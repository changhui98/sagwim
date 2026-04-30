import { useCallback, useRef, useState } from 'react'
import { ApiError } from '../../api/ApiError'
import { toggleContentLike } from '../../api/postApi'
import { useAuth } from '../../context/AuthContext'
import type { ContentResponse } from '../../types/post'
import styles from './PostRowItem.module.css'

interface PostRowItemProps {
  post: ContentResponse
  firstImageUrl: string | null
  imageCount: number
}

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

/**
 * 1열(행) 형태의 글 목록 아이템.
 * - 제목 1줄, 본문 1줄 (말줄임), 우측에 작성일을 표시한다.
 * - MyPostsSection 에서 list 뷰 모드일 때 사용된다.
 */
export function PostRowItem({ post, firstImageUrl, imageCount }: PostRowItemProps) {
  const { token, meUsername, meProfileImageUrl } = useAuth()
  const [liked, setLiked] = useState(() => post.likedByMe ?? false)
  const [likeCount, setLikeCount] = useState(() => post.likeCount ?? 0)
  const [pending, setPending] = useState(false)
  const inFlightRef = useRef(false)

  const handleLikeClick = useCallback(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true

    const prevLiked = liked
    const prevCount = likeCount
    const nextLiked = !prevLiked
    const nextCount = Math.max(0, prevCount + (nextLiked ? 1 : -1))

    setLiked(nextLiked)
    setLikeCount(nextCount)
    setPending(true)

    try {
      const res = await toggleContentLike(token, post.id)
      setLiked(res.liked)
      setLikeCount(res.likeCount)
    } catch (err) {
      setLiked(prevLiked)
      setLikeCount(prevCount)
      if (!(err instanceof ApiError)) {
        console.error('좋아요 처리 실패', err)
      }
    } finally {
      setPending(false)
      inFlightRef.current = false
    }
  }, [likeCount, liked, post.id, token])

  const displayName = post.nickname?.trim() || post.createdBy
  const commentCount = post.commentCount ?? 0
  const tags = post.tags?.filter((tag) => tag.trim().length > 0) ?? []
  const isMine = !!meUsername && post.createdBy === meUsername
  const avatarUrl = isMine ? meProfileImageUrl : null

  return (
    <article className={styles.row}>
      <div className={styles.head}>
        <div className={styles.authorWrap}>
          {avatarUrl ? (
            <div className={styles.avatar} aria-hidden="true">
              <img src={avatarUrl} alt="" className={styles.avatarImg} />
            </div>
          ) : (
            <div className={styles.avatar} aria-hidden="true">
              {(displayName.charAt(0) || '?').toUpperCase()}
            </div>
          )}
          <span className={styles.author}>{displayName}</span>
          <span className={styles.dot} aria-hidden="true">·</span>
          <span className={styles.date}>{formatRelativeTime(post.createdAt)}</span>
        </div>
      </div>

      <p className={styles.snippet}>{post.body}</p>

      {tags.length > 0 && (
        <div className={styles.tagChipList} aria-label="태그">
          {tags.map((tag) => (
            <span key={tag} className={styles.tagChip}>
              <span className={styles.tagChipText}>{tag}</span>
            </span>
          ))}
        </div>
      )}

      {firstImageUrl && (
        <div className={styles.thumbWrap}>
          <img src={firstImageUrl} alt="게시글 첨부 이미지" className={styles.thumb} loading="lazy" />
          {imageCount > 1 && (
            <span className={styles.multiBadge} aria-label="사진 여러 장">
              +{imageCount - 1}
            </span>
          )}
        </div>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.actionBtn} ${liked ? styles.liked : ''}`}
          aria-label={liked ? '좋아요 취소' : '좋아요'}
          aria-pressed={liked}
          onClick={handleLikeClick}
          disabled={pending}
        >
          <HeartIcon filled={liked} className={styles.icon} />
          <span>{likeCount}</span>
        </button>
        <button type="button" className={styles.actionBtn} aria-label="댓글">
          <CommentIcon className={styles.icon} />
          <span>{commentCount}</span>
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
      width={18}
      height={18}
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
      width={18}
      height={18}
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

