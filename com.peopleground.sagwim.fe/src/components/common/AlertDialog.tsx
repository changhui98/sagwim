import { useEffect } from 'react'
import styles from './AlertDialog.module.css'

type AlertVariant = 'success' | 'error'

interface AlertDialogProps {
  isOpen: boolean
  variant: AlertVariant
  message: string
  onClose: () => void
  confirmLabel?: string
}

export function AlertDialog({
  isOpen,
  variant,
  message,
  onClose,
  confirmLabel = '확인',
}: AlertDialogProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const emoji = variant === 'success' ? '✅' : '❌'

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alert-dialog-message"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <span className={styles.emoji} aria-hidden="true">{emoji}</span>
        <p id="alert-dialog-message" className={styles.message}>{message}</p>
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
