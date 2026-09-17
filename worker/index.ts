import type { HealthResponse } from '../src/contracts/index.js'

export default {
  async fetch(request): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'GET' && url.pathname === '/api/health') {
      const response: HealthResponse = {
        ok: true,
        service: 'nova-api',
      }

      return new Response(
        JSON.stringify(response),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    if (url.pathname.startsWith('/api/')) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Not Found',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    return new Response('Not Found', { status: 404 })
  },
} satisfies ExportedHandler
