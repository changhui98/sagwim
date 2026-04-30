import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteAdminUser, getAdminUsers } from '../../api/adminApi'
import { ApiError } from '../../api/ApiError'
import { useAuth } from '../../context/AuthContext'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { Skeleton } from '../../components/common/Skeleton'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { SuccessDialog } from '../../components/common/SuccessDialog'
import { getInitials } from '../../utils/stringUtils'
import { formatDateTime } from '../../utils/dateUtils'
import type { UserResponse } from '../../types/user'
import styles from './AdminUserListPage.module.css'

const PAGE_SIZE = 10
const MAX_VISIBLE_PAGES = 5

export function AdminUserListPage() {
  const navigate = useNavigate()
  const { token, logout, meUsername, meProfileImageUrl } = useAuth()

  const [users, setUsers] = useState<UserResponse[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [error, setError] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<UserResponse | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)

  const handleUnauthorized = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        logout()
        navigate('/login', { replace: true })
      }
    },
    [logout, navigate],
  )

  const loadUsers = useCallback(
    async (targetPage: number) => {
      try {
        setLoading(true)
        setError('')
        const response = await getAdminUsers(token, targetPage, PAGE_SIZE)
        const sortedUsers = [...response.content].sort((a, b) => {
          const aTime = a.createdDate ? new Date(a.createdDate).getTime() : 0
          const bTime = b.createdDate ? new Date(b.createdDate).getTime() : 0
          return bTime - aTime
        })
        setUsers(sortedUsers)
        setTotalPages(response.totalPages)
      } catch (err) {
        const message = err instanceof Error ? err.message : '사용자 목록 조회 실패'
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
    loadUsers(0)
  }, [loadUsers])

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage)
    loadUsers(nextPage)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      setDeleteLoading(true)
      await deleteAdminUser(token, deleteTarget.username)
      setDeleteTarget(null)
      setDeleteSuccess(true)
      loadUsers(page)
    } catch (err) {
      const message = err instanceof Error ? err.message : '사용자 삭제 실패'
      setError(message)
      handleUnauthorized(err)
    } finally {
      setDeleteLoading(false)
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
                    <th>닉네임</th>
                    <th>아이디</th>
                    <th>이메일</th>
                    <th>가입 경로</th>
                    <th>가입일</th>
                    <th>수정일</th>
                    <th>상태</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr className={styles.emptyRow}>
                      <td colSpan={8}>등록된 사용자가 없습니다.</td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      const avatarSrc =
                        user.profileImageUrl?.trim() ||
                        (user.username === meUsername ? meProfileImageUrl?.trim() ?? '' : '')
                      return (
                      <tr key={user.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="avatar avatar-md">
                              {avatarSrc ? (
                                <img
                                  src={avatarSrc}
                                  alt={`${user.nickname} 프로필`}
                                  className={styles.avatarImage}
                                />
                              ) : (
                                getInitials(user.nickname)
                              )}
                            </span>
                            <span className={styles.tableUsername}>
                              {user.nickname}
                            </span>
                          </div>
                        </td>
                        <td className={styles.tableSecondary}>
                          {user.username}
                        </td>
                        <td className={styles.tableSecondary}>
                          {user.userEmail}
                        </td>
                        <td>
                          {user.provider === 'KAKAO' ? (
                            <span className={styles.badgeKakao}>KAKAO</span>
                          ) : user.provider === 'GOOGLE' ? (
                            <span className={styles.badgeGoogle}>GOOGLE</span>
                          ) : (
                            <span className={styles.badgeLocal}>일반</span>
                          )}
                        </td>
                        <td className={styles.tableDate}>
                          {formatDateTime(user.createdDate)}
                        </td>
                        <td className={styles.tableDate}>
                          {formatDateTime(user.modifiedDate)}
                        </td>
                        <td>
                          {user.isDeleted ? (
                            <span className={`badge ${styles.badgeDeleted}`}>
                              탈퇴
                            </span>
                          ) : (
                            <span className="badge badge-success">활성</span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className={styles.deleteButton}
                            onClick={() => setDeleteTarget(user)}
                            disabled={deleteLoading}
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                      )
                    })
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
        isOpen={deleteTarget !== null}
        title="사용자 삭제"
        message={
          deleteTarget
            ? `'${deleteTarget.nickname}' 사용자를 삭제하시겠습니까?`
            : ''
        }
        confirmLabel="삭제"
        confirmVariant="danger"
        isLoading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      <SuccessDialog
        isOpen={deleteSuccess}
        title="사용자가 삭제되었습니다"
        message="선택한 사용자를 삭제 처리했어요."
        onClose={() => setDeleteSuccess(false)}
      />
    </div>
  )
}
