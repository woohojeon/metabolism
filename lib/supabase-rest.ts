// Server-only access to Supabase over its REST (PostgREST) interface.
//
// Deliberately not the supabase-js SDK: the routes here only need four simple
// table calls, and plain fetch keeps the dependency list — and the deploy
// bundle — unchanged.

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseReady = Boolean(URL_BASE && SERVICE_KEY)

/**
 * Calls the Supabase REST API with the service-role key, which bypasses row
 * level security. Never expose the result of this to a non-admin caller: the
 * students table holds cleartext passwords.
 */
export async function sb(
  path: string,
  init: RequestInit & { body?: string } = {},
): Promise<unknown> {
  if (!supabaseReady) throw new Error('Supabase is not configured')

  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      apikey: SERVICE_KEY!,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      // Ask PostgREST to echo the affected rows back so callers can return them.
      Prefer: 'return=representation',
      ...init.headers,
    },
  })

  const text = await res.text()
  if (!res.ok) {
    // PostgREST reports a unique-constraint violation as code 23505.
    if (text.includes('23505')) throw new DuplicateUsernameError()
    throw new Error(`Supabase ${res.status}: ${text.slice(0, 200)}`)
  }

  return text ? JSON.parse(text) : null
}

export class DuplicateUsernameError extends Error {
  constructor() {
    super('이미 사용 중인 아이디입니다.')
  }
}
