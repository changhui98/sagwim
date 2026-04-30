import { Skeleton } from '../common/Skeleton'
import styles from './StatCard.module.css'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  loading?: boolean
  accent?: boolean
}

export function StatCard({
  title,
  value,
  subtitle,
  loading = false,
  accent = false,
}: StatCardProps) {
  return (
    <div className={accent ? styles.cardAccent : styles.card}>
      <p className={styles.title}>{title}</p>
      {loading ? (
        <Skeleton width="80px" height="28px" />
      ) : (
        <p className={styles.value}>{value}</p>
      )}
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  )
}
