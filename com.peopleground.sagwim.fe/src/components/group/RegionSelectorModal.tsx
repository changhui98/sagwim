import { useEffect, useState } from 'react'
import styles from './RegionSelectorModal.module.css'

export const REGIONS = [
  '서울특별시',
  '부산광역시',
  '대구광역시',
  '인천광역시',
  '광주광역시',
  '대전광역시',
  '울산광역시',
  '세종특별자치시',
  '경기도',
  '강원특별자치도',
  '충청북도',
  '충청남도',
  '전북특별자치도',
  '전라남도',
  '경상북도',
  '경상남도',
  '제주특별자치도',
] as const

export type Region = (typeof REGIONS)[number]

interface RegionSelectorModalProps {
  isOpen: boolean
  selectedRegion: string | null
  onConfirm: (region: string) => void
  onClose: () => void
}

export function RegionSelectorModal({
  isOpen,
  selectedRegion,
  onConfirm,
  onClose,
}: RegionSelectorModalProps) {
  const [tempRegion, setTempRegion] = useState<string | null>(selectedRegion)

  // 모달이 열릴 때마다 현재 선택값으로 초기화
  useEffect(() => {
    if (isOpen) {
      setTempRegion(selectedRegion)
    }
  }, [isOpen, selectedRegion])

  // ESC 키 닫기
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleConfirm = () => {
    if (tempRegion) {
      onConfirm(tempRegion)
    }
    onClose()
  }

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="지역 선택"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>지역 선택</h3>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="닫기"
          >
            &#x2715;
          </button>
        </div>

        <div className={styles.grid}>
          {REGIONS.map((region) => (
            <button
              key={region}
              type="button"
              className={[
                styles.regionBtn,
                tempRegion === region ? styles.regionBtnActive : '',
              ].join(' ')}
              onClick={() => setTempRegion(region)}
            >
              {region}
            </button>
          ))}
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={!tempRegion}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  )
}
