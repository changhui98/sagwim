import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react'
import styles from './ImageBoxPicker.module.css'

interface ImageBoxPickerProps {
  images: File[]
  onChange: (next: File[]) => void
  disabled?: boolean
  maxCount?: number
}

export function ImageBoxPicker({
  images,
  onChange,
  disabled = false,
  maxCount = 10,
}: ImageBoxPickerProps) {
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const urls = images.map((file) => URL.createObjectURL(file))
    setPreviewUrls(urls)
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [images])

  const remain = Math.max(0, maxCount - images.length)

  const handlePick = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? [])
    if (selected.length === 0) return

    const next = [...images, ...selected].slice(0, maxCount)
    onChange(next)

    // 같은 파일을 다시 선택해도 onChange 되도록 input value 를 비운다.
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className={styles.wrap}>
      <input
        ref={inputRef}
        id={inputId}
        className={styles.hiddenInput}
        type="file"
        accept="image/*"
        multiple
        disabled={disabled || remain === 0}
        onChange={handlePick}
      />

      <div className={styles.grid}>
        {previewUrls.map((url, index) => (
          <div key={`${url}-${index}`} className={styles.box}>
            <img
              src={url}
              alt={`첨부 이미지 미리보기 ${index + 1}`}
              className={styles.image}
            />
          </div>
        ))}

        {remain > 0 && (
          <label
            htmlFor={inputId}
            className={`${styles.box} ${styles.addBox} ${disabled ? styles.disabled : ''}`}
            aria-label="사진 추가"
          >
            <span className={styles.plus}>+</span>
          </label>
        )}
      </div>
    </div>
  )
}
