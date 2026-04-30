import { useEffect, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { createGroupSchedule, searchPlaceSuggestions } from '../../api/groupApi'
import { ApiError } from '../../api/ApiError'
import { useAuth } from '../../context/AuthContext'
import type { PlaceSuggestionResponse } from '../../types/group'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { SuccessDialog } from '../common/SuccessDialog'
import styles from './ScheduleCreateModal.module.css'

interface ScheduleCreateModalProps {
  isOpen: boolean
  groupId: number
  onClose: () => void
  onCreated: () => void
}

interface ScheduleFormState {
  title: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  location: string
  description: string
}

interface SuggestedPlace {
  id: string
  label: string
}

const EMPTY_FORM: ScheduleFormState = {
  title: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  location: '',
  description: '',
}

const DEFAULT_SUGGESTED_PLACES: SuggestedPlace[] = [
  { id: 'sejong-center', label: '세종문화회관' },
  { id: 'gangnam-station', label: '강남역' },
  { id: 'hongdae-street', label: '홍대거리' },
  { id: 'jamsil-lotteworld', label: '잠실 롯데월드' },
  { id: 'haeundae-beach', label: '해운대 해수욕장' },
]

function toDateInputValue(date: Date): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function toTimeInputValue(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function getDefaultFormState(): ScheduleFormState {
  const now = new Date()
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
  return {
    ...EMPTY_FORM,
    startDate: toDateInputValue(now),
    startTime: toTimeInputValue(now),
    endDate: toDateInputValue(oneHourLater),
    endTime: toTimeInputValue(oneHourLater),
  }
}

export function ScheduleCreateModal({ isOpen, groupId, onClose, onCreated }: ScheduleCreateModalProps) {
  const { token } = useAuth()
  const [form, setForm] = useState<ScheduleFormState>(EMPTY_FORM)
  const [placeQuery, setPlaceQuery] = useState('')
  const [selectedPlaceLabel, setSelectedPlaceLabel] = useState('')
  const [placeResults, setPlaceResults] = useState<PlaceSuggestionResponse[]>([])
  const [placeSearching, setPlaceSearching] = useState(false)
  const [placeSearchError, setPlaceSearchError] = useState<string | null>(null)
  const [placeSearched, setPlaceSearched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setForm(getDefaultFormState())
    setPlaceQuery('')
    setSelectedPlaceLabel('')
    setPlaceResults([])
    setPlaceSearchError(null)
    setPlaceSearching(false)
    setPlaceSearched(false)
    setError(null)
    setSubmitting(false)
    setConfirmOpen(false)
    setSuccessOpen(false)
  }, [isOpen])

  const handlePlaceSearch = async () => {
    const keyword = placeQuery.trim()
    if (keyword.length < 2 || keyword === selectedPlaceLabel) return

    setPlaceSearching(true)
    setPlaceSearchError(null)
    setPlaceSearched(false)
    try {
      const data = await searchPlaceSuggestions(token, keyword)
      setPlaceResults(Array.isArray(data) ? data : [])
      setPlaceSearched(true)
    } catch {
      setPlaceResults([])
      setPlaceSearchError('장소 검색에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      setPlaceSearching(false)
    }
  }

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (submitting || confirmOpen || successOpen) return
      onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, submitting, confirmOpen, successOpen, onClose])

  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  if (!isOpen) return null

  const isValid =
    form.title.trim().length > 0 &&
    form.startDate !== '' &&
    form.startTime !== '' &&
    form.endDate !== '' &&
    form.endTime !== '' &&
    new Date(`${form.endDate}T${form.endTime}`) > new Date(`${form.startDate}T${form.startTime}`)

  const handleChange = (field: keyof ScheduleFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isValid || submitting) return
    setError(null)
    setConfirmOpen(true)
  }

  const handlePlaceSelect = (result: PlaceSuggestionResponse) => {
    const selectedAddress = result.fullAddress || result.primaryText
    setSelectedPlaceLabel(selectedAddress)
    setPlaceQuery(selectedAddress)
    handleChange('location', selectedAddress)
    setPlaceResults([])
    setPlaceSearchError(null)
    setPlaceSearched(false)
  }

  const clearPlaceSelection = () => {
    setSelectedPlaceLabel('')
    setPlaceQuery('')
    handleChange('location', '')
    setPlaceResults([])
    setPlaceSearchError(null)
    setPlaceSearched(false)
  }

  const handleSuggestedPlaceSelect = (label: string) => {
    setSelectedPlaceLabel(label)
    setPlaceQuery(label)
    handleChange('location', label)
    setPlaceResults([])
    setPlaceSearchError(null)
    setPlaceSearched(false)
  }

  const handleConfirmCreate = async () => {
    if (!isValid || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await createGroupSchedule(token, groupId, {
        title: form.title.trim(),
        startAt: `${form.startDate}T${form.startTime}:00`,
        endAt: `${form.endDate}T${form.endTime}:00`,
        location: form.location.trim() || undefined,
        description: form.description.trim() || undefined,
      })
      setConfirmOpen(false)
      setSuccessOpen(true)
    } catch (err) {
      setConfirmOpen(false)
      if (err instanceof ApiError) {
        setError(err.message || '일정 등록에 실패했습니다. 다시 시도해 주세요.')
      } else {
        setError('일정 등록에 실패했습니다. 다시 시도해 주세요.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleSuccessClose = () => {
    setSuccessOpen(false)
    onCreated()
    onClose()
  }

  return (
    <>
      <div
        className={styles.overlay}
        onClick={() => {
          if (submitting || confirmOpen || successOpen) return
          onClose()
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-create-modal-title"
      >
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <header className={styles.header}>
            <button
              type="button"
              className={styles.headerBtn}
              onClick={onClose}
              disabled={submitting}
            >
              취소
            </button>
            <h2 id="schedule-create-modal-title" className={styles.title}>
              일정 등록
            </h2>
            <button
              type="submit"
              form="schedule-create-modal-form"
              className={`${styles.headerBtn} ${styles.headerBtnPrimary}`}
              disabled={!isValid || submitting}
            >
              {submitting ? '등록 중…' : '등록'}
            </button>
          </header>

          <form
            id="schedule-create-modal-form"
            className={styles.form}
            onSubmit={handleSubmit}
          >
            {/* 제목 */}
            <div className={styles.fieldGroup}>
              <label htmlFor="schedule-title" className={styles.label}>
                제목 <span className={styles.required}>*</span>
              </label>
              <input
                id="schedule-title"
                type="text"
                className={styles.input}
                placeholder="일정 제목을 입력하세요"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                disabled={submitting}
                autoFocus
                maxLength={100}
              />
            </div>

            {/* 시작 일시 */}
            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label htmlFor="schedule-start-date" className={styles.label}>
                  시작 날짜 <span className={styles.required}>*</span>
                </label>
                <input
                  id="schedule-start-date"
                  type="date"
                  className={styles.input}
                  value={form.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="schedule-start-time" className={styles.label}>
                  시작 시간 <span className={styles.required}>*</span>
                </label>
                <input
                  id="schedule-start-time"
                  type="time"
                  className={styles.input}
                  value={form.startTime}
                  onChange={(e) => handleChange('startTime', e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* 종료 일시 */}
            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label htmlFor="schedule-end-date" className={styles.label}>
                  종료 날짜 <span className={styles.required}>*</span>
                </label>
                <input
                  id="schedule-end-date"
                  type="date"
                  className={styles.input}
                  value={form.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="schedule-end-time" className={styles.label}>
                  종료 시간 <span className={styles.required}>*</span>
                </label>
                <input
                  id="schedule-end-time"
                  type="time"
                  className={styles.input}
                  value={form.endTime}
                  onChange={(e) => handleChange('endTime', e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* 시간 유효성 경고 */}
            {form.startDate && form.startTime && form.endDate && form.endTime &&
              new Date(`${form.endDate}T${form.endTime}`) <= new Date(`${form.startDate}T${form.startTime}`) && (
                <p className={styles.validationError}>종료 시간은 시작 시간보다 늦어야 합니다.</p>
              )}

            {/* 장소 */}
            <div className={styles.fieldGroup}>
              <label htmlFor="schedule-location" className={styles.label}>
                장소
              </label>
              <input
                id="schedule-location"
                type="text"
                className={styles.input}
                placeholder="위치 입력 후 엔터로 검색"
                value={placeQuery}
                onChange={(e) => {
                  setSelectedPlaceLabel('')
                  setPlaceQuery(e.target.value)
                  handleChange('location', e.target.value)
                  if (placeResults.length > 0) setPlaceResults([])
                  if (placeSearchError) setPlaceSearchError(null)
                  if (placeSearched) setPlaceSearched(false)
                }}
                onKeyDown={(e: ReactKeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handlePlaceSearch()
                  }
                }}
                disabled={submitting}
              />
              {placeSearchError && <p className={styles.validationError}>{placeSearchError}</p>}
              {placeSearching && (
                <p className={styles.placeHelper}>검색 중…</p>
              )}
              {placeResults.length > 0 && selectedPlaceLabel !== placeQuery && (
                <ul className={styles.placeResultList}>
                  {placeResults.map((result) => (
                    <li key={result.placeId || result.fullAddress}>
                      <button
                        type="button"
                        className={styles.placeResultItem}
                        onClick={() => handlePlaceSelect(result)}
                        disabled={submitting}
                      >
                        <span className={styles.placePrimaryText}>{result.primaryText}</span>
                        {result.secondaryText && (
                          <span className={styles.placeSecondaryText}>{result.secondaryText}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {placeSearched && !placeSearching && placeResults.length === 0 && !placeSearchError && selectedPlaceLabel !== placeQuery && (
                <p className={styles.placeHelper}>검색 결과가 없습니다.</p>
              )}
              {selectedPlaceLabel && (
                <button
                  type="button"
                  className={styles.placeSelectedChip}
                  onClick={clearPlaceSelection}
                  disabled={submitting}
                >
                  {selectedPlaceLabel} · 선택 해제
                </button>
              )}
              {!placeQuery.trim() && !selectedPlaceLabel && (
                <div className={styles.suggestedPlaceSection}>
                  <p className={styles.placeHelper}>추천 위치</p>
                  <div className={styles.suggestedPlaceChips}>
                    {DEFAULT_SUGGESTED_PLACES.map((place) => (
                      <button
                        key={place.id}
                        type="button"
                        className={styles.suggestedPlaceChip}
                        onClick={() => handleSuggestedPlaceSelect(place.label)}
                        disabled={submitting}
                      >
                        {place.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 설명 */}
            <div className={styles.fieldGroup}>
              <label htmlFor="schedule-description" className={styles.label}>
                설명
              </label>
              <textarea
                id="schedule-description"
                className={styles.textarea}
                placeholder="일정 설명을 입력하세요 (선택)"
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                disabled={submitting}
                rows={3}
                maxLength={500}
              />
            </div>

            {error && <p className={styles.errorMessage}>{error}</p>}
          </form>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        title="일정 등록"
        message="일정을 등록하시겠습니까?"
        confirmLabel="등록"
        cancelLabel="취소"
        isLoading={submitting}
        onConfirm={handleConfirmCreate}
        onCancel={() => {
          if (!submitting) setConfirmOpen(false)
        }}
      />

      <SuccessDialog
        isOpen={successOpen}
        title="일정이 등록되었습니다"
        message="새 일정이 캘린더에 추가되었어요."
        onClose={handleSuccessClose}
      />
    </>
  )
}
