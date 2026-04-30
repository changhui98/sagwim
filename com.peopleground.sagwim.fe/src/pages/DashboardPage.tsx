import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyProfile, getUsers, updateMyProfile } from '../api/userApi'
import { useAuth } from '../context/AuthContext'
import { useHandleUnauthorized } from '../hooks/useHandleUnauthorized'
import { Navbar } from '../components/Navbar'
import { UserListSection } from '../components/dashboard/UserListSection'
import { MyProfileSection } from '../components/dashboard/MyProfileSection'
import { ProfileEditForm } from '../components/dashboard/ProfileEditForm'
import styles from './DashboardPage.module.css'
import type { UserDetailResponse, UserResponse } from '../types/user'

export function DashboardPage() {
  const navigate = useNavigate()
  const { token, logout } = useAuth()
  const handleUnauthorized = useHandleUnauthorized()

  const [users, setUsers] = useState<UserResponse[]>([])
  const [myProfile, setMyProfile] = useState<UserDetailResponse | null>(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)

  const [usersError, setUsersError] = useState('')
  const [profileError, setProfileError] = useState('')
  const [updateError, setUpdateError] = useState('')

  const [updateSuccess, setUpdateSuccess] = useState(false)

  const [form, setForm] = useState({
    nickname: '',
    userEmail: '',
    address: '',
    currentPassword: '',
    newPassword: '',
  })

  const handleLoadUsers = useCallback(
    async (targetPage = page) => {
      try {
        setLoading(true)
        setUsersError('')
        const response = await getUsers(token, targetPage, 10)
        setUsers(response.content)
        setTotalPages(response.totalPages)
      } catch (err) {
        const message = err instanceof Error ? err.message : '사용자 목록 조회 실패'
        setUsersError(message)
        handleUnauthorized(err)
      } finally {
        setLoading(false)
      }
    },
    [token, page, handleUnauthorized],
  )

  const handleLoadMyProfile = useCallback(async () => {
    try {
      setProfileLoading(true)
      setProfileError('')
      const response = await getMyProfile(token)
      setMyProfile(response)
      setForm((prev) => ({
        ...prev,
        nickname: response.nickname ?? '',
        userEmail: response.userEmail ?? '',
        address: response.address ?? '',
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : '내 프로필 조회 실패'
      setProfileError(message)
      handleUnauthorized(err)
    } finally {
      setProfileLoading(false)
    }
  }, [token, handleUnauthorized])

  const handleUpdateProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      setProfileLoading(true)
      setUpdateError('')
      setUpdateSuccess(false)
      const response = await updateMyProfile(token, form)
      setMyProfile(response)
      setUpdateSuccess(true)
      setForm((prev) => ({ ...prev, currentPassword: '', newPassword: '' }))
    } catch (err) {
      const message = err instanceof Error ? err.message : '프로필 수정 실패'
      setUpdateError(message)
      handleUnauthorized(err)
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePageChange = (next: number) => {
    setPage(next)
    handleLoadUsers(next)
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const handleClearSuccess = useCallback(() => {
    setUpdateSuccess(false)
  }, [])

  // 마운트 시 내 프로필 자동 로드
  useEffect(() => {
    handleLoadMyProfile()
  }, [handleLoadMyProfile])

  return (
    <>
      <Navbar
        role={myProfile?.role ?? null}
        onLogout={handleLogout}
      />

      <div className={styles.main}>
        <div className={styles.panelGrid}>
          <UserListSection
            users={users}
            page={page}
            totalPages={totalPages}
            loading={loading}
            error={usersError}
            onLoadUsers={() => handleLoadUsers(page)}
            onPageChange={handlePageChange}
          />

          <MyProfileSection
            profile={myProfile}
            loading={profileLoading}
            error={profileError}
            onLoadProfile={handleLoadMyProfile}
          />
        </div>

        <ProfileEditForm
          form={form}
          onFormChange={setForm}
          loading={profileLoading}
          error={updateError}
          onSubmit={handleUpdateProfile}
          updateSuccess={updateSuccess}
          onClearSuccess={handleClearSuccess}
        />
      </div>
    </>
  )
}
