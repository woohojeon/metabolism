/**
 * The address that makes a stored file save rather than open.
 *
 * An anchor's `download` attribute is honoured only for files from the page's
 * own origin — otherwise any site could drop a file from anywhere onto a
 * visitor's disk under a name of its choosing. Uploads are served from
 * storage's own host, so for those the attribute is ignored and the browser
 * simply navigates: 내려받기 becomes a second 열기.
 *
 * Storage takes a `download` parameter that sets the attachment header itself,
 * and a header is obeyed whatever the origin.
 *
 * Same-origin files under /public need the header too, even though the
 * attribute already covers them on a desktop: the in-app browser a phone opens
 * a shared link in ignores the attribute, and a header is the only thing left
 * that it listens to. /download/ is where those files answer with one attached
 * — see the rewrite in next.config.mjs.
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
    if (!parsed.pathname.includes('/storage/v1/object/public/')) return url
    parsed.searchParams.set('download', filename)
    return parsed.toString()
  } catch {
    return url
  }
}
