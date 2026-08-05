// Storage for everything edited in the page, shared across browsers.
//
// Two backends, picked the same way lib/students.ts picks one:
//
//   Supabase set   → /api/content, so an edit made on one computer is what
//                    every other visitor loads. Writing needs the admin cookie.
//   Supabase unset → localStorage, so the editing UI still works with no setup.
//                    Nothing is shared; this is the demo behaviour the site had
//                    before Supabase was configured.

import { announceAdminExpired, SESSION_EXPIRED_MESSAGE, usingSupabase } from './students'

// ------------------------------------------------------------------ documents

export async function loadContent<T>(key: string): Promise<T | null> {
  if (!usingSupabase) {
    if (typeof window === 'undefined') return null
    try {
      const raw = window.localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : null
    } catch {
      return null
    }
  }

  try {
    const res = await fetch(`/api/content?key=${encodeURIComponent(key)}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    const body = (await res.json()) as { value: T | null }
    return body.value
  } catch {
    // Offline or the API is down: fall back to the published defaults rather
    // than blanking the page.
    return null
  }
}

async function failure(res: Response, fallback: string) {
  // These writes are only ever offered to the administrator, so a refusal means
  // the session lapsed — an answer the editor can act on, unlike being told
  // they lack a permission they were just using.
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

export async function saveContent(key: string, value: unknown): Promise<void> {
  if (!usingSupabase) {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // A large upload can overflow localStorage; ignore as before.
    }
    return
  }

  const res = await fetch('/api/content', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  })
  if (!res.ok) throw await failure(res, '저장하지 못했습니다.')
}

export async function clearContent(key: string): Promise<void> {
  if (!usingSupabase) {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.removeItem(key)
    } catch {
      // ignore storage access errors
    }
    return
  }

  const res = await fetch(`/api/content?key=${encodeURIComponent(key)}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw await failure(res, '되돌리지 못했습니다.')
}

// -------------------------------------------------------------------- uploads

/**
 * Puts a picked file somewhere the other computers can read it and returns the
 * URL to store. Without Supabase it stays a data: URL, which is what the
 * gallery and slide controls used before.
 *
 * Two steps: ask the server where to put it, then put it there. The bytes go
 * from this browser straight to storage and never through the application —
 * a serverless request body is capped at 4.5MB, which a lecture PDF passes on
 * its own and a newspaper passes several times over. Relayed through a route
 * handler those uploads were refused by the platform before any of our code
 * ran, which is why they failed with nothing useful to say.
 */
export async function uploadFile(file: File): Promise<string> {
  if (!usingSupabase) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
  }

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name }),
  })
  if (!res.ok) throw await failure(res, '업로드를 준비하지 못했습니다.')
  const { uploadUrl, publicUrl } = (await res.json()) as {
    uploadUrl: string
    publicUrl: string
  }

  const put = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
  })
  if (!put.ok) {
    throw new Error(
      put.status === 413
        ? '파일이 스토리지 용량 한도를 넘습니다.'
        : `업로드에 실패했습니다. (${put.status})`,
    )
  }

  return publicUrl
}

/**
 * Drops a file this site uploaded, now that nothing points at it.
 *
 * Call it *after* the page that referenced the file has been saved without it.
 * Best effort by design: a file left in storage costs a little space, whereas
 * throwing here would report a failure for a deletion the administrator has
 * already been shown as done. Anything not in our bucket — the PDFs and
 * photographs shipped under /public — is left alone by the server.
 */
export async function deleteUpload(url: string | null | undefined): Promise<void> {
  if (!usingSupabase || !url) return
  try {
    await fetch(`/api/upload?url=${encodeURIComponent(url)}`, { method: 'DELETE' })
  } catch {
    // Offline, or the file was already gone. Neither is worth surfacing.
  }
}
