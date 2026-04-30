import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Skeleton } from '../common/Skeleton'
import type { MonthlyStatsPoint } from '../../types/adminStats'
import styles from './MonthlyChartCard.module.css'

interface MonthlyChartCardProps {
  title: string
  subtitle?: string
  unit?: string
  color: string
  data: MonthlyStatsPoint[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

interface ChartDatum {
  label: string
  fullLabel: string
  count: number
}

function formatMonthLabel(month: string): string {
  const parts = month.split('-')
  if (parts.length !== 2) return month
  const m = Number(parts[1])
  if (Number.isNaN(m)) return month
  return `${m}월`
}

function formatFullLabel(month: string): string {
  const parts = month.split('-')
  if (parts.length !== 2) return month
  return `${parts[0]}년 ${Number(parts[1])}월`
}

interface TooltipRenderProps {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: unknown }>
}

function renderTooltip({ active, payload }: TooltipRenderProps, unit: string) {
  if (!active || !payload || payload.length === 0) return null
  const entry = payload[0]
  const datum = entry.payload as ChartDatum | undefined
  if (!datum) return null
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{datum.fullLabel}</p>
      <p className={styles.tooltipValue}>
        {datum.count.toLocaleString()}
        <span className={styles.tooltipUnit}>{unit}</span>
      </p>
    </div>
  )
}

export function MonthlyChartCard({
  title,
  subtitle,
  unit = '',
  color,
  data,
  loading = false,
  error = null,
  onRetry,
}: MonthlyChartCardProps) {
  const chartData = useMemo<ChartDatum[]>(
    () =>
      data.map((point) => ({
        label: formatMonthLabel(point.month),
        fullLabel: formatFullLabel(point.month),
        count: point.count,
      })),
    [data],
  )

  const { total, latest, delta } = useMemo(() => {
    if (data.length === 0) return { total: 0, latest: 0, delta: null as number | null }
    const sum = data.reduce((acc, p) => acc + p.count, 0)
    const last = data[data.length - 1].count
    const prev = data.length >= 2 ? data[data.length - 2].count : null
    const diff = prev === null ? null : last - prev
    return { total: sum, latest: last, delta: diff }
  }, [data])

  const gradientId = useMemo(
    () => `chart-gradient-${title.replace(/\s+/g, '-')}`,
    [title],
  )

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <p className={styles.title}>{title}</p>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {!loading && !error && (
          <div className={styles.summary}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>이번 달</span>
              <span className={styles.summaryValue} style={{ color }}>
                {latest.toLocaleString()}
                <span className={styles.summaryUnit}>{unit}</span>
              </span>
              {delta !== null && (
                <span
                  className={
                    delta >= 0 ? styles.deltaPositive : styles.deltaNegative
                  }
                >
                  {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toLocaleString()}
                </span>
              )}
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>12개월 합계</span>
              <span className={styles.summaryValueSecondary}>
                {total.toLocaleString()}
                <span className={styles.summaryUnit}>{unit}</span>
              </span>
            </div>
          </div>
        )}
      </div>

      <div className={styles.chartArea}>
        {loading ? (
          <Skeleton height="220px" />
        ) : error ? (
          <div className={styles.errorBox}>
            <span>{error}</span>
            {onRetry && (
              <button className={styles.retryButton} onClick={onRetry} type="button">
                다시 시도
              </button>
            )}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={36}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ stroke: color, strokeOpacity: 0.3, strokeWidth: 1 }}
                content={(props: TooltipRenderProps) =>
                  renderTooltip(props, unit)
                }
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke={color}
                strokeWidth={2.5}
                fill={`url(#${gradientId})`}
                dot={{ r: 3, fill: color, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: color, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
