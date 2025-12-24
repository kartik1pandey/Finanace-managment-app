// Environment variable validation and defaults
export const getEnvVar = (name: string, defaultValue?: string): string => {
  const value = process.env[name]
  
  if (!value && !defaultValue) {
    console.warn(`Environment variable ${name} is not set`)
    return ''
  }
  
  return value || defaultValue || ''
}

export const isProduction = process.env.NODE_ENV === 'production'
export const isDevelopment = process.env.NODE_ENV === 'development'

// Supabase configuration
export const supabaseConfig = {
  url: getEnvVar('NEXT_PUBLIC_SUPABASE_URL', 'https://placeholder.supabase.co'),
  anonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'placeholder-key'),
}

// API configuration
export const apiConfig = {
  backend: getEnvVar('NEXT_PUBLIC_BACKEND', 'http://localhost:8000'),
  mcpServer: getEnvVar('NEXT_PUBLIC_MCP_SERVER', 'http://localhost:5001'),
}

// Check if environment is properly configured
export const isConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}