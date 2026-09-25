export type AnalyticsApiPeriod = '7' | '30' | '90' | 'custom'

export type AnalyticsMetricSummary = {
  averageOrderMinor: number | null
  completedOrderCount: number
  soldUnitCount: number
  totalOrderCount: number
  totalSalesMinor: number
}

export type AnalyticsTrendPoint = {
  averageOrderMinor: number | null
  date: string
  orderCount: number
  salesMinor: number
}

export type AnalyticsProductPerformance = {
  category: string
  name: string
  revenueMinor: number
  soldUnitCount: number
}

export type AnalyticsCategoryPerformance = {
  name: string
  revenueMinor: number
  share: number
}

export type AnalyticsResponse = {
  categories: AnalyticsCategoryPerformance[]
  current: AnalyticsMetricSummary
  currentTrend: AnalyticsTrendPoint[]
  previous: AnalyticsMetricSummary
  previousTrend: AnalyticsTrendPoint[]
  topProducts: AnalyticsProductPerformance[]
}
