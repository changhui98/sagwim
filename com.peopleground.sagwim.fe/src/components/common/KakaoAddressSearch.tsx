import { useEffect, useRef, useState } from 'react'
import styles from './KakaoAddressSearch.module.css'

interface KakaoAddressSearchProps {
  address: string
  onChange: (address: string) => void
  disabled?: boolean
  id?: string
}

export function KakaoAddressSearch({
  address,
  onChange,
  disabled = false,
  id,
}: KakaoAddressSearchProps) {
  const [isLayerOpen, setIsLayerOpen] = useState(false)
  const layerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isLayerOpen) return
    if (typeof window.daum === 'undefined' || !window.daum.Postcode || !layerRef.current) {
      return
    }

    layerRef.current.innerHTML = ''
    new window.daum.Postcode({
      oncomplete: (data) => {
        onChange(data.roadAddress || data.address)
        setIsLayerOpen(false)
      },
      width: '100%',
      height: '100%',
    }).embed(layerRef.current)
  }, [isLayerOpen, onChange])

  const handleSearchClick = () => {
    if (typeof window.daum === 'undefined' || !window.daum.Postcode) return
    setIsLayerOpen(true)
  }

  const isDaumAvailable =
    typeof window !== 'undefined' &&
    typeof window.daum !== 'undefined' &&
    Boolean(window.daum?.Postcode)

  return (
    <div className={styles.wrapper}>
      <input
        id={id}
        className={`input ${styles.input}`}
        placeholder="주소 검색 후 선택하세요"
        value={address}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        readOnly={isDaumAvailable}
      />
      <button
        type="button"
        className={`btn btn-secondary ${styles.searchBtn}`}
        disabled={disabled}
        onClick={handleSearchClick}
      >
        주소 검색
      </button>

      {isLayerOpen && (
        <div
          className={styles.layerOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="주소 검색"
        >
          <div className={styles.layerPanel}>
            <button
              type="button"
              className={styles.layerClose}
              onClick={() => setIsLayerOpen(false)}
              aria-label="주소 검색 닫기"
            >
              닫기
            </button>
            <div ref={layerRef} className={styles.layerBody} />
          </div>
        </div>
      )}
    </div>
  )
}
