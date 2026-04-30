import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNewGroups, getGroupLikeStatus, toggleGroupLike } from '../api/groupApi'
import { useAuth } from '../context/AuthContext'
import { useHandleUnauthorized } from '../hooks/useHandleUnauthorized'
import { Navbar } from '../components/Navbar'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { EmptyState } from '../components/common/EmptyState'
import type { GroupResponse } from '../types/group'
import { GROUP_CATEGORY_LABELS, GROUP_MEETING_TYPE_LABELS } from '../types/group'
import userAlt1Icon from '../assets/user-alt-1-svgrepo-com.svg'
import styles from './NewGroupsPage.module.css'

const PAGE_SIZE = 20

export function NewGroupsPage() {
  const navigate = useNavigate()
  const { token, logout, meRole } = useAuth()
  const handleUnauthorized = useHandleUnauthorized()

  const [groups, setGroups] = useState<GroupResponse[]>([])
  const [page, setPage] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [likedMap, setLikedMap] = useState<Record<number, boolean>>({})
  const [likeCountMap, setLikeCountMap] = useState<Record<number, number>>({})

  const loadPage = useCallback(
    async (pageNum: number, append: boolean) => {
      try {
        if (append) {
          setLoadingMore(true)
        } else {
          setLoading(true)
          setError('')
        }

        const response = await getNewGroups(token, pageNum, PAGE_SIZE)

        const incoming = response.content
        setGroups((prev) => (append ? [...prev, ...incoming] : incoming))
        setHasNext(response.hasNext)

        // 좋아요 수 맵 업데이트
        setLikeCountMap((prev) => {
          const next = { ...prev }
          incoming.forEach((g) => { next[g.id] = g.likeCount ?? 0 })
          return next
        })

        // 좋아요 여부 병렬 조회
        const likeStatusResults = await Promise.allSettled(
          incoming.map((g) => getGroupLikeStatus(token, g.id)),
        )
        setLikedMap((prev) => {
          const next = { ...prev }
          incoming.forEach((g, idx) => {
            const result = likeStatusResults[idx]
            next[g.id] = result.status === 'fulfilled' ? result.value.liked : false
          })
          return next
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : '모임 목록 조회 실패'
        setError(message)
        handleUnauthorized(err)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [token, handleUnauthorized],
  )

  useEffect(() => {
    loadPage(0, false)
  }, [loadPage])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    loadPage(nextPage, true)
  }

  const handleLikeToggle = async (e: React.MouseEvent, groupId: number) => {
    e.stopPropagation()
    try {
      const res = await toggleGroupLike(token, groupId)
      setLikedMap((prev) => ({ ...prev, [groupId]: res.liked }))
      setLikeCountMap((prev) => ({ ...prev, [groupId]: res.likeCount }))
    } catch {
      // 조용히 실패
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const renderGroupCard = (group: GroupResponse) => (
    <div
      key={group.id}
      role="button"
      tabIndex={0}
      className={styles.groupCard}
      onClick={() => navigate(`/app/groups/${group.id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/app/groups/${group.id}`) }}
    >
      <div className={styles.groupImageWrap}>
        {group.imageUrl ? (
          <img
            src={group.imageUrl}
            alt={group.name}
            className={styles.groupImage}
          />
        ) : (
          <div className={styles.groupImagePlaceholder}>🏠</div>
        )}
        <div className={styles.imageBadges}>
          <span className={styles.imageBadge}>
            {GROUP_CATEGORY_LABELS[group.category]}
          </span>
          <span className={`${styles.imageBadge} ${group.meetingType === 'ONLINE' ? styles.imageBadgeOnline : styles.imageBadgeOffline}`}>
            {group.meetingType === 'OFFLINE' && group.region
              ? `오프라인 · ${group.region}`
              : GROUP_MEETING_TYPE_LABELS[group.meetingType]}
          </span>
        </div>
      </div>
      <div className={styles.groupInfo}>
        <div className={styles.groupNameRow}>
          <p className={styles.groupName}>{group.name}</p>
          <div className={styles.memberCount}>
            <img src={userAlt1Icon} alt="" aria-hidden="true" className={styles.memberCountIcon} />
            <span>{group.currentMemberCount}/{group.maxMemberCount}</span>
          </div>
        </div>
        <div className={styles.groupDescRow}>
          <p className={styles.groupDesc}>{group.description ?? ''}</p>
          <button
            type="button"
            className={`${styles.likeButton} ${likedMap[group.id] ? styles.likeButtonActive : ''}`}
            onClick={(e) => handleLikeToggle(e, group.id)}
            aria-label={likedMap[group.id] ? '좋아요 취소' : '좋아요'}
          >
            <span>{likedMap[group.id] ? '♥' : '♡'}</span>
            <span>{likeCountMap[group.id] ?? 0}</span>
          </button>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    if (loading) {
      return (
        <div className={styles.loadingWrapper}>
          <LoadingSpinner />
        </div>
      )
    }

    if (error) {
      return (
        <div className="card">
          <EmptyState
            title="모임 목록을 불러올 수 없습니다."
            description={error}
            action={{ label: '다시 시도', onClick: () => loadPage(0, false) }}
          />
        </div>
      )
    }

    if (groups.length === 0) {
      return (
        <div className={styles.emptyStateCenter}>
          <EmptyState
            title="최근 7일 내 생성된 모임이 없습니다."
            description="첫 번째 모임을 만들어보세요."
          />
        </div>
      )
    }

    return (
      <>
        <div className={styles.groupGrid}>
          {groups.map((group) => renderGroupCard(group))}
        </div>
        {hasNext && (
          <div className={styles.loadMoreWrapper}>
            <button
              type="button"
              className={styles.loadMoreButton}
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? '불러오는 중...' : '더 보기'}
            </button>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <Navbar role={meRole} onLogout={handleLogout} />

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => navigate('/app/groups')}
            aria-label="뒤로 가기"
          >
            ←
          </button>
          <div>
            <h1 className={styles.pageTitle}>🌱 갓 피어난 모임</h1>
            <p className={styles.pageSubtitle}>최근 7일 내 생성된 모임 전체 목록</p>
          </div>
        </div>

        {renderContent()}
      </main>
    </>
  )
}
