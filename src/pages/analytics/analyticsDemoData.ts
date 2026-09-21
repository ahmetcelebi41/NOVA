export type AnalyticsPeriod = '7' | '30' | '90' | 'ozel'

export type AnalyticsMetricSummary = {
  averageOrderAmountInKurus: number | null
  completedOrderCount: number
  soldUnitCount: number
  totalOrderCount: number
  totalSalesInKurus: number
}

export type AnalyticsTrendPoint = {
  averageOrderAmountInKurus: number | null
  date: string
  label: string
  orderCount: number
  salesInKurus: number
}

export type AnalyticsProductPerformance = {
  category: string
  name: string
  revenueInKurus: number
  soldUnitCount: number
}

export type AnalyticsCategoryPerformance = {
  name: string
  revenueInKurus: number
  share: number
}

export type AnalyticsViewData = {
  categories: AnalyticsCategoryPerformance[]
  current: AnalyticsMetricSummary
  currentTrend: AnalyticsTrendPoint[]
  previous: AnalyticsMetricSummary
  previousTrend: AnalyticsTrendPoint[]
  topProducts: AnalyticsProductPerformance[]
}

type DailyProductPerformance = AnalyticsProductPerformance

type AnalyticsDailyPoint = {
  completedOrderCount: number
  date: string
  products: DailyProductPerformance[]
  soldUnitCount: number
  totalOrderCount: number
  totalSalesInKurus: number
}

const dayInMilliseconds = 24 * 60 * 60 * 1000

export const analyticsReferenceDate = '2026-09-17'
export const defaultCustomStartDate = '2026-09-04'
export const defaultCustomEndDate = analyticsReferenceDate

const productWeights = [28, 21, 17, 14, 11, 9]
const analyticsProducts = [
  { category: 'Baklava', name: 'Antep Fıstıklı Baklava' },
  { category: 'Cheesecake', name: 'Frambuazlı Cheesecake' },
  { category: 'Tatlı', name: 'San Sebastian' },
  { category: 'Pasta', name: 'Çilekli Pasta' },
  { category: 'Makaron', name: 'Çikolatalı Makaron' },
  { category: 'Tart', name: 'Limonlu Tart' },
] as const

function parseDate(value: string) {
  return Date.parse(`${value}T00:00:00Z`)
}

function toDateString(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10)
}

function splitInteger(total: number, weights: number[]) {
  const values = weights.map((weight) => Math.floor((total * weight) / 100))
  let remainder = total - values.reduce((sum, value) => sum + value, 0)
  let index = 0

  while (remainder > 0) {
    values[index % values.length] += 1
    remainder -= 1
    index += 1
  }

  return values
}

function createDailyPoint(date: string): AnalyticsDailyPoint {
  const dayNumber = Math.floor(parseDate(date) / dayInMilliseconds)
  const totalOrderCount = 13 + ((dayNumber * 7) % 9)
  const completedOrderCount = totalOrderCount - 1 - ((dayNumber * 5) % 3)
  const averageOrderAmountInKurus = 49_500 + ((dayNumber * 1_300) % 14_000)
  const totalSalesInKurus = completedOrderCount * averageOrderAmountInKurus
  const soldUnitCount = totalOrderCount + 5 + ((dayNumber * 3) % 8)
  const unitValues = splitInteger(soldUnitCount, productWeights)
  const revenueValues = splitInteger(totalSalesInKurus, productWeights)

  return {
    completedOrderCount,
    date,
    products: analyticsProducts.map((product, index) => ({
      ...product,
      revenueInKurus: revenueValues[index],
      soldUnitCount: unitValues[index],
    })),
    soldUnitCount,
    totalOrderCount,
    totalSalesInKurus,
  }
}

function createDateRange(startDate: string, endDate: string) {
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  const length = Math.floor((end - start) / dayInMilliseconds) + 1

  return Array.from({ length }, (_, index) =>
    createDailyPoint(toDateString(start + index * dayInMilliseconds)),
  )
}

