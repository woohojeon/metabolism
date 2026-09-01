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

/** The Storage bucket created by supabase/schema.sql. */
const BUCKET = 'uploads'

/**
 * Mints a one-off URL the browser can upload a single file to, and the public
 * URL that file will then be served from.
 *
 * The bytes deliberately do not pass through this application. A serverless
 * request body is capped — 4.5MB on the platform this deploys to — and a
 * lecture PDF is past that on its own, a newspaper several times over, so a
 * file relayed through a route handler is rejected before any of our code
 * runs. Signing hands the browser a short-lived, single-path token and lets it
 * talk to storage directly; the service key never leaves the server.
 *
 * Service-role only, so callers must check the caller is an admin.
 */
export async function sbSignedUpload(
  path: string,
): Promise<{ uploadUrl: string; publicUrl: string }> {
  if (!supabaseReady) throw new Error('Supabase is not configured')

  const res = await fetch(`${URL_BASE}/storage/v1/object/upload/sign/${BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY!,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  })

  if (!res.ok) {
    throw new Error(`Supabase storage ${res.status}: ${(await res.text()).slice(0, 200)}`)
  }

  // `url` comes back relative to /storage/v1 and carries the token.
  const { url } = (await res.json()) as { url: string }
  return {
    uploadUrl: `${URL_BASE}/storage/v1${url}`,
    publicUrl: `${URL_BASE}/storage/v1/object/public/${BUCKET}/${path}`,
  }
}

/** The public URL an uploaded file is served from, once it is in the bucket. */
export const PUBLIC_PREFIX = `/storage/v1/object/public/${BUCKET}/`

/** Where one named file in the uploads bucket is read from. */
export function publicObjectUrl(path: string): string {
  return `${URL_BASE}${PUBLIC_PREFIX}${path}`
}

/**
 * The name a public URL refers to inside the uploads bucket, or null if the URL
 * is not one this application put there.
 *
 * Everything a caller hands in is treated as untrusted. A path under /public —
 * the shipped newspaper, the category photographs — belongs to the deployment
 * and has to survive a delete, which here only ever means "nothing points at
 * this any more".
 */
export function storagePathOf(url: string): string | null {
  if (!supabaseReady) return null

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  if (parsed.origin !== new URL(URL_BASE!).origin) return null
  if (!parsed.pathname.startsWith(PUBLIC_PREFIX)) return null

  const path = decodeURIComponent(parsed.pathname.slice(PUBLIC_PREFIX.length))
  // Uploads are a single flat name. A separator or a dot-segment would mean
  // the URL was built by someone else.
  if (!path || path.includes('/') || path.includes('..')) return null
  return path
}

/** Removes one file from the uploads bucket. Service-role only. */
export async function sbDelete(path: string): Promise<void> {
  if (!supabaseReady) throw new Error('Supabase is not configured')

  const res = await fetch(`${URL_BASE}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'DELETE',
    headers: { apikey: SERVICE_KEY!, Authorization: `Bearer ${SERVICE_KEY}` },
  })

  if (!res.ok) {
    throw new Error(`Supabase storage ${res.status}: ${(await res.text()).slice(0, 200)}`)
  }
}
