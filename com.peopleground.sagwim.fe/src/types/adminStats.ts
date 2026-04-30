export interface MonthlyStatsPoint {
  month: string
  count: number
}

export interface MonthlyStatsResponse {
  timezone: string
  points: MonthlyStatsPoint[]
}
