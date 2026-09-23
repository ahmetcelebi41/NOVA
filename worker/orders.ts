import type {
  CreateOrderInput,
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
type CreateOrderParseResult = { ok: true; input: CreateOrderInput } | { ok: false }

type CustomerMatchRow = { id: number; phone: string; email: string | null }
type ProductCreateRow = {
  id: number
  name: string
  sku: string | null
  category: string
  price_in_kurus: number
  stock_quantity: number
  publication_status: string
}
type OrderSettingsRow = {
  delivery_fee_in_kurus: number
  minimum_order_amount_in_kurus: number
  delivery_enabled: number
  pickup_enabled: number
}
type CreatedOrderIdRow = { id: number }

export type OrderCreateErrorCode =
  | 'CUSTOMER_MATCH_CONFLICT'
  | 'PRODUCT_UNAVAILABLE'
  | 'INSUFFICIENT_STOCK'
  | 'ORDER_SETTINGS_NOT_CONFIGURED'
  | 'MINIMUM_ORDER_NOT_MET'
  | 'DELIVERY_METHOD_UNAVAILABLE'
  | 'STOCK_CONFLICT'

export class OrderCreateError extends Error {
  readonly code: OrderCreateErrorCode

  constructor(code: OrderCreateErrorCode) {
    super(code)
    this.code = code
  }
}

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key))
}

function isOptionalText(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || typeof value === 'string'
}

function validCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function istanbulNowParts(now: Date): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const part = (type: string): string => parts.find((item) => item.type === type)?.value ?? ''

  return {
    date: `${part('year')}-${part('month')}-${part('day')}`,
    time: `${part('hour')}:${part('minute')}`,
  }
}

export function parseCreateOrderInput(value: unknown): CreateOrderParseResult {
  if (!isRecord(value) || !hasOnlyKeys(value, ['customer', 'items', 'delivery', 'notes'])) {
    return { ok: false }
  }

  const { customer, items, delivery, notes } = value

  if (
    !isRecord(customer)
    || !hasOnlyKeys(customer, ['name', 'phone', 'email'])
    || typeof customer.name !== 'string'
    || !customer.name.trim()
    || typeof customer.phone !== 'string'
    || !customer.phone.trim()
    || !isOptionalText(customer.email)
    || (customer.email !== undefined && customer.email !== null
      && !!customer.email.trim()
      && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim()))
    || !Array.isArray(items)
    || items.length === 0
    || !items.every((item) => isRecord(item)
      && hasOnlyKeys(item, ['productId', 'quantity'])
      && Number.isSafeInteger(item.productId)
      && (item.productId as number) > 0
      && Number.isSafeInteger(item.quantity)
      && (item.quantity as number) > 0)
    || !isRecord(delivery)
    || !hasOnlyKeys(delivery, ['method', 'address', 'date', 'startTime', 'endTime'])
    || (delivery.method !== 'delivery' && delivery.method !== 'pickup')
    || !isOptionalText(delivery.address)
    || typeof delivery.date !== 'string'
    || !validCalendarDate(delivery.date)
    || typeof delivery.startTime !== 'string'
    || !/^([01]\d|2[0-3]):[0-5]\d$/.test(delivery.startTime)
    || typeof delivery.endTime !== 'string'
    || !/^([01]\d|2[0-3]):[0-5]\d$/.test(delivery.endTime)
    || delivery.endTime <= delivery.startTime
    || (delivery.method === 'delivery' && !delivery.address?.trim())
    || !isOptionalText(notes)
  ) {
    return { ok: false }
  }

  const quantities = new Map<number, number>()

  for (const item of items as CreateOrderInput['items']) {
    const quantity = (quantities.get(item.productId) ?? 0) + item.quantity

    if (!Number.isSafeInteger(quantity)) {
      return { ok: false }
    }

    quantities.set(item.productId, quantity)
  }

  const now = istanbulNowParts(new Date())

  if (
    delivery.date < now.date
    || (delivery.date === now.date && delivery.startTime <= now.time)
  ) {
    return { ok: false }
  }

  return {
    ok: true,
    input: {
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        email: customer.email?.trim() || null,
      },
      items: items as CreateOrderInput['items'],
      delivery: {
        method: delivery.method,
        address: delivery.method === 'delivery' ? delivery.address?.trim() ?? null : null,
        date: delivery.date,
        startTime: delivery.startTime,
        endTime: delivery.endTime,
      },
      notes: notes?.trim() || null,
    },
  }
}

