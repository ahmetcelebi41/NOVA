import type { HealthResponse } from '../src/contracts/index.js'
import { listProducts } from './products.js'

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
      try {
        return jsonResponse(await listProducts(env.DB))
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
