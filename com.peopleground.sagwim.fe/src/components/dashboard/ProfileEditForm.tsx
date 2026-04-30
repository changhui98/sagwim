import { type FormEvent, useEffect, useState } from 'react'
import { PasswordInput } from '../PasswordInput'
import { PasswordChecklist } from '../PasswordChecklist'
import { KakaoAddressSearch } from '../common/KakaoAddressSearch'
import { isPasswordValid } from '../../utils/passwordRules'
import styles from '../../pages/DashboardPage.module.css'

interface ProfileFormData {
  nickname: string
  userEmail: string
  address: string
  currentPassword: string
  newPassword: string
}

interface ProfileEditFormProps {
  form: ProfileFormData
  onFormChange: (updater: (prev: ProfileFormData) => ProfileFormData) => void
  loading: boolean
  error: string
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  updateSuccess: boolean
  onClearSuccess: () => void
}

export function ProfileEditForm({
  form,
  onFormChange,
  loading,
  error,
  onSubmit,
  updateSuccess,
  onClearSuccess,
}: ProfileEditFormProps) {
  const [newPwValid, setNewPwValid] = useState(false)

  useEffect(() => {
    setNewPwValid(isPasswordValid(form.newPassword))
  }, [form.newPassword])

  // 성공 메시지 3초 후 자동 소멸
  useEffect(() => {
    if (!updateSuccess) return
    const timer = setTimeout(() => onClearSuccess(), 3000)
    return () => clearTimeout(timer)
  }, [updateSuccess, onClearSuccess])

  return (
    <div className="card">
      <h2 className={`${styles.sectionTitle} ${styles.mb6}`}>
        프로필 수정
      </h2>

      <form onSubmit={onSubmit} className="form">
        <div className={styles.formGrid}>
          <div className="input-group">
            <label className="input-label" htmlFor="edit-nickname">닉네임</label>
            <input
              id="edit-nickname"
              className="input"
              placeholder="새 닉네임"
              value={form.nickname}
              onChange={(e) => onFormChange((prev) => ({ ...prev, nickname: e.target.value }))}
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="edit-email">이메일</label>
            <input
              id="edit-email"
              className="input"
              type="email"
              placeholder="name@example.com"
              value={form.userEmail}
              onChange={(e) => onFormChange((prev) => ({ ...prev, userEmail: e.target.value }))}
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="edit-address">주소</label>
            <KakaoAddressSearch
              id="edit-address"
              address={form.address}
              onChange={(value) => onFormChange((prev) => ({ ...prev, address: value }))}
              disabled={loading}
            />
          </div>

          <div />

          <div className="input-group">
            <label className="input-label" htmlFor="edit-cur-pw">현재 비밀번호</label>
            <PasswordInput
              id="edit-cur-pw"
              placeholder="••••••••"
              autoComplete="current-password"
              value={form.currentPassword}
              onChange={(e) => onFormChange((prev) => ({ ...prev, currentPassword: e.target.value }))}
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="edit-new-pw">새 비밀번호</label>
            <PasswordInput
              id="edit-new-pw"
              placeholder="••••••••"
              autoComplete="new-password"
              value={form.newPassword}
              onChange={(e) => onFormChange((prev) => ({ ...prev, newPassword: e.target.value }))}
              className={
                form.newPassword.length > 0
                  ? newPwValid ? styles.pwValid : styles.pwInvalid
                  : undefined
              }
            />
          </div>
        </div>

        {form.newPassword.length > 0 && (
          <PasswordChecklist password={form.newPassword} />
        )}

        {error && <p className="alert alert-error" role="alert">{error}</p>}

        {updateSuccess && (
          <p className="alert alert-success" role="status">프로필이 수정되었습니다.</p>
        )}

        <div className="flex justify-between items-center">
          <span className="text-xs text-muted">비밀번호 변경 시에만 입력하세요</span>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? '저장 중…' : '변경사항 저장'}
          </button>
        </div>
      </form>
    </div>
  )
}
