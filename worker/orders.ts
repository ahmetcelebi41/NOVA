import type {
  OrderCustomerSnapshot,
  OrderDateFilter,
  OrderDelivery,
  OrderDetail,
  OrderDetailResponse,
  OrderItemSnapshot,
  OrderListItem,
  OrderListResponse,
  OrdersQuery,
  OrderStatus,
  OrderStatusFilter,
  OrderStatusHistoryItem,
  OrderTotals,
} from '../src/contracts/index.js'

type OrderListRow = {
  id: number
  order_number: string
  customer_name_snapshot: string
  created_at: string
  total_in_kurus: number
  status: string
}

type OrderDetailRow = OrderListRow & {
  customer_id: number | null
  customer_phone_snapshot: string
  customer_email_snapshot: string | null
  delivery_method: string
  delivery_address_snapshot: string | null
  delivery_date: string | null
  delivery_start_time: string | null
  delivery_end_time: string | null
  notes: string | null
  subtotal_in_kurus: number
  delivery_fee_in_kurus: number
  updated_at: string
}

type OrderItemRow = {
  id: number
  order_id: number
  product_id: number | null
  product_name_snapshot: string
  product_sku_snapshot: string | null
  product_category_snapshot: string
  unit_price_in_kurus: number
  quantity: number
  line_total_in_kurus: number
}

type OrderProductNameRow = {
  order_id: number
  product_name_snapshot: string
}

type OrderHistoryRow = {
  id: number
  status: string
  created_at: string
}

type CountRow = { total_items: number }
type QueryBinding = string | number
type OrdersQueryParseResult = { ok: true; query: OrdersQuery } | { ok: false }

const pageSize = 20
const dayInMilliseconds = 24 * 60 * 60 * 1000
const istanbulDateFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Istanbul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
const istanbulOffsetFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Europe/Istanbul',
  timeZoneName: 'shortOffset',
})

function isOrderStatus(value: string): value is OrderStatus {
  return value === 'new'
    || value === 'preparing'
    || value === 'ready_for_delivery'
    || value === 'completed'
    || value === 'cancelled'
}

function isOrderStatusFilter(value: string): value is OrderStatusFilter {
  return value === 'pending' || isOrderStatus(value)
}

function isOrderDateFilter(value: string): value is OrderDateFilter {
  return value === 'bugun' || value === '7gun' || value === '30gun'
}

function parseOptionalText(searchParams: URLSearchParams, key: string): string | undefined {
  const value = searchParams.get(key)?.trim()

  return value || undefined
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

export function parseOrdersQuery(searchParams: URLSearchParams): OrdersQueryParseResult {
  const rawStatus = parseOptionalText(searchParams, 'status')
  const rawDate = parseOptionalText(searchParams, 'date')
  const status = rawStatus && isOrderStatusFilter(rawStatus) ? rawStatus : undefined
  const date = rawDate && isOrderDateFilter(rawDate) ? rawDate : undefined
  const page = parsePage(searchParams)

  if ((rawStatus && !status) || (rawDate && !date) || page === null) {
    return { ok: false }
  }

  return {
    ok: true,
    query: {
      status,
      q: parseOptionalText(searchParams, 'q'),
      date,
      page,
    },
  }
}

export function parseOrderId(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null
  }

  const orderId = Number(value)

  return Number.isSafeInteger(orderId) && orderId > 0 ? orderId : null
}

function escapeLikePattern(value: string): string {
  return value.replaceAll('!', '!!').replaceAll('%', '!%').replaceAll('_', '!_')
}

function istanbulTodayStart(now: Date): string {
  const parts = istanbulDateFormatter.formatToParts(now)
  const getPart = (type: string): number => {
    const value = Number(parts.find((part) => part.type === type)?.value)

    if (!Number.isInteger(value)) {
      throw new Error('Invalid Istanbul date')
    }

    return value
  }
  const utcMidnight = Date.UTC(getPart('year'), getPart('month') - 1, getPart('day'))
  const zoneName = istanbulOffsetFormatter
    .formatToParts(new Date(utcMidnight))
    .find((part) => part.type === 'timeZoneName')?.value
  const offsetMatch = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(zoneName ?? '')

  if (!offsetMatch) {
    throw new Error('Invalid Istanbul offset')
  }

  const sign = offsetMatch[1] === '+' ? 1 : -1
  const offsetMinutes = sign * (
    Number(offsetMatch[2]) * 60 + Number(offsetMatch[3] ?? '0')
  )

  return new Date(utcMidnight - offsetMinutes * 60 * 1000).toISOString()
}

