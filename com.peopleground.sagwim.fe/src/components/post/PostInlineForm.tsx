import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { createPost } from '../../api/postApi'
import { uploadContentImage } from '../../api/imageApi'
import { useAuth } from '../../context/AuthContext'
import { ImageBoxPicker } from './ImageBoxPicker'
import styles from './PostInlineForm.module.css'

interface PostInlineFormProps {
  myUsername: string | null
  onPostCreated: () => void
}

export interface PostInlineFormHandle {
  focusTitleInput: () => void
}

export const PostInlineForm = forwardRef<PostInlineFormHandle, PostInlineFormProps>(
  function PostInlineForm({ myUsername, onPostCreated }, ref) {
    const { token, meProfileImageUrl } = useAuth()
    const formRef = useRef<HTMLDivElement>(null)
    const bodyTextareaRef = useRef<HTMLTextAreaElement>(null)

    const [isExpanded, setIsExpanded] = useState(false)
    const [body, setBody] = useState('')
    const [images, setImages] = useState<File[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const isValid = body.trim().length > 0

    useImperativeHandle(ref, () => ({
      focusTitleInput() {
        setIsExpanded(true)
        requestAnimationFrame(() => {
          bodyTextareaRef.current?.focus()
        })
      },
    }))

    const resetForm = useCallback(() => {
      setBody('')
      setImages([])
      setError(null)
      setIsExpanded(false)
    }, [])

    const handleSubmit = async () => {
      if (!isValid || submitting) return

      setSubmitting(true)
      setError(null)

      try {
        const createdPost = await createPost(token, { body: body.trim() })
        if (images.length > 0) {
          await Promise.all(images.map((file) => uploadContentImage(token, file, createdPost.id)))
        }
        resetForm()
        onPostCreated()
      } catch {
        setError('게시글 등록에 실패했습니다. 다시 시도해 주세요.')
      } finally {
        setSubmitting(false)
      }
    }

    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
      const relatedTarget = e.relatedTarget as Node | null
      if (relatedTarget && formRef.current?.contains(relatedTarget)) {
        return
      }

      if (!body.trim() && images.length === 0) {
        setIsExpanded(false)
        setError(null)
      }
    }

    const handleCollapsedClick = () => {
      setIsExpanded(true)
      requestAnimationFrame(() => {
        bodyTextareaRef.current?.focus()
      })
    }

    const avatarInitial = myUsername ? myUsername.charAt(0).toUpperCase() : '?'
    const avatarUrl = meProfileImageUrl

    if (!isExpanded) {
      return (
        <div className={styles.wrapper}>
          <div
            className={styles.collapsed}
            onClick={handleCollapsedClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleCollapsedClick()
              }
            }}
          >
            <div className={styles.collapsedAvatar} aria-hidden="true">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className={styles.collapsedAvatarImg} />
              ) : (
                avatarInitial
              )}
            </div>
            <div className={styles.collapsedPlaceholder}>
              무슨 생각을 하고 계신가요?
            </div>
          </div>
        </div>
      )
    }

    return (
      <div
        className={styles.wrapper}
        ref={formRef}
        onBlur={handleBlur}
      >
        <div className={styles.expandedForm}>
          <textarea
            ref={bodyTextareaRef}
            className={styles.bodyTextarea}
            placeholder="내용을 입력하세요..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={submitting}
          />
          <ImageBoxPicker images={images} onChange={setImages} disabled={submitting} />
          {error && <p className={styles.errorMessage}>{error}</p>}
          <div className={styles.actions}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={resetForm}
              disabled={submitting}
            >
              취소
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSubmit}
              disabled={!isValid || submitting}
            >
              {submitting ? '등록 중...' : '등록하기'}
            </button>
          </div>
        </div>
      </div>
    )
  },
)
