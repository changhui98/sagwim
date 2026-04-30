import { useEffect } from 'react'
import styles from './CreateTypeSelectorModal.module.css'
import groupIcon from '../../assets/cel-rings-love-svgrepo-com.svg'
import postIcon from '../../assets/clipboard-list-alt-svgrepo-com.svg'

interface CreateTypeSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectPost: () => void
  onSelectGroup: () => void
}

export function CreateTypeSelectorModal({
  isOpen,
  onClose,
  onSelectPost,
  onSelectGroup,
}: CreateTypeSelectorModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="만들기 유형 선택"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>만들기</h2>
        </div>
        <div className={styles.buttonRow}>
          <button
            type="button"
            className={styles.optionButton}
            onClick={onSelectGroup}
          >
            <img src={groupIcon} alt="" className={styles.optionIcon} aria-hidden="true" />
            <span className={styles.optionLabel}>모임</span>
            <span className={styles.optionDesc}>새로운 모임을 개설해보세요</span>
          </button>
          <div className={styles.divider} aria-hidden="true" />
          <button
            type="button"
            className={styles.optionButton}
            onClick={onSelectPost}
          >
            <img src={postIcon} alt="" className={styles.optionIcon} aria-hidden="true" />
            <span className={styles.optionLabel}>게시글</span>
            <span className={styles.optionDesc}>자유롭게 글을 작성해보세요</span>
          </button>
        </div>
      </div>
    </div>
  )
}
