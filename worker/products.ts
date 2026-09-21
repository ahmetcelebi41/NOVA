import type {
  ProductListItem,
  ProductPublicationStatus,
  ProductsResponse,
} from '../src/contracts/index.js'

type ProductRow = {
  id: number
  name: string
  sku: string | null
  category: string
  price_in_kurus: number
  stock_quantity: number
  low_stock_threshold: number
  publication_status: string
  image_url: string | null
}

const productsQuery = `
  SELECT
    id,
    name,
    sku,
    category,
    price_in_kurus,
    stock_quantity,
    low_stock_threshold,
    publication_status,
    image_url
  FROM products
  ORDER BY created_at DESC, id DESC
`

function mapPublicationStatus(value: string): ProductPublicationStatus {
  if (value === 'active' || value === 'inactive') {
    return value
  }

  throw new Error('Invalid product publication status')
}

function mapProduct(row: ProductRow): ProductListItem {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category,
    priceMinor: row.price_in_kurus,
    stockQuantity: row.stock_quantity,
    lowStockThreshold: row.low_stock_threshold,
    publicationStatus: mapPublicationStatus(row.publication_status),
    imageUrl: row.image_url,
  }
}

export async function listProducts(database: D1Database): Promise<ProductsResponse> {
  const result = await database.prepare(productsQuery).all<ProductRow>()

  return {
    items: result.results.map(mapProduct),
  }
}
