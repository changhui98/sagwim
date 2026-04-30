import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { getMyProfile } from '../../api/userApi'
import { ApiError } from '../../api/ApiError'
import { useAuth } from '../../context/AuthContext'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { AdminSidebar } from './AdminSidebar'
import type { UserDetailResponse } from '../../types/user'
import styles from './AdminLayout.module.css'

const ADMIN_ROLE = 'ADMIN'

export function AdminLayout() {
  const navigate = useNavigate()
  const { token, logout } = useAuth()

  const [profile, setProfile] = useState<UserDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)

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
    const loadProfile = async () => {
      try {
        setLoading(true)
        const response = await getMyProfile(token)
        if (response.role !== ADMIN_ROLE) {
          setUnauthorized(true)
          return
        }
        setProfile(response)
      } catch (err) {
        handleUnauthorized(err)
        setUnauthorized(true)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [token, handleUnauthorized])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (unauthorized) {
    return <Navigate to="/app" replace />
  }

  return (
    <div className={styles.wrapper}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <nav className={styles.navbar}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Link to="/app/admin" className={styles.navBrand}>
              Sagwim
            </Link>
            <span className={styles.navBrandSuffix}>Admin</span>
          </div>

          <div className={styles.navRight}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => window.location.reload()}
              aria-label="새로고침"
              title="새로고침"
            >
              <svg
                className={`${styles.iconSvg} ${styles.refreshIcon}`}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M21 3v5h-5"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 16v5h5"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <Link to="/app" className={styles.backLink} aria-label="사이트 홈으로 이동">
              HOME
            </Link>
            <button
              type="button"
              className={styles.logoutButton}
              onClick={handleLogout}
            >
              로그아웃
            </button>
          </div>
        </nav>

        <div className={styles.body}>
          <AdminSidebar profile={profile} />
          <main className={styles.content}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
