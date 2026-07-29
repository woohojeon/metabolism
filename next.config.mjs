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
}

export default nextConfig
