import { RULES } from '../utils/passwordRules'
import styles from './PasswordChecklist.module.css'

interface Props {
  password: string
  confirmPassword?: string
}

export function PasswordChecklist({ password, confirmPassword }: Props) {
  if (password.length === 0) return null

  const showConfirmRule = confirmPassword !== undefined && confirmPassword.length > 0
  const confirmMet = showConfirmRule && password === confirmPassword

  return (
    <div className={styles.root} role="status" aria-live="polite">
      <ul className={styles.list}>
        {RULES.map(({ label, test }) => {
          const met = test(password)
          return (
            <li key={label} className={`${styles.rule} ${met ? styles.met : styles.unmet}`}>
              <span className={`${styles.icon} ${met ? styles.iconMet : styles.iconUnmet}`}>
                {met ? '✓' : '·'}
              </span>
              {label}
            </li>
          )
        })}

        {showConfirmRule && (
          <li className={`${styles.rule} ${confirmMet ? styles.met : styles.unmet}`}>
            <span className={`${styles.icon} ${confirmMet ? styles.iconMet : styles.iconUnmet}`}>
              {confirmMet ? '✓' : '·'}
            </span>
            비밀번호 일치
          </li>
        )}
      </ul>
    </div>
  )
}
