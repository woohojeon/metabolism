import { NextResponse } from 'next/server'
import { sb, supabaseReady } from '@/lib/supabase-rest'

// Keeps the Supabase project awake.
//
// A free project is paused after seven days without a request, and waking one
// is a manual trip to the dashboard — so a semester's quiet week over the
// holidays would take the roster, the boards and every saved edit offline
// until somebody noticed. vercel.json calls this once a day; the cheapest
// query that proves the database answered is enough to reset the clock.
//
// Never cached: a cached answer would keep returning while nothing reached
// Supabase at all, which is the one failure this route exists to prevent.
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Vercel signs its own cron calls when CRON_SECRET is set. Anyone else may
  // still call this — the query is a single row and tells them nothing — but
  // with the secret set only the scheduler can.
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseReady) {
    return NextResponse.json({ ok: false, reason: 'unconfigured' }, { status: 501 })
  }

  try {
    // `select=id&limit=1` over a table that always exists: one row, no columns
    // worth reading, and a round trip that counts as activity.
    await sb('students?select=id&limit=1')
    return NextResponse.json({ ok: true, at: new Date().toISOString() })
  } catch {
    // Worth a 502 rather than a silent ok: a failing keep-alive is the thing
    // that would otherwise be discovered by finding the project paused.
    return NextResponse.json({ ok: false, reason: 'unreachable' }, { status: 502 })
  }
}
