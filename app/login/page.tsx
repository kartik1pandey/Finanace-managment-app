'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { upsertUser, loadRawMCPData } from '@/lib/dataStore'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) router.push('/dashboard')
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Invalid email'); return }
    if (password.length < 6) { setError('Password too short'); return }
    setLoading(true)
    try {
      localStorage.setItem('token', 'mock-jwt')
      localStorage.setItem('userEmail', email)
      
      // Check if user exists, if not create
      await upsertUser(email)
      
      // Check if user has existing financial data in mcp_data table
      const mcpData = await loadRawMCPData(email)
      
      // If data exists, go to dashboard; otherwise go to connect accounts page
      if (mcpData) {
        router.push('/dashboard')
      } else {
        router.push('/')
      }
    } catch (e: unknown) {
      setError((e as Error)?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl p-8 relative">
        <div className="absolute top-4 right-4"></div>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">LUMEN AI</h1>
          <p className="text-sm text-gray-600 dark:text-slate-300">Welcome Back</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input aria-label="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input aria-label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center justify-between">
            <a href="/password-reset" className="text-blue-600">Forgot Password?</a>
            <a href="/signup" className="text-sm">Sign up</a>
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2.5 rounded-md">
            {loading ? 'Loading...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}