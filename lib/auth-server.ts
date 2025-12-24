// Server-side auth utilities
import { supabase } from './supabase'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

export interface AuthUser {
  id: string
  email: string
  user_metadata?: any
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      console.error('Token verification failed:', error)
      return null
    }

    return {
      id: user.id,
      email: user.email!,
      user_metadata: user.user_metadata,
    }
  } catch (error) {
    console.error('Error verifying token:', error)
    return null
  }
}

export async function getAuthUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  // Try to get token from Authorization header first
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    return await verifyToken(token)
  }

  // Fallback to cookies
  const cookieStore = await cookies()
  const token = cookieStore.get('supabase-access-token')?.value
  
  if (!token) {
    return null
  }

  return await verifyToken(token)
}

export async function getAuthUserFromCookies(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('supabase-access-token')?.value
  
  if (!token) {
    return null
  }

  return await verifyToken(token)
}