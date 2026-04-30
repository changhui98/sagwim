import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNewGroups, getPopularGroups, getGroupLikeStatus, toggleGroupLike } from '../api/groupApi'
import { useAuth } from '../context/AuthContext'
import { useHandleUnauthorized } from '../hooks/useHandleUnauthorized'
import { Navbar } from '../components/Navbar'
import type { GroupResponse } from '../types/group'
import treeIcon from '../assets/tree-svgrepo-com.svg'
import starPrizeIcon from '../assets/star-prize-award-svgrepo-com.svg'
import { GroupSection } from '../components/group/GroupSection'
import styles from './GroupListPage.module.css'

// 메인 화면에서 노출할 최대 개수
const PREVIEW_COUNT = 5

export function GroupListPage() {
  const navigate = useNavigate()
  const { token, logout, meRole } = useAuth()
  const handleUnauthorized = useHandleUnauthorized()

  // 신규 모임 상태
  const [groups, setGroups] = useState<GroupResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 인기 모임 상태
  const [popularGroups, setPopularGroups] = useState<GroupResponse[]>([])
  const [popularLoading, setPopularLoading] = useState(true)
  const [popularError, setPopularError] = useState('')

  // 좋아요 상태 (신규 + 인기 모임 통합 관리)
  const [likedMap, setLikedMap] = useState<Record<number, boolean>>({})
  const [likeCountMap, setLikeCountMap] = useState<Record<number, number>>({})

  const loadGroups = useCallback(
    async () => {
      setLoading(true)
      setPopularLoading(true)
      setError('')
      setPopularError('')

      // 신규 모임과 인기 모임을 병렬로 조회
      const [newResult, popularResult] = await Promise.allSettled([
        getNewGroups(token),
        getPopularGroups(token, 0, PREVIEW_COUNT),
      ])

      // 신규 모임 처리
      if (newResult.status === 'fulfilled') {
        const incoming = newResult.value.content
        setGroups(incoming)
        const countMap: Record<number, number> = {}
        incoming.forEach((g) => { countMap[g.id] = g.likeCount ?? 0 })
        setLikeCountMap((prev) => ({ ...prev, ...countMap }))
      } else {
        const message = newResult.reason instanceof Error ? newResult.reason.message : '모임 목록 조회 실패'
        setError(message)
        handleUnauthorized(newResult.reason)
      }
      setLoading(false)

      // 인기 모임 처리
      if (popularResult.status === 'fulfilled') {
        const incoming = popularResult.value.content
        setPopularGroups(incoming)
        const countMap: Record<number, number> = {}
        incoming.forEach((g) => { countMap[g.id] = g.likeCount ?? 0 })
        setLikeCountMap((prev) => ({ ...prev, ...countMap }))
      } else {
        const message = popularResult.reason instanceof Error ? popularResult.reason.message : '인기 모임 목록 조회 실패'
        setPopularError(message)
      }
      setPopularLoading(false)

      // 두 목록 전체에 대해 좋아요 여부 병렬 조회
      const allGroups: GroupResponse[] = []
      if (newResult.status === 'fulfilled') allGroups.push(...newResult.value.content)
      if (popularResult.status === 'fulfilled') allGroups.push(...popularResult.value.content)

      // 중복 제거 (같은 모임이 두 섹션에 동시에 등장할 수 있음)
      const uniqueGroups = allGroups.filter(
        (g, idx, arr) => arr.findIndex((x) => x.id === g.id) === idx,
      )

      const likeStatusResults = await Promise.allSettled(
        uniqueGroups.map((g) => getGroupLikeStatus(token, g.id)),
      )
      const likedMapInit: Record<number, boolean> = {}
      uniqueGroups.forEach((g, idx) => {
        const result = likeStatusResults[idx]
        likedMapInit[g.id] = result.status === 'fulfilled' ? result.value.liked : false
      })
      setLikedMap(likedMapInit)
    },
    [token, handleUnauthorized],
  )

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  const handleLikeToggle = async (e: React.MouseEvent, groupId: number) => {
    e.stopPropagation()
    try {
      const res = await toggleGroupLike(token, groupId)
      setLikedMap((prev) => ({ ...prev, [groupId]: res.liked }))
      setLikeCountMap((prev) => ({ ...prev, [groupId]: res.likeCount }))
    } catch {
      // 조용히 실패
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const renderContent = () => (
    <>
      <GroupSection
        title="🌱 갓 피어난 모임"
        subtitle="당신이 첫 멤버가 될 수도 있어요"
        groups={groups.slice(0, PREVIEW_COUNT)}
        loading={loading}
        error={error}
        onRetry={loadGroups}
        onViewAll={() => navigate('/app/groups/recent')}
        likedMap={likedMap}
        likeCountMap={likeCountMap}
        onLikeToggle={handleLikeToggle}
        emptyIcon={<img src={treeIcon} alt="" width={56} height={56} />}
        emptyTitle="최근 7일 내 생성된 모임이 없습니다."
        emptyDescription="첫 번째 모임을 만들어보세요."
      />
      <hr className={styles.divider} />
      <GroupSection
        title="🔥 요즘 북적이는 모임"
        subtitle="모두가 모이는 데는 이유가 있죠"
        groups={popularGroups}
        loading={popularLoading}
        error={popularError}
        onRetry={loadGroups}
        onViewAll={popularGroups.length > 0 ? () => navigate('/app/groups/popular') : undefined}
        likedMap={likedMap}
        likeCountMap={likeCountMap}
        onLikeToggle={handleLikeToggle}
        emptyIcon={<img src={starPrizeIcon} alt="" width={56} height={56} />}
        emptyTitle="아직 인기 모임이 없습니다."
        emptyDescription="좋아요를 많이 받은 모임이 여기에 표시됩니다."
      />
    </>
  )

  return (
    <>
      <Navbar role={meRole} onLogout={handleLogout} />

      <main className={styles.main}>
        {renderContent()}
      </main>
    </>
  )
}
