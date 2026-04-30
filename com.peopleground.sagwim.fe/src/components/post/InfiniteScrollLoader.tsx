import styles from './InfiniteScrollLoader.module.css'

export function InfiniteScrollLoader() {
  return (
    <div className={styles.container} role="status" aria-label="게시글 불러오는 중">
      <div className={styles.dots}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
    </div>
  )
}
