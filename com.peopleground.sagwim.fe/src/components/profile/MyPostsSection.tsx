import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { getMyPosts, getUserPosts } from '../../api/postApi'
import { getContentImages } from '../../api/imageApi'
import { ApiError } from '../../api/ApiError'
import { useAuth } from '../../context/AuthContext'
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import { MyPostCard } from './MyPostCard'
import { PostRowItem } from '../post/PostRowItem'
import { InfiniteScrollLoader } from '../post/InfiniteScrollLoader'
import { EndOfList } from '../post/EndOfList'
import { Skeleton } from '../common/Skeleton'
import { EmptyState } from '../common/EmptyState'
import { MenuMeatballsIcon } from '../NavIcons'
import type { ContentResponse } from '../../types/post'
import styles from './MyPostsSection.module.css'

type ViewMode = 'card' | 'list'

const PAGE_SIZE = 12
const VIEW_MODE_STORAGE_KEY = 'sagwim.profile.myPosts.viewMode'

const myPostsEmptyIcon = <MenuMeatballsIcon />
const MY_POSTS_EMPTY_ICON_COLOR = 'var(--clr-accent)'

interface MyPostsSectionProps {
  username?: string
  isOwner?: boolean
  onUnauthorized?: (err: unknown) => void
}

export interface MyPostsSectionHandle {
  /** 외부(예: 새 글 작성 직후)에서 목록을 맨 처음부터 다시 불러온다. */
  refresh: () => void
}

const readInitialViewMode = (): ViewMode => {
  if (typeof window === 'undefined') return 'card'
  try {
    const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY)
    if (stored === 'card' || stored === 'list') return stored
  } catch {
    /* localStorage 접근이 막힌 환경은 무시 */
  }
  return 'card'
}

