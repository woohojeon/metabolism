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
 * and a header is obeyed whatever the origin. Files shipped under /public are
 * same-origin, so the attribute already works for them and they are left as
 * they are.
 *
 * Kept free of imports so it can be exercised on its own.
 */
export function downloadUrl(url: string, filename: string): string {
  // Relative — a path under /public, served from this site.
  if (!/^https?:\/\//i.test(url)) return url

  try {
    const parsed = new URL(url)
    if (!parsed.pathname.includes('/storage/v1/object/public/')) return url
    parsed.searchParams.set('download', filename)
    return parsed.toString()
  } catch {
    return url
  }
}
