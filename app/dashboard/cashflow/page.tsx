'use client'
import { useState, useEffect } from 'react'
import CashFlowOverview from '@/components/cashflow/CashFlowOverview'
import ExpenseCategories from '@/components/cashflow/ExpenseCategories'
import BudgetAnalysis from '@/components/cashflow/BudgetAnalysis'
import TransactionHistory from '@/components/cashflow/TransactionHistory'
import SpendingInsights from '@/components/cashflow/SpendingInsights'
import CashFlowPredictions from '@/components/cashflow/CashFlowPredictions'

export default function CashFlowPage() {
  const [analysisData, setAnalysisData] = useState(null)
  const [transactionsData, setTransactionsData] = useState(null)
  const [predictionsData, setPredictionsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch cash flow analysis
        const analysisResponse = await fetch('http://localhost:8000/api/cashflow/analysis/1')
        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json()
          setAnalysisData(analysisData)
        }

        // Fetch transactions
        const transactionsResponse = await fetch('http://localhost:8000/api/cashflow/transactions/1')
        if (transactionsResponse.ok) {
          const transactionsData = await transactionsResponse.json()
          setTransactionsData(transactionsData)
        }

        // Fetch predictions
        const predictionsResponse = await fetch('http://localhost:8000/api/cashflow/predictions/1')
        if (predictionsResponse.ok) {
          const predictionsData = await predictionsResponse.json()
          setPredictionsData(predictionsData)
        }

      } catch (error) {
        console.error('Error fetching cash flow data:', error)
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

        {activeTab === 'transactions' && transactionsData && (
          <TransactionHistory data={transactionsData} />
        )}

        {activeTab === 'insights' && analysisData && (
          <SpendingInsights data={analysisData} />
        )}

        {activeTab === 'predictions' && predictionsData && (
          <CashFlowPredictions data={predictionsData} />
        )}
      </div>
    </div>
  )
}