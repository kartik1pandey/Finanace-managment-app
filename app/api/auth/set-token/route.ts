import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { token, refresh_token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const cookieStore = await cookies()
    
    // Set httpOnly cookies for security
    cookieStore.set('supabase-access-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    })

    if (refresh_token) {
      cookieStore.set('supabase-refresh-token', refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error setting token:', error)
    return NextResponse.json({ error: 'Failed to set token' }, { status: 500 })
  }
}