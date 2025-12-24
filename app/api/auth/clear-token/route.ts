import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = await cookies()
    
    // Clear auth cookies
    cookieStore.delete('supabase-access-token')
    cookieStore.delete('supabase-refresh-token')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing token:', error)
    return NextResponse.json({ error: 'Failed to clear token' }, { status: 500 })
  }
}