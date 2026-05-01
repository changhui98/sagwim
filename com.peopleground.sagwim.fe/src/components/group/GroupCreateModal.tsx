import { useEffect, useState } from 'react'
import { createGroup } from '../../api/groupApi'
import { uploadGroupImage } from '../../api/imageApi'
import { useAuth } from '../../context/AuthContext'
import { ImageBoxPicker } from '../post/ImageBoxPicker'
import { RegionSelectorModal } from './RegionSelectorModal'
import type { GroupCategory, GroupMeetingType } from '../../types/group'
import { GROUP_CATEGORY_LABELS } from '../../types/group'
import styles from './GroupCreateModal.module.css'

interface GroupCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (groupId: number) => void
}

export function GroupCreateModal({ isOpen, onClose, onCreated }: GroupCreateModalProps) {
  const { token } = useAuth()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<GroupCategory>('CLUB')
  const [meetingType, setMeetingType] = useState<GroupMeetingType>('OFFLINE')
  const [region, setRegion] = useState<string | null>(null)
  const [regionModalOpen, setRegionModalOpen] = useState(false)
  const [maxMemberCount, setMaxMemberCount] = useState(10)
  const [images, setImages] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 모달이 닫힐 때 폼 초기화
  useEffect(() => {
    if (!isOpen) {
      setName('')
      setDescription('')
      setCategory('CLUB')
      setMeetingType('OFFLINE')
      setRegion(null)
      setRegionModalOpen(false)
      setMaxMemberCount(10)
      setImages([])
      setErrors({})
      setSubmitting(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, submitting, onClose])

  if (!isOpen) return null

  const validate = () => {
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = '모임 이름은 필수입니다.'
    else if (name.length > 50) next.name = '모임 이름은 50자를 초과할 수 없습니다.'
    if (description.length > 1000) next.description = '설명은 1000자를 초과할 수 없습니다.'
    if (meetingType === 'OFFLINE' && !region) next.region = '오프라인 모임은 지역 선택이 필요합니다.'
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
        meetingType,
        region: meetingType === 'OFFLINE' ? region : null,
        maxMemberCount,
      })
      if (images.length > 0) {
        await Promise.all(images.map((file) => uploadGroupImage(token, file, created.id)))
      }
      onCreated(created.id)
    } catch (err) {
      const message = err instanceof Error ? err.message : '모임 생성 실패'
      alert(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleMeetingTypeChange = (type: GroupMeetingType) => {
    setMeetingType(type)
    // 온라인으로 바꾸면 지역 초기화
    if (type === 'ONLINE') {
      setRegion(null)
      if (errors.region) setErrors((prev) => ({ ...prev, region: '' }))
    }
  }

  return (
    <>
    <RegionSelectorModal
      isOpen={regionModalOpen}
      selectedRegion={region}
      onConfirm={(r) => {
        setRegion(r)
        if (errors.region) setErrors((prev) => ({ ...prev, region: '' }))
      }}
      onClose={() => setRegionModalOpen(false)}
    />
    <div
      className={styles.overlay}
      onClick={() => { if (!submitting) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="모임 만들기"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <button
            type="button"
            className={styles.headerBtn}
            onClick={onClose}
            disabled={submitting}
          >
            취소
          </button>
          <h2 className={styles.title}>모임 만들기</h2>
          <button
            type="submit"
            form="group-create-modal-form"
            className={`${styles.headerBtn} ${styles.headerBtnPrimary}`}
            disabled={submitting}
          >
            {submitting ? '생성 중...' : '만들기'}
          </button>
        </div>

        <form
          id="group-create-modal-form"
          onSubmit={handleSubmit}
          className={styles.form}
          noValidate
        >
          <div className={styles.fieldGroup}>
            <label htmlFor="modal-group-name" className={styles.label}>
              모임 이름 <span className={styles.required}>*</span>
            </label>
            <input
              id="modal-group-name"
              type="text"
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }))
              }}
              placeholder="모임 이름을 입력하세요 (최대 50자)"
              maxLength={50}
              disabled={submitting}
            />
            {errors.name && <p className={styles.errorText}>{errors.name}</p>}
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="modal-group-description" className={styles.label}>
              설명
            </label>
            <textarea
              id="modal-group-description"
              className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (errors.description) setErrors((prev) => ({ ...prev, description: '' }))
              }}
              placeholder="모임에 대한 설명을 입력하세요 (최대 1000자)"
              rows={4}
              maxLength={1000}
              disabled={submitting}
            />
            {errors.description && <p className={styles.errorText}>{errors.description}</p>}
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="modal-group-category" className={styles.label}>
              카테고리 <span className={styles.required}>*</span>
            </label>
            <select
              id="modal-group-category"
              className={styles.select}
              value={category}
              onChange={(e) => setCategory(e.target.value as GroupCategory)}
              disabled={submitting}
            >
              {(Object.keys(GROUP_CATEGORY_LABELS) as GroupCategory[]).map((key) => (
                <option key={key} value={key}>
                  {GROUP_CATEGORY_LABELS[key]}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              모임 방식 <span className={styles.required}>*</span>
            </label>
            <div className={styles.meetingTypeToggle}>
              {(['OFFLINE', 'ONLINE'] as GroupMeetingType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`${styles.meetingTypeBtn} ${meetingType === type ? styles.meetingTypeBtnActive : ''} ${meetingType === type && type === 'ONLINE' ? styles.meetingTypeBtnOnline : ''}`}
                  onClick={() => handleMeetingTypeChange(type)}
                  disabled={submitting}
                >
                  {type === 'OFFLINE' ? '오프라인' : '온라인'}
                </button>
              ))}
            </div>
          </div>

          {meetingType === 'OFFLINE' && (
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                지역 <span className={styles.required}>*</span>
              </label>
              <button
                type="button"
                className={`${styles.regionPickerBtn} ${errors.region ? styles.inputError : ''}`}
                onClick={() => setRegionModalOpen(true)}
                disabled={submitting}
              >
                {region ? (
                  <span className={styles.regionPickerValue}>{region}</span>
                ) : (
                  <span className={styles.regionPickerPlaceholder}>지역을 선택하세요</span>
                )}
                <span className={styles.regionPickerArrow} aria-hidden="true">&#8964;</span>
              </button>
              {errors.region && <p className={styles.errorText}>{errors.region}</p>}
            </div>
          )}

          <div className={styles.fieldGroup}>
            <label htmlFor="modal-group-maxMemberCount" className={styles.label}>
              최대 인원 <span className={styles.required}>*</span>
            </label>
            <input
              id="modal-group-maxMemberCount"
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
              disabled={submitting}
            />
            {errors.maxMemberCount && (
              <p className={styles.errorText}>{errors.maxMemberCount}</p>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>사진</label>
            <ImageBoxPicker images={images} onChange={setImages} disabled={submitting} />
          </div>
        </form>
      </div>
    </div>
    </>
  )
}