function dateCutoff(date: OrderDateFilter, now: Date): string {
  if (date === 'bugun') {
    return istanbulTodayStart(now)
  }

  const days = date === '7gun' ? 7 : 30

  return new Date(now.getTime() - days * dayInMilliseconds).toISOString()
}

function createFilters(query: OrdersQuery, now: Date): {
  bindings: QueryBinding[]
  whereClause: string
} {
  const bindings: QueryBinding[] = []
  const conditions: string[] = []

  if (query.status === 'pending') {
    conditions.push("status IN ('new', 'preparing', 'ready_for_delivery')")
  } else if (query.status) {
    conditions.push('status = ?')
    bindings.push(query.status)
  }

  if (query.q) {
    const pattern = `%${escapeLikePattern(query.q)}%`
    conditions.push(`(
      order_number LIKE ? ESCAPE '!' COLLATE NOCASE
      OR customer_name_snapshot LIKE ? ESCAPE '!' COLLATE NOCASE
      OR customer_phone_snapshot LIKE ? ESCAPE '!' COLLATE NOCASE
      OR customer_email_snapshot LIKE ? ESCAPE '!' COLLATE NOCASE
    )`)
    bindings.push(pattern, pattern, pattern, pattern)
  }

  if (query.date) {
    conditions.push('created_at >= ?')
    bindings.push(dateCutoff(query.date, now))
  }

  return {
    bindings,
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
  }
}

function mapOrderStatus(value: string): OrderStatus {
  if (!isOrderStatus(value)) {
    throw new Error('Invalid order status')
  }

  return value
}

function nonNegativeInteger(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`Invalid ${field}`)
  }

  return value
}

function positiveInteger(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`Invalid ${field}`)
  }

  return value
}

function mapListItem(row: OrderListRow, productNames: string[]): OrderListItem {
  return {
    id: positiveInteger(row.id, 'order id'),
    orderNumber: row.order_number,
    customerName: row.customer_name_snapshot,
    createdAt: row.created_at,
    productNames,
    itemCount: productNames.length,
    totalMinor: nonNegativeInteger(row.total_in_kurus, 'order total'),
    status: mapOrderStatus(row.status),
  }
}

async function readOrderProductNames(
  database: D1Database,
  orderIds: number[],
): Promise<OrderProductNameRow[]> {
  if (orderIds.length === 0) {
    return []
  }

  const placeholders = orderIds.map(() => '?').join(', ')
  const result = await database
    .prepare(`
      SELECT order_id, product_name_snapshot
      FROM order_items
      WHERE order_id IN (${placeholders})
      ORDER BY order_id ASC, id ASC
    `)
    .bind(...orderIds)
    .all<OrderProductNameRow>()

  return result.results
}

export async function listOrders(
  database: D1Database,
  query: OrdersQuery,
): Promise<OrderListResponse> {
  const { bindings, whereClause } = createFilters(query, new Date())
  const countStatement = database.prepare(`
    SELECT COUNT(*) AS total_items
    FROM orders
    ${whereClause}
  `)
  const countRow = await (
    bindings.length > 0 ? countStatement.bind(...bindings) : countStatement
  ).first<CountRow>()

  if (!countRow || !Number.isSafeInteger(countRow.total_items) || countRow.total_items < 0) {
    throw new Error('Invalid order count')
  }

  const offset = (query.page - 1) * pageSize
  const result = await database
    .prepare(`
      SELECT
        id,
        order_number,
        customer_name_snapshot,
        created_at,
        total_in_kurus,
        status
      FROM orders
      ${whereClause}
      ORDER BY created_at DESC, id DESC
      LIMIT ? OFFSET ?
    `)
    .bind(...bindings, pageSize, offset)
    .all<OrderListRow>()
  const itemsByOrder = new Map<number, string[]>()

  for (const item of await readOrderProductNames(database, result.results.map((row) => row.id))) {
    const names = itemsByOrder.get(item.order_id) ?? []
    names.push(item.product_name_snapshot)
    itemsByOrder.set(item.order_id, names)
  }

  return {
    items: result.results.map((row) => mapListItem(row, itemsByOrder.get(row.id) ?? [])),
    page: query.page,
    pageSize,
    totalItems: countRow.total_items,
    totalPages: Math.ceil(countRow.total_items / pageSize),
  }
}