function normalizePhone(value: string): string {
  return value.replace(/\D/g, '')
}

function normalizeEmail(value: string): string {
  return value.trim().toLocaleLowerCase('tr-TR')
}

async function matchCustomer(
  database: D1Database,
  customer: CreateOrderInput['customer'],
): Promise<{ id: number | null; rowCount: number }> {
  const rows = (await database.prepare('SELECT id, phone, email FROM customers')
    .all<CustomerMatchRow>()).results
  const phone = normalizePhone(customer.phone)
  const email = customer.email ? normalizeEmail(customer.email) : ''
  const byPhone = phone
    ? rows.filter((row) => normalizePhone(row.phone) === phone)
    : []
  const byEmail = email
    ? rows.filter((row) => row.email && normalizeEmail(row.email) === email)
    : []

  if (
    byPhone.length > 1
    || byEmail.length > 1
    || (byPhone.length === 1 && byEmail.length === 1 && byPhone[0].id !== byEmail[0].id)
  ) {
    throw new OrderCreateError('CUSTOMER_MATCH_CONFLICT')
  }

  return { id: byPhone[0]?.id ?? byEmail[0]?.id ?? null, rowCount: rows.length }
}

function aggregateItems(items: CreateOrderInput['items']): Map<number, number> {
  const quantities = new Map<number, number>()

  for (const item of items) {
    const quantity = (quantities.get(item.productId) ?? 0) + item.quantity

    quantities.set(item.productId, quantity)
  }

  return quantities
}

