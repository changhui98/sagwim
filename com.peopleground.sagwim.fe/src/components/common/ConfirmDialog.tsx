import { useEffect } from 'react'
import styles from './ConfirmDialog.module.css'

type ConfirmVariant = 'primary' | 'danger'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: ConfirmVariant
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

const VARIANT_CLASS_MAP: Record<ConfirmVariant, string> = {
  primary: 'btn btn-primary',
  danger: 'btn btn-danger',
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  confirmVariant = 'primary',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div
      className={styles.overlay}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 id="confirm-dialog-title" className={styles.title}>
          {title}
        </h2>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={VARIANT_CLASS_MAP[confirmVariant]}
            onClick={onConfirm}
            disabled={isLoading}
            autoFocus
          >
            {isLoading ? '처리 중...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
