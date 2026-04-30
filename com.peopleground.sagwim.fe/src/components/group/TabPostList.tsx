import { useCallback, useEffect, useState } from 'react'
import { getGroupPosts } from '../../api/postApi'
import { useAuth } from '../../context/AuthContext'
import type { ContentResponse } from '../../types/post'
import { PostCard } from '../post/PostCard'
import { PostCreateModal } from '../post/PostCreateModal'
import styles from './TabPostList.module.css'

interface TabPostListProps {
  groupId: number
  isMember: boolean
}

const PAGE_SIZE = 10

export function TabPostList({ groupId, isMember }: TabPostListProps) {
  const { token } = useAuth()
  const [posts, setPosts] = useState<ContentResponse[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const fetchPosts = useCallback(
    async (targetPage: number) => {
      setLoading(true)
      setError(null)
      try {
        const result = await getGroupPosts(token, groupId, targetPage, PAGE_SIZE)
        if (targetPage === 0) {
          setPosts(result.content)
        } else {
          setPosts((prev) => [...prev, ...result.content])
        }
        setHasMore(result.hasNext)
        setPage(targetPage)
      } catch {
        setError('게시글을 불러오는 데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    },
    [token, groupId],
  )

  useEffect(() => {
    fetchPosts(0)
  }, [fetchPosts])

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchPosts(page + 1)
    }
  }

  const handlePostCreated = () => {
    fetchPosts(0)
  }

  return (
    <div className={styles.wrapper}>
      {/* 글쓰기 버튼 (모임 멤버에게만 표시) */}
      {isMember && (
        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.createBtn}
            onClick={() => setIsCreateModalOpen(true)}
          >
            + 게시글 작성
          </button>
        </div>
      )}

      {/* 게시글 목록 */}
      {error ? (
        <div className={styles.errorWrapper}>
          <p className={styles.errorText}>{error}</p>
          <button type="button" className={styles.retryBtn} onClick={() => fetchPosts(0)}>
            다시 시도
          </button>
        </div>
      ) : posts.length === 0 && !loading ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>아직 게시글이 없습니다.</p>
        </div>
      ) : (
        <>
          <ul className={styles.postList}>
            {posts.map((post) => (
              <li key={post.id}>
                <PostCard post={post} fullWidth />
              </li>
            ))}
          </ul>

          {hasMore && (
            <div className={styles.loadMoreRow}>
              <button
                type="button"
                className={styles.loadMoreBtn}
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? '불러오는 중...' : '더 보기'}
              </button>
            </div>
          )}

          {loading && posts.length > 0 && (
            <div className={styles.loadingRow}>
              <span className={styles.loadingText}>불러오는 중...</span>
            </div>
          )}
        </>
      )}

      <PostCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handlePostCreated}
        groupId={groupId}
      />
    </div>
  )
}
