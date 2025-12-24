import { useState, useEffect, createContext, useContext } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  token: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function useAuthProvider() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Skip auth setup if Supabase is not properly configured (build time)
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setToken(session?.access_token ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event)
        setSession(session)
        setUser(session?.user ?? null)
        setToken(session?.access_token ?? null)
        setLoading(false)

        // Store token securely in httpOnly cookie via API call
        if (session?.access_token) {
          try {
            await fetch('/api/auth/set-token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                token: session.access_token,
                refresh_token: session.refresh_token,
              }),
            })
          } catch (error) {
            console.error('Failed to set secure token:', error)
          }
        } else {
          // Clear token on logout
          try {
            await fetch('/api/auth/clear-token', {
              method: 'POST',
            })
          } catch (error) {
            console.error('Failed to clear token:', error)
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    
    // Ensure user exists in our database
    if (data.user) {
      try {
        const { upsertUser } = await import('@/lib/dataStore')
        await upsertUser(data.user.email!, data.user.user_metadata?.name)
      } catch (dbError) {
        console.error('Failed to upsert user:', dbError)
      }
    }
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) throw error
    
    // Create user in our database
    if (data.user) {
      try {
        const { upsertUser } = await import('@/lib/dataStore')
        await upsertUser(data.user.email!, data.user.user_metadata?.name)
      } catch (dbError) {
        console.error('Failed to create user:', dbError)
      }
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const refreshToken = async () => {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) throw error
    
    if (data.session) {
      setSession(data.session)
      setUser(data.session.user)
      setToken(data.session.access_token)
    }
  }

  return {
    user,
    session,
    loading,
    token,
    signIn,
    signUp,
    signOut,
    refreshToken,
  }
}