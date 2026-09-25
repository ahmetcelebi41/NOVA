import type { OrderStatus } from './orders.js'
import type { ProductStockStatus } from './products.js'

export type OverviewSalesPoint = {
  date: string
  orderCount: number
  salesMinor: number
}

export type OverviewSalesPeriod = {
  days: 7 | 30 | 90
  currentSalesMinor: number
  previousSalesMinor: number
  points: OverviewSalesPoint[]
}

export type OverviewOrderStatusCount = {
  status: Exclude<OrderStatus, 'cancelled'>
  count: number
}

export type OverviewCriticalStock = {
  id: number
  name: string
  stockQuantity: number
  status: Exclude<ProductStockStatus, 'normal'>
}

export type OverviewRecentOrder = {
  id: number
  orderNumber: string
  customerName: string
  createdAt: string
  totalMinor: number
  status: OrderStatus
}

export type OverviewResponse = {
  kpis: {
    todaySalesMinor: number
    yesterdaySalesMinor: number
    todayOrderCount: number
    yesterdayOrderCount: number
    pendingOrderCount: number
    lowStockProductCount: number
  }
  salesPeriods: OverviewSalesPeriod[]
  orderStatuses: OverviewOrderStatusCount[]
  criticalInventory: OverviewCriticalStock[]
  recentOrders: OverviewRecentOrder[]
}
