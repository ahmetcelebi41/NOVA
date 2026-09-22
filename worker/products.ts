import { z } from 'zod'
import type {
  CreateProductInput,
  ProductDetail,
  ProductDetailResponse,
  ProductListItem,
  ProductPublicationStatus,
  ProductsQuery,
  ProductsResponse,
  ProductStatusFilter,
  ProductStockStatus,
  UpdateProductInput,
} from '../src/contracts/index.js'

type ProductDetailRow = {
  id: number
  name: string
  sku: string | null
  category: string
  description: string | null
  price_in_kurus: number
  stock_quantity: number
  low_stock_threshold: number
  publication_status: string
  image_url: string | null
  created_at: string
  updated_at: string
}

type ProductRow = {
  id: number
  name: string
  sku: string | null
  category: string
  price_in_kurus: number
  stock_quantity: number
  low_stock_threshold: number
  publication_status: string
  stock_status: string
  image_url: string | null
}

type CountRow = {
  total_items: number
}

type ProductIdRow = {
  id: number
}

type ProductsQueryParseResult =
  | { ok: true; query: ProductsQuery }
  | { ok: false }

type ProductInputParseResult<T> =
  | { ok: true; input: T }
  | { ok: false }

type QueryBinding = string | number | null

const pageSize = 20

const positiveSafeIntegerSchema = z.number().refine(
  (value) => Number.isSafeInteger(value) && value > 0,
)
const nonNegativeSafeIntegerSchema = z.number().refine(
  (value) => Number.isSafeInteger(value) && value >= 0,
)
const requiredTextSchema = z.string().trim().min(1)
const nullableTextSchema = z.string().nullable()
const publicationStatusSchema = z.enum(['active', 'inactive'])

const createProductInputSchema = z.strictObject({
  name: requiredTextSchema,
  sku: nullableTextSchema.optional(),
  category: requiredTextSchema,
  description: nullableTextSchema.optional(),
  priceMinor: positiveSafeIntegerSchema,
  stockQuantity: nonNegativeSafeIntegerSchema,
  lowStockThreshold: nonNegativeSafeIntegerSchema,
  publicationStatus: publicationStatusSchema.default('active'),
  imageUrl: nullableTextSchema.optional(),
})

const updateProductInputSchema = z.strictObject({
  name: requiredTextSchema.optional(),
  sku: nullableTextSchema.optional(),
  category: requiredTextSchema.optional(),
  description: nullableTextSchema.optional(),
  priceMinor: positiveSafeIntegerSchema.optional(),
  lowStockThreshold: nonNegativeSafeIntegerSchema.optional(),
  publicationStatus: publicationStatusSchema.optional(),
  imageUrl: nullableTextSchema.optional(),
}).refine((input) => Object.keys(input).length > 0)

export class ProductSkuConflictError extends Error {
  constructor() {
    super('Product SKU conflict')
    this.name = 'ProductSkuConflictError'
  }
}

function isProductStatusFilter(value: string): value is ProductStatusFilter {
  return value === 'active' || value === 'inactive' || value === 'low' || value === 'out'
}

function parseOptionalText(searchParams: URLSearchParams, key: string): string | undefined {
  const value = searchParams.get(key)?.trim()

  return value || undefined
}

function parseOptionalNonNegativeInteger(
  searchParams: URLSearchParams,
  key: string,
): number | undefined | null {
  const rawValue = searchParams.get(key)

  if (rawValue === null || !rawValue.trim()) {
    return undefined
  }

  const value = Number(rawValue)

  return Number.isSafeInteger(value) && value >= 0 ? value : null
}

function parsePage(searchParams: URLSearchParams): number | null {
  const rawValue = searchParams.get('page')

  if (rawValue === null) {
    return 1
  }

  const value = Number(rawValue)
  const maximumPage = Math.floor(Number.MAX_SAFE_INTEGER / pageSize) + 1

  return Number.isSafeInteger(value) && value >= 1 && value <= maximumPage ? value : null
}

