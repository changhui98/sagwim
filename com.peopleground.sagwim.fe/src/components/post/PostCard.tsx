import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ContentResponse } from '../../types/post'
import { ApiError } from '../../api/ApiError'
import { toggleContentLike } from '../../api/postApi'
import { useAuth } from '../../context/AuthContext'
import styles from './PostCard.module.css'

interface PostCardProps {
  post: ContentResponse
  fullWidth?: boolean
}

/**
 * 게시글 작성 시각을 SNS 스타일 상대시간 문자열로 변환한다.
 *
 * 규칙
 * - 1시간 미만: "n분" (0분은 "방금")
 * - 24시간 미만: "n시간"
 * - 그 이후: "n일"
 *
 * 미래(시계 오차 등)로 찍힌 timestamp 는 음수 방지를 위해 "방금" 으로 처리한다.
 * 백엔드가 KST 기준 LocalDateTime 문자열을 보내기 때문에, 타임존이 포함되지
 * 않은 값은 그대로 Date 로 파싱해도 브라우저가 로컬 타임존으로 해석한다.
 * 한국 사용자 기준 환경에서 자연스럽게 맞물리도록 보정 없이 사용한다.
 */
function formatRelativeTime(dateStr: string): string {
  const then = new Date(dateStr).getTime()
  if (Number.isNaN(then)) return ''

  const diffMs = Date.now() - then
  const diffMin = Math.floor(diffMs / 60_000)

  if (diffMin < 1) return '방금'
  if (diffMin < 60) return `${diffMin}분`

  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}시간`

  const diffDay = Math.floor(diffHour / 24)
  return `${diffDay}일`
}

function getInitial(name: string): string {
  return (name?.trim().charAt(0) ?? '').toUpperCase()
}

function formatCount(n: number): string {
  if (n < 1000) return String(n)
  if (n < 10000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`
  return `${Math.floor(n / 1000)}K`
}

