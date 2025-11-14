'use client'
import { useState, useEffect } from 'react'
import LoansOverview from '@/components/loans/LoansOverview'
import LoansList from '@/components/loans/LoansList'
import EMICalculator from '@/components/loans/EMICalculator'
import PrepaymentAnalysis from '@/components/loans/PrepaymentAnalysis'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND || 'http://localhost:8000'

export default function LoansPage() {
  const [loansData, setLoansData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
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
      
      // Fetch loans summary - Note: This uses static data from backend
      // Update this endpoint if you have MCP loan data
      const loansResponse = await fetch(`${API_BASE_URL}/api/loans/summary/1`)
      if (loansResponse.ok) {
        const loansData = await loansResponse.json()
        setLoansData(loansData)
        
        if (loansData.active_loans && loansData.active_loans.length > 0) {
          setSelectedLoan(loansData.active_loans[0])
        }
      }

    } catch (error) {
      console.error('Error fetching loans data:', error)
      setError('Failed to fetch loans data')
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
          <h1 className="text-3xl font-bold text-gray-900">Loans & Debt Management</h1>
          <p className="text-gray-600">Track, manage, and optimize your loans</p>
        </div>
        <div className="text-sm text-gray-500">
          Smart debt management tools
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'myloans', 'calculator', 'prepayment'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'overview' ? 'Dashboard' : 
               tab === 'myloans' ? 'My Loans' :
               tab === 'calculator' ? 'EMI Calculator' :
               tab === 'prepayment' ? 'Prepayment' : tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'overview' && loansData && (
          <LoansOverview data={loansData} />
        )}

        {activeTab === 'myloans' && loansData && (
          <LoansList 
            data={loansData} 
            onSelectLoan={setSelectedLoan}
            selectedLoan={selectedLoan}
          />
        )}

        {activeTab === 'calculator' && (
          <EMICalculator />
        )}

        {activeTab === 'prepayment' && selectedLoan && (
          <PrepaymentAnalysis loan={selectedLoan} />
        )}
      </div>
    </div>
  )
}