'use client'
import { useState, useEffect } from 'react'

interface DebtConsolidationProps {
  data: any
}

interface ConsolidationAdvice {
  consolidation_recommended: boolean
  candidates: Array<any>
  suggested_loan: any
  potential_monthly_savings: number
  reasoning: string
}

export default function DebtConsolidation({ data }: DebtConsolidationProps) {
  const [advice, setAdvice] = useState<ConsolidationAdvice | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchConsolidationAdvice()
  }, [])

  const fetchConsolidationAdvice = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:8000/api/loans/debt-consolidation/1')
      if (response.ok) {
        const adviceData = await response.json()
        setAdvice(adviceData)
      }
    } catch (error) {
      console.error('Error fetching consolidation advice:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Debt Consolidation Analysis</h2>
        <p className="text-gray-600">
          Combine multiple high-interest debts into a single, manageable loan
        </p>
      </div>

      {/* Recommendation */}
      {advice && (
        <div className={`p-6 rounded-lg border ${
          advice.consolidation_recommended 
            ? 'bg-green-50 border-green-200' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {advice.consolidation_recommended ? '✅ Recommended' : 'ℹ️ Not Recommended'}
              </h3>
              <p className="text-gray-700">{advice.reasoning}</p>
            </div>
            {advice.consolidation_recommended && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Potential Monthly Savings</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(advice.potential_monthly_savings)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Consolidation Candidates */}
      {advice && advice.consolidation_recommended && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current High-Interest Debts */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">High-Interest Debts</h3>
            <div className="space-y-3">
              {advice.candidates.map((candidate, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{candidate.name}</p>
                    <p className="text-sm text-gray-500">Interest: {candidate.interest_rate}%</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(candidate.outstanding_amount)}
                    </p>
                    <p className="text-sm text-red-600">High Interest</p>
                  </div>
                </div>
              ))}
              
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center font-semibold">
                  <span>Total to Consolidate</span>
                  <span className="text-red-600">
                    {formatCurrency(advice.candidates.reduce((sum, c) => sum + c.outstanding_amount, 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Suggested Consolidation Loan */}
          {advice.suggested_loan && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggested Consolidation Loan</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Loan Amount</span>
                    <span className="font-semibold">{formatCurrency(advice.suggested_loan.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Interest Rate</span>
                    <span className="font-semibold text-green-600">{advice.suggested_loan.interest_rate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tenure</span>
                    <span className="font-semibold">{advice.suggested_loan.tenure_years} years</span>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">Benefits</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Single monthly payment instead of multiple</li>
                    <li>• Lower interest rate saves money</li>
                    <li>• Fixed repayment schedule</li>
                    <li>• Potentially improve credit score</li>
                  </ul>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-2">Considerations</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Check for processing fees and charges</li>
                    <li>• Ensure you qualify for the new loan</li>
                    <li>• Don't accumulate new debt after consolidation</li>
                    <li>• Read all terms and conditions carefully</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 text-xl">📊</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Compare Offers</h4>
            <p className="text-sm text-gray-600">
              Get quotes from multiple banks for the best consolidation loan
            </p>
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-green-600 text-xl">📝</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Check Eligibility</h4>
            <p className="text-sm text-gray-600">
              Ensure you meet income and credit score requirements
            </p>
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-purple-600 text-xl">💳</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Close Old Accounts</h4>
            <p className="text-sm text-gray-600">
              Pay off and close high-interest accounts after consolidation
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}