export function parseProductsQuery(searchParams: URLSearchParams): ProductsQueryParseResult {
  const rawStatus = parseOptionalText(searchParams, 'status')
  const status = rawStatus && isProductStatusFilter(rawStatus) ? rawStatus : undefined
  const priceMinMinor = parseOptionalNonNegativeInteger(searchParams, 'priceMinMinor')
  const priceMaxMinor = parseOptionalNonNegativeInteger(searchParams, 'priceMaxMinor')
  const page = parsePage(searchParams)

  if (
    (rawStatus && !status)
    || priceMinMinor === null
    || priceMaxMinor === null
    || page === null
    || (
      priceMinMinor !== undefined
      && priceMaxMinor !== undefined
      && priceMinMinor > priceMaxMinor
    )
  ) {
    return { ok: false }
  }

  return {
    ok: true,
    query: {
      status,
      q: parseOptionalText(searchParams, 'q'),
      category: parseOptionalText(searchParams, 'category'),
      priceMinMinor,
      priceMaxMinor,
      page,
    },
  }
}

function escapeLikePattern(value: string): string {
  return value
    .replaceAll('!', '!!')
    .replaceAll('%', '!%')
    .replaceAll('_', '!_')
}

function createFilters(query: ProductsQuery): {
  bindings: QueryBinding[]
  whereClause: string
} {
  const bindings: QueryBinding[] = []
  const conditions: string[] = []

  if (query.status === 'active' || query.status === 'inactive') {
    conditions.push('publication_status = ?')
    bindings.push(query.status)
  } else if (query.status === 'low') {
    conditions.push('stock_quantity > 0 AND stock_quantity <= low_stock_threshold')
  } else if (query.status === 'out') {
    conditions.push('stock_quantity = 0')
  }

  if (query.q) {
    const searchPattern = `%${escapeLikePattern(query.q)}%`
    conditions.push(`(
      name LIKE ? ESCAPE '!' COLLATE NOCASE
      OR sku LIKE ? ESCAPE '!' COLLATE NOCASE
    )`)
    bindings.push(searchPattern, searchPattern)
  }

  if (query.category) {
    conditions.push('category = ? COLLATE NOCASE')
    bindings.push(query.category)
  }

  if (query.priceMinMinor !== undefined) {
    conditions.push('price_in_kurus >= ?')
    bindings.push(query.priceMinMinor)
  }

  if (query.priceMaxMinor !== undefined) {
    conditions.push('price_in_kurus <= ?')
    bindings.push(query.priceMaxMinor)
  }

  return {
    bindings,
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
  }
}

function mapPublicationStatus(value: string): ProductPublicationStatus {
  if (value === 'active' || value === 'inactive') {
    return value
  }

  throw new Error('Invalid product publication status')
}

function mapStockStatus(value: string): ProductStockStatus {
  if (value === 'normal' || value === 'low' || value === 'out') {
    return value
  }

  throw new Error('Invalid product stock status')
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
    stockStatus: mapStockStatus(row.stock_status),
    imageUrl: row.image_url,
  }
}

function mapProductDetail(row: ProductDetailRow): ProductDetail {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category,
    description: row.description,
    priceMinor: row.price_in_kurus,
    stockQuantity: row.stock_quantity,
    lowStockThreshold: row.low_stock_threshold,
    publicationStatus: mapPublicationStatus(row.publication_status),
    imageUrl: row.image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function isSkuConstraintError(error: unknown): boolean {
  return error instanceof Error
    && error.message.includes('UNIQUE constraint failed: products.sku')
}

function validateProductIdRow(row: ProductIdRow | null): number | null {
  if (!row || !Number.isSafeInteger(row.id) || row.id <= 0) {
    return null
  }

  return row.id
}

export function parseCreateProductInput(value: unknown): ProductInputParseResult<CreateProductInput> {
  const result = createProductInputSchema.safeParse(value)

  return result.success
    ? { ok: true, input: result.data }
    : { ok: false }
}

export function parseUpdateProductInput(value: unknown): ProductInputParseResult<UpdateProductInput> {
  const result = updateProductInputSchema.safeParse(value)

  return result.success
    ? { ok: true, input: result.data }
    : { ok: false }
}

export function parseProductId(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null
  }

  const productId = Number(value)

  return Number.isSafeInteger(productId) && productId > 0 ? productId : null
}

export async function getProduct(
  database: D1Database,
  productId: number,
): Promise<ProductDetailResponse | null> {
  const row = await database
    .prepare(`
      SELECT
        id,
        name,
        sku,
        category,
        description,
        price_in_kurus,
        stock_quantity,
        low_stock_threshold,
        publication_status,
        image_url,
        created_at,
        updated_at
      FROM products
      WHERE id = ?
      LIMIT 1
    `)
    .bind(productId)
    .first<ProductDetailRow>()

  return row ? { item: mapProductDetail(row) } : null
}

