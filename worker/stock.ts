import { z } from 'zod'
import type {
  InventoryMovementListItem,
  InventoryMovementsResponse,
  InventoryMovementType,
  StockListItem,
  StockListResponse,
  StockQuery,
  StockState,
  StockUpdateResponse,
  UpdateStockInput,
} from '../src/contracts/index.js'
import { parseStockStatus, stockStatusSql } from './stock-status.js'

type StockListRow = {
  id: number
  name: string
  sku: string | null
  category: string
  stock_quantity: number
  low_stock_threshold: number
  stock_status: string
}

type StockStateRow = {
  id: number
  stock_quantity: number
  low_stock_threshold: number
  stock_status: string
}

type InventoryMovementRow = {
  id: number
  movement_type: string
  quantity_delta: number
  resulting_stock: number
  order_id: number | null
  created_at: string
}

type CountRow = {
  total_items: number
}

type StockQueryParseResult =
  | { ok: true; query: StockQuery }
  | { ok: false }

type StockInputParseResult =
  | { ok: true; input: UpdateStockInput }
  | { ok: false }

type QueryBinding = string | number

const pageSize = 20
const updateStockInputSchema = z.strictObject({
  stockQuantity: z.number().refine(
    (value) => Number.isSafeInteger(value) && value >= 0,
  ),
})

export class StockConflictError extends Error {
  constructor() {
    super('Stock changed during update')
    this.name = 'StockConflictError'
  }
}

