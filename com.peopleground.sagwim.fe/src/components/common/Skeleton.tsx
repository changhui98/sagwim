import styles from './Skeleton.module.css'

interface SkeletonProps {
  width?: string
  height?: string
  borderRadius?: string
  className?: string
  count?: number
}

export function Skeleton({
  width = '100%',
  height = '16px',
  borderRadius = 'var(--r-md)',
  className,
  count = 1,
}: SkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`${styles.skeleton} ${className ?? ''}`}
      style={{ width, height, borderRadius }}
    />
  ))

  if (count === 1) return items[0]

  return <div className={styles.wrapper}>{items}</div>
}
