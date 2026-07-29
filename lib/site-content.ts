// Storage for everything edited in the page, shared across browsers.
//
// Two backends, picked the same way lib/students.ts picks one:
//
//   Supabase set   → /api/content, so an edit made on one computer is what
//                    every other visitor loads. Writing needs the admin cookie.
//   Supabase unset → localStorage, so the editing UI still works with no setup.
//                    Nothing is shared; this is the demo behaviour the site had
//                    before Supabase was configured.

import { usingSupabase } from './students'

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

  const form = new FormData()
  form.append('file', file)

  const res = await fetch('/api/upload', { method: 'POST', body: form })
  if (!res.ok) throw await failure(res, '업로드에 실패했습니다.')
  return ((await res.json()) as { url: string }).url
}
