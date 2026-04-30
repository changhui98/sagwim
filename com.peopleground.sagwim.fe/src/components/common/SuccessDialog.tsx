import { useEffect } from 'react'
import styles from './SuccessDialog.module.css'

interface SuccessDialogProps {
  isOpen: boolean
  title: string
  message?: string
  /**
   * 자동으로 닫힐 시간(ms). 0 또는 null 이면 자동 닫히지 않는다.
   * 기본: 1600ms.
   */
  autoCloseMs?: number | null
  onClose: () => void
  confirmLabel?: string
}

export function SuccessDialog({
  isOpen,
  title,
  message,
  autoCloseMs = 1600,
  onClose,
  confirmLabel = '확인',
}: SuccessDialogProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) return
    if (!autoCloseMs || autoCloseMs <= 0) return
    const timer = window.setTimeout(onClose, autoCloseMs)
    return () => window.clearTimeout(timer)
  }, [isOpen, autoCloseMs, onClose])

  if (!isOpen) return null

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="success-dialog-title"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.iconWrap} aria-hidden="true">
          <svg
            className={styles.icon}
            viewBox="0 0 52 52"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle className={styles.iconCircle} cx="26" cy="26" r="24" />
            <path
              className={styles.iconCheck}
              fill="none"
              d="M14 27 l8 8 l16 -18"
            />
          </svg>
        </div>

        <h2 id="success-dialog-title" className={styles.title}>
          {title}
        </h2>
        {message && <p className={styles.message}>{message}</p>}

        <div className={styles.actions}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
