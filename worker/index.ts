import type { HealthResponse } from '../src/contracts/index.js'
import { verifyCloudflareAccess, type CloudflareAccessEnv } from './access.js'
import { getAnalytics, parseAnalyticsQuery } from './analytics.js'
import {
  getCustomer,
  listCustomers,
  parseCustomerId,
  parseCustomersQuery,
} from './customers.js'
import {
  createOrder,
  getOrder,
  listOrders,
  OrderCreateError,
  OrderStatusError,
  parseCreateOrderInput,
  parseOrderId,
  parseOrdersQuery,
  parseUpdateOrderStatusInput,
  updateOrderStatus,
} from './orders.js'
import {
  createProduct,
  getProduct,
  listProducts,
  parseCreateProductInput,
  parseProductId,
  parseProductsQuery,
  parseUpdateProductInput,
  ProductSkuConflictError,
  updateProduct,
} from './products.js'
import { getSettings, parseUpdateSettingsInput, putSettings } from './settings.js'
import { getOverview } from './overview.js'
import {
  listStock,
  listStockMovements,
  parseStockQuery,
  parseUpdateStockInput,
  StockConflictError,
  updateStock,
} from './stock.js'

type Env = CloudflareAccessEnv & {
  DB: D1Database
  ENVIRONMENT: 'development' | 'production'
}

const jsonHeaders = { 'Content-Type': 'application/json' }

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: jsonHeaders,
    },
  )
}

function invalidProductInputResponse(): Response {
  return jsonResponse(
    {
      error: {
        code: 'INVALID_PRODUCT_INPUT',
        message: 'Geçersiz ürün bilgileri.',
      },
    },
    400,
  )
}

function productSkuConflictResponse(): Response {
  return jsonResponse(
    {
      error: {
        code: 'SKU_CONFLICT',
        message: 'Bu SKU başka bir üründe kullanılıyor.',
      },
    },
    409,
  )
}

function internalErrorResponse(): Response {
  return jsonResponse(
    {
      ok: false,
      error: 'Internal Server Error',
    },
    500,
  )
}

function invalidStockInputResponse(): Response {
  return jsonResponse(
    {
      error: {
        code: 'INVALID_STOCK_INPUT',
        message: 'Geçersiz stok bilgileri.',
      },
    },
    400,
  )
}

function productNotFoundResponse(): Response {
  return jsonResponse(
    {
      error: {
        code: 'PRODUCT_NOT_FOUND',
        message: 'Ürün bulunamadı.',
      },
    },
    404,
  )
}

async function readJsonBody(request: Request): Promise<unknown> {
  return request.json()
}

