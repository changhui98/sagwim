import type { UserDetailResponse } from '../../types/user'
import { getInitials } from '../../utils/stringUtils'
import styles from '../../pages/DashboardPage.module.css'

interface MyProfileSectionProps {
  profile: UserDetailResponse | null
  loading: boolean
  error: string
  onLoadProfile: () => void
}

export function MyProfileSection({
  profile,
  loading,
  error,
  onLoadProfile,
}: MyProfileSectionProps) {
  return (
    <div className="card">
      <div className={`header-row ${styles.mb4}`}>
        <h2 className={styles.sectionTitle}>내 프로필</h2>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onLoadProfile}
          disabled={loading}
        >
          {loading ? '조회 중…' : '조회'}
        </button>
      </div>

      {error && <p className="alert alert-error" role="alert">{error}</p>}

      {profile ? (
        <div className={styles.profileCard}>
          <span className="avatar avatar-lg">{getInitials(profile.nickname)}</span>
          <div className={styles.profileInfo}>
            <span className={styles.profileName}>{profile.nickname}</span>
            <div className={styles.profileMeta}>
              <span>@{profile.username}</span>
              <span>{profile.userEmail}</span>
            </div>
            {profile.address && (
              <span className="text-xs text-muted">{profile.address}</span>
            )}
          </div>
        </div>
      ) : (
        <p className={`text-muted text-sm ${styles.py4}`}>
          조회 버튼을 눌러 프로필을 불러오세요
        </p>
      )}
    </div>
  )
}
