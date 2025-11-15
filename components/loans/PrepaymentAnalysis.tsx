'use client'
import { useState, useEffect } from 'react'

interface PrepaymentAnalysisProps {
  loan: any
}

interface PrepaymentResult {
  prepayment_amount: number
  interest_savings: number
  time_savings_months: number
  new_tenure_months: number
  current_tenure_months: number
  percentage_savings: number
}

export default function PrepaymentAnalysis({ loan }: PrepaymentAnalysisProps) {
  const [prepaymentAmount, setPrepaymentAmount] = useState(50000)
  const [prepaymentResult, setPrepaymentResult] = useState<PrepaymentResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [amortizationData, setAmortizationData] = useState<any[]>([])

  useEffect(() => {
    if (loan) {
      calculatePrepaymentSavings()
      fetchAmortizationSchedule()
    }
  }, [loan])

  const calculatePrepaymentSavings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:8000/api/loans/prepayment/1/${loan.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prepayment_amount: prepaymentAmount
        })
      })

      if (response.ok) {
        const result = await response.json()
        setPrepaymentResult(result)
      }
    } catch (error) {
      console.error('Error calculating prepayment savings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAmortizationSchedule = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/loans/amortization/1/${loan.id}`)
      if (response.ok) {
        const data = await response.json()
        setAmortizationData(data)
      }
    } catch (error) {
      console.error('Error fetching amortization schedule:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatMonths = (months: number) => {
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    return `${years} years ${remainingMonths} months`
  }

  return (
    <div className="space-y-6">
      {/* Loan Details */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Loan</p>
            <p className="font-semibold">{loan.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Outstanding</p>
            <p className="font-semibold">{formatCurrency(loan.outstanding_amount)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Interest Rate</p>
            <p className="font-semibold">{loan.interest_rate}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Tenure Left</p>
            <p className="font-semibold">{formatMonths(loan.remaining_emis)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prepayment Calculator */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Prepayment Calculator</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prepayment Amount (₹)
              </label>
              <input
                type="range"
                min="10000"
                max={Math.min(loan.outstanding_amount * 0.5, 1000000)}
                step="10000"
                value={prepaymentAmount}
                onChange={(e) => setPrepaymentAmount(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>10K</span>
                <span className="font-semibold text-blue-600">{formatCurrency(prepaymentAmount)}</span>
                <span>10L</span>
              </div>
            </div>

            <button
              onClick={calculatePrepaymentSavings}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Calculating...' : 'Calculate Savings'}
            </button>
          </div>

          {/* Prepayment Results */}
          {prepaymentResult && !prepaymentResult.error && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">💰 Interest Savings</h4>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(prepaymentResult.interest_savings)}
                </p>
                <p className="text-sm text-green-700">
                  {prepaymentResult.percentage_savings}% of remaining interest
                </p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">⏱️ Time Savings</h4>
                <p className="text-xl font-bold text-blue-600">
                  {formatMonths(prepaymentResult.time_savings_months)}
                </p>
                <p className="text-sm text-blue-700">
                  Loan closes {prepaymentResult.time_savings_months} months early
                </p>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-2">📅 New Tenure</h4>
                <p className="text-lg font-bold text-purple-600">
                  {formatMonths(prepaymentResult.new_tenure_months)}
                </p>
                <p className="text-sm text-purple-700">
                  Instead of {formatMonths(prepaymentResult.current_tenure_months)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Amortization Schedule Preview */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Amortization Schedule (First 12 Months)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Month</th>
                  <th className="text-right py-2">Principal</th>
                  <th className="text-right py-2">Interest</th>
                  <th className="text-right py-2">Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {amortizationData.slice(0, 12).map((schedule) => (
                  <tr key={schedule.month} className="border-b">
                    <td className="py-2">{schedule.month}</td>
                    <td className="text-right py-2">{formatCurrency(schedule.principal)}</td>
                    <td className="text-right py-2">{formatCurrency(schedule.interest)}</td>
                    <td className="text-right py-2">{formatCurrency(schedule.outstanding_principal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Prepayment Strategy Tips */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Prepayment Strategy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">🎯 When to Prepay</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Early in loan tenure for maximum savings</li>
              <li>• When you have surplus funds</li>
              <li>• Before interest rate hikes</li>
            </ul>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">💰 How Much to Prepay</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Start with 5-10% of outstanding amount</li>
              <li>• Consider tax implications for home loans</li>
              <li>• Maintain emergency fund first</li>
            </ul>
          </div>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">📈 Best Candidates</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• High interest personal loans</li>
              <li>• Credit card debts</li>
              <li>• Loans with no prepayment penalty</li>
            </ul>
          </div>
          
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-medium text-purple-800 mb-2">⚡ Quick Wins</h4>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• Use bonuses for lump-sum prepayment</li>
              <li>• Round up EMI payments</li>
              <li>• Make one extra EMI per year</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}