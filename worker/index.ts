export default {
  async fetch(request): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'GET' && url.pathname === '/api/health') {
      return new Response(
        JSON.stringify({
          ok: true,
          service: 'nova-api',
        }),
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
