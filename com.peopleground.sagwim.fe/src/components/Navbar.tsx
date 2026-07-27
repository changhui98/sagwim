import {
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import styles from './Navbar.module.css'
import { useAuth } from '../context/AuthContext'
import { useAuthGate } from '../context/AuthGateContext'
import { useNotificationCount } from '../context/NotificationCountContext'
import { useMessageCount } from '../context/MessageCountContext'
import { SidePanel, type SidePanelType } from './SidePanel'
import { MoreMenuPopover } from './MoreMenuPopover'
import { CreateBottomSheet } from './common/CreateBottomSheet'
import {
  ChatIcon,
  GridEvenMoreIcon,
  HeartIcon,
  HomeIcon,
  PlusSquareIcon,
  PostsIcon,
  SearchIcon,
  ShieldIcon,
  UserCircleIcon,
} from './NavIcons'

const ADMIN_ROLES = new Set(['ADMIN', 'MANAGER'])

interface NavbarProps {
  role: string | null
  onLogout: () => void
}

interface NavItem {
  label: string
  icon: ReactNode
  to?: string
  onClick?: () => void
  match?: (pathname: string) => boolean
  adminOnly?: boolean
  authOnly?: boolean
  mobileHidden?: boolean
  desktopHidden?: boolean
  /** 모바일 하단 바 가운데 만들기(+) 버튼 — 원형 강조 스타일 */
  createItem?: boolean
}

export function Navbar({ role, onLogout }: NavbarProps) {
  const { meRole, meProfileImageUrl, isAuthenticated } = useAuth()
  const { unreadCount } = useNotificationCount()
  const { unreadMessageCount } = useMessageCount()
  const effectiveRole = role ?? meRole ?? null
  const isAdmin = effectiveRole !== null && ADMIN_ROLES.has(effectiveRole)
  const location = useLocation()
  const navigate = useNavigate()

  const { open: openAuthGate } = useAuthGate()
  const [moreOpen, setMoreOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [activePanel, setActivePanel] = useState<SidePanelType | null>(null)
  const [createSheetOpen, setCreateSheetOpen] = useState(false)

  const togglePanel = useCallback((panel: SidePanelType) => {
    setActivePanel((prev) => (prev === panel ? null : panel))
    setMoreOpen(false)
  }, [])

  const closePanel = useCallback(() => {
    setActivePanel(null)
  }, [])

  /**
   * 회원 전용 화면으로 가는 탭의 링크 속성.
   * 로그인 상태면 평범한 Link, 게스트면 이동하지 않고 인증 게이트 모달만 연다.
   * (앱 LandingBottomBar가 게스트 탭을 openGate로 처리해 현재 화면에 머무는 것과 동일 동작)
   */
  const memberOnlyLink = (to: string): Pick<NavItem, 'to' | 'onClick'> =>
    isAuthenticated ? { to } : { onClick: openAuthGate }

  const navItems: NavItem[] = [
    {
      // 로그인 유저의 홈 = 모임 허브 (모바일 하단 바에서 모임 리스트 직행 진입점)
      to: isAuthenticated ? '/app/groups' : '/app',
      label: '홈',
      icon: <HomeIcon />,
      match: (p) => p === '/app' || p.startsWith('/app/groups'),
    },
    {
      label: '검색',
      icon: <SearchIcon />,
      // 모바일에서는 하단 바 대신 MobileHeader 좌측 돋보기가 검색 진입을 담당
      onClick: () => {
        if (window.innerWidth > 640) {
          togglePanel('search')
        } else {
          navigate('/app/search')
        }
      },
      match: (p) => activePanel === 'search' || p.startsWith('/app/search'),
      mobileHidden: true,
    },
    {
      ...memberOnlyLink('/app/posts'),
      label: '게시글',
      icon: <PostsIcon />,
      match: (p) => p.startsWith('/app/posts'),
    },
    {
      label: '만들기',
      icon: (
        <span className={styles.createIconCircle}>
          <PlusSquareIcon />
        </span>
      ),
      onClick: () => {
        if (!isAuthenticated) {
          openAuthGate()
          return
        }
        if (window.innerWidth > 640) {
          navigate('/app/create')
        } else {
          setCreateSheetOpen(true)
        }
      },
      match: (p) => createSheetOpen || p.startsWith('/app/create'),
      createItem: true,
    },
    {
      ...memberOnlyLink('/app/messages'),
      label: '메시지',
      icon: (
        <span className={styles.navIconWrap}>
          <ChatIcon />
          {unreadMessageCount > 0 && (
            <span
              className={styles.unreadBadge}
              aria-label={`읽지 않은 메시지 ${unreadMessageCount}건`}
            >
              {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
            </span>
          )}
        </span>
      ),
      match: (p) => p.startsWith('/app/messages'),
    },
    {
      ...memberOnlyLink('/app/profile'),
      label: '프로필',
      icon: meProfileImageUrl ? (
        <span className={styles.navAvatar} aria-hidden="true">
          <img src={meProfileImageUrl} alt="" className={styles.navAvatarImg} />
        </span>
      ) : (
        <UserCircleIcon />
      ),
      match: (p) => p.startsWith('/app/profile'),
    },
    {
      label: '알림',
      icon: (
        <span className={styles.navIconWrap}>
          <HeartIcon />
          {unreadCount > 0 && (
            <span
              className={styles.unreadBadge}
              aria-label={`읽지 않은 알림 ${unreadCount}건`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </span>
      ),
      onClick: () => {
        togglePanel('notifications')
      },
      match: () => activePanel === 'notifications',
      mobileHidden: true,
      authOnly: true,
    },
  ]

  if (isAdmin) {
    navItems.push({
      to: '/app/admin',
      label: '관리자',
      icon: <ShieldIcon />,
      match: (p) => p.startsWith('/app/admin'),
      adminOnly: true,
    })
  }

  const visibleNavItems = isAuthenticated
    ? navItems
    : navItems.filter((item) => !item.authOnly)

  const isActive = (item: NavItem) => {
    if (item.match) return item.match(location.pathname)
    return location.pathname === item.to
  }

  return (
    <>
    <aside
      className={`${styles.sidebar} ${(moreOpen || activePanel !== null) ? styles.sidebarOpen : ''}`}
      aria-label="주 메뉴"
    >
      <div className={styles.sidebarInner}>
        <Link to="/app" className={styles.brand} aria-label="Sagwim 홈">
          <span className={styles.brandLogoWrap}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className={styles.brandLogo} aria-hidden focusable={false}>
              <rect x="4" y="4" width="248" height="248" rx="56" fill="none" stroke="#91A8D0" strokeWidth="4" />
              <g stroke="#91A8D0" strokeWidth="26" strokeLinecap="round" fill="none">
                <path d="M128 78 L72 184" />
                <path d="M128 78 L184 184" />
              </g>
            </svg>
          </span>
        </Link>

        <nav className={styles.nav}>
          <ul className={styles.navList}>
            {visibleNavItems.map((item) => {
              const active = isActive(item)
              const itemClassName = `${styles.navItem} ${active ? styles.navItemActive : ''}`
              const itemContent = (
                <>
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navLabel}>{item.label}</span>
                </>
              )

              const liClassName = [
                item.adminOnly ? styles.adminNavItem : '',
                item.mobileHidden ? styles.mobileHiddenNavItem : '',
                item.desktopHidden ? styles.desktopHiddenNavItem : '',
                item.createItem ? styles.createNavItem : '',
              ].filter(Boolean).join(' ') || undefined

              return (
                <li key={item.label} className={liClassName}>
                  {item.onClick ? (
                    <button
                      type="button"
                      className={itemClassName}
                      onClick={item.onClick}
                      aria-current={active ? 'page' : undefined}
                    >
                      {itemContent}
                    </button>
                  ) : (
                    <Link
                      to={item.to ?? '#'}
                      className={itemClassName}
                      aria-current={active ? 'page' : undefined}
                    >
                      {itemContent}
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        <div className={styles.footer} ref={menuRef}>
          {isAuthenticated ? (
            <>
              <MoreMenuPopover
                isOpen={moreOpen}
                onClose={() => setMoreOpen(false)}
                onLogout={onLogout}
                anchorRef={menuRef}
                placement="sidebar"
              />
              <button
                type="button"
                className={`${styles.navItem} ${styles.moreButton} ${moreOpen ? styles.moreButtonOpen : ''}`}
                onClick={() => setMoreOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={moreOpen}
              >
                <span className={styles.navIcon}>
                  <GridEvenMoreIcon />
                </span>
                <span className={styles.navLabel}>더 보기</span>
              </button>
            </>
          ) : (
            <Link to="/login" className={`${styles.navItem} ${styles.moreButton}`}>
              <span className={styles.navIcon}>
                <UserCircleIcon />
              </span>
              <span className={styles.navLabel}>로그인</span>
            </Link>
          )}
        </div>
      </div>
    </aside>
    <SidePanel
      type={activePanel}
      onClose={closePanel}
    />
    <CreateBottomSheet
      isOpen={createSheetOpen}
      onClose={() => setCreateSheetOpen(false)}
    />
    </>
  )
}
