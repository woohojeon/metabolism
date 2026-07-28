/** @type {import('next').NextConfig} */
const nextConfig = {
  // No `output: 'export'` — the .pptx → PDF conversion needs a server route to
  // hold the CloudConvert API key (see app/api/convert-slides/route.ts).
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
