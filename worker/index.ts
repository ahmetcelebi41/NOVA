import type { HealthResponse } from '../src/contracts/index.js'
import {
  getProduct,
  listProducts,
  parseProductId,
  parseProductsQuery,
} from './products.js'

type Env = {
  DB: D1Database
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

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'GET' && url.pathname === '/api/health') {
      const response: HealthResponse = {
        ok: true,
        service: 'nova-api',
      }

      return jsonResponse(response)
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
        return jsonResponse(
          {
            ok: false,
            error: 'Internal Server Error',
          },
          500,
        )
      }
    }

    if (request.method === 'GET' && url.pathname.startsWith('/api/products/')) {
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
        return jsonResponse(
          {
            ok: false,
            error: 'Internal Server Error',
          },
          500,
        )
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
