'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface LoansOverviewProps {
  data: {
    summary: {
      total_loans: number
      total_outstanding: number
      total_credit_card_debt: number
      total_monthly_emi: number
      debt_to_income_ratio: number
      avg_interest_rate: number
      total_interest_paid: number
    }
    upcoming_payments: Array<{
      type: string
      name: string
      amount: number
      due_date: string
      days_until_due: number
      lender: string
    }>
    debt_analysis: {
      high_interest_debt: number
      high_interest_percentage: number
      recommended_strategy: string
      potential_savings: number
      risk_level: string
    }
    active_loans: Array<any>
    credit_cards: Array<any>
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function LoansOverview({ data }: LoansOverviewProps) {
  const { summary, upcoming_payments, debt_analysis, active_loans, credit_cards } = data

  // Prepare data for charts
  const loanDistribution = active_loans.map(loan => ({
    name: loan.name,
    value: loan.outstanding_amount,
    interest_rate: loan.interest_rate
  }))

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'avalanche': return 'text-purple-600 bg-purple-100'
      case 'snowball': return 'text-blue-600 bg-blue-100'
      default: return 'text-green-600 bg-green-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Outstanding</h3>
          <p className="text-2xl font-bold text-gray-900">₹{summary.total_outstanding.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">Across {summary.total_loans} loans</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Monthly EMI</h3>
          <p className="text-2xl font-bold text-blue-600">₹{summary.total_monthly_emi.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">Total monthly commitment</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Avg Interest Rate</h3>
          <p className="text-2xl font-bold text-purple-600">{summary.avg_interest_rate}%</p>
          <p className="text-sm text-gray-500 mt-1">Weighted average</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Debt-to-Income</h3>
          <p className="text-2xl font-bold text-orange-600">{summary.debt_to_income_ratio}%</p>
          <p className="text-sm text-gray-500 mt-1">Of monthly income</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loan Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={loanDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, value, interest_rate }) => 
                    `${name}: ₹${(value/100000).toFixed(1)}L (${interest_rate}%)`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {loanDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Debt Analysis */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Debt Health Analysis</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 border rounded-lg">
              <span className="font-medium text-gray-700">Risk Level</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(debt_analysis.risk_level)}`}>
                {debt_analysis.risk_level.toUpperCase()}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-4 border rounded-lg">
              <span className="font-medium text-gray-700">Recommended Strategy</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStrategyColor(debt_analysis.recommended_strategy)}`}>
                {debt_analysis.recommended_strategy.toUpperCase()}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-4 border rounded-lg">
              <span className="font-medium text-gray-700">High Interest Debt</span>
              <span className="font-semibold text-red-600">
                ₹{debt_analysis.high_interest_debt.toLocaleString()} ({debt_analysis.high_interest_percentage}%)
              </span>
            </div>
            
            <div className="flex justify-between items-center p-4 border rounded-lg">
              <span className="font-medium text-gray-700">Potential Savings</span>
              <span className="font-semibold text-green-600">
                ₹{debt_analysis.potential_savings.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Payments */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Payments</h3>
        <div className="space-y-3">
          {upcoming_payments.map((payment, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  payment.type === 'loan' ? 'bg-blue-100' : 'bg-purple-100'
                }`}>
                  <span className={`text-sm font-semibold ${
                    payment.type === 'loan' ? 'text-blue-600' : 'text-purple-600'
                  }`}>
                    {payment.type === 'loan' ? '🏠' : '💳'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{payment.name}</p>
                  <p className="text-sm text-gray-500">{payment.lender}</p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-semibold text-gray-900">₹{payment.amount.toLocaleString()}</p>
                <p className={`text-sm ${
                  payment.days_until_due <= 3 ? 'text-red-600' : 
                  payment.days_until_due <= 7 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  Due in {payment.days_until_due} days
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(payment.due_date).toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}