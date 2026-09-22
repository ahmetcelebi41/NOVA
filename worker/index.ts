import type { HealthResponse } from '../src/contracts/index.js'
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

async function readJsonBody(request: Request): Promise<unknown> {
  return request.json()
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
