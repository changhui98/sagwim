import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getMyProfile, getUserProfile, updateMyProfile } from '../api/userApi'
import { uploadUserProfileImage } from '../api/imageApi'
import { useAuth } from '../context/AuthContext'
import { useHandleUnauthorized } from '../hooks/useHandleUnauthorized'
import { usePostCreatedSubscription } from '../context/PostCreateModalContext'
import { Navbar } from '../components/Navbar'
import { ProfileEditModal } from '../components/profile/ProfileEditModal'
import {
  MyPostsSection,
  type MyPostsSectionHandle,
} from '../components/profile/MyPostsSection'
import { getInitials } from '../utils/stringUtils'
import styles from './ProfilePage.module.css'
import type { UserDetailResponse } from '../types/user'
import { ApiError } from '../api/ApiError'

export function ProfilePage() {
  const navigate = useNavigate()
  const { username } = useParams<{ username?: string }>()
  const { token, logout, setMeProfile } = useAuth()

  const [myProfile, setMyProfile] = useState<UserDetailResponse | null>(null)
  const [viewerProfile, setViewerProfile] = useState<UserDetailResponse | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const myPostsRef = useRef<MyPostsSectionHandle | null>(null)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const isOwner = !!viewerProfile && !!myProfile && viewerProfile.username === myProfile.username

  const handleUnauthorized = useHandleUnauthorized()

  const loadProfile = useCallback(async () => {
    try {
      setProfileLoading(true)
      setProfileError('')
      if (username) {
        const [viewerResponse, targetResponse] = await Promise.all([
          getMyProfile(token),
          getUserProfile(token, username),
        ])
        setViewerProfile(viewerResponse)
        setMyProfile(targetResponse)
        setMeProfile(viewerResponse)
      } else {
        const response = await getMyProfile(token)
        setViewerProfile(response)
        setMyProfile(response)
        setMeProfile(response)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '프로필 조회 실패'
      setProfileError(message)
      handleUnauthorized(err)
    } finally {
      setProfileLoading(false)
    }
  }, [token, handleUnauthorized, username, setMeProfile])

  const handleProfileSaved = (updated: UserDetailResponse) => {
    setMyProfile(updated)
    setViewerProfile(updated)
    setMeProfile(updated)
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const handleAvatarPick = useCallback(() => {
    if (!isOwner || avatarUploading || !myProfile) return
    avatarInputRef.current?.click()
  }, [avatarUploading, isOwner, myProfile])

  const handleAvatarChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      if (!myProfile) return
      const file = e.target.files?.[0]
      e.currentTarget.value = ''
      if (!file) return

      try {
        setAvatarUploading(true)
        setProfileError('')
        const uploaded = await uploadUserProfileImage(token, file, myProfile.id)
        const updated = await updateMyProfile(token, {
          nickname: myProfile.nickname,
          userEmail: myProfile.userEmail,
          address: myProfile.address,
          currentPassword: '',
          newPassword: '',
          profileImageUrl: uploaded.fileUrl,
        })
        setMyProfile(updated)
        if (viewerProfile?.username === updated.username) {
          setViewerProfile(updated)
        }
        setMeProfile(updated)
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message || '프로필 이미지 변경에 실패했습니다.'
            : '프로필 이미지 변경에 실패했습니다.'
        setProfileError(message)
        handleUnauthorized(err)
      } finally {
        setAvatarUploading(false)
      }
    },
    [myProfile, token, viewerProfile, handleUnauthorized, setMeProfile],
  )

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  // 새 글 작성 플로우가 완료되면 내 글 목록을 최신화한다.
  usePostCreatedSubscription(
    useCallback(() => {
      myPostsRef.current?.refresh()
    }, []),
  )

  return (
    <>
      <Navbar role={myProfile?.role ?? null} onLogout={handleLogout} />

      <main className={styles.main}>
        {profileError && (
          <p className="alert alert-error" role="alert">{profileError}</p>
        )}

        {/* ── 공개 프로필 헤더 ── */}
        <section className={styles.profileHeader} aria-label={isOwner ? '내 프로필' : '사용자 프로필'}>
          <div className={styles.avatarWrap}>
            <button
              type="button"
              className={styles.avatarButton}
              onClick={handleAvatarPick}
              disabled={!isOwner || avatarUploading || !myProfile}
              aria-label={isOwner ? '프로필 사진 변경' : '프로필 사진'}
            >
              {myProfile?.profileImageUrl ? (
                <img
                  src={myProfile.profileImageUrl}
                  alt={`${myProfile.nickname} 프로필 이미지`}
                  className={styles.avatarImage}
                />
              ) : (
                <span className={`avatar ${styles.avatarLg}`}>
                  {myProfile ? getInitials(myProfile.nickname) : '··'}
                </span>
              )}
            </button>
            {isOwner && (
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className={styles.avatarInput}
                onChange={handleAvatarChange}
                disabled={avatarUploading}
              />
            )}
          </div>

          <div className={styles.headerInfo}>
            <div className={styles.nameRow}>
              <h1 className={styles.displayName}>
                {myProfile?.nickname ?? '\u00A0'}
              </h1>
            </div>

            {isOwner && (
              <p className={styles.meta}>
                {avatarUploading ? '프로필 이미지 업로드 중…' : '이미지를 눌러 프로필 사진 변경'}
              </p>
            )}
          </div>
        </section>

        {/* ── 액션 버튼 ── */}
        {isOwner && (
          <div className={styles.actionRow}>
            <button
              type="button"
              className={styles.editButton}
              onClick={() => setEditOpen(true)}
              disabled={!myProfile || profileLoading}
            >
              프로필 편집
            </button>
          </div>
        )}
        {myProfile && viewerProfile && !isOwner && (
          <div className={styles.socialActionRow}>
            <button type="button" className={`${styles.socialButton} ${styles.followButton}`}>
              팔로우
            </button>
            <button type="button" className={styles.socialButton}>
              메시지 보내기
            </button>
          </div>
        )}

        {/* ── 내가 작성한 글 ── */}
        <MyPostsSection
          ref={myPostsRef}
          username={username}
          isOwner={isOwner}
          onUnauthorized={handleUnauthorized}
        />
      </main>

      {isOwner && (
        <ProfileEditModal
          isOpen={editOpen}
          profile={myProfile}
          onClose={() => setEditOpen(false)}
          onSaved={handleProfileSaved}
          onUnauthorized={handleUnauthorized}
        />
      )}
    </>
  )
}
