import { createClient } from '@supabase/supabase-js'

// Get environment variables with fallbacks for build time
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY

// Check if we're in a build environment
const isBuildTime = process.env.NODE_ENV === 'production' && !url

// Provide fallback values for build time to prevent errors
const supabaseUrl = url || 'https://placeholder.supabase.co'
const supabaseKey = key || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.M9jrxyvPLkUxWgOYSf5dNdJ8v_eRrq810ShFRT8N-6M'

// Create the client
export const supabase = createClient(supabaseUrl, supabaseKey)

// Export a function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(url && key && !isBuildTime)
}