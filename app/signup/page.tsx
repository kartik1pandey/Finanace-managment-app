'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { upsertUser } from '@/lib/dataStore'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Name required'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Invalid email'); return }
    if (password.length < 6) { setError('Password too short'); return }
    setLoading(true)
    try {
      // Create new user in Supabase
      await upsertUser(email, name)
      
      // Set authentication tokens
      localStorage.setItem('token', 'mock-jwt')
      localStorage.setItem('userEmail', email)
      localStorage.setItem('userName', name)
      
      // Redirect to connect accounts page
      router.push('/')
    } catch (e: unknown) {
      setError((e as Error)?.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">LUMEN AI</h1>
          <p className="text-sm text-gray-600 dark:text-slate-300">Create your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2.5 rounded-md">
            {loading ? 'Loading...' : 'Sign up'}
          </button>
          <div className="text-sm text-center"><a href="/login" className="text-blue-600">Back to Login</a></div>
        </form>
      </div>
    </div>
  )
}