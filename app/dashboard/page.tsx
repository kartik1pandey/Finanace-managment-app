'use client'
import { useState, useEffect } from 'react'
import FinancialSummary from '@/components/dashboard/FinancialSummary'
import CashFlowChart from '@/components/dashboard/CashFlowChart'
import RecentTransactions from '@/components/dashboard/RecentTransactions'
import InvestmentPerformance from '@/components/dashboard/InvestmentPerformance'
import FinancialHealth from '@/components/dashboard/FinancialHealth'

export default function DashboardPage() {
  const [financialData, setFinancialData] = useState(null)
  const [healthData, setHealthData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Starting to fetch data...')
        
        // Test if backend is reachable
        const testResponse = await fetch('http://localhost:8000/')
        if (!testResponse.ok) {
          throw new Error('Backend server is not running')
        }
        
        // Fetch financial summary with absolute URL to avoid rewrite issues
        const financialResponse = await fetch('http://localhost:8000/api/financial/summary/1')
        console.log('Financial response status:', financialResponse.status)
        
        if (!financialResponse.ok) {
          throw new Error(`Backend returned ${financialResponse.status}: ${financialResponse.statusText}`)
        }
        
        const financialData = await financialResponse.json()
        console.log('Financial data received:', financialData)
        setFinancialData(financialData)

        // Fetch financial health
        const healthResponse = await fetch('http://localhost:8000/api/financial/health/1')
        if (healthResponse.ok) {
          const healthData = await healthResponse.json()
          setHealthData(healthData)
        }

        setError('')
      } catch (error) {
        console.error('Error details:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        <div className="text-center text-gray-600">Loading your financial data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-red-600 text-xl mb-4">❌ Failed to load financial data</div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 mb-2">Error: {error}</p>
            <p className="text-sm text-red-600">
              Make sure your backend server is running on port 8000
            </p>
          </div>
          <div className="space-y-4 text-left bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold">To fix this:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Open terminal in the <code className="bg-gray-200 px-1 rounded">backend</code> folder</li>
              <li>Run: <code className="bg-gray-200 px-1 rounded">python main.py</code></li>
              <li>Wait for "🚀 Starting ArthSahay Backend on http://localhost:8000" message</li>
              <li>Refresh this page</li>
            </ol>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {financialData?.user_profile?.name || 'User'}! 
            <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
              {financialData?.user_profile?.risk_profile || 'Moderate'} risk profile
            </span>
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleDateString('en-IN')}
        </div>
      </div>

      {/* Main Dashboard Content */}
      <FinancialSummary data={financialData.summary} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CashFlowChart data={financialData.cash_flow} />
        <InvestmentPerformance data={financialData.investments} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentTransactions transactions={financialData.recent_transactions} />
        </div>
        <div>
          {healthData && <FinancialHealth {...healthData} />}
        </div>
      </div>
    </div>
  )
}