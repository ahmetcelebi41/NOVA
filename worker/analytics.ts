import type {
  AnalyticsApiPeriod,
  AnalyticsMetricSummary,
  AnalyticsProductPerformance,
  AnalyticsResponse,
  AnalyticsTrendPoint,
} from '../src/contracts/index.js'

type AnalyticsQuery = {
  startDate: string
  endDate: string
  period: AnalyticsApiPeriod
}
type AnalyticsQueryParseResult = { ok: true; query: AnalyticsQuery } | { ok: false }
type OrderDailyRow = {
  date: string
  completed_order_count: number
  order_count: number
  sales_minor: number
}
type ItemDailyRow = { date: string; sold_unit_count: number }
type ProductRow = {
  category: string
  name: string
  revenue_minor: number
  sold_unit_count: number
}

const dayInMilliseconds = 24 * 60 * 60 * 1000

function validDate(value: string | null): value is string {
  return Boolean(
    value
    && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value,
  )
}

function validPeriod(value: string | null): value is AnalyticsApiPeriod {
  return value === '7' || value === '30' || value === '90' || value === 'custom'
}

export function parseAnalyticsQuery(searchParams: URLSearchParams): AnalyticsQueryParseResult {
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const period = searchParams.get('period')

  if (!validDate(startDate) || !validDate(endDate) || startDate > endDate || !validPeriod(period)) {
    return { ok: false }
  }

  return { ok: true, query: { startDate, endDate, period } }
}

function dateString(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10)
}

function offsetDate(date: string, dayOffset: number) {
  return dateString(Date.parse(`${date}T00:00:00Z`) + dayOffset * dayInMilliseconds)
}

