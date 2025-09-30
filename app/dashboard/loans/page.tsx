'use client'
import { useState, useEffect } from 'react'
import LoansOverview from '@/components/loans/LoansOverview'
import LoansList from '@/components/loans/LoansList'
import EMICalculator from '@/components/loans/EMICalculator'
import PrepaymentAnalysis from '@/components/loans/PrepaymentAnalysis'
import DebtConsolidation from '@/components/loans/DebtConsolidation'
import RepaymentStrategy from '@/components/loans/RepaymentStrategy'

export default function LoansPage() {
  const [loansData, setLoansData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedLoan, setSelectedLoan] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch loans summary
        const loansResponse = await fetch('http://localhost:8000/api/loans/summary/1')
        if (loansResponse.ok) {
          const loansData = await loansResponse.json()
          setLoansData(loansData)
          
          // Set first loan as selected by default
          if (loansData.active_loans && loansData.active_loans.length > 0) {
            setSelectedLoan(loansData.active_loans[0])
          }
        }

      } catch (error) {
        console.error('Error fetching loans data:', error)
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
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
          {['overview', 'myloans', 'calculator', 'prepayment', 'consolidation', 'strategy'].map((tab) => (
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
               tab === 'prepayment' ? 'Prepayment' :
               tab === 'consolidation' ? 'Consolidation' :
               tab === 'strategy' ? 'Strategy' : tab}
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

        {activeTab === 'consolidation' && loansData && (
          <DebtConsolidation data={loansData} />
        )}

        {activeTab === 'strategy' && loansData && (
          <RepaymentStrategy data={loansData} />
        )}
      </div>
    </div>
  )
}