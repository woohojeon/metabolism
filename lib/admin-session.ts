// The administrator session, as an httpOnly cookie the browser cannot read.
//
// The cookie value is an HMAC of the admin username. The signing secret is the
// service-role key: it is server-only and already high-entropy, so this adds no
// extra environment variable to configure. A forged cookie cannot be produced
// without that key, and JavaScript on the page cannot read or copy a real one.

import { createHmac, timingSafeEqual } from 'node:crypto'
import { ADMIN_USERNAME } from './students'

export const ADMIN_COOKIE = 'vbiochem_admin'

/** 12 hours — long enough for a working session, short enough to expire. */
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 12

export function signAdminSession() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  return createHmac('sha256', secret).update(ADMIN_USERNAME).digest('hex')
}

export function isAdminSession(value: string | undefined) {
  if (!value) return false
  try {
    const a = Buffer.from(value)
    const b = Buffer.from(signAdminSession())
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}