export const MyPostsSection = forwardRef<MyPostsSectionHandle, MyPostsSectionProps>(
  function MyPostsSection({ username, isOwner = true, onUnauthorized }, ref) {
    const { token } = useAuth()

    const [viewMode, setViewMode] = useState<ViewMode>(readInitialViewMode)
    const [posts, setPosts] = useState<ContentResponse[]>([])
    const [postImageMeta, setPostImageMeta] = useState<Record<number, { firstUrl: string | null; count: number }>>({})

    const [loading, setLoading] = useState(true)
    const [initialLoad, setInitialLoad] = useState(true)
    const [isFetchingMore, setIsFetchingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const photoPosts = posts.filter((post) => (postImageMeta[post.id]?.count ?? 0) > 0)
    const textPosts = posts.filter((post) => (postImageMeta[post.id]?.count ?? 0) === 0)


    // 다음에 요청할 페이지 번호. (마지막으로 성공한 페이지 + 1)
    const nextPageRef = useRef(0)
    // 동시 요청 방지(예: 빠른 스크롤로 intersect 이벤트가 중복으로 들어오는 상황)
    const fetchingRef = useRef(false)

    const { ref: sentinelRef, isIntersecting } = useIntersectionObserver({
      rootMargin: '0px 0px 300px 0px',
    })

    const fetchPage = useCallback(
      async (targetPage: number, append: boolean) => {
        if (fetchingRef.current) return
        fetchingRef.current = true
        try {
          if (append) setIsFetchingMore(true)
          else setLoading(true)
          setError(null)

          const response = username
            ? await getUserPosts(token, username, targetPage, PAGE_SIZE)
            : await getMyPosts(token, targetPage, PAGE_SIZE)

          setPosts((prev) =>
            append ? [...prev, ...response.content] : response.content,
          )
          setHasMore(response.hasNext)
          nextPageRef.current = targetPage + 1
        } catch (err) {
          if (err instanceof ApiError) {
            setError(err.message || '게시글을 불러오지 못했습니다.')
            onUnauthorized?.(err)
          } else {
            setError('게시글을 불러오지 못했습니다.')
          }
          // 첫 로드 실패 시에만 hasMore 를 끊어 무한 루프 방지
          if (!append) setHasMore(false)
        } finally {
          if (append) setIsFetchingMore(false)
          else setLoading(false)
          setInitialLoad(false)
          fetchingRef.current = false
        }
      },
      [token, onUnauthorized, username],
    )

    // 최초 1회 로드
    useEffect(() => {
      nextPageRef.current = 0
      setPosts([])
      setPostImageMeta({})
      setHasMore(true)
      fetchPage(0, false)
    }, [fetchPage])

    useEffect(() => {
      if (posts.length === 0) return

      const unresolvedIds = posts
        .map((post) => post.id)
        .filter((id) => postImageMeta[id] === undefined)

      if (unresolvedIds.length === 0) return

      let cancelled = false

      Promise.all(
        unresolvedIds.map(async (postId) => {
          try {
            const images = await getContentImages(token, postId)
            return {
              postId,
              firstUrl: images[0]?.fileUrl ?? null,
              count: images.length,
            }
          } catch {
            return {
              postId,
              firstUrl: null,
              count: 0,
            }
          }
        }),
      ).then((results) => {
        if (cancelled) return
        setPostImageMeta((prev) => {
          const next = { ...prev }
          results.forEach((result) => {
            next[result.postId] = {
              firstUrl: result.firstUrl,
              count: result.count,
            }
          })
          return next
        })
      })

      return () => {
        cancelled = true
      }
    }, [posts, postImageMeta, token])

    // 센티넬이 뷰포트에 들어오면 다음 페이지 요청
    useEffect(() => {
      if (!isIntersecting) return
      if (!hasMore) return
      if (loading || isFetchingMore) return
      fetchPage(nextPageRef.current, true)
    }, [isIntersecting, hasMore, loading, isFetchingMore, fetchPage])

    const refresh = useCallback(() => {
      nextPageRef.current = 0
      setPosts([])
      setHasMore(true)
      setError(null)
      fetchPage(0, false)
    }, [fetchPage])

    useImperativeHandle(ref, () => ({ refresh }), [refresh])

    const handleViewModeChange = (mode: ViewMode) => {
      if (mode === viewMode) return
      setViewMode(mode)
      try {
        window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode)
      } catch {
        /* noop */
      }
    }

    const handleRetry = () => {
      if (posts.length === 0) {
        refresh()
      } else {
        fetchPage(nextPageRef.current, true)
      }
    }

    const renderSkeleton = () => {
      if (viewMode === 'card') {
        return (
          <div className={styles.cardGrid}>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className={styles.cardSkeleton}>
                <Skeleton height="100%" />
              </div>
            ))}
          </div>
        )
      }
      return (
        <div className={styles.listWrap}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className={styles.rowSkeleton}>
              <Skeleton height="16px" width="70%" />
              <Skeleton height="12px" width="40%" />
            </div>
          ))}
        </div>
      )
    }

    const renderItems = () => {
      if (viewMode === 'card') {
        return (
          <div className={styles.cardGrid}>
            {photoPosts.map((post) => (
              <MyPostCard
                key={post.id}
                post={post}
                firstImageUrl={postImageMeta[post.id]?.firstUrl ?? null}
                imageCount={postImageMeta[post.id]?.count ?? 0}
              />
            ))}
          </div>
        )
      }
      return (
        <div className={styles.listWrap}>
          {textPosts.map((post) => (
            <PostRowItem
              key={post.id}
              post={post}
              firstImageUrl={postImageMeta[post.id]?.firstUrl ?? null}
              imageCount={postImageMeta[post.id]?.count ?? 0}
            />
          ))}
        </div>
      )
    }

    const renderBody = () => {
      if (initialLoad) return renderSkeleton()

      if (posts.length === 0 && error) {
        return (
          <div className={styles.errorBox}>
            <p className={styles.errorText}>{error}</p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleRetry}
            >
              다시 시도
            </button>
          </div>
        )
      }

      if (viewMode === 'card' && photoPosts.length === 0) {
        return (
          <div className={styles.emptyWrap}>
            <EmptyState
              icon={myPostsEmptyIcon}
              iconColor={MY_POSTS_EMPTY_ICON_COLOR}
              description="첫 사진을 공유해 목록을 채워보세요."
            />
          </div>
        )
      }

      if (posts.length === 0) {
        return (
          <div className={styles.emptyWrap}>
            <EmptyState
              icon={myPostsEmptyIcon}
              iconColor={MY_POSTS_EMPTY_ICON_COLOR}
              description={isOwner ? '첫 게시글을 작성해 목록을 채워보세요.' : '아직 작성된 게시글이 없습니다.'}
            />
          </div>
        )
      }

      if (viewMode === 'list' && textPosts.length === 0) {
        return (
          <div className={styles.emptyWrap}>
            <EmptyState
              icon={myPostsEmptyIcon}
              iconColor={MY_POSTS_EMPTY_ICON_COLOR}
              title="사진 없는 글이 없습니다"
              description="글 탭에서는 사진이 없는 글만 보여드려요."
            />
          </div>
        )
      }

      return (
        <>
          {renderItems()}

          {error && (
            <div className={styles.retryBanner}>
              <p className={styles.retryText}>{error}</p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleRetry}
              >
                다시 시도
              </button>
            </div>
          )}

          {isFetchingMore && <InfiniteScrollLoader />}

          {!hasMore && !error && <EndOfList />}

          {/* IntersectionObserver 센티넬 — 리스트 끝에서 200~300px 앞에서 다음 페이지를 미리 로드 */}
          <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
        </>
      )
    }

    return (
      <section className={styles.section} aria-label={isOwner ? '내가 작성한 글' : '사용자가 작성한 글'}>
        <header className={styles.header}>
          <div
            className={styles.viewToggle}
            role="tablist"
            aria-label="글 목록 보기 방식"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'card'}
              className={`${styles.toggleBtn} ${viewMode === 'card' ? styles.toggleBtnActive : ''}`}
              onClick={() => handleViewModeChange('card')}
              aria-label="사진 게시글 보기"
            >
              <svg
                className={styles.toggleIcon}
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="14" height="14" rx="2.2" fill="none" strokeWidth="1.6" />
                <circle cx="8" cy="8" r="1.4" />
                <path d="M5.5 14.5l3.2-3.6 2.5 2 2.4-2.9 1.4 1.6" fill="none" strokeWidth="1.6" />
              </svg>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'list'}
              className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.toggleBtnActive : ''}`}
              onClick={() => handleViewModeChange('list')}
              aria-label="글 보기"
            >
              <svg
                className={styles.toggleIcon}
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M4.5 4.5h11a1.5 1.5 0 0 1 1.5 1.5v6.6a1.5 1.5 0 0 1-1.5 1.5H9.4l-3.6 3v-3H4.5A1.5 1.5 0 0 1 3 12.6V6a1.5 1.5 0 0 1 1.5-1.5z" fill="none" strokeWidth="1.6" />
              </svg>
            </button>
          </div>
        </header>

        <div className={styles.body}>{renderBody()}</div>
      </section>
    )
  },
)
