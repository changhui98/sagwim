import type { UserResponse } from '../../types/user'
import { getInitials } from '../../utils/stringUtils'
import styles from '../../pages/DashboardPage.module.css'

interface UserListSectionProps {
  users: UserResponse[]
  page: number
  totalPages: number
  loading: boolean
  error: string
  onLoadUsers: () => void
  onPageChange: (next: number) => void
}

export function UserListSection({
  users,
  page,
  totalPages,
  loading,
  error,
  onLoadUsers,
  onPageChange,
}: UserListSectionProps) {
  return (
    <div className="card">
      <div className={`header-row ${styles.mb4}`}>
        <h2 className={styles.sectionTitle}>
          사용자 목록
          {users.length > 0 && (
            <span className={styles.countChip}>{users.length}</span>
          )}
        </h2>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onLoadUsers}
          disabled={loading}
        >
          {loading ? '조회 중…' : '조회'}
        </button>
      </div>

      {error && <p className="alert alert-error" role="alert">{error}</p>}

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
                <td colSpan={4}>조회 버튼을 눌러 사용자를 불러오세요</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="avatar avatar-md">{getInitials(user.nickname)}</span>
                      <span className={styles.tableUsername}>{user.nickname}</span>
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

      {users.length > 0 && (
        <div className={styles.tableFooter}>
          <span className="text-xs text-muted">페이지 {page + 1} / {totalPages || '?'}</span>
          <div className="pagination">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onPageChange(page - 1)}
              disabled={loading || page === 0}
            >
              ← 이전
            </button>
            <span className="page-num">{page + 1}</span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onPageChange(page + 1)}
              disabled={loading || (totalPages > 0 && page >= totalPages - 1)}
            >
              다음 →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