function createDateRange(startDate: string, endDate: string) {
  const length = Math.floor(
    (Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`))
      / dayInMilliseconds,
  ) + 1
  return Array.from({ length }, (_, index) => offsetDate(startDate, index))
}

function safeNonNegativeInteger(value: number, field: string) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`Invalid ${field}`)
  return value
}

function summarize(
  dates: string[],
  ordersByDate: Map<string, OrderDailyRow>,
  itemsByDate: Map<string, ItemDailyRow>,
): AnalyticsMetricSummary {
  let completedOrderCount = 0
  let soldUnitCount = 0
  let totalOrderCount = 0
  let totalSalesMinor = 0

  dates.forEach((date) => {
    const order = ordersByDate.get(date)
    const item = itemsByDate.get(date)
    completedOrderCount += safeNonNegativeInteger(order?.completed_order_count ?? 0, 'completed order count')
    totalOrderCount += safeNonNegativeInteger(order?.order_count ?? 0, 'order count')
    totalSalesMinor += safeNonNegativeInteger(order?.sales_minor ?? 0, 'sales')
    soldUnitCount += safeNonNegativeInteger(item?.sold_unit_count ?? 0, 'sold unit count')
  })

  return {
    averageOrderMinor: completedOrderCount ? Math.round(totalSalesMinor / completedOrderCount) : null,
    completedOrderCount,
    soldUnitCount,
    totalOrderCount,
    totalSalesMinor,
  }
}

function createTrend(
  dates: string[],
  ordersByDate: Map<string, OrderDailyRow>,
  itemsByDate: Map<string, ItemDailyRow>,
  weekly: boolean,
): AnalyticsTrendPoint[] {
  const groups = weekly
    ? Array.from({ length: Math.ceil(dates.length / 7) }, (_, index) => dates.slice(index * 7, index * 7 + 7))
    : dates.map((date) => [date])

  return groups.map((group) => {
    const summary = summarize(group, ordersByDate, itemsByDate)
    return {
      averageOrderMinor: summary.averageOrderMinor,
      date: group.at(-1) ?? group[0],
      orderCount: summary.totalOrderCount,
      salesMinor: summary.totalSalesMinor,
    }
  })
}

export async function getAnalytics(
  database: D1Database,
  query: AnalyticsQuery,
): Promise<AnalyticsResponse> {
  const currentDates = createDateRange(query.startDate, query.endDate)
  const previousEndDate = offsetDate(query.startDate, -1)
  const previousStartDate = offsetDate(previousEndDate, -(currentDates.length - 1))
  const previousDates = createDateRange(previousStartDate, previousEndDate)

  const [ordersResult, itemsResult, productsResult] = await Promise.all([
    database.prepare(`
      SELECT
        date(created_at, '+3 hours') AS date,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_order_count,
        SUM(CASE WHEN status <> 'cancelled' THEN 1 ELSE 0 END) AS order_count,
        SUM(CASE WHEN status = 'completed' THEN total_in_kurus ELSE 0 END) AS sales_minor
      FROM orders
      WHERE date(created_at, '+3 hours') BETWEEN ? AND ?
      GROUP BY date(created_at, '+3 hours')
    `).bind(previousStartDate, query.endDate).all<OrderDailyRow>(),
    database.prepare(`
      SELECT date(orders.created_at, '+3 hours') AS date, SUM(order_items.quantity) AS sold_unit_count
      FROM order_items
      JOIN orders ON orders.id = order_items.order_id
      WHERE orders.status <> 'cancelled'
        AND date(orders.created_at, '+3 hours') BETWEEN ? AND ?
      GROUP BY date(orders.created_at, '+3 hours')
    `).bind(previousStartDate, query.endDate).all<ItemDailyRow>(),
    database.prepare(`
      SELECT
        order_items.product_name_snapshot AS name,
        order_items.product_category_snapshot AS category,
        SUM(CASE WHEN orders.status = 'completed' THEN order_items.line_total_in_kurus ELSE 0 END)
          AS revenue_minor,
        SUM(CASE WHEN orders.status <> 'cancelled' THEN order_items.quantity ELSE 0 END)
          AS sold_unit_count
      FROM order_items
      JOIN orders ON orders.id = order_items.order_id
      WHERE date(orders.created_at, '+3 hours') BETWEEN ? AND ?
      GROUP BY order_items.product_name_snapshot, order_items.product_category_snapshot
      HAVING sold_unit_count > 0 OR revenue_minor > 0
      ORDER BY sold_unit_count DESC, revenue_minor DESC, name ASC
    `).bind(query.startDate, query.endDate).all<ProductRow>(),
  ])

  const ordersByDate = new Map(ordersResult.results.map((row) => [row.date, row]))
  const itemsByDate = new Map(itemsResult.results.map((row) => [row.date, row]))
  const products: AnalyticsProductPerformance[] = productsResult.results.map((row) => ({
    category: row.category,
    name: row.name,
    revenueMinor: safeNonNegativeInteger(row.revenue_minor, 'product revenue'),
    soldUnitCount: safeNonNegativeInteger(row.sold_unit_count, 'product sold units'),
  }))
  const categoryRevenue = new Map<string, number>()
  products.forEach((product) => {
    categoryRevenue.set(product.category, (categoryRevenue.get(product.category) ?? 0) + product.revenueMinor)
  })
  const totalCategoryRevenue = [...categoryRevenue.values()].reduce((sum, value) => sum + value, 0)
  const weekly = query.period === '90'

  return {
    current: summarize(currentDates, ordersByDate, itemsByDate),
    previous: summarize(previousDates, ordersByDate, itemsByDate),
    currentTrend: createTrend(currentDates, ordersByDate, itemsByDate, weekly),
    previousTrend: createTrend(previousDates, ordersByDate, itemsByDate, weekly),
    topProducts: products.slice(0, 5),
    categories: [...categoryRevenue.entries()]
      .map(([name, revenueMinor]) => ({
        name,
        revenueMinor,
        share: totalCategoryRevenue ? (revenueMinor / totalCategoryRevenue) * 100 : 0,
      }))
      .sort((left, right) => right.revenueMinor - left.revenueMinor),
  }
}
