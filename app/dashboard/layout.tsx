// app/dashboard/layout.tsx
'use client';

import { useState } from 'react';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import { Menu } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <DashboardSidebar isMobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 overflow-auto">
        <div className="lg:hidden p-4 bg-white border-b">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}