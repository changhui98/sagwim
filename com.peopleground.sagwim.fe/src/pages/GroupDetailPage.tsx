import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getGroup, joinGroup, leaveGroup, updateGroup, deleteGroup, kickGroupMember, uploadGroupImage, toggleGroupLike, getGroupLikeStatus } from '../api/groupApi'
import { GroupLikersModal } from '../components/group/GroupLikersModal'
import { getMyProfile } from '../api/userApi'
import { useAuth } from '../context/AuthContext'
import { useHandleUnauthorized } from '../hooks/useHandleUnauthorized'
import { extractErrorMessage } from '../utils/errorUtils'
import { Navbar } from '../components/Navbar'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { GroupEditForm } from '../components/group/GroupEditForm'
import { GroupDetailTabs } from '../components/group/GroupDetailTabs'
import { TabMemberList } from '../components/group/TabMemberList'
import { TabPostList } from '../components/group/TabPostList'
import { TabSchedule } from '../components/group/TabSchedule'
import photoCameraIcon from '../assets/photo-camera-photograph-svgrepo-com.svg'
import userAlt1Icon from '../assets/user-alt-1-svgrepo-com.svg'
import type { GroupTab } from '../components/group/GroupDetailTabs'
import type { GroupCategory, GroupDetailResponse, GroupMeetingType } from '../types/group'
import type { UserDetailResponse } from '../types/user'
import { GROUP_CATEGORY_LABELS, GROUP_MEETING_TYPE_LABELS } from '../types/group'
import styles from './GroupDetailPage.module.css'

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const { token, logout } = useAuth()
  const handleUnauthorized = useHandleUnauthorized()

  const [group, setGroup] = useState<GroupDetailResponse | null>(null)
  const [myProfile, setMyProfile] = useState<UserDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  const [isEditMode, setIsEditMode] = useState(false)
  const [activeTab, setActiveTab] = useState<GroupTab>('schedule')
  const [imageUploading, setImageUploading] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [likeLoading, setLikeLoading] = useState(false)
  const [likersModalOpen, setLikersModalOpen] = useState(false)

  const loadData = useCallback(async () => {
    if (!groupId) return
    try {
      setLoading(true)
      setError('')
      const [groupData, profileData, likeStatus] = await Promise.all([
        getGroup(token, Number(groupId)),
        getMyProfile(token),
        getGroupLikeStatus(token, Number(groupId)).catch(() => ({ liked: false })),
      ])
      setGroup(groupData)
      setMyProfile(profileData)
      setLikeCount(groupData.likeCount)
      setLiked(likeStatus.liked)
    } catch (err) {
      setError(extractErrorMessage(err, '모임 정보 조회 실패'))
      handleUnauthorized(err)
    } finally {
      setLoading(false)
    }
  }, [token, groupId, handleUnauthorized])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const isMember = group?.members.some((m) => m.username === myProfile?.username) ?? false
  const isLeader = myProfile?.username === group?.leaderUsername
  const groupImageUrl = group?.imageUrl?.trim() ? group.imageUrl.trim() : null

  const handleJoin = async () => {
    if (!groupId) return
    try {
      setActionLoading(true)
      await joinGroup(token, Number(groupId))
      await loadData()
    } catch (err) {
      alert(extractErrorMessage(err, '모임 가입 실패'))
      handleUnauthorized(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleLeave = async () => {
    if (!groupId) return
    if (!window.confirm('모임에서 탈퇴하시겠습니까?')) return
    try {
      setActionLoading(true)
      await leaveGroup(token, Number(groupId))
      await loadData()
    } catch (err) {
      alert(extractErrorMessage(err, '모임 탈퇴 실패'))
      handleUnauthorized(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditSubmit = async (data: {
    name: string
    description: string
    category: GroupCategory
    meetingType: GroupMeetingType
    region: string | null
    maxMemberCount: number
  }) => {
    if (!groupId) return
    try {
      setActionLoading(true)
      await updateGroup(token, Number(groupId), data)
      setIsEditMode(false)
      await loadData()
    } catch (err) {
      alert(extractErrorMessage(err, '모임 수정 실패'))
      handleUnauthorized(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteGroup = async () => {
    if (!groupId) return
    if (!window.confirm('모임을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
    try {
      setActionLoading(true)
      await deleteGroup(token, Number(groupId))
      navigate('/app/groups', { replace: true })
    } catch (err) {
      alert(extractErrorMessage(err, '모임 삭제 실패'))
      handleUnauthorized(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleKick = async (username: string, nickname: string) => {
    if (!groupId) return
    if (!window.confirm(`${nickname}님을 강퇴하시겠습니까?`)) return
    try {
      setActionLoading(true)
      await kickGroupMember(token, Number(groupId), username)
      await loadData()
    } catch (err) {
      alert(extractErrorMessage(err, '강퇴 실패'))
      handleUnauthorized(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleLikeToggle = async () => {
    if (!groupId || likeLoading) return
    try {
      setLikeLoading(true)
      const res = await toggleGroupLike(token, Number(groupId))
      setLiked(res.liked)
      setLikeCount(res.likeCount)
    } catch {
      // 조용히 실패
    } finally {
      setLikeLoading(false)
    }
  }

  const handleImageAreaClick = () => {
    if (!isLeader) return
    imageInputRef.current?.click()
  }

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !groupId) return

    // 동일 파일 재선택 허용을 위해 value 초기화
    e.target.value = ''

    try {
      setImageUploading(true)
      const updated = await uploadGroupImage(token, Number(groupId), file)
      // 업로드 성공 시 group 상태의 imageUrl만 즉시 반영 (전체 재조회 없이)
      setGroup((prev) => (prev ? { ...prev, imageUrl: updated.imageUrl } : prev))
    } catch (err) {
      alert(extractErrorMessage(err, '이미지 업로드에 실패했습니다.'))
      handleUnauthorized(err)
    } finally {
      setImageUploading(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar role={myProfile?.role ?? null} onLogout={handleLogout} />
        <main className={styles.main}>
          <div className={styles.loadingWrapper}>
            <LoadingSpinner />
          </div>
        </main>
      </>
    )
  }

  if (error || !group) {
    return (
      <>
        <Navbar role={myProfile?.role ?? null} onLogout={handleLogout} />
        <main className={styles.main}>
          <div className={styles.errorWrapper}>
            <p className={styles.errorText}>{error || '모임을 찾을 수 없습니다.'}</p>
            <button type="button" className={styles.backButton} onClick={() => navigate('/app/groups')}>
              목록으로 돌아가기
            </button>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar role={myProfile?.role ?? null} onLogout={handleLogout} />

      <GroupLikersModal
        isOpen={likersModalOpen}
        groupId={Number(groupId)}
        token={token}
        onClose={() => setLikersModalOpen(false)}
      />

      <main className={styles.main}>
        <div className={styles.topRow}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => navigate('/app/groups')}
          >
            &larr; 모임 목록
          </button>

          {isLeader && !isEditMode && (
            <div className={styles.topActions}>
              <button
                type="button"
                className={styles.topTextAction}
                onClick={() => setIsEditMode(true)}
                disabled={actionLoading}
              >
                수정
              </button>
              <button
                type="button"
                className={styles.topTextAction}
                onClick={handleDeleteGroup}
                disabled={actionLoading}
              >
                삭제
              </button>
            </div>
          )}

          {!isLeader && (
            <div className={styles.actionRow}>
              {isMember ? (
                <button
                  type="button"
                  className={styles.topTextAction}
                  onClick={handleLeave}
                  disabled={actionLoading}
                >
                  {actionLoading ? '처리 중...' : '모임 탈퇴'}
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.topTextAction}
                  onClick={handleJoin}
                  disabled={actionLoading || group.currentMemberCount >= group.maxMemberCount}
                >
                  {actionLoading
                    ? '처리 중...'
                    : group.currentMemberCount >= group.maxMemberCount
                      ? '정원 초과'
                      : '모임 가입'}
                </button>
              )}
            </div>
          )}
        </div>

        <div className={styles.groupHeader}>
          {/* hidden file input — 모임장 전용 */}
          {isLeader && (
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={handleImageFileChange}
            />
          )}

          <div
            className={`${styles.heroMedia} ${isLeader ? styles.heroMediaLeader : ''}`}
            onClick={handleImageAreaClick}
            role={isLeader ? 'button' : undefined}
            tabIndex={isLeader ? 0 : undefined}
            aria-label={isLeader ? '모임 대표 사진 변경' : undefined}
            onKeyDown={isLeader ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleImageAreaClick() } : undefined}
          >
            {imageUploading ? (
              <div className={styles.heroImagePlaceholder}>
                <p className={styles.placeholderText}>업로드 중...</p>
              </div>
            ) : groupImageUrl ? (
              <>
                <img
                  src={groupImageUrl}
                  alt={`${group.name} 대표 이미지`}
                  className={styles.heroImage}
                />
                {isLeader && (
                  <div className={styles.heroImageEditOverlay} aria-hidden="true">
                    <img src={photoCameraIcon} alt="" className={styles.overlayIcon} />
                    <span className={styles.overlayText}>사진 변경</span>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.heroImagePlaceholder} role="img" aria-label="모임 이미지 준비중">
                <img src={photoCameraIcon} alt="" className={styles.placeholderIcon} />
                <p className={styles.placeholderText}>
                  {isLeader ? '사진을 등록해주세요.' : '모임의 사진을 준비중입니다.'}
                </p>
              </div>
            )}
          </div>

          <div className={styles.groupSummary}>
            <div className={styles.badgeRow}>
              <span className={styles.categoryBadge}>
                {GROUP_CATEGORY_LABELS[group.category]}
              </span>
              <span
                className={
                  group.meetingType === 'ONLINE'
                    ? styles.meetingTypeBadgeOnline
                    : styles.meetingTypeBadgeOffline
                }
              >
                {group.meetingType === 'OFFLINE' && group.region
                  ? `오프라인 · ${group.region}`
                  : GROUP_MEETING_TYPE_LABELS[group.meetingType]}
              </span>
            </div>

            <h1 className={styles.groupName}>{group.name}</h1>
            <div className={styles.memberCountBox}>
              <img src={userAlt1Icon} alt="" aria-hidden="true" className={styles.memberCountIcon} />
              <span className={styles.memberCountValue}>
                {group.currentMemberCount} / {group.maxMemberCount}
              </span>
            </div>

            {group.description && (
              <p className={styles.groupDescription}>{group.description}</p>
            )}
            <div className={styles.likeArea}>
              <button
                type="button"
                className={`${styles.likeHeartButton} ${liked ? styles.likeButtonActive : ''}`}
                onClick={handleLikeToggle}
                disabled={likeLoading}
                aria-label={liked ? '좋아요 취소' : '좋아요'}
              >
                <span className={styles.likeIcon}>{liked ? '♥' : '♡'}</span>
              </button>
              <button
                type="button"
                className={`${styles.likeCountButton} ${liked ? styles.likeButtonActive : ''}`}
                onClick={() => setLikersModalOpen(true)}
                aria-label={`좋아요 ${likeCount}명 보기`}
              >
                <span className={styles.likeCount}>{likeCount}</span>
              </button>
            </div>
          </div>
        </div>

        {isLeader && isEditMode && (
          <GroupEditForm
            group={group}
            actionLoading={actionLoading}
            onSubmit={handleEditSubmit}
            onCancel={() => setIsEditMode(false)}
          />
        )}

        <div className={styles.contentDivider} aria-hidden="true" />

        {/* 탭 네비게이션 */}
        <div className={styles.tabSection}>
          <GroupDetailTabs activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === 'posts' && (
            <TabPostList groupId={Number(groupId)} isMember={isMember} />
          )}
          {activeTab === 'members' && (
            <TabMemberList
              members={group.members}
              isLeader={isLeader}
              actionLoading={actionLoading}
              onKick={handleKick}
            />
          )}
          {activeTab === 'schedule' && (
            <TabSchedule groupId={Number(groupId)} isMember={isMember} />
          )}
        </div>
      </main>
    </>
  )
}
