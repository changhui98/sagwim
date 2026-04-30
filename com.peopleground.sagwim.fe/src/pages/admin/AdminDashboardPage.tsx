import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getAdminUsers,
  getMonthlyContentCreations,
  getMonthlySignups,
} from '../../api/adminApi'
import { ApiError } from '../../api/ApiError'
import { useAuth } from '../../context/AuthContext'
import { StatCard } from '../../components/admin/StatCard'
import { MonthlyChartCard } from '../../components/admin/MonthlyChartCard'
import { Skeleton } from '../../components/common/Skeleton'
import { getInitials } from '../../utils/stringUtils'
import type { UserResponse } from '../../types/user'
import type { MonthlyStatsPoint } from '../../types/adminStats'
import styles from './AdminDashboardPage.module.css'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'] as const

function formatTime(date: Date): string {
  return date.toLocaleTimeString('ko-KR', { hour12: false })
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const day = DAY_NAMES[date.getDay()]
  return `${y}년 ${m}월 ${d}일 (${day})`
}

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const { token, logout, meUsername, meProfileImageUrl } = useAuth()

  const [currentTime, setCurrentTime] = useState(new Date())
  const [totalUsers, setTotalUsers] = useState<number | null>(null)
  const [recentUsers, setRecentUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)

  const [signupStats, setSignupStats] = useState<MonthlyStatsPoint[]>([])
  const [contentStats, setContentStats] = useState<MonthlyStatsPoint[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [signupError, setSignupError] = useState<string | null>(null)
  const [contentError, setContentError] = useState<string | null>(null)

  const handleUnauthorized = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        logout()
        navigate('/login', { replace: true })
      }
    },
    [logout, navigate],
  )

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [countRes, recentRes] = await Promise.all([
          getAdminUsers(token, 0, 1),
          getAdminUsers(token, 0, 5),
        ])
        setTotalUsers(countRes.totalElements)
        const sortedRecentUsers = [...recentRes.content].sort((a, b) => {
          const aTime = a.createdDate ? new Date(a.createdDate).getTime() : 0
          const bTime = b.createdDate ? new Date(b.createdDate).getTime() : 0
          return bTime - aTime
        })
        setRecentUsers(sortedRecentUsers)
      } catch (err) {
        handleUnauthorized(err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [token, handleUnauthorized])

  const loadStats = useCallback(async () => {
    const describeError = (reason: unknown, fallback: string): string => {
      if (reason instanceof ApiError) {
        if (reason.status >= 500) {
          return `${fallback} 잠시 후 다시 시도해 주세요. (HTTP ${reason.status})`
        }
        return `${fallback} (HTTP ${reason.status})`
      }
      return fallback
    }

    try {
      setStatsLoading(true)
      setSignupError(null)
      setContentError(null)
      const [signupRes, contentRes] = await Promise.allSettled([
        getMonthlySignups(token, 12),
        getMonthlyContentCreations(token, 12),
      ])

      if (signupRes.status === 'fulfilled') {
        setSignupStats(signupRes.value.points)
      } else {
        console.error('[admin] 가입자 통계 로드 실패:', signupRes.reason)
        handleUnauthorized(signupRes.reason)
        setSignupError(
          describeError(signupRes.reason, '가입자 통계를 불러오지 못했습니다.'),
        )
      }

      if (contentRes.status === 'fulfilled') {
        setContentStats(contentRes.value.points)
      } else {
        console.error('[admin] 게시글 통계 로드 실패:', contentRes.reason)
        handleUnauthorized(contentRes.reason)
        setContentError(
          describeError(contentRes.reason, '게시글 통계를 불러오지 못했습니다.'),
        )
      }
    } finally {
      setStatsLoading(false)
    }
  }, [token, handleUnauthorized])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  return (
    <div className={styles.container}>
      <div className={styles.statsGrid}>
        <StatCard
          title="현재 시간"
          value={formatTime(currentTime)}
          subtitle={formatDate(currentTime)}
          accent
        />
        <StatCard
          title="전체 사용자"
          value={totalUsers !== null ? `${totalUsers}명` : '-'}
          subtitle="등록된 전체 사용자 수"
          loading={loading}
          accent
        />
        <StatCard
          title="최근 12개월 게시글"
          value={
            contentStats.length > 0
              ? `${contentStats.reduce((s, p) => s + p.count, 0)}건`
              : '-'
          }
          subtitle="최근 12개월간 작성된 게시글"
          loading={statsLoading}
        />
      </div>

      <div className={styles.chartsGrid}>
        <MonthlyChartCard
          title="월별 신규 가입자 수"
          subtitle="최근 12개월 · KST 기준"
          unit="명"
          color="#c0784a"
          data={signupStats}
          loading={statsLoading}
          error={signupError}
          onRetry={loadStats}
        />
        <MonthlyChartCard
          title="월별 신규 게시글 수"
          subtitle="최근 12개월 · KST 기준"
          unit="건"
          color="#10b981"
          data={contentStats}
          loading={statsLoading}
          error={contentError}
          onRetry={loadStats}
        />
      </div>

      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>최근 가입 사용자</h2>
        {loading ? (
          <Skeleton height="200px" />
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>닉네임</th>
                <th>이메일</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', color: 'var(--clr-text-muted)' }}>
                    사용자가 없습니다.
                  </td>
                </tr>
              ) : (
                recentUsers.map((user) => {
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
                        <span className="font-semibold">{user.nickname}</span>
                      </div>
                    </td>
                    <td>{user.userEmail}</td>
                    <td>
                      {user.isDeleted ? (
                        <span className={`badge ${styles.badgeDeleted}`}>탈퇴</span>
                      ) : (
                        <span className="badge badge-success">활성</span>
                      )}
                    </td>
                  </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
