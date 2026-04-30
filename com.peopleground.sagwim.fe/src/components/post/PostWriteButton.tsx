import { useNavigate } from 'react-router-dom'
import styles from './PostWriteButton.module.css'

interface PostWriteButtonProps {
  variant: 'fab' | 'header'
  onClick?: () => void
}

export function PostWriteButton({ variant, onClick }: PostWriteButtonProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (onClick) {
      onClick()
      return
    }
    navigate('/app/posts/new')
  }

  if (variant === 'fab') {
    return (
      <button
        type="button"
        className={styles.fab}
        onClick={handleClick}
        aria-label="게시글 작성"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    )
  }

  return (
    <button
      type="button"
      className={`btn btn-primary ${styles.headerButton}`}
      onClick={handleClick}
    >
      글쓰기
    </button>
  )
}
