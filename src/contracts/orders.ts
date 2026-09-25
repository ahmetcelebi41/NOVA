export type OrderStatus =
  | 'new'
  | 'preparing'
  | 'ready_for_delivery'
  | 'completed'
  | 'cancelled'

export type OrderStatusFilter = OrderStatus | 'pending'
export type OrderDateFilter = 'bugun' | '7gun' | '30gun'

export type OrdersQuery = {
  status?: OrderStatusFilter
  q?: string
  date?: OrderDateFilter
  page: number
}

export type CreateOrderInput = {
  customer: {
    name: string
    phone: string
    email?: string | null
  }
  items: { productId: number; quantity: number }[]
  delivery: {
    method: 'delivery' | 'pickup'
    address?: string | null
    date: string
    startTime: string
    endTime: string
  }
  notes?: string | null
}

export type UpdateOrderStatusInput = {
  status: OrderStatus
}

export type OrderListItem = {
  id: number
  orderNumber: string
  customerName: string
  createdAt: string
  productNames: string[]
  itemCount: number
  totalMinor: number
  status: OrderStatus
}

export type OrderListResponse = {
  items: OrderListItem[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export type OrderDetail = {
  id: number
  orderNumber: string
  status: OrderStatus
  createdAt: string
  updatedAt: string
  notes: string | null
}

export type OrderCustomerSnapshot = {
  id: number | null
  name: string
  phone: string
  email: string | null
}

export type OrderDelivery = {
  method: 'delivery' | 'pickup'
  address: string | null
  date: string | null
  startTime: string | null
  endTime: string | null
}

export type OrderTotals = {
  subtotalMinor: number
  deliveryFeeMinor: number
  totalMinor: number
}

export type OrderItemSnapshot = {
  id: number
  productId: number | null
  name: string
  sku: string | null
  category: string
  unitPriceMinor: number
  quantity: number
  lineTotalMinor: number
}

export type OrderStatusHistoryItem = {
  id: number
  status: OrderStatus
  createdAt: string
}

export type OrderDetailResponse = {
  order: OrderDetail
  customer: OrderCustomerSnapshot
  delivery: OrderDelivery
  totals: OrderTotals
  items: OrderItemSnapshot[]
  statusHistory: OrderStatusHistoryItem[]
}
