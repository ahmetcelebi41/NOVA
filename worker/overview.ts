import type {
  OrderStatus,
  OverviewCriticalStock,
  OverviewRecentOrder,
  OverviewResponse,
  OverviewSalesPoint,
} from '../src/contracts/index.js'
import { parseStockStatus, stockStatusSql } from './stock-status.js'

type DailyRow = { date: string; order_count: number; sales_minor: number }
type CountRow = { count: number }
type StatusRow = { status: string; count: number }
type CriticalStockRow = {
  id: number
  name: string
  stock_quantity: number
  stock_status: string
}
type RecentOrderRow = {
  id: number
  order_number: string
  customer_name_snapshot: string
  created_at: string
  total_in_kurus: number
  status: string
}

const dayInMilliseconds = 24 * 60 * 60 * 1000
const visibleStatuses = ['new', 'preparing', 'ready_for_delivery', 'completed'] as const

function dateString(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10)
}

function istanbulToday() {
  return dateString(Date.now() + 3 * 60 * 60 * 1000)
}

function offsetDate(date: string, dayOffset: number) {
  return dateString(Date.parse(`${date}T00:00:00Z`) + dayOffset * dayInMilliseconds)
}

function createDates(startDate: string, length: number) {
  return Array.from({ length }, (_, index) => offsetDate(startDate, index))
}

function safeNonNegativeInteger(value: number, field: string) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`Invalid ${field}`)
  return value
}

function mapOrderStatus(value: string): OrderStatus {
  if (
    value === 'new'
    || value === 'preparing'
    || value === 'ready_for_delivery'
    || value === 'completed'
    || value === 'cancelled'
  ) return value
  throw new Error('Invalid order status')
}

export async function getOverview(database: D1Database): Promise<OverviewResponse> {
  const today = istanbulToday()
  const allDates = createDates(offsetDate(today, -179), 180)
  const dailyResult = await database.prepare(`
    SELECT
      date(created_at, '+3 hours') AS date,
      SUM(CASE WHEN status <> 'cancelled' THEN 1 ELSE 0 END) AS order_count,
      SUM(CASE WHEN status = 'completed' THEN total_in_kurus ELSE 0 END) AS sales_minor
    FROM orders
    WHERE date(created_at, '+3 hours') BETWEEN ? AND ?
    GROUP BY date(created_at, '+3 hours')
  `).bind(allDates[0], today).all<DailyRow>()
  const dailyByDate = new Map(dailyResult.results.map((row) => [row.date, row]))
  const allPoints: OverviewSalesPoint[] = allDates.map((date) => {
    const row = dailyByDate.get(date)
    return {
      date,
      orderCount: safeNonNegativeInteger(row?.order_count ?? 0, 'daily order count'),
      salesMinor: safeNonNegativeInteger(row?.sales_minor ?? 0, 'daily sales'),
    }
  })

  const salesPeriods = ([7, 30, 90] as const).map((days) => {
    const points = allPoints.slice(-days)
    const previousPoints = allPoints.slice(-(days * 2), -days)
    return {
      days,
      currentSalesMinor: points.reduce((sum, point) => sum + point.salesMinor, 0),
      previousSalesMinor: previousPoints.reduce((sum, point) => sum + point.salesMinor, 0),
      points,
    }
  })

  const [pendingRow, lowStockRow, statusResult, criticalResult, recentResult] = await Promise.all([
    database.prepare(`
      SELECT COUNT(*) AS count FROM orders
      WHERE status IN ('new', 'preparing', 'ready_for_delivery')
    `).first<CountRow>(),
    database.prepare(`
      SELECT COUNT(*) AS count FROM (
        SELECT ${stockStatusSql} AS stock_status FROM products
      ) WHERE stock_status = 'low'
    `).first<CountRow>(),
    database.prepare(`
      SELECT status, COUNT(*) AS count
      FROM orders
      WHERE date(created_at, '+3 hours') = ? AND status <> 'cancelled'
      GROUP BY status
    `).bind(today).all<StatusRow>(),
    database.prepare(`
      SELECT id, name, stock_quantity, stock_status FROM (
        SELECT id, name, stock_quantity, ${stockStatusSql} AS stock_status
        FROM products
      )
      WHERE stock_status <> 'normal'
      ORDER BY CASE stock_status WHEN 'out' THEN 0 ELSE 1 END, stock_quantity ASC, id ASC
      LIMIT 5
    `).all<CriticalStockRow>(),
    database.prepare(`
      SELECT id, order_number, customer_name_snapshot, created_at, total_in_kurus, status
      FROM orders
      ORDER BY created_at DESC, id DESC
      LIMIT 5
    `).all<RecentOrderRow>(),
  ])

  if (!pendingRow || !lowStockRow) throw new Error('Missing overview counts')
  const statusCounts = new Map(statusResult.results.map((row) => [row.status, row.count]))
  const todayPoint = allPoints.at(-1)
  const yesterdayPoint = allPoints.at(-2)

  return {
    kpis: {
      todaySalesMinor: todayPoint?.salesMinor ?? 0,
      yesterdaySalesMinor: yesterdayPoint?.salesMinor ?? 0,
      todayOrderCount: todayPoint?.orderCount ?? 0,
      yesterdayOrderCount: yesterdayPoint?.orderCount ?? 0,
      pendingOrderCount: safeNonNegativeInteger(pendingRow.count, 'pending order count'),
      lowStockProductCount: safeNonNegativeInteger(lowStockRow.count, 'low stock count'),
    },
    salesPeriods,
    orderStatuses: visibleStatuses.map((status) => ({
      status,
      count: safeNonNegativeInteger(statusCounts.get(status) ?? 0, 'status count'),
    })),
    criticalInventory: criticalResult.results.map((row): OverviewCriticalStock => ({
      id: row.id,
      name: row.name,
      stockQuantity: safeNonNegativeInteger(row.stock_quantity, 'stock quantity'),
      status: parseStockStatus(row.stock_status) as OverviewCriticalStock['status'],
    })),
    recentOrders: recentResult.results.map((row): OverviewRecentOrder => ({
      id: row.id,
      orderNumber: row.order_number,
      customerName: row.customer_name_snapshot,
      createdAt: row.created_at,
      totalMinor: safeNonNegativeInteger(row.total_in_kurus, 'order total'),
      status: mapOrderStatus(row.status),
    })),
  }
}
