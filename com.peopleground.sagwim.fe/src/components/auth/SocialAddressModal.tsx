import { useState } from 'react'
import { KakaoAddressSearch } from '../common/KakaoAddressSearch'
import styles from './SocialAddressModal.module.css'

interface SocialAddressModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { nickname: string; address: string }) => void
  loading?: boolean
  defaultNickname?: string
}

export function SocialAddressModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  defaultNickname = '',
}: SocialAddressModalProps) {
  const [nickname, setNickname] = useState(defaultNickname)
  const [address, setAddress] = useState('')
  const [nicknameError, setNicknameError] = useState('')

  if (!isOpen) return null

  const handleSubmit = () => {
    const trimmedNickname = nickname.trim()
    if (trimmedNickname.length < 2) {
      setNicknameError('닉네임은 최소 2글자 이상이어야 합니다.')
      return
    }
    if (!address.trim()) return
    onSubmit({ nickname: trimmedNickname, address: address.trim() })
  }

  const isSubmittable = nickname.trim().length >= 2 && address.trim().length > 0

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="social-address-modal-title"
    >
      <div className={styles.modal}>
        <h2 id="social-address-modal-title" className={styles.title}>
          추가 정보 입력
        </h2>
        <p className={styles.description}>
          Sagwim 서비스 이용을 위해 아래 정보를 입력해주세요.
        </p>

        <div className="input-group">
          <label className="input-label" htmlFor="social-nickname">
            닉네임
          </label>
          <input
            id="social-nickname"
            className="input"
            placeholder="2~10자, 한글·영문·숫자"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value)
              setNicknameError('')
            }}
            disabled={loading}
            maxLength={10}
          />
          {nicknameError && (
            <p className="field-error" role="alert">{nicknameError}</p>
          )}
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="social-address">
            주소
          </label>
          <KakaoAddressSearch
            id="social-address"
            address={address}
            onChange={setAddress}
            disabled={loading}
          />
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            나중에 입력
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || !isSubmittable}
          >
            {loading ? '저장 중…' : '확인'}
          </button>
        </div>
      </div>
    </div>
  )
}
