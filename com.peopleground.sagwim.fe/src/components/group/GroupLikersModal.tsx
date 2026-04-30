import { useEffect, useRef, useState } from 'react'
import { getGroupLikers } from '../../api/groupApi'
import type { GroupLikerResponse } from '../../api/groupApi'
import styles from './GroupLikersModal.module.css'

const PAGE_SIZE = 20

interface GroupLikersModalProps {
  isOpen: boolean
  groupId: number
  token: string
  onClose: () => void
}

export function GroupLikersModal({ isOpen, groupId, token, onClose }: GroupLikersModalProps) {
  const [allLikers, setAllLikers] = useState<GroupLikerResponse[]>([])
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  const sentinelRef = useRef<HTMLDivElement>(null)

  // 전체 데이터 초기 로드
  useEffect(() => {
    if (!isOpen) return

    let cancelled = false

    const fetchLikers = async () => {
      try {
        setLoading(true)
        setError('')
        const data = await getGroupLikers(token, groupId)
        if (!cancelled) {
          setAllLikers(data)
          setVisibleCount(PAGE_SIZE)
        }
      } catch {
        if (!cancelled) setError('좋아요한 사람 목록을 불러올 수 없습니다.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchLikers()

    return () => {
      cancelled = true
    }
  }, [isOpen, groupId, token])

  // 모달 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setAllLikers([])
      setVisibleCount(PAGE_SIZE)
      setError('')
    }
  }, [isOpen])

  // ESC 키 닫기
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // IntersectionObserver: sentinel이 보이면 다음 슬라이스 노출
  useEffect(() => {
    if (!sentinelRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry.isIntersecting) return
        if (visibleCount >= allLikers.length) return

        setLoadingMore(true)
        // 다음 프레임에 추가 — DOM 블로킹 없이 자연스럽게 렌더
        requestAnimationFrame(() => {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, allLikers.length))
          setLoadingMore(false)
        })
      },
      { threshold: 0 },
    )

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [allLikers.length, visibleCount])

  if (!isOpen) return null

  const visibleLikers = allLikers.slice(0, visibleCount)
  const hasMore = visibleCount < allLikers.length

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="좋아요한 사람들"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>좋아요한 사람들</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className={styles.body}>
          {loading && (
            <p className={styles.stateText}>불러오는 중...</p>
          )}

          {!loading && error && (
            <p className={styles.errorText}>{error}</p>
          )}

          {!loading && !error && allLikers.length === 0 && (
            <p className={styles.stateText}>아직 좋아요를 누른 사람이 없습니다.</p>
          )}

          {!loading && !error && allLikers.length > 0 && (
            <>
              <ul className={styles.likerList}>
                {visibleLikers.map((liker) => (
                  <li key={liker.username} className={styles.likerItem}>
                    {liker.profileImageUrl?.trim() ? (
                      <img
                        src={liker.profileImageUrl.trim()}
                        alt={`${liker.nickname} 프로필 이미지`}
                        className={styles.avatarImg}
                      />
                    ) : (
                      <span className={`avatar ${styles.avatarFallback}`}>
                        {liker.nickname.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className={styles.nickname}>{liker.nickname}</span>
                  </li>
                ))}
              </ul>

              {/* 추가 로딩 스피너 */}
              {loadingMore && (
                <div className={styles.loadingMore}>
                  <span className={styles.spinner} aria-label="추가 로딩 중" />
                </div>
              )}

              {/* sentinel: 이 요소가 보이면 다음 슬라이스 로드 */}
              {hasMore && <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
