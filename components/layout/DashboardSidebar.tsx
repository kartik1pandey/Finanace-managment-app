'use client';

import { useState, useEffect } from 'react';
import { Home, BarChart3, TrendingUp, CreditCard, MessageSquare, FileText, Calculator, LogOut, User, Sparkles } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

const menuItems = [
  { id: '/dashboard', label: 'Dashboard', icon: Home },
  { id: '/dashboard/cashflow', label: 'Cash Flow', icon: BarChart3 },
  { id: '/dashboard/investments', label: 'Investments', icon: TrendingUp },
  { id: '/dashboard/loans', label: 'Loans', icon: CreditCard },
  { id: '/dashboard/receipts', label: 'Receipts', icon: FileText },
  { id: '/dashboard/tax', label: 'Tax Planning', icon: Calculator },
  { id: '/dashboard/advisor', label: 'AI Advisor', icon: MessageSquare },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Get user info from localStorage or session
    if (typeof window !== 'undefined') {
      const savedSession = localStorage.getItem('mcp_session');
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession);
          // You can customize this based on your session structure
          setUserName(parsed.userName || 'User');
          setUserEmail(parsed.userEmail || '');
        } catch (e) {
          console.error('Error parsing session:', e);
        }
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mcp_session');
    }
    router.push('/');
  };

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-72 bg-[#0a0a0a] border-r border-gray-800 shadow-2xl flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              LUMEN
            </h2>
            <p className="text-xs text-gray-400">Financial Intelligence</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => router.push(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                      : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-white'}`} />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse"></div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile & Logout Section */}
      <div className="p-4 border-t border-gray-800 bg-[#0a0a0a]">
        {/* User Info */}
        <div className="mb-3 p-3 rounded-xl bg-[#1a1a1a] border border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{userName}</p>
              {userEmail && (
                <p className="text-xs text-gray-400 truncate">{userEmail}</p>
              )}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-red-600/10 text-red-400 hover:bg-red-600/20 hover:text-red-300 transition-all duration-200 border border-red-600/20 hover:border-red-600/30 group"
        >
          <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}