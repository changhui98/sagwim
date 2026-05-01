import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createGroup } from '../api/groupApi'
import { uploadGroupImage } from '../api/imageApi'
import { getMyProfile } from '../api/userApi'
import { useAuth } from '../context/AuthContext'
import { useHandleUnauthorized } from '../hooks/useHandleUnauthorized'
import { Navbar } from '../components/Navbar'
import { ImageBoxPicker } from '../components/post/ImageBoxPicker'
import type { GroupCategory } from '../types/group'
import type { UserDetailResponse } from '../types/user'
import { GROUP_CATEGORY_LABELS } from '../types/group'
import styles from './GroupCreatePage.module.css'

export function GroupCreatePage() {
  const navigate = useNavigate()
  const { token, logout } = useAuth()
  const handleUnauthorized = useHandleUnauthorized()

  const [myProfile, setMyProfile] = useState<UserDetailResponse | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<GroupCategory>('CLUB')
  const [maxMemberCount, setMaxMemberCount] = useState(10)
  const [images, setImages] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    getMyProfile(token)
      .then(setMyProfile)
      .catch(handleUnauthorized)
  }, [token, handleUnauthorized])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = '모임 이름은 필수입니다.'
    else if (name.length > 50) next.name = '모임 이름은 50자를 초과할 수 없습니다.'
    if (description.length > 1000) next.description = '설명은 1000자를 초과할 수 없습니다.'
    if (maxMemberCount < 2) next.maxMemberCount = '최대 인원은 2명 이상이어야 합니다.'
    if (maxMemberCount > 1000) next.maxMemberCount = '최대 인원은 1000명을 초과할 수 없습니다.'
    return next
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      setSubmitting(true)
      const created = await createGroup(token, {
        name: name.trim(),
        description: description.trim(),
        category,
        meetingType: 'OFFLINE',
        region: null,
        maxMemberCount,
      })
      if (images.length > 0) {
        await Promise.all(images.map((file) => uploadGroupImage(token, file, created.id)))
      }
      navigate(`/app/groups/${created.id}`, { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : '모임 생성 실패'
      alert(message)
      handleUnauthorized(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Navbar role={myProfile?.role ?? null} onLogout={handleLogout} />

      <main className={styles.main}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate('/app/groups')}
        >
          &larr; 모임 목록
        </button>

        <div className={styles.card}>
          <h1 className={styles.title}>모임 만들기</h1>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.fieldGroup}>
              <label htmlFor="name" className={styles.label}>
                모임 이름 <span className={styles.required}>*</span>
              </label>
              <input
                id="name"
                type="text"
                className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }))
                }}
                placeholder="모임 이름을 입력하세요 (최대 50자)"
                maxLength={50}
              />
              {errors.name && <p className={styles.errorText}>{errors.name}</p>}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="description" className={styles.label}>
                설명
              </label>
              <textarea
                id="description"
                className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  if (errors.description) setErrors((prev) => ({ ...prev, description: '' }))
                }}
                placeholder="모임에 대한 설명을 입력하세요 (최대 1000자)"
                rows={4}
                maxLength={1000}
              />
              {errors.description && <p className={styles.errorText}>{errors.description}</p>}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="category" className={styles.label}>
                카테고리 <span className={styles.required}>*</span>
              </label>
              <select
                id="category"
                className={styles.select}
                value={category}
                onChange={(e) => setCategory(e.target.value as GroupCategory)}
              >
                {(Object.keys(GROUP_CATEGORY_LABELS) as GroupCategory[]).map((key) => (
                  <option key={key} value={key}>
                    {GROUP_CATEGORY_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="maxMemberCount" className={styles.label}>
                최대 인원 <span className={styles.required}>*</span>
              </label>
              <input
                id="maxMemberCount"
                type="number"
                className={`${styles.input} ${errors.maxMemberCount ? styles.inputError : ''}`}
                value={maxMemberCount}
                onChange={(e) => {
                  setMaxMemberCount(Number(e.target.value))
                  if (errors.maxMemberCount)
                    setErrors((prev) => ({ ...prev, maxMemberCount: '' }))
                }}
                min={2}
                max={1000}
              />
              {errors.maxMemberCount && (
                <p className={styles.errorText}>{errors.maxMemberCount}</p>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>사진</label>
              <ImageBoxPicker images={images} onChange={setImages} disabled={submitting} />
            </div>

            <div className={styles.buttonRow}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => navigate('/app/groups')}
                disabled={submitting}
              >
                취소
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={submitting}
              >
                {submitting ? '생성 중...' : '모임 만들기'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  )
}
