import styles from './EndOfList.module.css'

export function EndOfList() {
  return (
    <div className={styles.container}>
      <span className={styles.divider} />
      <p className={styles.text}>모든 게시글을 확인했습니다</p>
      <span className={styles.divider} />
    </div>
  )
}