export function PostCard({ post, fullWidth = false }: PostCardProps) {
  const { token, meUsername, meProfileImageUrl } = useAuth()

  // 좋아요 상태의 단일 소스는 로컬 state. 초기값만 prop 에서 가져오고, 이후
  // 부모가 같은 post 객체로 재렌더 해도 낙관적 업데이트가 덮어써지지 않는다.
  // 페이지를 벗어났다가 돌아오면 PostListPage 가 unmount → remount 되며
  // PostCard 역시 새로 마운트 되어 서버의 likedByMe 값으로 자연스럽게 초기화된다.
  const [liked, setLiked] = useState(() => post.likedByMe ?? false)
  const [likeCount, setLikeCount] = useState(() => post.likeCount ?? 0)
  const [imageUrls] = useState<string[]>(() => post.imageUrls ?? [])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [pending, setPending] = useState(false)

  // setState 는 비동기라 단순 `pending` state 만으로는 같은 tick 안에서의
  // 중복 클릭을 막을 수 없다. 동기적으로 즉시 반영되는 ref 로 in-flight 를 판정.
  const inFlightRef = useRef(false)
  // stale closure 방어: 이벤트 핸들러가 호출되는 시점의 최신 state 값을
  // 언제나 읽을 수 있도록 동기 refs 도 함께 유지.
  const likedRef = useRef(liked)
  const likeCountRef = useRef(likeCount)

  const updateLiked = useCallback((next: boolean) => {
    likedRef.current = next
    setLiked(next)
  }, [])

  const updateLikeCount = useCallback((next: number) => {
    likeCountRef.current = next
    setLikeCount(next)
  }, [])

  const handleLikeClick = useCallback(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true

    const prevLiked = likedRef.current
    const prevCount = likeCountRef.current
    const nextLiked = !prevLiked
    const nextCount = Math.max(0, prevCount + (nextLiked ? 1 : -1))

    updateLiked(nextLiked)
    updateLikeCount(nextCount)
    setPending(true)

    try {
      const res = await toggleContentLike(token, post.id)
      updateLiked(res.liked)
      updateLikeCount(res.likeCount)
    } catch (err) {
      updateLiked(prevLiked)
      updateLikeCount(prevCount)
      if (!(err instanceof ApiError)) {
        console.error('좋아요 처리 실패', err)
      }
    } finally {
      inFlightRef.current = false
      setPending(false)
    }
  }, [post.id, token, updateLiked, updateLikeCount])

  const commentCount = post.commentCount ?? 0
  const tags = post.tags?.filter((tag) => tag.trim().length > 0) ?? []

  // 서버가 작성자 닉네임을 내려주면 그걸 우선 사용하고, 누락되었거나 구버전
  // 응답인 경우에 한해 username(`createdBy`) 으로 폴백한다. 사용자가 볼 화면에는
  // 더 이상 @아이디 형태를 노출하지 않는다.
  const displayName = post.nickname?.trim() || post.createdBy
  const profilePath = `/app/profile/${encodeURIComponent(post.createdBy)}`
  const isMine = !!meUsername && post.createdBy === meUsername
  const avatarUrl = isMine ? meProfileImageUrl : null

  return (
    <article className={`${styles.card} ${fullWidth ? styles.cardFullWidth : ''}`}>
      <div className={styles.header}>
        <Link to={profilePath} className={styles.authorAvatarLink} aria-label={`${displayName} 프로필 보기`}>
          {avatarUrl ? (
            <div className={styles.avatar} aria-hidden="true">
              <img src={avatarUrl} alt="" className={styles.avatarImg} />
            </div>
          ) : (
            <div className={styles.avatar} aria-hidden="true">
              {getInitial(displayName)}
            </div>
          )}
        </Link>
        <div className={styles.headerInfo}>
          <Link to={profilePath} className={`${styles.authorName} ${styles.authorNameLink}`}>
            {displayName}
          </Link>
          <span className={styles.sep} aria-hidden="true">·</span>
          <time className={styles.date} dateTime={post.createdAt}>
            {formatRelativeTime(post.createdAt)}
          </time>
        </div>
      </div>
      {imageUrls.length > 0 && (
        <div className={styles.imageWrap}>
          <img
            src={imageUrls[currentImageIndex]}
            alt={`게시글 첨부 이미지 ${currentImageIndex + 1}`}
            className={styles.image}
            loading="lazy"
          />
          {imageUrls.length > 1 && (
            <>
              <button
                type="button"
                className={`${styles.slideBtn} ${styles.slideBtnPrev}`}
                aria-label="이전 이미지"
                onClick={() =>
                  setCurrentImageIndex((prev) =>
                    prev === 0 ? imageUrls.length - 1 : prev - 1,
                  )
                }
              >
                ‹
              </button>
              <button
                type="button"
                className={`${styles.slideBtn} ${styles.slideBtnNext}`}
                aria-label="다음 이미지"
                onClick={() =>
                  setCurrentImageIndex((prev) =>
                    prev === imageUrls.length - 1 ? 0 : prev + 1,
                  )
                }
              >
                ›
              </button>
              <div className={styles.indicators}>
                {imageUrls.map((_, index) => (
                  <span
                    key={index}
                    className={`${styles.dot} ${index === currentImageIndex ? styles.dotActive : ''}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
      <p className={styles.content}>{post.body}</p>
      {tags.length > 0 && (
        <div className={styles.tagChipList} aria-label="태그">
          {tags.map((tag) => (
            <span key={tag} className={styles.tagChip}>
              <span className={styles.tagChipText}>{tag}</span>
            </span>
          ))}
        </div>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.actionBtn} ${liked ? styles.liked : ''}`}
          onClick={handleLikeClick}
          disabled={pending}
          aria-label={liked ? '좋아요 취소' : '좋아요'}
          aria-pressed={liked}
        >
          <HeartIcon filled={liked} className={styles.icon} />
          <span className={styles.count}>{formatCount(likeCount)}</span>
        </button>

        <button
          type="button"
          className={styles.actionBtn}
          aria-label="댓글 보기"
        >
          <CommentIcon className={styles.icon} />
          <span className={styles.count}>{formatCount(commentCount)}</span>
        </button>
      </div>
    </article>
  )
}

interface IconProps extends React.SVGProps<SVGSVGElement> {
  filled?: boolean
}

function HeartIcon({ filled = false, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable={false}
      {...props}
    >
      <path d="M12 20.5s-7.5-4.6-7.5-10a4.5 4.5 0 0 1 8-2.9 4.5 4.5 0 0 1 8 2.9c0 5.4-7.5 10-7.5 10h-1z" />
    </svg>
  )
}

function CommentIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable={false}
      {...props}
    >
      <path d="M21 12a8 8 0 0 1-11.6 7.2L4 20l.9-4.2A8 8 0 1 1 21 12z" />
    </svg>
  )
}
