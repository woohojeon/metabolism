// Server-side read of the shared site-content documents.
//
// The client reads these through /api/content (lib/site-content.ts); a server
// component can go straight to Supabase with the service key instead. Doing so
// lets a page render already holding whatever the administrator last saved, so
// an edited hero or newspaper title never flashes its published default before
// the client swaps the saved copy in.
//
// Server-only: this imports the service-role Supabase client and must never be
// pulled into a client component.

import { sb, supabaseReady } from '@/lib/supabase-rest'

type Row<T> = { value: T | null }

export async function loadContentServer<T>(key: string): Promise<T | null> {
  // Not configured (local/demo): the client falls back to localStorage, so
  // there is nothing to read here. The page renders its published defaults.
  if (!supabaseReady) return null
  try {
    const rows = (await sb(
      `site_content?key=eq.${encodeURIComponent(key)}&select=value&limit=1`,
    )) as Row<T>[]
    return rows?.[0]?.value ?? null
  } catch {
    // Offline or the database is down: fall back to the published defaults
    // rather than failing the whole page.
    return null
  }
}

// A cacheable read of one site-content document, for pages that want to stay on
// the CDN (ISR) rather than render on every request.
//
// `sb()` above is deliberately no-store — it is shared with the students table
// and with writes, which must never be cached — and a no-store fetch inside a
// page forces that page to render dynamically. This reads `site_content` alone
// (public article edits, shown to everyone) with a revalidate window instead,
// so the page it feeds can be prerendered and refreshed every `revalidate`
// seconds. An edit therefore appears to other visitors within that window, not
// instantly; the editing administrator still sees it at once from local state.
export async function loadContentCached<T>(
  key: string,
  revalidate: number,
): Promise<T | null> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!base || !serviceKey) return null
  try {
    const res = await fetch(
      `${base}/rest/v1/site_content?key=eq.${encodeURIComponent(key)}&select=value&limit=1`,
      {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        next: { revalidate },
      },
    )
    if (!res.ok) return null
    const rows = (await res.json()) as Row<T>[]
    return rows?.[0]?.value ?? null
  } catch {
    return null
  }
}
