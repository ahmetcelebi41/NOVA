export type ProductPublicationStatus = 'active' | 'inactive'
export type ProductStockStatus = 'normal' | 'low' | 'out'
export type ProductStatusFilter = 'active' | 'inactive' | 'low' | 'out'

export type ProductsQuery = {
  status?: ProductStatusFilter
  q?: string
  category?: string
  priceMinMinor?: number
  priceMaxMinor?: number
  page: number
}

export type ProductListItem = {
  id: number
  name: string
  sku: string | null
  category: string
  priceMinor: number
  stockQuantity: number
  lowStockThreshold: number
  publicationStatus: ProductPublicationStatus
  stockStatus: ProductStockStatus
  imageUrl: string | null
}

export type ProductsResponse = {
  items: ProductListItem[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}