export async function createProduct(
  database: D1Database,
  input: CreateProductInput,
): Promise<ProductDetailResponse> {
  const timestamp = new Date().toISOString()

  try {
    const insertedRow = await database
      .prepare(`
        INSERT INTO products (
          name,
          sku,
          category,
          description,
          price_in_kurus,
          stock_quantity,
          low_stock_threshold,
          publication_status,
          image_url,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING id
      `)
      .bind(
        input.name,
        input.sku ?? null,
        input.category,
        input.description ?? null,
        input.priceMinor,
        input.stockQuantity,
        input.lowStockThreshold,
        input.publicationStatus ?? 'active',
        input.imageUrl ?? null,
        timestamp,
        timestamp,
      )
      .first<ProductIdRow>()
    const productId = validateProductIdRow(insertedRow)

    if (productId === null) {
      throw new Error('Invalid inserted product id')
    }

    const response = await getProduct(database, productId)

    if (!response) {
      throw new Error('Inserted product not found')
    }

    return response
  } catch (error) {
    if (isSkuConstraintError(error)) {
      throw new ProductSkuConflictError()
    }

    throw error
  }
}

export async function updateProduct(
  database: D1Database,
  productId: number,
  input: UpdateProductInput,
): Promise<ProductDetailResponse | null> {
  const assignments: string[] = []
  const bindings: QueryBinding[] = []

  if (input.name !== undefined) {
    assignments.push('name = ?')
    bindings.push(input.name)
  }

  if (input.sku !== undefined) {
    assignments.push('sku = ?')
    bindings.push(input.sku)
  }

  if (input.category !== undefined) {
    assignments.push('category = ?')
    bindings.push(input.category)
  }

  if (input.description !== undefined) {
    assignments.push('description = ?')
    bindings.push(input.description)
  }

  if (input.priceMinor !== undefined) {
    assignments.push('price_in_kurus = ?')
    bindings.push(input.priceMinor)
  }

  if (input.lowStockThreshold !== undefined) {
    assignments.push('low_stock_threshold = ?')
    bindings.push(input.lowStockThreshold)
  }

  if (input.publicationStatus !== undefined) {
    assignments.push('publication_status = ?')
    bindings.push(input.publicationStatus)
  }

  if (input.imageUrl !== undefined) {
    assignments.push('image_url = ?')
    bindings.push(input.imageUrl)
  }

  assignments.push('updated_at = ?')
  bindings.push(new Date().toISOString(), productId)

  try {
    const updatedRow = await database
      .prepare(`
        UPDATE products
        SET ${assignments.join(', ')}
        WHERE id = ?
        RETURNING id
      `)
      .bind(...bindings)
      .first<ProductIdRow>()
    const updatedProductId = validateProductIdRow(updatedRow)

    if (updatedProductId === null) {
      return null
    }

    const response = await getProduct(database, updatedProductId)

    if (!response) {
      throw new Error('Updated product not found')
    }

    return response
  } catch (error) {
    if (isSkuConstraintError(error)) {
      throw new ProductSkuConflictError()
    }

    throw error
  }
}

export async function listProducts(
  database: D1Database,
  query: ProductsQuery,
): Promise<ProductsResponse> {
  const { bindings, whereClause } = createFilters(query)
  const countQuery = `
    SELECT COUNT(*) AS total_items
    FROM products
    ${whereClause}
  `
  const dataQuery = `
    SELECT
      id,
      name,
      sku,
      category,
      price_in_kurus,
      stock_quantity,
      low_stock_threshold,
      publication_status,
      CASE
        WHEN stock_quantity = 0 THEN 'out'
        WHEN stock_quantity > 0 AND stock_quantity <= low_stock_threshold THEN 'low'
        ELSE 'normal'
      END AS stock_status,
      image_url
    FROM products
    ${whereClause}
    ORDER BY created_at DESC, id DESC
    LIMIT ? OFFSET ?
  `
  const countStatement = database.prepare(countQuery)
  const countRow = await (
    bindings.length > 0 ? countStatement.bind(...bindings) : countStatement
  ).first<CountRow>()

  if (!countRow || !Number.isSafeInteger(countRow.total_items) || countRow.total_items < 0) {
    throw new Error('Invalid product count')
  }

  const offset = (query.page - 1) * pageSize
  const result = await database
    .prepare(dataQuery)
    .bind(...bindings, pageSize, offset)
    .all<ProductRow>()

  return {
    items: result.results.map(mapProduct),
    page: query.page,
    pageSize,
    totalItems: countRow.total_items,
    totalPages: Math.ceil(countRow.total_items / pageSize),
  }
}
