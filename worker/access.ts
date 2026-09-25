import { createRemoteJWKSet, jwtVerify } from 'jose'

export type CloudflareAccessEnv = {
  POLICY_AUD?: string
  TEAM_DOMAIN?: string
}

const remoteJwksByUrl = new Map<string, ReturnType<typeof createRemoteJWKSet>>()

function forbidden(message: string) {
  return new Response(message, {
    status: 403,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

function accessIssuer(teamDomain: string) {
  const issuer = new URL(teamDomain)

  if (
    issuer.protocol !== 'https:'
    || issuer.username
    || issuer.password
    || issuer.search
    || issuer.hash
    || (issuer.pathname !== '/' && issuer.pathname !== '')
  ) {
    throw new Error('Invalid Cloudflare Access team domain')
  }

  return issuer.origin
}

function remoteJwks(issuer: string) {
  const certsUrl = new URL('/cdn-cgi/access/certs', issuer).href
  const cached = remoteJwksByUrl.get(certsUrl)

  if (cached) return cached

  const jwks = createRemoteJWKSet(new URL(certsUrl))
  remoteJwksByUrl.set(certsUrl, jwks)
  return jwks
}

export async function verifyCloudflareAccess(
  request: Request,
  env: CloudflareAccessEnv,
): Promise<Response | null> {
  if (!env.TEAM_DOMAIN || !env.POLICY_AUD) {
    return forbidden('Cloudflare Access is not configured.')
  }

  const token = request.headers.get('Cf-Access-Jwt-Assertion')

  if (!token) return forbidden('Missing Cloudflare Access token.')

  try {
    const issuer = accessIssuer(env.TEAM_DOMAIN)
    await jwtVerify(token, remoteJwks(issuer), {
      algorithms: ['RS256'],
      audience: env.POLICY_AUD,
      issuer,
    })

    return null
  } catch {
    return forbidden('Invalid Cloudflare Access token.')
  }
}