export default {
  async fetch(request, env): Promise<Response> {
    if (env.ENVIRONMENT === 'production') {
      const accessFailure = await verifyCloudflareAccess(request, env)

      if (accessFailure) return accessFailure
    }

    const url = new URL(request.url)

    if (request.method === 'GET' && url.pathname === '/api/health') {
      const response: HealthResponse = {
        ok: true,
        service: 'nova-api',
      }

      return jsonResponse(response)
    }

    if (request.method === 'GET' && url.pathname === '/api/settings') {
      try {
        const settings = await getSettings(env.DB)

        return settings
          ? jsonResponse(settings)
          : jsonResponse({
              error: {
                code: 'SETTINGS_NOT_CONFIGURED',
                message: 'İşletme ayarları yapılandırılmadı.',
              },
            }, 404)
      } catch {
        return internalErrorResponse()
      }
    }

    if (request.method === 'GET' && url.pathname === '/api/overview') {
      try {
        return jsonResponse(await getOverview(env.DB))
      } catch {
        return internalErrorResponse()
      }
    }

    if (request.method === 'GET' && url.pathname === '/api/analytics') {
      const parsedQuery = parseAnalyticsQuery(url.searchParams)

      if (!parsedQuery.ok) {
        return jsonResponse({
          error: { code: 'INVALID_ANALYTICS_QUERY', message: 'Geçersiz analiz tarih aralığı.' },
        }, 400)
      }

      try {
        return jsonResponse(await getAnalytics(env.DB, parsedQuery.query))
      } catch {
        return internalErrorResponse()
      }
    }

    if (request.method === 'PUT' && url.pathname === '/api/settings') {
      let body: unknown

      try {
        body = await readJsonBody(request)
      } catch {
        return jsonResponse({
          error: { code: 'INVALID_SETTINGS_INPUT', message: 'Geçersiz işletme ayarları.' },
        }, 400)
      }

      const input = parseUpdateSettingsInput(body)

      if (!input) {
        return jsonResponse({
          error: { code: 'INVALID_SETTINGS_INPUT', message: 'Geçersiz işletme ayarları.' },
        }, 400)
      }

      try {
        return jsonResponse(await putSettings(env.DB, input))
      } catch {
        return internalErrorResponse()
      }
    }

    if (request.method === 'GET' && url.pathname === '/api/products') {
      const parsedQuery = parseProductsQuery(url.searchParams)

      if (!parsedQuery.ok) {
        return jsonResponse(
          {
            error: {
              code: 'INVALID_QUERY',
              message: 'Geçersiz ürün filtreleri.',
            },
          },
          400,
        )
      }

      try {
        return jsonResponse(await listProducts(env.DB, parsedQuery.query))
      } catch {
        return internalErrorResponse()
      }
    }

    if (request.method === 'GET' && url.pathname === '/api/customers') {
      const parsedQuery = parseCustomersQuery(url.searchParams)

      if (!parsedQuery.ok) {
        return jsonResponse(
          {
            error: {
              code: 'INVALID_CUSTOMER_QUERY',
              message: 'Geçersiz müşteri filtreleri.',
            },
          },
          400,
        )
      }

      try {
        return jsonResponse(await listCustomers(env.DB, parsedQuery.query))
      } catch {
        return internalErrorResponse()
      }
    }

    if (request.method === 'GET' && url.pathname === '/api/orders') {
      const parsedQuery = parseOrdersQuery(url.searchParams)

      if (!parsedQuery.ok) {
        return jsonResponse(
          {
            error: {
              code: 'INVALID_ORDER_QUERY',
              message: 'Geçersiz sipariş filtreleri.',
            },
          },
          400,
        )
      }

      try {
        return jsonResponse(await listOrders(env.DB, parsedQuery.query))
      } catch {
        return internalErrorResponse()
      }
    }

    if (request.method === 'POST' && url.pathname === '/api/orders') {
      let body: unknown

      try {
        body = await readJsonBody(request)
      } catch {
        return jsonResponse({
          error: { code: 'INVALID_ORDER_INPUT', message: 'Geçersiz sipariş bilgileri.' },
        }, 400)
      }

      const parsedInput = parseCreateOrderInput(body)

      if (!parsedInput.ok) {
        return jsonResponse({
          error: { code: 'INVALID_ORDER_INPUT', message: 'Geçersiz sipariş bilgileri.' },
        }, 400)
      }

      try {
        return jsonResponse(await createOrder(env.DB, parsedInput.input), 201)
      } catch (error) {
        return error instanceof OrderCreateError
          ? jsonResponse({ error: { code: error.code, message: 'Sipariş oluşturulamadı.' } }, 409)
          : internalErrorResponse()
      }
    }

    if (request.method === 'PATCH' && url.pathname.startsWith('/api/orders/')) {
      const parts = url.pathname.slice('/api/orders/'.length).split('/')

      if (parts.length !== 2 || parts[1] !== 'status') {
        return jsonResponse({ ok: false, error: 'Not Found' }, 404)
      }

      const orderId = parseOrderId(parts[0] ?? '')

      if (orderId === null) {
        return jsonResponse({
          error: { code: 'INVALID_ORDER_ID', message: 'Geçersiz sipariş kimliği.' },
        }, 400)
      }

      let body: unknown

      try {
        body = await readJsonBody(request)
      } catch {
        return jsonResponse({
          error: { code: 'INVALID_ORDER_STATUS_INPUT', message: 'Geçersiz sipariş durumu.' },
        }, 400)
      }

      const input = parseUpdateOrderStatusInput(body)

      if (!input) {
        return jsonResponse({
          error: { code: 'INVALID_ORDER_STATUS_INPUT', message: 'Geçersiz sipariş durumu.' },
        }, 400)
      }

      try {
        const detail = await updateOrderStatus(env.DB, orderId, input)

        return detail
          ? jsonResponse(detail)
          : jsonResponse({
              error: { code: 'ORDER_NOT_FOUND', message: 'Sipariş bulunamadı.' },
            }, 404)
      } catch (error) {
        return error instanceof OrderStatusError
          ? jsonResponse({
              error: { code: error.code, message: 'Sipariş durumu güncellenemedi.' },
            }, 409)
          : internalErrorResponse()
      }
    }

    if (request.method === 'GET' && url.pathname.startsWith('/api/orders/')) {
      const rawOrderId = url.pathname.slice('/api/orders/'.length)

      if (rawOrderId.includes('/')) {
        return jsonResponse({ ok: false, error: 'Not Found' }, 404)
      }

      const orderId = parseOrderId(rawOrderId)

      if (orderId === null) {
        return jsonResponse(
          {
            error: {
              code: 'INVALID_ORDER_ID',
              message: 'Geçersiz sipariş kimliği.',
            },
          },
          400,
        )
      }

      try {
        const response = await getOrder(env.DB, orderId)

        return response
          ? jsonResponse(response)
          : jsonResponse(
              {
                error: {
                  code: 'ORDER_NOT_FOUND',
                  message: 'Sipariş bulunamadı.',
                },
              },
              404,
            )
      } catch {
        return internalErrorResponse()
      }
    }

    if (request.method === 'GET' && url.pathname.startsWith('/api/customers/')) {
      const rawCustomerId = url.pathname.slice('/api/customers/'.length)

      if (rawCustomerId.includes('/')) {
        return jsonResponse(
          {
            ok: false,
            error: 'Not Found',
          },
          404,
        )
      }

      const customerId = parseCustomerId(rawCustomerId)

      if (customerId === null) {
        return jsonResponse(
          {
            error: {
              code: 'INVALID_CUSTOMER_ID',
              message: 'Geçersiz müşteri kimliği.',
            },
          },
          400,
        )
      }

      try {
        const response = await getCustomer(env.DB, customerId)

        return response
          ? jsonResponse(response)
          : jsonResponse(
              {
                error: {
                  code: 'CUSTOMER_NOT_FOUND',
                  message: 'Müşteri bulunamadı.',
                },
              },
              404,
            )
      } catch {
        return internalErrorResponse()
      }
    }

    if (request.method === 'GET' && url.pathname === '/api/stock') {
      const parsedQuery = parseStockQuery(url.searchParams)

      if (!parsedQuery.ok) {
        return jsonResponse(
          {
            error: {
              code: 'INVALID_STOCK_QUERY',
              message: 'Geçersiz stok filtreleri.',
            },
          },
          400,
        )
      }

      try {
        return jsonResponse(await listStock(env.DB, parsedQuery.query))
      } catch {
        return internalErrorResponse()
      }
    }

    if (request.method === 'POST' && url.pathname === '/api/products') {
      let body: unknown

      try {
        body = await readJsonBody(request)
      } catch {
        return invalidProductInputResponse()
      }

      const parsedInput = parseCreateProductInput(body)

      if (!parsedInput.ok) {
        return invalidProductInputResponse()
      }

      try {
        return jsonResponse(await createProduct(env.DB, parsedInput.input), 201)
      } catch (error) {
        return error instanceof ProductSkuConflictError
          ? productSkuConflictResponse()
          : internalErrorResponse()
      }
    }

    if (
      (request.method === 'GET' || request.method === 'PATCH')
      && url.pathname.startsWith('/api/products/')
    ) {
      const rawProductId = url.pathname.slice('/api/products/'.length)

      if (rawProductId.includes('/')) {
        return jsonResponse(
          {
            ok: false,
            error: 'Not Found',
          },
          404,
        )
      }

      const productId = parseProductId(rawProductId)

      if (productId === null) {
        return jsonResponse(
          {
            error: {
              code: 'INVALID_PRODUCT_ID',
              message: 'Geçersiz ürün kimliği.',
            },
          },
          400,
        )
      }

      if (request.method === 'GET') {
        try {
          const response = await getProduct(env.DB, productId)

          if (!response) {
            return jsonResponse(
              {
                error: {
                  code: 'PRODUCT_NOT_FOUND',
                  message: 'Ürün bulunamadı.',
                },
              },
              404,
            )
          }

          return jsonResponse(response)
        } catch {
          return internalErrorResponse()
        }
      }

      let body: unknown

      try {
        body = await readJsonBody(request)
      } catch {
        return invalidProductInputResponse()
      }

      const parsedInput = parseUpdateProductInput(body)

      if (!parsedInput.ok) {
        return invalidProductInputResponse()
      }

      try {
        const response = await updateProduct(env.DB, productId, parsedInput.input)

        if (!response) {
          return jsonResponse(
            {
              error: {
                code: 'PRODUCT_NOT_FOUND',
                message: 'Ürün bulunamadı.',
              },
            },
            404,
          )
        }

        return jsonResponse(response)
      } catch (error) {
        return error instanceof ProductSkuConflictError
          ? productSkuConflictResponse()
          : internalErrorResponse()
      }
    }

    if (url.pathname.startsWith('/api/stock/')) {
      const stockPath = url.pathname.slice('/api/stock/'.length)
      const segments = stockPath.split('/')

      if (
        request.method === 'GET'
        && segments.length === 2
        && segments[1] === 'movements'
      ) {
        const productId = parseProductId(segments[0] ?? '')

        if (productId === null) {
          return jsonResponse(
            {
              error: {
                code: 'INVALID_PRODUCT_ID',
                message: 'Geçersiz ürün kimliği.',
              },
            },
            400,
          )
        }

        try {
          const response = await listStockMovements(env.DB, productId)

          return response ? jsonResponse(response) : productNotFoundResponse()
        } catch {
          return internalErrorResponse()
        }
      }

      if (request.method === 'PATCH' && segments.length === 1) {
        const productId = parseProductId(segments[0] ?? '')

        if (productId === null) {
          return jsonResponse(
            {
              error: {
                code: 'INVALID_PRODUCT_ID',
                message: 'Geçersiz ürün kimliği.',
              },
            },
            400,
          )
        }

        let body: unknown

        try {
          body = await readJsonBody(request)
        } catch {
          return invalidStockInputResponse()
        }

        const parsedInput = parseUpdateStockInput(body)

        if (!parsedInput.ok) {
          return invalidStockInputResponse()
        }

        try {
          const response = await updateStock(env.DB, productId, parsedInput.input)

          return response ? jsonResponse(response) : productNotFoundResponse()
        } catch (error) {
          if (error instanceof StockConflictError) {
            return jsonResponse(
              {
                error: {
                  code: 'STOCK_CONFLICT',
                  message: 'Stok başka bir işlem tarafından değiştirildi.',
                },
              },
              409,
            )
          }

          return internalErrorResponse()
        }
      }
    }

    if (url.pathname.startsWith('/api/')) {
      return jsonResponse(
        {
          ok: false,
          error: 'Not Found',
        },
        404,
      )
    }

    return new Response('Not Found', { status: 404 })
  },
} satisfies ExportedHandler<Env>
