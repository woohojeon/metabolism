/** @type {import('next').NextConfig} */
const nextConfig = {
  // No `output: 'export'` — /api/content and /api/upload need a server to hold
  // the Supabase service-role key.
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // The second address every PDF under /public/downloads answers on, and the
  // only difference between the two: this one says "save me".
  //
  // A file the CDN serves carries no Content-Disposition, so 내려받기 had
  // nothing but the anchor's `download` attribute to lean on — and a phone's
  // browser ignores that attribute outright. 내려받기 became a second 열기, on
  // mobile only, because a desktop honours the attribute.
  //
  // The attachment header alone did not settle it: Safari on iOS reads
  // `Content-Type: application/pdf`, decides it has a reader for that, and
  // opens the file anyway. So the type is answered as octet-stream here —
  // there is no viewer for a stream of bytes, which leaves saving as the only
  // thing a browser can do with it. 열기 keeps the real type, since that link
  // wants exactly the reader this one is avoiding.
  //
  // A rewrite rather than a route that streams the bytes: the newspaper is
  // 15MB, well past what a serverless function may return, and this way the
  // CDN goes on serving the file untouched. The header is matched against the
  // address that was asked for, so /downloads/… keeps opening inline and
  // /download/… saves.
  // `:path*` rather than `:file`: a single segment does not match a name with
  // a dot in it, and every file here has one.
  async rewrites() {
    return [{ source: '/download/:path*', destination: '/downloads/:path*' }]
  },
  async headers() {
    return [
      {
        source: '/download/:path*',
        headers: [
          { key: 'Content-Disposition', value: 'attachment; filename=":path*"' },
          { key: 'Content-Type', value: 'application/octet-stream' },
        ],
      },
    ]
  },
}

export default nextConfig
