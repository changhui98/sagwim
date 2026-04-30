import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { GROUP_CATEGORY_LABELS, GROUP_MEETING_TYPE_LABELS } from '../../types/group'
import type { GroupResponse } from '../../types/group'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { EmptyState } from '../common/EmptyState'
import userAlt1Icon from '../../assets/user-alt-1-svgrepo-com.svg'
import styles from './GroupSection.module.css'

interface GroupCardProps {
  group: GroupResponse
  liked: boolean
  likeCount: number
  onNavigate: (groupId: number) => void
  onLikeToggle: (e: React.MouseEvent, groupId: number) => void
}

function GroupCard({ group, liked, likeCount, onNavigate, onLikeToggle }: GroupCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={styles.card}
      onClick={() => onNavigate(group.id)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigate(group.id) }}
    >
      <div className={styles.imageWrap}>
        {group.imageUrl ? (
          <img
            src={group.imageUrl}
            alt={group.name}
            className={styles.image}
          />
        ) : (
          <div className={styles.imagePlaceholder}>🏠</div>
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
      <div className={styles.cardInfo}>
        <div className={styles.cardNameRow}>
          <p className={styles.cardName}>{group.name}</p>
          <div className={styles.cardMemberCount}>
            <img src={userAlt1Icon} alt="" aria-hidden="true" className={styles.cardMemberCountIcon} />
            <span>{group.currentMemberCount}/{group.maxMemberCount}</span>
          </div>
        </div>
        <div className={styles.cardDescRow}>
          <p className={styles.cardDesc}>{group.description ?? ''}</p>
          <button
            type="button"
            className={`${styles.likeButton} ${liked ? styles.likeButtonActive : ''}`}
            onClick={(e) => onLikeToggle(e, group.id)}
            aria-label={liked ? '좋아요 취소' : '좋아요'}
          >
            <span>{liked ? '♥' : '♡'}</span>
            <span>{likeCount}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

interface GroupSectionProps {
  title: string
  subtitle: string
  groups: GroupResponse[]
  loading: boolean
  error: string
  onRetry?: () => void
  onViewAll?: () => void
  likedMap: Record<number, boolean>
  likeCountMap: Record<number, number>
  onLikeToggle: (e: React.MouseEvent, groupId: number) => void
  emptyIcon?: ReactNode
  emptyTitle?: string
  emptyDescription?: string
}

export function GroupSection({
  title,
  subtitle,
  groups,
  loading,
  error,
  onRetry,
  onViewAll,
  likedMap,
  likeCountMap,
  onLikeToggle,
  emptyIcon,
  emptyTitle,
  emptyDescription,
}: GroupSectionProps) {
  const navigate = useNavigate()

  const renderBody = () => {
    if (loading) {
      return (
        <div className={styles.loadingWrapper}>
          <LoadingSpinner />
        </div>
      )
    }

    if (error) {
      return (
        <EmptyState
          title="모임 목록을 불러올 수 없습니다."
          description={error}
          action={onRetry ? { label: '다시 시도', onClick: onRetry } : undefined}
        />
      )
    }

    if (groups.length === 0) {
      return (
        <div className={styles.emptyStateCenter}>
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
          />
        </div>
      )
    }

    return (
      <div className={styles.grid}>
        {groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            liked={likedMap[group.id] ?? false}
            likeCount={likeCountMap[group.id] ?? 0}
            onNavigate={(groupId) => navigate(`/app/groups/${groupId}`)}
            onLikeToggle={onLikeToggle}
          />
        ))}
      </div>
    )
  }

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.sectionTitle}>{title}</p>
          <p className={styles.sectionSubtitle}>{subtitle}</p>
        </div>
        {onViewAll && (
          <button
            type="button"
            className={styles.sectionViewAll}
            onClick={onViewAll}
          >
            전체 보기
          </button>
        )}
      </div>
      {renderBody()}
    </section>
  )
}
