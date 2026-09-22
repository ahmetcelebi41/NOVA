import type { ProductStockStatus } from './products.js'

export type StockQuery = {
  status?: ProductStockStatus
  q?: string
  page: number
}

export type StockListItem = {
  id: number
  name: string
  sku: string | null
  category: string
  stockQuantity: number
  lowStockThreshold: number
  stockStatus: ProductStockStatus
}

export type StockListResponse = {
  items: StockListItem[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export type UpdateStockInput = {
  stockQuantity: number
}

export type StockState = {
  id: number
  stockQuantity: number
  lowStockThreshold: number
  stockStatus: ProductStockStatus
}

export type StockUpdateResponse = {
  item: StockState
}

export type InventoryMovementType =
  | 'increase'
  | 'decrease'
  | 'order_created'
  | 'order_cancelled'

export type InventoryMovementListItem = {
  id: number
  movementType: InventoryMovementType
  quantityDelta: number
  resultingStock: number
  orderId: number | null
  createdAt: string
}

export type InventoryMovementsResponse = {
  items: InventoryMovementListItem[]
}
