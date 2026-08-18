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
