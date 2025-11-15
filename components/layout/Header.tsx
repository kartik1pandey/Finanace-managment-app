'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Header() {
  const router = useRouter()
  const [theme, setTheme] = useState('light')
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (t) setTheme(t)
    if (token) setAuthed(true)
    if (t === 'dark') document.documentElement.classList.add('dark')

    // Listen for storage changes (login/logout from other tabs or components)
    const handleStorageChange = () => {
      const currentToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      setAuthed(!!currentToken)
    }

    window.addEventListener('storage', handleStorageChange)
    // Also check periodically for same-tab changes
    const interval = setInterval(handleStorageChange, 1000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    if (next === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', next)
  }

  const handleAuthClick = () => {
    if (authed) {
      localStorage.removeItem('token')
      localStorage.removeItem('userEmail')
      localStorage.removeItem('userName')
      localStorage.removeItem('mcp_session')
      setAuthed(false)
      router.push('/login')
    } else {
      router.push('/login')
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 z-50">
      <div className="max-w-6xl mx-auto h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={() => router.push(authed ? '/dashboard' : '/login')} className="text-xl font-bold">LUMEN AI</button>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <button onClick={() => router.push('/dashboard')} className="hover:underline">Dashboard</button>
            <button onClick={() => router.push('/dashboard')} className="hover:underline">Accounts</button>
            <button onClick={() => router.push('/dashboard')} className="hover:underline">Transactions</button>
            <button onClick={() => router.push('/dashboard')} className="hover:underline">Reports</button>
            <a href="https://finbodhi.com/docs/getting-started" className="hover:underline" target="_blank">Docs</a>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button aria-label="Toggle theme" onClick={toggleTheme} className="px-3 py-2 border rounded-md">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button onClick={handleAuthClick} className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md">
            {authed ? 'Logout' : 'Login'}
          </button>
        </div>
      </div>
    </header>
  )
}