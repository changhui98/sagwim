import type { ReactNode } from 'react'
import styles from './EmptyState.module.css'

interface EmptyStateAction {
  label: string
  onClick: () => void
}

interface EmptyStateProps {
  title?: string
  description?: string
  action?: EmptyStateAction
  /** 비우면 기본(📭). 마이페이지 등에서 SVG 아이콘으로 교체할 때 사용 */
  icon?: ReactNode
  /** `icon`이 SVG(`currentColor`)일 때 적용. 예: `#F08080` */
  iconColor?: string
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  iconColor,
}: EmptyStateProps) {
  return (
    <div className={styles.container}>
      <span
        className={`${styles.icon}${icon ? ` ${styles.iconGraphic}` : ''}${icon && iconColor ? ` ${styles.iconGraphicCustom}` : ''}`}
        style={iconColor ? { color: iconColor } : undefined}
        aria-hidden="true"
      >
        {icon ?? '📭'}
      </span>
      {title ? <h3 className={styles.title}>{title}</h3> : null}
      {description && <p className={styles.description}>{description}</p>}
      {action && (
        <button
          type="button"
          className={`btn btn-secondary btn-sm ${styles.actionButton}`}
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
