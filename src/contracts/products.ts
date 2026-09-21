export type ProductPublicationStatus = 'active' | 'inactive'

export type ProductListItem = {
  id: number
  name: string
  sku: string | null
  category: string
  priceMinor: number
  stockQuantity: number
  lowStockThreshold: number
  publicationStatus: ProductPublicationStatus
  imageUrl: string | null
}

export type ProductsResponse = {
  items: ProductListItem[]
}
