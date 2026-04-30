import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPost } from '../api/postApi'
import { uploadContentImage } from '../api/imageApi'
import { getMyProfile } from '../api/userApi'
import { ApiError } from '../api/ApiError'
import { useAuth } from '../context/AuthContext'
import { Navbar } from '../components/Navbar'
import { ImageBoxPicker } from '../components/post/ImageBoxPicker'
import type { UserDetailResponse } from '../types/user'
import styles from './PostCreatePage.module.css'

export function PostCreatePage() {
  const navigate = useNavigate()
  const { token, logout } = useAuth()
  const [myProfile, setMyProfile] = useState<UserDetailResponse | null>(null)

  const handleUnauthorized = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        logout()
        navigate('/login', { replace: true })
      }
    },
    [logout, navigate],
  )

  useEffect(() => {
    let cancelled = false
    getMyProfile(token)
      .then((res) => {
        if (!cancelled) setMyProfile(res)
      })
      .catch((err) => handleUnauthorized(err))
    return () => {
      cancelled = true
    }
  }, [token, handleUnauthorized])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const [body, setBody] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValid = body.trim().length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || submitting) return

    setSubmitting(true)
    setError(null)

    try {
      const createdPost = await createPost(token, { body: body.trim() })
      if (images.length > 0) {
        await Promise.all(images.map((file) => uploadContentImage(token, file, createdPost.id)))
      }
      navigate('/app')
    } catch {
      setError('게시글 등록에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Navbar
        role={myProfile?.role ?? null}
        onLogout={handleLogout}
      />
      <main className={styles.main}>
        <div className={styles.formWrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>게시글 작성</h1>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="post-body">
              내용
            </label>
            <textarea
              id="post-body"
              className={styles.bodyTextarea}
              placeholder="내용을 입력하세요..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={submitting}
              autoFocus
            />
          </div>
          <div className={styles.fieldGroup}>
            <ImageBoxPicker images={images} onChange={setImages} disabled={submitting} />
          </div>

          {error && <p className={styles.errorMessage}>{error}</p>}

          <div className={styles.actions}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
              disabled={submitting}
            >
              취소
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!isValid || submitting}
            >
              {submitting ? '등록 중...' : '게시글 등록'}
            </button>
          </div>
        </form>
        </div>
      </main>
    </>
  )
}
