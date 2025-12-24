import { createClient } from '@supabase/supabase-js'
import { supabaseConfig, isConfigured } from './env'

// Create the client with configuration from env utility
export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey)

// Export a function to check if Supabase is properly configured
export const isSupabaseConfigured = isConfigured