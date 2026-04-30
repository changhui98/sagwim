export type GroupTab = 'posts' | 'members' | 'schedule'

interface GroupDetailTabsProps {
  activeTab: GroupTab
  onChange: (tab: GroupTab) => void
}

import styles from './GroupDetailTabs.module.css'

const TABS: { key: GroupTab; label: string; icon: string }[] = [
  { key: 'schedule', label: '일정', icon: 'calendar-custom' },
  { key: 'posts', label: '게시글', icon: 'posts-custom' },
  { key: 'members', label: '멤버', icon: 'members-custom' },
]

function ScheduleTabIcon() {
  return (
    <svg
      className={styles.tabImageIcon}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="18" rx="2.2" />
        <path d="M2 9.2h20" />
        <path d="M7 2.8v3.2M12 2.8v3.2M17 2.8v3.2" />
        <rect x="6" y="12" width="3" height="3" />
        <rect x="10.5" y="12" width="3" height="3" />
        <rect x="15" y="12" width="3" height="3" />
      </g>
    </svg>
  )
}

function PostsTabIcon() {
  return (
    <svg
      className={styles.tabImageIcon}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M8 5.00005C7.01165 5.00082 6.49359 5.01338 6.09202 5.21799C5.71569 5.40973 5.40973 5.71569 5.21799 6.09202C5 6.51984 5 7.07989 5 8.2V17.8C5 18.9201 5 19.4802 5.21799 19.908C5.40973 20.2843 5.71569 20.5903 6.09202 20.782C6.51984 21 7.07989 21 8.2 21H15.8C16.9201 21 17.4802 21 17.908 20.782C18.2843 20.5903 18.5903 20.2843 18.782 19.908C19 19.4802 19 18.9201 19 17.8V8.2C19 7.07989 19 6.51984 18.782 6.09202C18.5903 5.71569 18.2843 5.40973 17.908 5.21799C17.5064 5.01338 16.9884 5.00082 16 5.00005M8 5.00005V7H16V5.00005M8 5.00005V4.70711C8 4.25435 8.17986 3.82014 8.5 3.5C8.82014 3.17986 9.25435 3 9.70711 3H14.2929C14.7456 3 15.1799 3.17986 15.5 3.5C15.8201 3.82014 16 4.25435 16 4.70711V5.00005M15 12H12M15 16H12M9 12H9.01M9 16H9.01"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MembersTabIcon() {
  return (
    <svg
      className={styles.tabImageIcon}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M5 21C5 17.134 8.13401 14 12 14C15.866 14 19 17.134 19 21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function GroupDetailTabs({ activeTab, onChange }: GroupDetailTabsProps) {
  return (
    <nav className={styles.tabNav} role="tablist" aria-label="모임 상세 탭">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-label={tab.label}
          aria-selected={activeTab === tab.key}
          className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabBtnActive : ''}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.key === 'schedule' && <ScheduleTabIcon />}
          {tab.key === 'posts' && <PostsTabIcon />}
          {tab.key === 'members' && <MembersTabIcon />}
        </button>
      ))}
    </nav>
  )
}
