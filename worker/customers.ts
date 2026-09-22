import type {
  CustomerDetail,
  CustomerDetailResponse,
  CustomerListItem,
  CustomerListResponse,
  CustomerMetrics,
  CustomerOrderStatus,
  CustomerRecentOrder,
  CustomersQuery,
  CustomerStatus,
} from '../src/contracts/index.js'

type CustomerAggregateRow = {
  id: number
  name: string
  phone: string
  email: string | null
  address: string | null
  created_at: string
  updated_at: string
  valid_order_count: number
  completed_order_count: number
  total_spend_minor: number
  last_order_at: string | null
  customer_status: string | null
}

type CustomerListRow = {
  id: number
  name: string
  phone: string
  email: string | null
  valid_order_count: number
  total_spend_minor: number
  last_order_at: string | null
  customer_status: string | null
}

type CountRow = {
  total_items: number
}

type RecentOrderRow = {
  id: number
  order_number: string
  created_at: string
  status: string
  total_in_kurus: number
}

type OrderItemRow = {
  order_id: number
  product_name_snapshot: string
}

type CustomersQueryParseResult =
  | { ok: true; query: CustomersQuery }
  | { ok: false }

type QueryBinding = string | number

const pageSize = 20
const dayInMilliseconds = 24 * 60 * 60 * 1000

const customerOrderMetricsSql = `
  SELECT
    customer_id,
    COUNT(*) AS valid_order_count,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_order_count,
    COALESCE(SUM(CASE WHEN status = 'completed' THEN total_in_kurus ELSE 0 END), 0)
      AS total_spend_minor,
    MIN(created_at) AS first_order_at,
    MAX(created_at) AS last_order_at
  FROM orders
  WHERE customer_id IS NOT NULL AND status <> 'cancelled'
  GROUP BY customer_id
`

const customerStatusSql = `
  CASE
    WHEN order_metrics.last_order_at < ? THEN 'inactive'
    WHEN COALESCE(order_metrics.valid_order_count, 0) >= 2 THEN 'repeat'
    WHEN order_metrics.first_order_at >= ? THEN 'new'
    ELSE NULL
  END
`

const customerRowsSql = `
  WITH order_metrics AS (
    ${customerOrderMetricsSql}
  ), customer_rows AS (
    SELECT
      customers.id,
      customers.name,
      customers.phone,
      customers.email,
      customers.address,
      customers.created_at,
      customers.updated_at,
      COALESCE(order_metrics.valid_order_count, 0) AS valid_order_count,
      COALESCE(order_metrics.completed_order_count, 0) AS completed_order_count,
      COALESCE(order_metrics.total_spend_minor, 0) AS total_spend_minor,
      order_metrics.last_order_at,
      ${customerStatusSql} AS customer_status
    FROM customers
    LEFT JOIN order_metrics ON order_metrics.customer_id = customers.id
  )
`

function isCustomerStatus(value: string): value is CustomerStatus {
  return value === 'new' || value === 'repeat' || value === 'inactive'
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

export function parseCustomersQuery(
  searchParams: URLSearchParams,
): CustomersQueryParseResult {
  const rawStatus = parseOptionalText(searchParams, 'status')
  const status = rawStatus && isCustomerStatus(rawStatus) ? rawStatus : undefined
  const page = parsePage(searchParams)

  if ((rawStatus && !status) || page === null) {
    return { ok: false }
  }

  return {
    ok: true,
    query: {
      status,
      q: parseOptionalText(searchParams, 'q'),
      page,
    },
  }
}

export function parseCustomerId(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null
  }

  const customerId = Number(value)

  return Number.isSafeInteger(customerId) && customerId > 0 ? customerId : null
}

function escapeLikePattern(value: string): string {
  return value
    .replaceAll('!', '!!')
    .replaceAll('%', '!%')
    .replaceAll('_', '!_')
}

function createStatusBoundaries(referenceTime: Date): {
  inactiveCutoff: string
  newCutoff: string
} {
  return {
    inactiveCutoff: new Date(
      referenceTime.getTime() - 90 * dayInMilliseconds,
    ).toISOString(),
    newCutoff: new Date(
      referenceTime.getTime() - 30 * dayInMilliseconds,
    ).toISOString(),
  }
}

function createFilters(query: CustomersQuery): {
  bindings: QueryBinding[]
  whereClause: string
} {
  const bindings: QueryBinding[] = []
  const conditions: string[] = []

  if (query.status) {
    conditions.push('customer_status = ?')
    bindings.push(query.status)
  }

  if (query.q) {
    const searchPattern = `%${escapeLikePattern(query.q)}%`
    conditions.push(`(
      name LIKE ? ESCAPE '!' COLLATE NOCASE
      OR phone LIKE ? ESCAPE '!' COLLATE NOCASE
      OR email LIKE ? ESCAPE '!' COLLATE NOCASE
    )`)
    bindings.push(searchPattern, searchPattern, searchPattern)
  }

  return {
    bindings,
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
  }
}

function mapCustomerStatus(value: string | null): CustomerStatus | null {
  if (value === null || isCustomerStatus(value)) {
    return value
  }

  throw new Error('Invalid customer status')
}

function mapOrderStatus(value: string): CustomerOrderStatus {
  if (
    value === 'new'
    || value === 'preparing'
    || value === 'ready_for_delivery'
    || value === 'completed'
    || value === 'cancelled'
  ) {
    return value
  }

  throw new Error('Invalid order status')
}

