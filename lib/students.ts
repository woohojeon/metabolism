// The roster of accounts that may sign in, plus the client-side calls the
// admin page uses to manage it.
//
// Two backends, picked by whether Supabase is configured:
//
//   Supabase set   → every read/write goes through /api/login and
//                    /api/students, which hold the service-role key. Student
//                    passwords never reach a non-admin browser.
//   Supabase unset → a seeded roster in localStorage, so the admin page can be
//                    demonstrated with no setup. Nothing is shared between
//                    browsers; see supabase/schema.sql to switch it on.

export type Student = {
  id: string
  name: string
  username: string
  password: string
}

/** Only this username can open /admin. */
export const ADMIN_USERNAME = 'jbnu'

/** Inlined at build time, so this is also true in the browser. */
export const usingSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)

// ---------------------------------------------------------------- local demo

// Versioned: the seed below is only written when the key is missing, so a
// browser that stored an earlier roster would otherwise keep serving it no
// matter how SEED changes. Bump the suffix whenever SEED does.
const LOCAL_KEY = 'vbiochem-students:v2'

// The administrator plus one example student, so the page has something to
// show before any account has been created.
const SEED: Student[] = [
  { id: 'a0', name: 'Jaewon Seol', username: ADMIN_USERNAME, password: '1234' },
  { id: 'a1', name: '전우호', username: 'vet2601', password: 'metab-2601' },
]

function readLocal(): Student[] {
  if (typeof window === 'undefined') return SEED
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY)
    if (raw) return JSON.parse(raw) as Student[]
  } catch {
    // fall through to the seed
  }
  writeLocal(SEED)
  return SEED
}

function writeLocal(rows: Student[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(rows))
  } catch {
    // ignore storage access errors
  }
}

// ------------------------------------------------------------------- session

/**
 * Fired when the server turns down a write because the administrator's session
 * has lapsed. The provider listens and drops the stored sign-in, so the page
 * stops offering controls that no longer work.
 */
export const ADMIN_EXPIRED_EVENT = 'vbiochem:admin-expired'

export function announceAdminExpired() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(ADMIN_EXPIRED_EVENT))
  }
}

/**
 * Whether the server still recognises this browser as the administrator.
 *
 * A dropped connection answers yes: the stored sign-in is worth keeping
 * through a blip, and the next write will say so plainly if it is not.
 */
export async function adminSessionAlive(): Promise<boolean> {
  if (!usingSupabase) return true
  try {
    const res = await fetch('/api/login', { cache: 'no-store' })
    if (!res.ok) return false
    return ((await res.json()) as { isAdmin?: boolean }).isAdmin === true
  } catch {
    return true
  }
}

/** The message to show when a request was refused for want of a live session. */
export const SESSION_EXPIRED_MESSAGE =
  '로그인이 만료되었습니다. 다시 로그인한 뒤 저장해 주세요.'

// ------------------------------------------------------------------ requests

async function fail(res: Response, fallback: string) {
  // Only the administrator is ever shown the controls behind these calls, so a
  // refusal here means the session lapsed rather than that the wrong person
  // asked.
  if (res.status === 403) {
    announceAdminExpired()
    return new Error(SESSION_EXPIRED_MESSAGE)
  }
  try {
    const body = await res.json()
    return new Error(typeof body?.error === 'string' ? body.error : fallback)
  } catch {
    return new Error(fallback)
  }
}

export type LoginResult = { ok: boolean; isAdmin: boolean }

export async function verifyLogin(
  username: string,
  password: string,
): Promise<LoginResult> {
  const id = username.trim()

  if (!usingSupabase) {
    const row = readLocal().find((s) => s.username === id)
    const ok = Boolean(row && row.password === password)
    return { ok, isAdmin: ok && id === ADMIN_USERNAME }
  }

  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: id, password }),
  })
  if (res.status === 401) return { ok: false, isAdmin: false }
  if (!res.ok) throw await fail(res, '로그인 처리 중 오류가 발생했습니다.')
  return (await res.json()) as LoginResult
}

export async function endSession() {
  if (!usingSupabase) return
  try {
    await fetch('/api/logout', { method: 'POST' })
  } catch {
    // the client-side state is cleared regardless
  }
}

export async function listStudents(): Promise<Student[]> {
  if (!usingSupabase) return readLocal()

  const res = await fetch('/api/students', { cache: 'no-store' })
  if (!res.ok) throw await fail(res, '명단을 불러오지 못했습니다.')
  return (await res.json()) as Student[]
}

export async function createStudent(
  input: Omit<Student, 'id'>,
): Promise<Student> {
  if (!usingSupabase) {
    const rows = readLocal()
    if (rows.some((s) => s.username === input.username)) {
      throw new Error('이미 사용 중인 아이디입니다.')
    }
    const row = { ...input, id: `local-${Date.now()}` }
    writeLocal([...rows, row])
    return row
  }

  const res = await fetch('/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw await fail(res, '계정을 추가하지 못했습니다.')
  return (await res.json()) as Student
}

export async function updateStudent(
  id: string,
  patch: Partial<Omit<Student, 'id'>>,
): Promise<void> {
  if (!usingSupabase) {
    const rows = readLocal()
    if (
      patch.username &&
      rows.some((s) => s.username === patch.username && s.id !== id)
    ) {
      throw new Error('이미 사용 중인 아이디입니다.')
    }
    writeLocal(rows.map((s) => (s.id === id ? { ...s, ...patch } : s)))
    return
  }

  const res = await fetch('/api/students', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...patch }),
  })
  if (!res.ok) throw await fail(res, '수정 내용을 저장하지 못했습니다.')
}

export async function deleteStudent(id: string): Promise<void> {
  if (!usingSupabase) {
    writeLocal(readLocal().filter((s) => s.id !== id))
    return
  }

  const res = await fetch(`/api/students?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw await fail(res, '계정을 삭제하지 못했습니다.')
}
