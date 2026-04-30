import type { ScheduleResponse } from '../../types/group'
import pinPointIcon from '../../assets/pin-point-svgrepo-com.svg'
import userHeartIcon from '../../assets/user-heart-svgrepo-com.svg'
import styles from './ScheduleEventCard.module.css'

interface ScheduleEventCardProps {
  schedule: ScheduleResponse
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export function ScheduleEventCard({ schedule }: ScheduleEventCardProps) {
  const startTime = formatTime(schedule.startAt)
  const endTime = formatTime(schedule.endAt)

  return (
    <div className={styles.card}>
      <div className={styles.accentBar} />
      <div className={styles.content}>
        <div className={styles.titleRow}>
          <p className={styles.title}>{schedule.title}</p>
          <span className={styles.creatorItem}>
            <img src={userHeartIcon} alt="등록자" className={styles.metaIcon} />
            {schedule.createdByNickname}
          </span>
        </div>
        {schedule.description && (
          <p className={styles.description}>{schedule.description}</p>
        )}
        <div className={styles.bottomRow}>
          {schedule.location ? (
            <span className={styles.metaItem}>
              <img src={pinPointIcon} alt="위치" className={styles.metaIcon} />
              {schedule.location}
            </span>
          ) : (
            <span />
          )}
          <span className={styles.metaItem}>
            <span className={styles.metaIcon}>🕐</span>
            {startTime} ~ {endTime}
          </span>
        </div>
      </div>
    </div>
  )
}
