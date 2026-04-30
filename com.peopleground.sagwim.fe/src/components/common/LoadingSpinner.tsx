import styles from './LoadingSpinner.module.css'

type SpinnerSize = 'sm' | 'md' | 'lg'

interface LoadingSpinnerProps {
  size?: SpinnerSize
  overlay?: boolean
  label?: string
}

export function LoadingSpinner({
  size = 'md',
  overlay = false,
  label = '로딩 중',
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={`${styles.spinner} ${styles[size]}`}
      role="status"
      aria-label={label}
    />
  )

  if (overlay) {
    return <div className={styles.overlay}>{spinner}</div>
  }

  return spinner
}
