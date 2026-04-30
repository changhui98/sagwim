import { useState } from 'react'
import { RegionSelectorModal } from './RegionSelectorModal'
import type { GroupCategory, GroupDetailResponse, GroupMeetingType } from '../../types/group'
import { GROUP_CATEGORY_LABELS } from '../../types/group'
import styles from '../../pages/GroupDetailPage.module.css'

interface GroupEditFormData {
  name: string
  description: string
  category: GroupCategory
  meetingType: GroupMeetingType
  region: string | null
  maxMemberCount: number
}

interface GroupEditFormProps {
  group: GroupDetailResponse
  actionLoading: boolean
  onSubmit: (data: GroupEditFormData) => void
  onCancel: () => void
}

export function GroupEditForm({ group, actionLoading, onSubmit, onCancel }: GroupEditFormProps) {
  const [editName, setEditName] = useState(group.name)
  const [editDescription, setEditDescription] = useState(group.description ?? '')
  const [editCategory, setEditCategory] = useState<GroupCategory>(group.category)
  const [editMeetingType, setEditMeetingType] = useState<GroupMeetingType>(group.meetingType)
  const [editRegion, setEditRegion] = useState<string | null>(group.region ?? null)
  const [regionModalOpen, setRegionModalOpen] = useState(false)
  const [editMaxMemberCount, setEditMaxMemberCount] = useState(group.maxMemberCount)

  const handleMeetingTypeChange = (type: GroupMeetingType) => {
    setEditMeetingType(type)
    if (type === 'ONLINE') setEditRegion(null)
  }

  const handleSubmit = () => {
    if (!editName.trim()) {
      alert('모임 이름을 입력해주세요.')
      return
    }
    if (editMeetingType === 'OFFLINE' && !editRegion) {
      alert('오프라인 모임은 지역을 선택해주세요.')
      return
    }
    onSubmit({
      name: editName.trim(),
      description: editDescription,
      category: editCategory,
      meetingType: editMeetingType,
      region: editMeetingType === 'OFFLINE' ? editRegion : null,
      maxMemberCount: editMaxMemberCount,
    })
  }

  return (
    <>
      <RegionSelectorModal
        isOpen={regionModalOpen}
        selectedRegion={editRegion}
        onConfirm={(r) => setEditRegion(r)}
        onClose={() => setRegionModalOpen(false)}
      />

      <div className={styles.editForm}>
        <input
          type="text"
          className={styles.editInput}
          placeholder="모임 이름 (최대 50자)"
          maxLength={50}
          required
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
        />
        <textarea
          className={styles.editTextarea}
          placeholder="모임 설명 (최대 1000자)"
          maxLength={1000}
          rows={4}
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
        />
        <select
          className={styles.editSelect}
          value={editCategory}
          onChange={(e) => setEditCategory(e.target.value as GroupCategory)}
        >
          {(Object.keys(GROUP_CATEGORY_LABELS) as GroupCategory[]).map((key) => (
            <option key={key} value={key}>{GROUP_CATEGORY_LABELS[key]}</option>
          ))}
        </select>
        <div className={styles.editMeetingTypeToggle}>
          {(['OFFLINE', 'ONLINE'] as GroupMeetingType[]).map((type) => (
            <button
              key={type}
              type="button"
              className={[
                styles.editMeetingTypeBtn,
                editMeetingType === type ? styles.editMeetingTypeBtnActive : '',
                editMeetingType === type && type === 'ONLINE' ? styles.editMeetingTypeBtnOnline : '',
              ].join(' ')}
              onClick={() => handleMeetingTypeChange(type)}
              disabled={actionLoading}
            >
              {type === 'OFFLINE' ? '오프라인' : '온라인'}
            </button>
          ))}
        </div>

        {editMeetingType === 'OFFLINE' && (
          <button
            type="button"
            className={styles.editRegionPickerBtn}
            onClick={() => setRegionModalOpen(true)}
            disabled={actionLoading}
          >
            {editRegion ? (
              <span className={styles.editRegionPickerValue}>{editRegion}</span>
            ) : (
              <span className={styles.editRegionPickerPlaceholder}>지역을 선택하세요</span>
            )}
            <span className={styles.editRegionPickerArrow} aria-hidden="true">&#8964;</span>
          </button>
        )}

        <input
          type="number"
          className={styles.editInput}
          min={group.currentMemberCount}
          max={100}
          value={editMaxMemberCount}
          onChange={(e) => setEditMaxMemberCount(Number(e.target.value))}
        />
        <div className={styles.editButtonRow}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
            disabled={actionLoading}
          >
            취소
          </button>
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSubmit}
            disabled={actionLoading}
          >
            {actionLoading ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </>
  )
}
