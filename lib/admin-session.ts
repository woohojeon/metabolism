// The signed-in session, as httpOnly cookies the browser cannot read.
//
// Two of them, because they answer two different questions:
//
//   vbiochem_admin   — may this browser change the site? An HMAC of the admin
//                      username, so there is nothing to forge without the key.
//   vbiochem_session — who is this browser signed in as? Carries the username,
//                      signed, so the server can attribute a board post to the
//                      person who actually wrote it. localStorage cannot do
//                      this job: the page can write whatever name it likes
//                      into it, and a Q&A that only the administrator may read
//                      is worth nothing if a student can post under someone
//                      else's name.
//
// The signing secret is the service-role key: it is server-only and already
// high-entropy, so this adds no extra environment variable to configure.

import { createHmac, timingSafeEqual } from 'node:crypto'
import { ADMIN_USERNAME } from './students'

export const ADMIN_COOKIE = 'vbiochem_admin'

/** 12 hours — long enough for a working session, short enough to expire. */
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 12

function secret() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  return key
}

export function signAdminSession() {
  return createHmac('sha256', secret()).update(ADMIN_USERNAME).digest('hex')
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

// ------------------------------------------------------------ who is signed in

export const USER_COOKIE = 'vbiochem_session'

/**
 * 30 days. Longer than the administrator's, on purpose: this cookie only says
 * who someone is, never that they may edit anything, and a student who has to
 * sign in again to read the answer to their own question will simply not read
 * it. It is renewed on every page load that asks (GET /api/login).
 */
export const USER_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

/**
 * `<username>.<expiry>.<signature>`.
 *
 * The username is base64url so that no separator can appear inside it, and the
 * expiry is inside the signed payload rather than left to the cookie's own
 * lifetime — a cookie copied out of one browser and pasted into another keeps
 * whatever expiry it was given here.
 */
export function signUserSession(username: string, now = Date.now()) {
  const payload = `${Buffer.from(username).toString('base64url')}.${
    now + USER_COOKIE_MAX_AGE * 1000
  }`
  return `${payload}.${createHmac('sha256', secret()).update(payload).digest('base64url')}`
}

/** The username this cookie vouches for, or null if it does not. */
export function readUserSession(value: string | undefined): string | null {
  if (!value) return null
  try {
    const cut = value.lastIndexOf('.')
    if (cut < 0) return null

    const payload = value.slice(0, cut)
    const given = Buffer.from(value.slice(cut + 1))
    const wanted = Buffer.from(
      createHmac('sha256', secret()).update(payload).digest('base64url'),
    )
    if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) return null

    const [name64, expiry] = payload.split('.')
    if (!name64 || !expiry) return null
    if (!(Number(expiry) > Date.now())) return null

    return Buffer.from(name64, 'base64url').toString() || null
  } catch {
    return null
  }
}
