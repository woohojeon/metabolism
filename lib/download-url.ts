/**
 * The address that makes a stored file save rather than open.
 *
 * Nothing about the file changes here — only which of its two addresses the
 * 내려받기 link points at. Both an upload and a file shipped under /public
 * have one address that opens and one that saves, and this picks the second.
 *
 * Why an address at all, rather than the anchor's `download` attribute: the
 * attribute is honoured only for files from the page's own origin — otherwise
 * any site could drop a file from anywhere onto a visitor's disk under a name
 * of its choosing — and a phone's browser ignores it even then. A header is
 * what a phone listens to, and only a URL can carry one.
 *
 *   an upload   → /api/download/…, which re-answers storage's bytes as
 *                 octet-stream. Storage's own `?download=` sets the attachment
 *                 header but serves the file under the type it was uploaded
 *                 with, and Safari on iOS opens a PDF on the strength of that
 *                 type however firmly it has been told to save.
 *   /downloads/ → /download/…, the same file with the same two headers
 *                 attached by the CDN. See next.config.mjs.
 *
 * Kept free of imports so it can be exercised on its own.
 */
export function downloadUrl(url: string, filename: string): string {
  // Relative — a path under /public, served from this site.
  if (!/^https?:\/\//i.test(url)) {
    return url.startsWith('/downloads/') ? `/download/${url.slice('/downloads/'.length)}` : url
  }

  try {
    const parsed = new URL(url)
    const at = parsed.pathname.indexOf('/storage/v1/object/public/')
    if (at === -1) return url

    // The bucket and the name within it; only a flat name is one this site
    // uploaded, and only those are worth routing.
    const rest = parsed.pathname.slice(at + '/storage/v1/object/public/'.length)
    const name = decodeURIComponent(rest.slice(rest.indexOf('/') + 1))
    if (!name || name.includes('/')) return url

    return `/api/download/${encodeURIComponent(name)}?name=${encodeURIComponent(filename)}`
  } catch {
    return url
  }
}
