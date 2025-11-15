import DashboardSidebar from '@/components/layout/DashboardSidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <DashboardSidebar />
      <main className="flex-1 overflow-auto ml-72">
        {children}
      </main>
    </div>
  )
}