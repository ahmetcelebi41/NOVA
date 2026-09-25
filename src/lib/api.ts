type ApiErrorBody = {
  error?: {
    code?: unknown
    message?: unknown
  }
}

export class ApiError extends Error {
  code: string | null
  status: number

  constructor(status: number, code: string | null) {
    super(`API request failed with status ${status}`)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

export async function apiJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      ...(init?.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    let body: ApiErrorBody | null = null

    try {
      body = await response.json() as ApiErrorBody
    } catch {
      // Non-JSON failures are intentionally reduced to a user-safe generic error.
    }

    const code = typeof body?.error?.code === 'string' ? body.error.code : null
    throw new ApiError(response.status, code)
  }

  return response.json() as Promise<T>
}
