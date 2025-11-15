'use client';

import { Menu, X, Home, BarChart3, TrendingUp, CreditCard, MessageSquare, FileText, Calculator } from 'lucide-react';
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

export default function DashboardSidebar({ isMobileOpen, onClose }: { isMobileOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r h-full transform transition-transform duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">LUMEN</h2>
            <p className="text-sm text-gray-600">Financial Dashboard</p>
          </div>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.id; // Define isActive here
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      router.push(item.id);
                      if (typeof onClose === 'function') {
                        onClose();
                      }
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
}