function isStockStatus(value: string): value is NonNullable<StockQuery['status']> {
  return value === 'normal' || value === 'low' || value === 'out'
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

function escapeLikePattern(value: string): string {
  return value
    .replaceAll('!', '!!')
    .replaceAll('%', '!%')
    .replaceAll('_', '!_')
}

function createFilters(query: StockQuery): {
  bindings: QueryBinding[]
  whereClause: string
} {
  const bindings: QueryBinding[] = []
  const conditions: string[] = []

  if (query.status === 'normal') {
    conditions.push('stock_quantity > low_stock_threshold')
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

  return {
    bindings,
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
  }
}

function mapStockListItem(row: StockListRow): StockListItem {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category,
    stockQuantity: row.stock_quantity,
    lowStockThreshold: row.low_stock_threshold,
    stockStatus: parseStockStatus(row.stock_status),
  }
}

function mapStockState(row: StockStateRow): StockState {
  return {
    id: row.id,
    stockQuantity: row.stock_quantity,
    lowStockThreshold: row.low_stock_threshold,
    stockStatus: parseStockStatus(row.stock_status),
  }
}

function parseMovementType(value: string): InventoryMovementType {
  if (
    value === 'increase'
    || value === 'decrease'
    || value === 'order_created'
    || value === 'order_cancelled'
  ) {
    return value
  }

  throw new Error('Invalid inventory movement type')
}

function mapInventoryMovement(row: InventoryMovementRow): InventoryMovementListItem {
  return {
    id: row.id,
    movementType: parseMovementType(row.movement_type),
    quantityDelta: row.quantity_delta,
    resultingStock: row.resulting_stock,
    orderId: row.order_id,
    createdAt: row.created_at,
  }
}

async function getStockStateRow(
  database: D1Database,
  productId: number,
): Promise<StockStateRow | null> {
  return database
    .prepare(`
      SELECT
        id,
        stock_quantity,
        low_stock_threshold,
        ${stockStatusSql} AS stock_status
      FROM products
      WHERE id = ?
      LIMIT 1
    `)
    .bind(productId)
    .first<StockStateRow>()
}

export function parseStockQuery(searchParams: URLSearchParams): StockQueryParseResult {
  const rawStatus = searchParams.get('status')?.trim()
  const status = rawStatus && isStockStatus(rawStatus) ? rawStatus : undefined
  const q = searchParams.get('q')?.trim() || undefined
  const page = parsePage(searchParams)

  if ((rawStatus && !status) || page === null) {
    return { ok: false }
  }

  return { ok: true, query: { status, q, page } }
}

export function parseUpdateStockInput(value: unknown): StockInputParseResult {
  const result = updateStockInputSchema.safeParse(value)

  return result.success
    ? { ok: true, input: result.data }
    : { ok: false }
}

export async function listStock(
  database: D1Database,
  query: StockQuery,
): Promise<StockListResponse> {
  const { bindings, whereClause } = createFilters(query)
  const countStatement = database.prepare(`
    SELECT COUNT(*) AS total_items
    FROM products
    ${whereClause}
  `)
  const countRow = await (
    bindings.length > 0 ? countStatement.bind(...bindings) : countStatement
  ).first<CountRow>()

  if (!countRow || !Number.isSafeInteger(countRow.total_items) || countRow.total_items < 0) {
    throw new Error('Invalid stock count')
  }

  const offset = (query.page - 1) * pageSize
  const result = await database
    .prepare(`
      SELECT
        id,
        name,
        sku,
        category,
        stock_quantity,
        low_stock_threshold,
        ${stockStatusSql} AS stock_status
      FROM products
      ${whereClause}
      ORDER BY stock_quantity ASC, id ASC
      LIMIT ? OFFSET ?
    `)
    .bind(...bindings, pageSize, offset)
    .all<StockListRow>()

  return {
    items: result.results.map(mapStockListItem),
    page: query.page,
    pageSize,
    totalItems: countRow.total_items,
    totalPages: Math.ceil(countRow.total_items / pageSize),
  }
}

export async function updateStock(
  database: D1Database,
  productId: number,
  input: UpdateStockInput,
): Promise<StockUpdateResponse | null> {
  const currentRow = await getStockStateRow(database, productId)

  if (!currentRow) {
    return null
  }

  if (currentRow.stock_quantity === input.stockQuantity) {
    return { item: mapStockState(currentRow) }
  }

  const quantityDelta = input.stockQuantity - currentRow.stock_quantity
  const movementType = quantityDelta > 0 ? 'increase' : 'decrease'
  const updatedAt = new Date().toISOString()
  const [updateResult, movementResult, stateResult] = await database.batch<StockStateRow>([
    database
      .prepare(`
        UPDATE products
        SET stock_quantity = ?, updated_at = ?
        WHERE id = ? AND stock_quantity = ?
      `)
      .bind(input.stockQuantity, updatedAt, productId, currentRow.stock_quantity),
    database
      .prepare(`
        INSERT INTO inventory_movements (
          product_id,
          order_id,
          movement_type,
          quantity_delta,
          resulting_stock
        )
        SELECT ?, NULL, ?, ?, ?
        WHERE changes() = 1
      `)
      .bind(productId, movementType, quantityDelta, input.stockQuantity),
    database
      .prepare(`
        SELECT
          id,
          stock_quantity,
          low_stock_threshold,
          ${stockStatusSql} AS stock_status
        FROM products
        WHERE id = ?
        LIMIT 1
      `)
      .bind(productId),
  ])

  if (!updateResult || updateResult.meta.changes === 0) {
    throw new StockConflictError()
  }

  if (updateResult.meta.changes !== 1 || movementResult?.meta.changes !== 1) {
    throw new Error('Invalid atomic stock update result')
  }

  const updatedRow = stateResult?.results[0]

  if (!updatedRow) {
    throw new Error('Updated stock not found')
  }

  return { item: mapStockState(updatedRow) }
}

export async function listStockMovements(
  database: D1Database,
  productId: number,
): Promise<InventoryMovementsResponse | null> {
  const stockState = await getStockStateRow(database, productId)

  if (!stockState) {
    return null
  }

  const result = await database
    .prepare(`
      SELECT
        id,
        movement_type,
        quantity_delta,
        resulting_stock,
        order_id,
        created_at
      FROM inventory_movements
      WHERE product_id = ?
      ORDER BY created_at DESC, id DESC
    `)
    .bind(productId)
    .all<InventoryMovementRow>()

  return { items: result.results.map(mapInventoryMovement) }
}
