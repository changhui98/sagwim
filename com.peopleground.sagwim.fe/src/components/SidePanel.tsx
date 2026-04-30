import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { searchUsers } from '../api/userApi'
import { getPosts } from '../api/postApi'
import { getGroups } from '../api/groupApi'
import type { UserResponse } from '../types/user'
import type { ContentResponse } from '../types/post'
import type { GroupResponse } from '../types/group'
import { GROUP_CATEGORY_LABELS } from '../types/group'
import styles from './SidePanel.module.css'

export type SidePanelType = 'search' | 'notifications'

interface SidePanelProps {
  type: SidePanelType | null
  onClose: () => void
}

interface PanelConfig {
  title: string
  renderContent: (onClose: () => void) => ReactNode
}

interface SearchResults {
  users: UserResponse[]
  posts: ContentResponse[]
  groups: GroupResponse[]
}

function SearchContent({ onClose }: { onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { token } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResults | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults(null)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const [usersRes, postsRes, groupsRes] = await Promise.allSettled([
          searchUsers(token, trimmed, 0, 5),
          getPosts(token, 0, 5, trimmed, 'TITLE'),
          getGroups(token, 0, 5, trimmed),
        ])
        setResults({
          users: usersRes.status === 'fulfilled' ? usersRes.value.content : [],
          posts: postsRes.status === 'fulfilled' ? postsRes.value.content : [],
          groups: groupsRes.status === 'fulfilled' ? groupsRes.value.content : [],
        })
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, token])

  const handleUserClick = (username: string) => {
    navigate(`/app/profile/${username}`)
    onClose()
  }

  const handlePostClick = () => {
    navigate('/app')
    onClose()
  }

  const handleGroupClick = (groupId: number) => {
    navigate(`/app/groups/${groupId}`)
    onClose()
  }

  const hasResults =
    results &&
    (results.users.length > 0 || results.posts.length > 0 || results.groups.length > 0)

  return (
    <div className={styles.panelBody}>
      <div className={styles.searchInputWrap}>
        <input
          ref={inputRef}
          type="search"
          className={styles.searchInput}
          placeholder="검색"
          aria-label="검색어 입력"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading && (
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} aria-label="검색 중" />
        </div>
      )}

      {!loading && !query.trim() && (
        <p className={styles.emptyMessage}>검색어를 입력해주세요.</p>
      )}

      {!loading && query.trim() && results && !hasResults && (
        <p className={styles.emptyMessage}>검색 결과가 없습니다.</p>
      )}

      {!loading && results && results.users.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionTitle}>유저</p>
            <button
              type="button"
              className={styles.sectionViewAll}
              onClick={() => { navigate('/app/users'); onClose() }}
            >
              전체 보기
            </button>
          </div>
          <ul className={styles.resultList}>
            {results.users.map((user) => (
              <li key={user.username}>
                <button
                  type="button"
                  className={styles.resultItem}
                  onClick={() => handleUserClick(user.username)}
                >
                  <div className={styles.avatar}>
                    {user.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt={user.nickname}
                        className={styles.avatarImg}
                      />
                    ) : (
                      <span className={styles.avatarFallback}>{user.nickname[0]}</span>
                    )}
                  </div>
                  <div className={styles.resultMeta}>
                    <span className={styles.resultPrimary}>{user.nickname}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && results && results.posts.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionTitle}>게시글</p>
            <button
              type="button"
              className={styles.sectionViewAll}
              onClick={() => { navigate('/app'); onClose() }}
            >
              전체 보기
            </button>
          </div>
          <ul className={styles.resultList}>
            {results.posts.slice(0, 5).map((post) => (
              <li key={post.id}>
                <button
                  type="button"
                  className={styles.resultItem}
                  onClick={handlePostClick}
                >
                  <div className={styles.resultMeta}>
                    <span className={styles.resultPrimary}>
                      {post.body.length > 60 ? post.body.slice(0, 60) + '…' : post.body}
                    </span>
                    <span className={styles.resultSecondary}>
                      {post.nickname ?? post.createdBy}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && results && results.groups.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionTitle}>모임</p>
          <ul className={styles.resultList}>
            {results.groups.map((group) => (
              <li key={group.id}>
                <button
                  type="button"
                  className={styles.resultItem}
                  onClick={() => handleGroupClick(group.id)}
                >
                  <div className={styles.avatar}>
                    {group.imageUrl ? (
                      <img
                        src={group.imageUrl}
                        alt={group.name}
                        className={styles.avatarImg}
                      />
                    ) : (
                      <span className={styles.avatarFallback}>{group.name[0]}</span>
                    )}
                  </div>
                  <div className={styles.resultMeta}>
                    <span className={styles.resultPrimary}>{group.name}</span>
                    <span className={styles.resultSecondary}>
                      {GROUP_CATEGORY_LABELS[group.category]} · {group.currentMemberCount}명
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function NotificationsContent() {
  return (
    <div className={styles.panelBody}>
      <p className={styles.emptyMessage}>새로운 알림이 없습니다.</p>
    </div>
  )
}

const PANEL_CONFIG: Record<SidePanelType, PanelConfig> = {
  search: {
    title: '검색',
    renderContent: (onClose) => <SearchContent onClose={onClose} />,
  },
  notifications: {
    title: '알림',
    renderContent: () => <NotificationsContent />,
  },
}

export function SidePanel({ type, onClose }: SidePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const isOpen = type !== null

  // 외부 클릭으로 닫기 — 사이드바(aside) 클릭은 제외
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      // 패널 내부 클릭이면 무시
      if (panelRef.current?.contains(target)) return
      // 사이드바(aside) 내부 클릭이면 무시 (버튼 토글은 Navbar에서 처리)
      const sidebar = document.querySelector('aside[aria-label="주 메뉴"]')
      if (sidebar?.contains(target)) return
      onClose()
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    // mousedown으로 등록해야 클릭 이벤트보다 먼저 실행됨
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const config = type ? PANEL_CONFIG[type] : null

  return (
    <div
      ref={panelRef}
      className={`${styles.panel} ${isOpen ? styles.panelOpen : ''}`}
      role="dialog"
      aria-modal="false"
      aria-label={config?.title}
      aria-hidden={!isOpen}
    >
      {config && (
        <>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>{config.title}</h2>
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="패널 닫기"
            >
              <CloseIcon />
            </button>
          </div>
          {config.renderContent(onClose)}
        </>
      )}
    </div>
  )
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
