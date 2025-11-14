'use client'
import { useState, useEffect } from 'react'
import CashFlowOverview from '@/components/cashflow/CashFlowOverview'
import ExpenseCategories from '@/components/cashflow/ExpenseCategories'
import BudgetAnalysis from '@/components/cashflow/BudgetAnalysis'
import TransactionHistory from '@/components/cashflow/TransactionHistory'
import SpendingInsights from '@/components/cashflow/SpendingInsights'
import CashFlowPredictions from '@/components/cashflow/CashFlowPredictions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND || 'http://localhost:8000'

export default function CashFlowPage() {
  const [analysisData, setAnalysisData] = useState(null)
  const [transactionsData, setTransactionsData] = useState(null)
  const [predictionsData, setPredictionsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get session from localStorage
    if (typeof window !== 'undefined') {
      const savedSession = localStorage.getItem('mcp_session')
      if (savedSession) {
        const parsed = JSON.parse(savedSession)
        if (parsed.sessionId && parsed.isLoggedIn) {
          setSessionId(parsed.sessionId)
          fetchData(parsed.sessionId)
        } else {
          setError('Please connect your financial accounts from the dashboard')
          setLoading(false)
        }
      } else {
        setError('No session found. Please connect your accounts from the dashboard')
        setLoading(false)
      }
    }
  }, [])

  const fetchData = async (sid: string) => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch cash flow analysis from financial summary
      const analysisResponse = await fetch(`${API_BASE_URL}/api/financial/summary/1?session_id=${sid}`)
      if (analysisResponse.ok) {
        const data = await analysisResponse.json()
        // Transform data for CashFlowOverview component
        const transformedData = {
          summary: data.summary,
          cash_flow: data.cash_flow,
          category_analysis: data.cash_flow?.categories || [],
          monthly_data: data.cash_flow?.monthly_data || []
        }
        setAnalysisData(transformedData)
      }

      // Note: Transaction history and predictions are using static data from backend
      // If you have MCP endpoints for these, update the URLs accordingly

    } catch (error) {
      console.error('Error fetching cash flow data:', error)
      setError('Failed to fetch cash flow data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cash Flow Analysis</h1>
          <p className="text-gray-600">Track your income, expenses, and savings patterns</p>
        </div>
        <div className="text-sm text-gray-500">
          Last 6 months analysis
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'categories', 'budget', 'transactions', 'insights', 'predictions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'overview' ? 'Overview' : 
               tab === 'categories' ? 'Categories' :
               tab === 'budget' ? 'Budget' :
               tab === 'transactions' ? 'Transactions' :
               tab === 'insights' ? 'Insights' : 'Predictions'}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'overview' && analysisData && (
          <CashFlowOverview data={analysisData} />
        )}

        {activeTab === 'categories' && analysisData && (
          <div className="space-y-6">
            <ExpenseCategories data={analysisData.category_analysis} />
          </div>
        )}

        {activeTab === 'budget' && analysisData && (
          <BudgetAnalysis data={analysisData} />
        )}

        {activeTab === 'transactions' && (
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <p className="text-gray-600">Transaction history coming soon with real MCP data</p>
          </div>
        )}

        {activeTab === 'insights' && analysisData && (
          <SpendingInsights data={analysisData} />
        )}

        {activeTab === 'predictions' && (
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <p className="text-gray-600">Cash flow predictions coming soon</p>
          </div>
        )}
      </div>
    </div>
  )
}