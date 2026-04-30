import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  deleteAdminContent,
  getAdminContents,
  restoreAdminContent,
} from '../../api/adminApi'
import { ApiError } from '../../api/ApiError'
import { useAuth } from '../../context/AuthContext'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { Skeleton } from '../../components/common/Skeleton'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { SuccessDialog } from '../../components/common/SuccessDialog'
import { formatDateTime } from '../../utils/dateUtils'
import type { AdminContentResponse } from '../../types/post'
import styles from './AdminUserListPage.module.css'

const PAGE_SIZE = 10
const MAX_VISIBLE_PAGES = 5

type ConfirmAction = 'delete' | 'restore'

interface ConfirmState {
  content: AdminContentResponse
  action: ConfirmAction
}

export function AdminPostListPage() {
  const navigate = useNavigate()
  const { token, logout } = useAuth()

  const [contents, setContents] = useState<AdminContentResponse[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [error, setError] = useState('')

  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [successAction, setSuccessAction] = useState<ConfirmAction | null>(null)

  const handleUnauthorized = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        logout()
        navigate('/login', { replace: true })
      }
    },
    [logout, navigate],
  )

  const loadContents = useCallback(
    async (targetPage: number) => {
      try {
        setLoading(true)
        setError('')
        const response = await getAdminContents(token, targetPage, PAGE_SIZE)
        const sortedContents = [...response.content].sort((a, b) => {
          const aTime = a.createdDate ? new Date(a.createdDate).getTime() : 0
          const bTime = b.createdDate ? new Date(b.createdDate).getTime() : 0
          return bTime - aTime
        })
        setContents(sortedContents)
        setTotalPages(response.totalPages)
      } catch (err) {
        const message = err instanceof Error ? err.message : '게시글 목록 조회 실패'
        setError(message)
        handleUnauthorized(err)
      } finally {
        setLoading(false)
        setInitialLoad(false)
      }
    },
    [token, handleUnauthorized],
  )

  useEffect(() => {
    loadContents(0)
  }, [loadContents])

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage)
    loadContents(nextPage)
  }

  const handleConfirm = async () => {
    if (!confirmState) return
    const { action } = confirmState
    try {
      setActionLoading(true)
      if (action === 'delete') {
        await deleteAdminContent(token, confirmState.content.id)
      } else {
        await restoreAdminContent(token, confirmState.content.id)
      }
      setConfirmState(null)
      setSuccessAction(action)
      loadContents(page)
    } catch (err) {
      const label = action === 'delete' ? '삭제' : '복구'
      const message = err instanceof Error ? err.message : `게시글 ${label} 실패`
      setError(message)
      handleUnauthorized(err)
    } finally {
      setActionLoading(false)
    }
  }

  const getPageNumbers = (): number[] => {
    if (totalPages <= MAX_VISIBLE_PAGES) {
      return Array.from({ length: totalPages }, (_, i) => i)
    }
    const half = Math.floor(MAX_VISIBLE_PAGES / 2)
    let start = Math.max(0, page - half)
    const end = Math.min(totalPages, start + MAX_VISIBLE_PAGES)
    if (end - start < MAX_VISIBLE_PAGES) {
      start = Math.max(0, end - MAX_VISIBLE_PAGES)
    }
    return Array.from({ length: end - start }, (_, i) => start + i)
  }

  const isDeleted = (content: AdminContentResponse): boolean => content.deletedDate !== null

  return (
    <div className={styles.container}>
      {error && <p className="alert alert-error" role="alert">{error}</p>}

      <div className={styles.tableCard}>
        {initialLoad ? (
          <div style={{ padding: 'var(--sp-6)' }}>
            <Skeleton height="300px" />
          </div>
        ) : (
          <>
            <div className={styles.tableWrap} style={{ position: 'relative' }}>
              {loading && <LoadingSpinner overlay />}
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>내용</th>
                    <th>작성자</th>
                    <th>작성일</th>
                    <th>수정일</th>
                    <th>상태</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {contents.length === 0 ? (
                    <tr className={styles.emptyRow}>
                      <td colSpan={6}>등록된 게시글이 없습니다.</td>
                    </tr>
                  ) : (
                    contents.map((content) => (
                      <tr key={content.id}>
                        <td>
                          <span className={styles.tableUsername}>
                            {content.body}
                          </span>
                        </td>
                        <td className={styles.tableSecondary}>
                          @{content.createdBy}
                        </td>
                        <td className={styles.tableDate}>
                          {formatDateTime(content.createdDate)}
                        </td>
                        <td className={styles.tableDate}>
                          {formatDateTime(content.lastModifiedDate)}
                        </td>
                        <td>
                          {isDeleted(content) ? (
                            <span className={`badge ${styles.badgeDeleted}`}>
                              삭제됨
                            </span>
                          ) : (
                            <span className="badge badge-success">활성</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                            {isDeleted(content) ? (
                              <button
                                type="button"
                                className={styles.refreshButton}
                                onClick={() =>
                                  setConfirmState({ content, action: 'restore' })
                                }
                                disabled={actionLoading}
                              >
                                복구
                              </button>
                            ) : (
                              <button
                                type="button"
                                className={styles.deleteButton}
                                onClick={() =>
                                  setConfirmState({ content, action: 'delete' })
                                }
                                disabled={actionLoading}
                              >
                                삭제
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className={styles.paginationBar}>
                <button
                  type="button"
                  className={styles.pageButton}
                  onClick={() => handlePageChange(page - 1)}
                  disabled={loading || page === 0}
                >
                  이전
                </button>
                {getPageNumbers().map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    className={
                      pageNum === page
                        ? styles.pageButtonActive
                        : styles.pageButton
                    }
                    onClick={() => handlePageChange(pageNum)}
                    disabled={loading}
                  >
                    {pageNum + 1}
                  </button>
                ))}
                <button
                  type="button"
                  className={styles.pageButton}
                  onClick={() => handlePageChange(page + 1)}
                  disabled={loading || page >= totalPages - 1}
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmState !== null}
        title={confirmState?.action === 'delete' ? '게시글 삭제' : '게시글 복구'}
        message={
          confirmState
            ? confirmState.action === 'delete'
              ? '선택한 게시글을 삭제하시겠습니까?'
              : '선택한 게시글을 복구하시겠습니까?'
            : ''
        }
        confirmLabel={confirmState?.action === 'delete' ? '삭제' : '복구'}
        confirmVariant={confirmState?.action === 'delete' ? 'danger' : 'primary'}
        isLoading={actionLoading}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmState(null)}
      />

      <SuccessDialog
        isOpen={successAction !== null}
        title={
          successAction === 'delete'
            ? '게시글이 삭제되었습니다'
            : '게시글이 복구되었습니다'
        }
        message={
          successAction === 'delete'
            ? '선택한 게시글을 삭제 처리했어요.'
            : '선택한 게시글을 복구했어요.'
        }
        onClose={() => setSuccessAction(null)}
      />
    </div>
  )
}