export async function createOrder(
  database: D1Database,
  input: CreateOrderInput,
): Promise<OrderDetailResponse> {
  const customer = await matchCustomer(database, input.customer)
  const quantities = aggregateItems(input.items)
  const ids = [...quantities.keys()]
  const placeholders = ids.map(() => '?').join(', ')
  const [productResult, settings] = await Promise.all([
    database.prepare(`
      SELECT id, name, sku, category, price_in_kurus, stock_quantity, publication_status
      FROM products WHERE id IN (${placeholders})
    `).bind(...ids).all<ProductCreateRow>(),
    database.prepare(`
      SELECT delivery_fee_in_kurus, minimum_order_amount_in_kurus,
        delivery_enabled, pickup_enabled
      FROM settings WHERE id = 1
    `).first<OrderSettingsRow>(),
  ])
  const products = new Map(productResult.results.map((product) => [product.id, product]))

  for (const id of ids) {
    const product = products.get(id)

    if (!product || product.publication_status !== 'active') {
      throw new OrderCreateError('PRODUCT_UNAVAILABLE')
    }

    if (product.stock_quantity < (quantities.get(id) ?? 0)) {
      throw new OrderCreateError('INSUFFICIENT_STOCK')
    }
  }

  if (!settings) {
    throw new OrderCreateError('ORDER_SETTINGS_NOT_CONFIGURED')
  }

  if (
    (input.delivery.method === 'delivery' && settings.delivery_enabled !== 1)
    || (input.delivery.method === 'pickup' && settings.pickup_enabled !== 1)
  ) {
    throw new OrderCreateError('DELIVERY_METHOD_UNAVAILABLE')
  }

  let subtotal = 0

  for (const id of ids) {
    const product = products.get(id)!
    const lineTotal = product.price_in_kurus * quantities.get(id)!
    subtotal += lineTotal

    if (!Number.isSafeInteger(lineTotal) || !Number.isSafeInteger(subtotal)) {
      throw new Error('Invalid order total')
    }
  }

  if (subtotal < settings.minimum_order_amount_in_kurus) {
    throw new OrderCreateError('MINIMUM_ORDER_NOT_MET')
  }

  const fee = input.delivery.method === 'delivery' ? settings.delivery_fee_in_kurus : 0
  const total = subtotal + fee

  if (!Number.isSafeInteger(total)) {
    throw new Error('Invalid order total')
  }

  const token = `__pending__${crypto.randomUUID()}`
  const now = new Date().toISOString()
  const statements: D1PreparedStatement[] = []

  if (customer.id === null) {
    statements.push(database.prepare(`
      INSERT INTO customers (name, phone, email)
      SELECT ?, ?, ? WHERE (SELECT COUNT(*) FROM customers) = ?
    `).bind(input.customer.name, input.customer.phone, input.customer.email ?? null,
      customer.rowCount))
  }

  statements.push(database.prepare(`
    INSERT INTO orders (
      order_number, customer_id, customer_name_snapshot, customer_phone_snapshot,
      customer_email_snapshot, delivery_method, delivery_address_snapshot,
      delivery_date, delivery_start_time, delivery_end_time, notes,
      subtotal_in_kurus, delivery_fee_in_kurus, total_in_kurus, status
    ) VALUES (
      ?, CASE WHEN ? = 1 THEN last_insert_rowid() ELSE ? END,
      CASE WHEN (? = 0 OR changes() = 1)
        AND (SELECT COUNT(*) FROM customers) = ? AND
        EXISTS (SELECT 1 FROM settings WHERE id = 1
          AND delivery_fee_in_kurus = ? AND minimum_order_amount_in_kurus = ?
          AND delivery_enabled = ? AND pickup_enabled = ?)
        THEN ? ELSE NULL END,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new'
    )
  `).bind(
    token,
    customer.id === null ? 1 : 0,
    customer.id,
    customer.id === null ? 1 : 0,
    customer.rowCount + (customer.id === null ? 1 : 0),
    settings.delivery_fee_in_kurus,
    settings.minimum_order_amount_in_kurus,
    settings.delivery_enabled,
    settings.pickup_enabled,
    input.customer.name,
    input.customer.phone,
    input.customer.email ?? null,
    input.delivery.method,
    input.delivery.address ?? null,
    input.delivery.date,
    input.delivery.startTime,
    input.delivery.endTime,
    input.notes ?? null,
    subtotal,
    fee,
    total,
  ))

  for (const id of ids) {
    const product = products.get(id)!
    const quantity = quantities.get(id)!
    statements.push(database.prepare(`
      INSERT INTO order_items (
        order_id, product_id, product_name_snapshot, product_sku_snapshot,
        product_category_snapshot, unit_price_in_kurus, quantity, line_total_in_kurus
      ) VALUES ((SELECT id FROM orders WHERE order_number = ?), ?, ?, ?, ?, ?, ?, ?)
    `).bind(token, id, product.name, product.sku, product.category,
      product.price_in_kurus, quantity, product.price_in_kurus * quantity))
    statements.push(database.prepare(`
      UPDATE products SET stock_quantity = stock_quantity - ?, updated_at = ?
      WHERE id = ? AND publication_status = 'active' AND price_in_kurus = ?
        AND name = ? AND sku IS ? AND category = ?
        AND stock_quantity = ? AND stock_quantity >= ?
    `).bind(quantity, now, id, product.price_in_kurus, product.name,
      product.sku, product.category, product.stock_quantity, quantity))
    statements.push(database.prepare(`
      INSERT INTO inventory_movements (
        product_id, order_id, movement_type, quantity_delta, resulting_stock
      ) VALUES (
        CASE WHEN changes() = 1 THEN ? ELSE NULL END,
        (SELECT id FROM orders WHERE order_number = ?), 'order_created', ?,
        (SELECT stock_quantity FROM products WHERE id = ?)
      )
    `).bind(id, token, -quantity, id))
  }

  const orderIdResultIndex = statements.length
  statements.push(database.prepare('SELECT id FROM orders WHERE order_number = ?').bind(token))
  statements.push(database.prepare(`
    UPDATE orders SET order_number = 'NOVA-' || printf('%06d', id)
    WHERE order_number = ?
  `).bind(token))
  // AUTOINCREMENT's sequence identifies this batch's new order. A missing final
  // update makes order_id NULL and aborts the batch instead of committing a token.
  statements.push(database.prepare(`
    INSERT INTO order_status_history (order_id, status)
    VALUES (
      CASE WHEN changes() = 1 THEN
        (SELECT id FROM orders
          WHERE id = (SELECT seq FROM sqlite_sequence WHERE name = 'orders')
            AND order_number = 'NOVA-' || printf('%06d', id))
      ELSE NULL END,
      'new'
    )
  `))

  let results: D1Result[]

  try {
    results = await database.batch(statements)
  } catch {
    // Any failed guarded update deliberately makes the next NOT NULL insert fail.
    // D1 rolls back the entire batch, including a new customer and earlier items.
    throw new OrderCreateError('STOCK_CONFLICT')
  }

  const orderId = (results[orderIdResultIndex]?.results as CreatedOrderIdRow[] | undefined)?.[0]?.id

  if (!orderId || !Number.isSafeInteger(orderId)) {
    throw new Error('Committed order ID missing')
  }

  const detail = await getOrder(database, orderId)

  if (!detail) {
    throw new Error('Committed order missing')
  }

  return detail
}
