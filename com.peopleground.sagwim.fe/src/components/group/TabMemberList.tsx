import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getUserProfile } from '../../api/userApi'
import { useAuth } from '../../context/AuthContext'
import type { GroupMemberResponse } from '../../types/group'
import styles from './TabMemberList.module.css'

interface TabMemberListProps {
  members: GroupMemberResponse[]
  isLeader: boolean
  actionLoading: boolean
  onKick: (username: string, nickname: string) => void
}

function CrownIcon() {
  return (
    <svg
      className={styles.crownIcon}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4 8L6 20H18L20 8M4 8L5.71624 9.37299C6.83218 10.2657 7.39014 10.7121 7.95256 10.7814C8.4453 10.8421 8.94299 10.7173 9.34885 10.4314C9.81211 10.1051 10.0936 9.4483 10.6565 8.13476L12 5M4 8C4.55228 8 5 7.55228 5 7C5 6.44772 4.55228 6 4 6C3.44772 6 3 6.44772 3 7C3 7.55228 3.44772 8 4 8ZM20 8L18.2838 9.373C17.1678 10.2657 16.6099 10.7121 16.0474 10.7814C15.5547 10.8421 15.057 10.7173 14.6511 10.4314C14.1879 10.1051 13.9064 9.4483 13.3435 8.13476L12 5M20 8C20.5523 8 21 7.55228 21 7C21 6.44772 20.5523 6 20 6C19.4477 6 19 6.44772 19 7C19 7.55228 19.4477 8 20 8ZM12 5C12.5523 5 13 4.55228 13 4C13 3.44772 12.5523 3 12 3C11.4477 3 11 3.44772 11 4C11 4.55228 11.4477 5 12 5ZM12 4H12.01M20 7H20.01M4 7H4.01"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function TabMemberList({ members, isLeader, actionLoading, onKick }: TabMemberListProps) {
  const { token } = useAuth()
  const [profileImageMap, setProfileImageMap] = useState<Record<string, string>>({})

  useEffect(() => {
    if (members.length === 0) {
      setProfileImageMap({})
      return
    }

    let cancelled = false
    const usernames = members.map((member) => member.username)

    Promise.all(
      usernames.map(async (username) => {
        try {
          const profile = await getUserProfile(token, username)
          return [username, profile.profileImageUrl?.trim() ?? ''] as const
        } catch {
          return [username, ''] as const
        }
      }),
    ).then((entries) => {
      if (cancelled) return
      const next: Record<string, string> = {}
      entries.forEach(([username, url]) => {
        if (url) next[username] = url
      })
      setProfileImageMap(next)
    })

    return () => {
      cancelled = true
    }
  }, [members, token])

  const membersSorted = useMemo(
    () =>
      [...members].sort((a, b) => {
        if (a.role === 'LEADER' && b.role !== 'LEADER') return -1
        if (a.role !== 'LEADER' && b.role === 'LEADER') return 1
        return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
      }),
    [members],
  )

  const formatJoinedDate = (joinedAt: string) => {
    const dt = new Date(joinedAt)
    if (Number.isNaN(dt.getTime())) return '가입일 정보 없음'
    const yy = dt.getFullYear()
    const mm = String(dt.getMonth() + 1).padStart(2, '0')
    const dd = String(dt.getDate()).padStart(2, '0')
    return `${yy}.${mm}.${dd} 가입`
  }

  return (
    <section className={styles.membersSection}>
      <ul className={styles.memberGrid}>
        {membersSorted.map((member) => (
          <li key={member.userId} className={styles.memberItem}>
            <Link
              to={`/app/profile/${encodeURIComponent(member.username)}`}
              className={styles.memberLink}
              aria-label={`${member.nickname} 프로필로 이동`}
            >
              <div className={styles.memberAvatarWrap}>
                {profileImageMap[member.username] ? (
                  <img
                    src={profileImageMap[member.username]}
                    alt={`${member.nickname} 프로필 이미지`}
                    className={styles.memberAvatarImg}
                  />
                ) : (
                  <span className={`avatar ${styles.memberAvatar}`}>
                    {member.nickname.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className={styles.memberInfo}>
                <span className={styles.memberNickname}>{member.nickname}</span>
                <span className={styles.memberJoinedAt}>{formatJoinedDate(member.joinedAt)}</span>
              </div>
            </Link>
            {member.role === 'LEADER' && (
              <span className={styles.leaderBadge} aria-label="모임장">
                <CrownIcon />
              </span>
            )}
            {isLeader && member.role !== 'LEADER' && (
              <button
                type="button"
                className={styles.kickButton}
                onClick={() => onKick(member.username, member.nickname)}
                disabled={actionLoading}
              >
                강퇴
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
