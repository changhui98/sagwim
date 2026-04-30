import { Link, useLocation } from 'react-router-dom'
import { getInitials } from '../../utils/stringUtils'
import type { UserDetailResponse } from '../../types/user'
import styles from './AdminSidebar.module.css'

interface MenuItem {
  path: string
  label: string
  icon: string
}

const MENU_ITEMS: readonly MenuItem[] = [
  { path: '/app/admin', label: 'Dashboard', icon: '📊' },
  { path: '/app/admin/users', label: '사용자 관리', icon: '👥' },
  { path: '/app/admin/posts', label: '게시글 관리', icon: '📝' },
] as const

interface AdminSidebarProps {
  profile: UserDetailResponse | null
}

export function AdminSidebar({ profile }: AdminSidebarProps) {
  const location = useLocation()

  const isActive = (path: string): boolean => {
    if (path === '/app/admin') {
      return location.pathname === '/app/admin'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <aside className={styles.sidebar}>
      {profile && (
        <div className={styles.profileSection}>
          <span className={`avatar avatar-lg ${styles.profileAvatar}`}>
            {profile.profileImageUrl?.trim() ? (
              <img
                src={profile.profileImageUrl.trim()}
                alt={`${profile.nickname} 프로필`}
                className={styles.profileAvatarImg}
              />
            ) : (
              getInitials(profile.nickname)
            )}
          </span>
          <div className={styles.profileInfo}>
            <span className={styles.profileName}>{profile.nickname}</span>
            <span className={styles.profileRole}>Administrator</span>
          </div>
        </div>
      )}

      <nav className={styles.nav}>
        {MENU_ITEMS.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={
              isActive(item.path) ? styles.menuItemActive : styles.menuItem
            }
          >
            <span className={styles.menuIcon}>{item.icon}</span>
            <span className={styles.menuLabel}>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}
