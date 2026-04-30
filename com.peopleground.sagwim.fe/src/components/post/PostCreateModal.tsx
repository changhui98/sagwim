import { useEffect, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { createPost } from '../../api/postApi'
import { uploadContentImage } from '../../api/imageApi'
import { ApiError } from '../../api/ApiError'
import { useAuth } from '../../context/AuthContext'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { SuccessDialog } from '../common/SuccessDialog'
import { ImageBoxPicker } from './ImageBoxPicker'
import styles from './PostCreateModal.module.css'

interface PostCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
  /** 모임 내에서 작성하는 경우 해당 모임 ID를 전달한다. 없으면 전체 피드 게시글로 등록된다. */
  groupId?: number
}

export function PostCreateModal({ isOpen, onClose, onCreated, groupId }: PostCreateModalProps) {
  const { token } = useAuth()
  const [body, setBody] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setBody('')
    setImages([])
    setTags([])
    setTagInput('')
    setError(null)
    setSubmitting(false)
    setConfirmOpen(false)
    setSuccessOpen(false)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (submitting) return
      // 확인/성공 팝업이 떠 있을 때는 해당 팝업이 먼저 처리하도록 무시
      if (confirmOpen || successOpen) return
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

  const isValid = body.trim().length > 0

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isValid || submitting) return
    setError(null)
    setConfirmOpen(true)
  }

  const handleConfirmCreate = async () => {
    if (!isValid || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const createdPost = await createPost(token, {
        body: body.trim(),
        tags,
        groupId: groupId ?? null,
      })
      if (images.length > 0) {
        await Promise.all(images.map((file) => uploadContentImage(token, file, createdPost.id)))
      }
      setConfirmOpen(false)
      setSuccessOpen(true)
    } catch (err) {
      setConfirmOpen(false)
      if (err instanceof ApiError) {
        setError(err.message || '게시글 등록에 실패했습니다. 다시 시도해 주세요.')
      } else {
        setError('게시글 등록에 실패했습니다. 다시 시도해 주세요.')
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

  const addTag = (rawTag: string) => {
    const normalized = rawTag.trim().replace(/^#/, '').replace(/\s+/g, '')
    if (!normalized) return
    if (tags.includes(normalized)) return
    setTags((prev) => [...prev, normalized])
  }

  const handleTagKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    // 한글 IME 조합 중 Enter 입력 시 중복 태그가 생성되는 현상을 방지한다.
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    if (e.key !== 'Enter') return
    e.preventDefault()
    addTag(tagInput)
    setTagInput('')
  }

  const removeTag = (target: string) => {
    setTags((prev) => prev.filter((tag) => tag !== target))
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
        aria-labelledby="post-create-modal-title"
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
            <h2 id="post-create-modal-title" className={styles.title}>
              새 게시글
            </h2>
            <button
              type="submit"
              form="post-create-modal-form"
              className={`${styles.headerBtn} ${styles.headerBtnPrimary}`}
              disabled={!isValid || submitting}
            >
              {submitting ? '게시 중…' : '게시'}
            </button>
          </header>

          <form
            id="post-create-modal-form"
            className={styles.form}
            onSubmit={handleSubmit}
          >
            <textarea
              className={styles.bodyTextarea}
              placeholder="내용을 입력하세요"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={submitting}
              autoFocus
            />
            <ImageBoxPicker images={images} onChange={setImages} disabled={submitting} />
            <div className={styles.tagSection}>
              <label htmlFor="post-tag-input" className={styles.tagLabel}>태그</label>
              <input
                id="post-tag-input"
                type="text"
                className={styles.tagInput}
                placeholder="태그 입력 후 Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                disabled={submitting}
              />
              {tags.length > 0 && (
                <div className={styles.tagChipList} aria-label="입력한 태그">
                  {tags.map((tag) => (
                    <div key={tag} className={styles.tagChip}>
                      <span className={styles.tagChipText}>#{tag}</span>
                      <button
                        type="button"
                        className={styles.tagChipRemove}
                        onClick={() => removeTag(tag)}
                        disabled={submitting}
                        aria-label={`${tag} 태그 삭제`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {error && <p className={styles.errorMessage}>{error}</p>}
          </form>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        title="게시글 작성"
        message="게시글 작성을 하시겠습니까?"
        confirmLabel="작성"
        cancelLabel="취소"
        isLoading={submitting}
        onConfirm={handleConfirmCreate}
        onCancel={() => {
          if (!submitting) setConfirmOpen(false)
        }}
      />

      <SuccessDialog
        isOpen={successOpen}
        title="게시글이 작성되었습니다"
        message="작성하신 게시글이 목록에 등록되었어요."
        onClose={handleSuccessClose}
      />
    </>
  )
}
