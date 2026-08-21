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
 * Fired when the server turns down a request because the session behind it has
 * lapsed — the administrator's, or a student's. The provider listens and drops
 * the stored sign-in, so the page stops offering controls that no longer work
 * and the header stops claiming someone is signed in when nobody is.
 */
export const SESSION_EXPIRED_EVENT = 'vbiochem:session-expired'

export function announceSessionExpired() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
  }
}

/**
 * Who the server still takes this browser to be, and whether it may edit.
 *
 * `null` means the question could not be put — offline, or the API is down.
 * That is not the same as "nobody": the stored sign-in is worth keeping through
 * a blip, and the next write will say so plainly if the session really is gone.
 */
export async function sessionState(): Promise<{
  user: string | null
  isAdmin: boolean
} | null> {
  if (!usingSupabase) return null
  try {
    const res = await fetch('/api/login', { cache: 'no-store' })
    if (!res.ok) return { user: null, isAdmin: false }
    const body = (await res.json()) as { isAdmin?: boolean; user?: string | null }
    return { user: body.user ?? null, isAdmin: body.isAdmin === true }
  } catch {
    return null
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
    announceSessionExpired()
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

/** What a roster import did, so the page can report it rather than guess. */
export type BulkResult = {
  /** Accounts written by this import. */
  added: number
  /** Usernames that were already on the roster and were left as they were. */
  skipped: string[]
}

/**
 * Adds a whole roster at once.
 *
 * Existing usernames are skipped rather than treated as an error: uploading a
 * revised class list is the normal way this is used, and only the students who
 * joined since the last upload should be created.
 */
export async function createStudents(
  input: Omit<Student, 'id'>[],
): Promise<BulkResult> {
  if (!usingSupabase) {
    const rows = readLocal()
    const taken = new Set(rows.map((s) => s.username))
    const skipped: string[] = []
    const fresh: Student[] = []

    input.forEach((row, i) => {
      if (row.username === ADMIN_USERNAME || taken.has(row.username)) {
        skipped.push(row.username)
        return
      }
      taken.add(row.username)
      fresh.push({ ...row, id: `local-${Date.now()}-${i}` })
    })

    writeLocal([...rows, ...fresh])
    return { added: fresh.length, skipped }
  }

  const res = await fetch('/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ students: input }),
  })
  if (!res.ok) throw await fail(res, '명단을 등록하지 못했습니다.')

  const body = (await res.json()) as { added: Student[]; skipped: string[] }
  return { added: body.added.length, skipped: body.skipped }
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

/** What a multi-row delete actually removed. */
export type DeleteResult = {
  deleted: number
  /** True when the administrator was in the selection and was left in place. */
  keptAdmin: boolean
}

/**
 * Removes several accounts in one request.
 *
 * The administrator is skipped rather than refused, so selecting every row and
 * deleting clears the class without locking anyone out of this page.
 */
export async function deleteStudents(ids: string[]): Promise<DeleteResult> {
  if (ids.length === 0) return { deleted: 0, keptAdmin: false }

  if (!usingSupabase) {
    const rows = readLocal()
    const doomed = new Set(ids)
    const keptAdmin = rows.some(
      (s) => doomed.has(s.id) && s.username === ADMIN_USERNAME,
    )
    const left = rows.filter(
      (s) => !doomed.has(s.id) || s.username === ADMIN_USERNAME,
    )
    writeLocal(left)
    return { deleted: rows.length - left.length, keptAdmin }
  }

  const res = await fetch(`/api/students?ids=${encodeURIComponent(ids.join(','))}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw await fail(res, '선택한 계정을 삭제하지 못했습니다.')

  const body = (await res.json()) as { deleted?: number; keptAdmin?: boolean }
  return { deleted: body.deleted ?? 0, keptAdmin: body.keptAdmin === true }
}
