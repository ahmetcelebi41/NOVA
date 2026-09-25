export type BasicAuthEnv = {
  BASIC_AUTH_PASSWORD?: string
  BASIC_AUTH_USERNAME?: string
}

const encoder = new TextEncoder()

function unauthorized() {
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'WWW-Authenticate': 'Basic realm="NOVA"',
    },
  })
}

async function secureEqual(actual: string, expected: string) {
  const [actualHash, expectedHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(actual)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ])
  const actualBytes = new Uint8Array(actualHash)
  const expectedBytes = new Uint8Array(expectedHash)
  let difference = 0

  for (let index = 0; index < actualBytes.length; index += 1) {
    difference |= actualBytes[index] ^ expectedBytes[index]
  }

  return difference === 0
}

function parseCredentials(authorization: string | null) {
  if (!authorization) return null

  const [scheme, encoded, extra] = authorization.trim().split(/\s+/)

  if (scheme?.toLowerCase() !== 'basic' || !encoded || extra) return null

  try {
    const decoded = atob(encoded)
    const separatorIndex = decoded.indexOf(':')

    if (separatorIndex < 0) return null

    return {
      password: decoded.slice(separatorIndex + 1),
      username: decoded.slice(0, separatorIndex),
    }
  } catch {
    return null
  }
}

export async function verifyBasicAuth(
  request: Request,
  env: BasicAuthEnv,
): Promise<Response | null> {
  if (!env.BASIC_AUTH_USERNAME || !env.BASIC_AUTH_PASSWORD) return unauthorized()

  const credentials = parseCredentials(request.headers.get('Authorization'))

  if (!credentials) return unauthorized()

  const [usernameMatches, passwordMatches] = await Promise.all([
    secureEqual(credentials.username, env.BASIC_AUTH_USERNAME),
    secureEqual(credentials.password, env.BASIC_AUTH_PASSWORD),
  ])

  return usernameMatches && passwordMatches ? null : unauthorized()
}
