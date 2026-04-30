import type { KeyboardEvent } from 'react'
import styles from './SearchBar.module.css'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onSearch: () => void
  placeholder?: string
  disabled?: boolean
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = '검색어를 입력하세요',
  disabled = false,
}: SearchBarProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSearch()
    }
  }

  return (
    <div className={styles.container}>
      <input
        type="text"
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={placeholder}
      />
      <button
        type="button"
        className={styles.button}
        onClick={onSearch}
        disabled={disabled}
      >
        검색
      </button>
    </div>
  )
}
