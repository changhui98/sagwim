import { useCallback, useEffect, useState } from 'react'
import { getGroupSchedules } from '../../api/groupApi'
import { useAuth } from '../../context/AuthContext'
import type { ScheduleResponse } from '../../types/group'
import { ScheduleCalendar } from './ScheduleCalendar'
import { ScheduleEventList } from './ScheduleEventList'
import { ScheduleCreateModal } from './ScheduleCreateModal'
import styles from './TabSchedule.module.css'

interface TabScheduleProps {
  groupId: number
  isMember: boolean
}

function toDateString(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

export function TabSchedule({ groupId, isMember }: TabScheduleProps) {
  const { token } = useAuth()

  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()) // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(
    toDateString(today.getFullYear(), today.getMonth(), today.getDate()),
  )
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const fetchSchedules = useCallback(
    async (year: number, month: number) => {
      setLoading(true)
      try {
        // API는 1-indexed month를 사용한다고 가정
        const data = await getGroupSchedules(token, groupId, year, month + 1)
        setSchedules(data)
      } catch {
        // 백엔드 미연동 또는 오류 시 빈 배열로 fallback
        setSchedules([])
      } finally {
        setLoading(false)
      }
    },
    [token, groupId],
  )

  useEffect(() => {
    fetchSchedules(currentYear, currentMonth)
  }, [fetchSchedules, currentYear, currentMonth])

  const handleMonthChange = (year: number, month: number) => {
    setCurrentYear(year)
    setCurrentMonth(month)
    setSelectedDate(null)
  }

  const handleScheduleCreated = () => {
    fetchSchedules(currentYear, currentMonth)
  }

  return (
    <div className={styles.wrapper}>
      {/* 캘린더: 로딩 중에도 DOM을 유지해 스크롤 점프를 막는다 */}
      <ScheduleCalendar
        year={currentYear}
        month={currentMonth}
        schedules={schedules}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        onMonthChange={handleMonthChange}
      />
      {loading && (
        <div className={styles.loadingInline} aria-live="polite">
          <span className={styles.loadingText}>일정을 불러오는 중...</span>
        </div>
      )}

      {/* 선택된 날짜의 일정 목록 */}
      <ScheduleEventList
        selectedDate={selectedDate}
        schedules={schedules}
        canCreate={isMember}
        onCreateClick={() => setIsCreateModalOpen(true)}
      />

      {/* 일정 등록 모달 */}
      <ScheduleCreateModal
        isOpen={isCreateModalOpen}
        groupId={groupId}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleScheduleCreated}
      />
    </div>
  )
}
