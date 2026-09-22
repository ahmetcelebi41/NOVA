export type CustomerStatus = 'new' | 'repeat' | 'inactive'

export type CustomerOrderStatus =
  | 'new'
  | 'preparing'
  | 'ready_for_delivery'
  | 'completed'
  | 'cancelled'

export type CustomersQuery = {
  status?: CustomerStatus
  q?: string
  page: number
}

export type CustomerListItem = {
  id: number
  name: string
  phone: string
  email: string | null
  orderCount: number
  totalSpendMinor: number
  lastOrderAt: string | null
  status: CustomerStatus | null
}

export type CustomerListResponse = {
  items: CustomerListItem[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export type CustomerDetail = {
  id: number
  name: string
  phone: string
  email: string | null
  address: string | null
  createdAt: string
  updatedAt: string
  status: CustomerStatus | null
}

export type CustomerMetrics = {
  validOrderCount: number
  completedOrderCount: number
  totalSpendMinor: number
  averageOrderMinor: number
}

export type CustomerRecentOrder = {
  id: number
  orderNumber: string
  createdAt: string
  status: CustomerOrderStatus
  totalMinor: number
  productNames: string[]
  itemCount: number
}

export type CustomerDetailResponse = {
  customer: CustomerDetail
  metrics: CustomerMetrics
  recentOrders: CustomerRecentOrder[]
}