function summarize(points: AnalyticsDailyPoint[]): AnalyticsMetricSummary {
  const totalSalesInKurus = points.reduce((sum, point) => sum + point.totalSalesInKurus, 0)
  const completedOrderCount = points.reduce(
    (sum, point) => sum + point.completedOrderCount,
    0,
  )

  return {
    averageOrderAmountInKurus: completedOrderCount
      ? totalSalesInKurus / completedOrderCount
      : null,
    completedOrderCount,
    soldUnitCount: points.reduce((sum, point) => sum + point.soldUnitCount, 0),
    totalOrderCount: points.reduce((sum, point) => sum + point.totalOrderCount, 0),
    totalSalesInKurus,
  }
}

function createTrend(points: AnalyticsDailyPoint[], weekly: boolean): AnalyticsTrendPoint[] {
  const groups = weekly
    ? Array.from({ length: Math.ceil(points.length / 7) }, (_, index) =>
        points.slice(index * 7, index * 7 + 7),
      )
    : points.map((point) => [point])

  return groups.map((group) => {
    const summary = summarize(group)
    const lastPoint = group[group.length - 1]

    return {
      averageOrderAmountInKurus: summary.averageOrderAmountInKurus,
      date: lastPoint.date,
      label: lastPoint.date,
      orderCount: summary.totalOrderCount,
      salesInKurus: summary.totalSalesInKurus,
    }
  })
}

function aggregateProducts(points: AnalyticsDailyPoint[]) {
  const totals = new Map<string, AnalyticsProductPerformance>()

  points.forEach((point) => {
    point.products.forEach((product) => {
      const existing = totals.get(product.name)

      totals.set(product.name, {
        category: product.category,
        name: product.name,
        revenueInKurus: (existing?.revenueInKurus ?? 0) + product.revenueInKurus,
        soldUnitCount: (existing?.soldUnitCount ?? 0) + product.soldUnitCount,
      })
    })
  })

  return [...totals.values()]
}

function aggregateCategories(products: AnalyticsProductPerformance[], totalSalesInKurus: number) {
  const totals = new Map<string, number>()

  products.forEach((product) => {
    totals.set(product.category, (totals.get(product.category) ?? 0) + product.revenueInKurus)
  })

  return [...totals.entries()]
    .map(([name, revenueInKurus]) => ({
      name,
      revenueInKurus,
      share: totalSalesInKurus ? (revenueInKurus / totalSalesInKurus) * 100 : 0,
    }))
    .sort((left, right) => right.revenueInKurus - left.revenueInKurus)
}

export function getPresetDates(period: Exclude<AnalyticsPeriod, 'ozel'>) {
  const dayCount = Number(period)
  const endTimestamp = parseDate(analyticsReferenceDate)

  return {
    endDate: analyticsReferenceDate,
    startDate: toDateString(endTimestamp - (dayCount - 1) * dayInMilliseconds),
  }
}

export function createAnalyticsView(
  startDate: string,
  endDate: string,
  period: AnalyticsPeriod,
): AnalyticsViewData {
  const currentPoints = createDateRange(startDate, endDate)
  const currentStartTimestamp = parseDate(startDate)
  const currentEndTimestamp = parseDate(endDate)
  const periodLength = Math.floor((currentEndTimestamp - currentStartTimestamp) / dayInMilliseconds) + 1
  const previousEndTimestamp = currentStartTimestamp - dayInMilliseconds
  const previousStartTimestamp = previousEndTimestamp - (periodLength - 1) * dayInMilliseconds
  const previousPoints = createDateRange(
    toDateString(previousStartTimestamp),
    toDateString(previousEndTimestamp),
  )
  const current = summarize(currentPoints)
  const products = aggregateProducts(currentPoints)
  const weekly = period === '90'

  return {
    categories: aggregateCategories(products, current.totalSalesInKurus),
    current,
    currentTrend: createTrend(currentPoints, weekly),
    previous: summarize(previousPoints),
    previousTrend: createTrend(previousPoints, weekly),
    topProducts: products
      .sort((left, right) => right.soldUnitCount - left.soldUnitCount)
      .slice(0, 5),
  }
}
