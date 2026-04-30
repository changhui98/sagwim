import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyProfile, getUsers } from '../api/userApi'
import { ApiError } from '../api/ApiError'
import { useAuth } from '../context/AuthContext'
import { Navbar } from '../components/Navbar'
import { getInitials } from '../utils/stringUtils'
import styles from './ContentListPage.module.css'
import type { UserDetailResponse, UserResponse } from '../types/user'

const PAGE_SIZE = 10
const MAX_VISIBLE_PAGES = 5

export function ContentListPage() {
  const navigate = useNavigate()
  const { token, logout } = useAuth()

  const [users, setUsers] = useState<UserResponse[]>([])
  const [myProfile, setMyProfile] = useState<UserDetailResponse | null>(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
        const response = await getUsers(token, targetPage, PAGE_SIZE)
        setUsers(response.content)
        setTotalPages(response.totalPages)
        setTotalElements(response.totalElements)
      } catch (err) {
        const message = err instanceof Error ? err.message : '사용자 목록 조회 실패'
        setError(message)
        handleUnauthorized(err)
      } finally {
        setLoading(false)
      }
    },
    [token, handleUnauthorized],
  )

  const loadProfile = useCallback(async () => {
    try {
      const response = await getMyProfile(token)
      setMyProfile(response)
    } catch (err) {
      handleUnauthorized(err)
    }
  }, [token, handleUnauthorized])

  useEffect(() => {
    loadProfile()
    loadUsers(0)
  }, [loadProfile, loadUsers])

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage)
    loadUsers(nextPage)
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
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
    <>
      <Navbar
        role={myProfile?.role ?? null}
        onLogout={handleLogout}
      />

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            <h1 className={styles.pageTitle}>사용자 목록</h1>
            {totalElements > 0 && (
              <span className={styles.totalChip}>
                총 {totalElements}명
              </span>
            )}
          </div>
          <button
            type="button"
            className={styles.refreshButton}
            onClick={() => loadUsers(page)}
            disabled={loading}
          >
            {loading ? '조회 중...' : '새로고침'}
          </button>
        </div>

        {error && <p className="alert alert-error" role="alert">{error}</p>}

        <div className="card">
          {loading && users.length === 0 ? (
            <div className={styles.loadingOverlay}>불러오는 중...</div>
          ) : (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>닉네임</th>
                      <th>아이디</th>
                      <th>이메일</th>
                      <th>상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr className={styles.emptyRow}>
                        <td colSpan={4}>등록된 사용자가 없습니다</td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <div className="flex items-center gap-2">
                              <span className="avatar avatar-md">
                                {getInitials(user.nickname)}
                              </span>
                              <span className={styles.tableUsername}>
                                {user.nickname}
                              </span>
                            </div>
                          </td>
                          <td className={styles.tableSecondary}>{user.username}</td>
                          <td className={styles.tableSecondary}>{user.userEmail}</td>
                          <td>
                            {user.isDeleted ? (
                              <span className={`badge ${styles.badgeDeleted}`}>탈퇴</span>
                            ) : (
                              <span className="badge badge-success">활성</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 0 && (
                <div className={styles.paginationBar}>
                  <span className={styles.paginationInfo}>
                    페이지 {page + 1} / {totalPages} | 총 {totalElements}명
                  </span>
                  <div className={styles.paginationButtons}>
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
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  )
}
