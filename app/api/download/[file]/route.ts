import { NextResponse } from 'next/server'
import { publicObjectUrl, supabaseReady } from '@/lib/supabase-rest'

/**
 * Hands one uploaded file over as a download.
 *
 * Storage can already be asked for an attachment header — `?download=` does
 * it, whatever the origin — and on a desktop that is enough. Safari on iOS
 * reads `Content-Type: application/pdf` alongside it, decides it has a reader
 * for that, and opens the file anyway: 내려받기 was a second 열기 on a phone.
 * What settles it is answering as octet-stream, since there is no viewer for a
 * stream of bytes, and storage serves each file under the type it was uploaded
 * with — the same object the 열기 link wants opened. So the bytes come back
 * through here instead, wearing a different type on the way out.
 *
 * The file is streamed rather than read into memory: a serverless response is
 * capped, and the largest slide deck is 15MB. Uploads are named by a UUID and
 * never rewritten, so the answer is cached for a year — the CDN serves every
 * request after the first and the bytes cross this function once per file.
 */

/** A name the uploads bucket could have produced: one flat, unslashed file. */
const OBJECT_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/

/** Line ends and separators, which a filename must not carry into a header. */
const HEADER_HOSTILE = /[\/\r\n"]/g

export async function GET(
  request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  if (!supabaseReady) return new NextResponse(null, { status: 404 })

  const { file } = await params
  // Not a name this application minted — and with no separator in it, nothing
  // outside the uploads bucket can be reached by asking.
  if (!OBJECT_NAME.test(file) || file.includes('..')) {
    return new NextResponse(null, { status: 404 })
  }

  const upstream = await fetch(publicObjectUrl(file), { cache: 'no-store' })
  if (!upstream.ok || !upstream.body) {
    // Storage answers a missing object with 400, not 404, so anything it
    // refuses is reported here as the file simply not being there. A 5xx is
    // storage itself being down, which is not the caller's mistake.
    return new NextResponse(null, { status: upstream.status >= 500 ? 502 : 404 })
  }

  // The name to save under. Given twice: `filename*` carries 한글 intact, and
  // the plain `filename` is what a reader that ignores the encoded form falls
  // back to. The object's own name is the last resort.
  const asked = new URL(request.url).searchParams.get('name')
  const name = (asked ?? file).replace(HEADER_HOSTILE, '_').slice(0, 200) || file
  const ascii = name.replace(/[^\x20-\x7E]/g, '_')

  const headers = new Headers({
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`,
    'Cache-Control': 'public, max-age=31536000, immutable',
  })
  const length = upstream.headers.get('content-length')
  if (length) headers.set('Content-Length', length)

  return new NextResponse(upstream.body, { headers })
}