async function readOrderItems(database: D1Database, orderId: number): Promise<OrderItemRow[]> {
  const result = await database
    .prepare(`
      SELECT
        id,
        order_id,
        product_id,
        product_name_snapshot,
        product_sku_snapshot,
        product_category_snapshot,
        unit_price_in_kurus,
        quantity,
        line_total_in_kurus
      FROM order_items
      WHERE order_id = ?
      ORDER BY id ASC
    `)
    .bind(orderId)
    .all<OrderItemRow>()

  return result.results
}

function mapItem(row: OrderItemRow): OrderItemSnapshot {
  return {
    id: positiveInteger(row.id, 'item id'),
    productId: row.product_id,
    name: row.product_name_snapshot,
    sku: row.product_sku_snapshot,
    category: row.product_category_snapshot,
    unitPriceMinor: nonNegativeInteger(row.unit_price_in_kurus, 'unit price'),
    quantity: positiveInteger(row.quantity, 'quantity'),
    lineTotalMinor: nonNegativeInteger(row.line_total_in_kurus, 'line total'),
  }
}

function mapHistory(row: OrderHistoryRow): OrderStatusHistoryItem {
  return {
    id: positiveInteger(row.id, 'history id'),
    status: mapOrderStatus(row.status),
    createdAt: row.created_at,
  }
}

function mapDetail(row: OrderDetailRow): {
  order: OrderDetail
  customer: OrderCustomerSnapshot
  delivery: OrderDelivery
  totals: OrderTotals
} {
  if (row.delivery_method !== 'delivery' && row.delivery_method !== 'pickup') {
    throw new Error('Invalid delivery method')
  }

  return {
    order: {
      id: positiveInteger(row.id, 'order id'),
      orderNumber: row.order_number,
      status: mapOrderStatus(row.status),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      notes: row.notes,
    },
    customer: {
      id: row.customer_id,
      name: row.customer_name_snapshot,
      phone: row.customer_phone_snapshot,
      email: row.customer_email_snapshot,
    },
    delivery: {
      method: row.delivery_method,
      address: row.delivery_address_snapshot,
      date: row.delivery_date,
      startTime: row.delivery_start_time,
      endTime: row.delivery_end_time,
    },
    totals: {
      subtotalMinor: nonNegativeInteger(row.subtotal_in_kurus, 'subtotal'),
      deliveryFeeMinor: nonNegativeInteger(row.delivery_fee_in_kurus, 'delivery fee'),
      totalMinor: nonNegativeInteger(row.total_in_kurus, 'order total'),
    },
  }
}

export async function getOrder(
  database: D1Database,
  orderId: number,
): Promise<OrderDetailResponse | null> {
  const row = await database
    .prepare(`
      SELECT
        id,
        order_number,
        customer_id,
        customer_name_snapshot,
        customer_phone_snapshot,
        customer_email_snapshot,
        delivery_method,
        delivery_address_snapshot,
        delivery_date,
        delivery_start_time,
        delivery_end_time,
        notes,
        subtotal_in_kurus,
        delivery_fee_in_kurus,
        total_in_kurus,
        status,
        created_at,
        updated_at
      FROM orders
      WHERE id = ?
      LIMIT 1
    `)
    .bind(orderId)
    .first<OrderDetailRow>()

  if (!row) {
    return null
  }

  const [itemRows, historyResult] = await Promise.all([
    readOrderItems(database, orderId),
    database
      .prepare(`
        SELECT id, status, created_at
        FROM order_status_history
        WHERE order_id = ?
        ORDER BY created_at ASC, id ASC
      `)
      .bind(orderId)
      .all<OrderHistoryRow>(),
  ])

  return {
    ...mapDetail(row),
    items: itemRows.map(mapItem),
    statusHistory: historyResult.results.map(mapHistory),
  }
}
