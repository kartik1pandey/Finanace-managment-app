/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // Ensure environment variables are available at build time
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_BACKEND: process.env.NEXT_PUBLIC_BACKEND,
    NEXT_PUBLIC_MCP_SERVER: process.env.NEXT_PUBLIC_MCP_SERVER,
  },
  // Disable static optimization for pages that use Supabase
  experimental: {
    // This helps with build-time environment variable issues
    esmExternals: 'loose',
  },
  // Handle build-time errors more gracefully
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
}

module.exports = nextConfig