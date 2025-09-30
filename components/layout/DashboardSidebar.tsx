'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/dashboard/cashflow', label: 'Cash Flow', icon: '💰' },
  { href: '/dashboard/investments', label: 'Investments', icon: '📈' },
  { href: '/dashboard/loans', label: 'Loans', icon: '🏠' },
  { href: '/dashboard/advisor', label: 'AI Advisor', icon: '🤖' },
]

export default function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-white shadow-sm border-r h-full">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-gray-800">ArthSahay</h2>
        <p className="text-sm text-gray-600">Financial Dashboard</p>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}