function assertNonNegativeSafeInteger(value: number, fieldName: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`Invalid ${fieldName}`)
  }

  return value
}

function mapCustomerListItem(row: CustomerListRow): CustomerListItem {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    orderCount: assertNonNegativeSafeInteger(row.valid_order_count, 'valid order count'),
    totalSpendMinor: assertNonNegativeSafeInteger(row.total_spend_minor, 'total spend'),
    lastOrderAt: row.last_order_at,
    status: mapCustomerStatus(row.customer_status),
  }
}

function mapCustomerDetail(row: CustomerAggregateRow): CustomerDetail {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: mapCustomerStatus(row.customer_status),
  }
}

function mapCustomerMetrics(row: CustomerAggregateRow): CustomerMetrics {
  const validOrderCount = assertNonNegativeSafeInteger(
    row.valid_order_count,
    'valid order count',
  )
  const completedOrderCount = assertNonNegativeSafeInteger(
    row.completed_order_count,
    'completed order count',
  )
  const totalSpendMinor = assertNonNegativeSafeInteger(
    row.total_spend_minor,
    'total spend',
  )

  return {
    validOrderCount,
    completedOrderCount,
    totalSpendMinor,
    averageOrderMinor: completedOrderCount === 0
      ? 0
      : Math.round(totalSpendMinor / completedOrderCount),
  }
}

function mapRecentOrder(
  row: RecentOrderRow,
  productNames: string[],
): CustomerRecentOrder {
  return {
    id: row.id,
    orderNumber: row.order_number,
    createdAt: row.created_at,
    status: mapOrderStatus(row.status),
    totalMinor: assertNonNegativeSafeInteger(row.total_in_kurus, 'order total'),
    productNames,
    itemCount: productNames.length,
  }
}

export async function listCustomers(
  database: D1Database,
  query: CustomersQuery,
): Promise<CustomerListResponse> {
  const { inactiveCutoff, newCutoff } = createStatusBoundaries(new Date())
  const { bindings, whereClause } = createFilters(query)
  const commonBindings = [inactiveCutoff, newCutoff, ...bindings]
  const countStatement = database.prepare(`
    ${customerRowsSql}
    SELECT COUNT(*) AS total_items
    FROM customer_rows
    ${whereClause}
  `)
  const countRow = await countStatement
    .bind(...commonBindings)
    .first<CountRow>()

  if (!countRow || !Number.isSafeInteger(countRow.total_items) || countRow.total_items < 0) {
    throw new Error('Invalid customer count')
  }

  const offset = (query.page - 1) * pageSize
  const result = await database
    .prepare(`
      ${customerRowsSql}
      SELECT
        id,
        name,
        phone,
        email,
        valid_order_count,
        total_spend_minor,
        last_order_at,
        customer_status
      FROM customer_rows
      ${whereClause}
      ORDER BY id ASC
      LIMIT ? OFFSET ?
    `)
    .bind(...commonBindings, pageSize, offset)
    .all<CustomerListRow>()

  return {
    items: result.results.map(mapCustomerListItem),
    page: query.page,
    pageSize,
    totalItems: countRow.total_items,
    totalPages: Math.ceil(countRow.total_items / pageSize),
  }
}

async function getRecentOrders(
  database: D1Database,
  customerId: number,
): Promise<CustomerRecentOrder[]> {
  const orderResult = await database
    .prepare(`
      SELECT
        id,
        order_number,
        created_at,
        status,
        total_in_kurus
      FROM orders
      WHERE customer_id = ?
      ORDER BY created_at DESC, id DESC
      LIMIT 10
    `)
    .bind(customerId)
    .all<RecentOrderRow>()
  const orderRows = orderResult.results

  if (orderRows.length === 0) {
    return []
  }

  const placeholders = orderRows.map(() => '?').join(', ')
  const itemResult = await database
    .prepare(`
      SELECT
        order_id,
        product_name_snapshot
      FROM order_items
      WHERE order_id IN (${placeholders})
      ORDER BY order_id ASC, id ASC
    `)
    .bind(...orderRows.map((order) => order.id))
    .all<OrderItemRow>()
  const productNamesByOrderId = new Map<number, string[]>()

  for (const item of itemResult.results) {
    const productNames = productNamesByOrderId.get(item.order_id) ?? []
    productNames.push(item.product_name_snapshot)
    productNamesByOrderId.set(item.order_id, productNames)
  }

  return orderRows.map((order) => mapRecentOrder(
    order,
    productNamesByOrderId.get(order.id) ?? [],
  ))
}

export async function getCustomer(
  database: D1Database,
  customerId: number,
): Promise<CustomerDetailResponse | null> {
  const { inactiveCutoff, newCutoff } = createStatusBoundaries(new Date())
  const row = await database
    .prepare(`
      ${customerRowsSql}
      SELECT
        id,
        name,
        phone,
        email,
        address,
        created_at,
        updated_at,
        valid_order_count,
        completed_order_count,
        total_spend_minor,
        last_order_at,
        customer_status
      FROM customer_rows
      WHERE id = ?
      LIMIT 1
    `)
    .bind(inactiveCutoff, newCutoff, customerId)
    .first<CustomerAggregateRow>()

  if (!row) {
    return null
  }

  return {
    customer: mapCustomerDetail(row),
    metrics: mapCustomerMetrics(row),
    recentOrders: await getRecentOrders(database, customerId),
  }
}
