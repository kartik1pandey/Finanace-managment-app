'use client'
import { useState, useEffect } from 'react'

interface RepaymentStrategyProps {
  data: any
}

interface StrategyAdvice {
  recommended_strategy: string
  reasoning: string
  steps: string[]
}

export default function RepaymentStrategy({ data }: RepaymentStrategyProps) {
  const [strategy, setStrategy] = useState<StrategyAdvice | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchRepaymentStrategy()
  }, [])

  const fetchRepaymentStrategy = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:8000/api/loans/repayment-strategy/1')
      if (response.ok) {
        const strategyData = await response.json()
        setStrategy(strategyData)
      }
    } catch (error) {
      console.error('Error fetching repayment strategy:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStrategyDetails = (strategyName: string) => {
    switch (strategyName) {
      case 'avalanche':
        return {
          name: 'Avalanche Method',
          description: 'Pay off debts with the highest interest rates first',
          icon: '🏔️',
          color: 'text-red-600 bg-red-100',
          pros: [
            'Saves the most money on interest',
            'Mathematically optimal',
            'Fastest way to become debt-free'
          ],
          cons: [
            'May take longer to see first debt paid off',
            'Requires discipline',
            'Less psychological motivation initially'
          ]
        }
      case 'snowball':
        return {
          name: 'Snowball Method', 
          description: 'Pay off smallest debts first regardless of interest rate',
          icon: '⛄',
          color: 'text-blue-600 bg-blue-100',
          pros: [
            'Quick wins build motivation',
            'Simplifies number of payments faster',
            'Psychological benefits from early success'
          ],
          cons: [
            'May pay more interest overall',
            'Not mathematically optimal',
            'Takes longer for large high-interest debts'
          ]
        }
      default:
        return {
          name: 'Balanced Approach',
          description: 'Mix of avalanche and snowball methods',
          icon: '⚖️',
          color: 'text-green-600 bg-green-100',
          pros: [
            'Balances mathematical efficiency and motivation',
            'Flexible approach',
            'Good for mixed debt portfolios'
          ],
          cons: [
            'Not as optimal as pure avalanche',
            'Requires careful planning',
            'May lack clear focus'
          ]
        }
    }
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const strategyDetails = strategy ? getStrategyDetails(strategy.recommended_strategy) : null

  return (
    <div className="space-y-6">
      {/* Recommended Strategy */}
      {strategy && strategyDetails && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Recommended Repayment Strategy</h2>
              <p className="text-gray-600 mt-1">{strategy.reasoning}</p>
            </div>
            <div className={`px-4 py-2 rounded-full text-lg font-semibold ${strategyDetails.color}`}>
              {strategyDetails.icon} {strategyDetails.name}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Strategy Steps */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Implementation Steps</h3>
              <div className="space-y-3">
                {strategy.steps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-gray-700">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Strategy Analysis */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategy Analysis</h3>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">✅ Advantages</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    {strategyDetails.pros.map((pro, index) => (
                      <li key={index}>• {pro}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-2">⚠️ Considerations</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {strategyDetails.cons.map((con, index) => (
                      <li key={index}>• {con}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debt Payoff Plan */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Customized Payoff Plan</h3>
        <div className="space-y-4">
          {data.active_loans
            .sort((a, b) => {
              if (strategy?.recommended_strategy === 'avalanche') {
                return b.interest_rate - a.interest_rate
              } else if (strategy?.recommended_strategy === 'snowball') {
                return a.outstanding_amount - b.outstanding_amount
              }
              return a.outstanding_amount - b.outstanding_amount
            })
            .map((loan, index) => (
              <div key={loan.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{loan.name}</p>
                    <p className="text-sm text-gray-500">{loan.lender} • {loan.interest_rate}%</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ₹{loan.outstanding_amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {loan.remaining_emis} months remaining
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Additional Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Acceleration Strategies</h3>
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-1">💰 Round Up Payments</h4>
              <p className="text-sm text-yellow-700">
                Round up your EMI to the nearest thousand for faster payoff
              </p>
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-1">🎯 Use Windfalls</h4>
              <p className="text-sm text-blue-700">
                Apply bonuses, tax refunds, or gifts toward debt reduction
              </p>
            </div>
            
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-1">📈 Increase Income</h4>
              <p className="text-sm text-green-700">
                Consider side income specifically for debt repayment
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mindset & Motivation</h3>
          <div className="space-y-3">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-1">📊 Track Progress</h4>
              <p className="text-sm text-purple-700">
                Use visual tools to see your debt decreasing each month
              </p>
            </div>
            
            <div className="p-3 bg-pink-50 border border-pink-200 rounded-lg">
              <h4 className="font-semibold text-pink-800 mb-1">🎉 Celebrate Milestones</h4>
              <p className="text-sm text-pink-700">
                Reward yourself when you pay off each debt (with small, free rewards)
              </p>
            </div>
            
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
              <h4 className="font-semibold text-indigo-800 mb-1">🤝 Stay Accountable</h4>
              <p className="text-sm text-indigo-700">
                Share your progress with a trusted friend or family member
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}