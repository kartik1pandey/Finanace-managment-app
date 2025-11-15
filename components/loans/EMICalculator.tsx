'use client'
import { useState, useEffect } from 'react'

interface EMIResult {
  emi: number
  total_interest: number
  total_payment: number
  principal: number
  interest_rate: number
  tenure_years: number
  tenure_months: number
}

export default function EMICalculator() {
  const [principal, setPrincipal] = useState(500000)
  const [interestRate, setInterestRate] = useState(8.5)
  const [tenureYears, setTenureYears] = useState(5)
  const [emiResult, setEmiResult] = useState<EMIResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    calculateEMI()
  }, [])

  const calculateEMI = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:8000/api/loans/calculate-emi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          principal,
          interest_rate: interestRate,
          tenure_years: tenureYears
        })
      })

      if (response.ok) {
        const result = await response.json()
        setEmiResult(result)
      }
    } catch (error) {
      console.error('Error calculating EMI:', error)
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">EMI Calculator</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan Amount (₹)
              </label>
              <input
                type="range"
                min="100000"
                max="10000000"
                step="100000"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>1L</span>
                <span className="font-semibold text-blue-600">{formatCurrency(principal)}</span>
                <span>100L</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interest Rate (% p.a.)
              </label>
              <input
                type="range"
                min="6"
                max="20"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>6%</span>
                <span className="font-semibold text-blue-600">{interestRate}%</span>
                <span>20%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan Tenure (Years)
              </label>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={tenureYears}
                onChange={(e) => setTenureYears(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>1 Year</span>
                <span className="font-semibold text-blue-600">{tenureYears} Years</span>
                <span>30 Years</span>
              </div>
            </div>

            <button
              onClick={calculateEMI}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Calculating...' : 'Calculate EMI'}
            </button>
          </div>

          {/* Results Section */}
          {emiResult && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Monthly EMI</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(emiResult.emi)}
                </p>
                <p className="text-sm text-blue-700 mt-2">
                  Payable every month for {emiResult.tenure_years} years
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-600">Total Interest</h4>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(emiResult.total_interest)}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-600">Total Payment</h4>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(emiResult.total_payment)}
                  </p>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">Interest to Principal Ratio</h4>
                <p className="text-green-700">
                  You'll pay {(emiResult.total_interest / emiResult.principal * 100).toFixed(1)}% 
                  of the principal amount as interest
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick EMI Tips */}
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Smart EMI Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">📉 Reduce Interest</h4>
              <p className="text-sm text-yellow-700">
                Even 0.5% lower interest rate can save you lakhs over the loan tenure
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">⏱️ Shorter Tenure</h4>
              <p className="text-sm text-blue-700">
                Choose shorter tenure when possible to minimize total interest paid
              </p>
            </div>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">💰 Prepayment</h4>
              <p className="text-sm text-green-700">
                Make occasional prepayments to reduce principal and save on interest
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-2">📊 EMI/Income Ratio</h4>
              <p className="text-sm text-purple-700">
                Keep your total EMI below 40% of your monthly income for financial safety
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}