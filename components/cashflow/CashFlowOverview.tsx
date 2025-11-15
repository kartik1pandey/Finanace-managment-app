'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

interface CashFlowOverviewProps {
  data: {
    overview: {
      total_income: number
      total_expenses: number
      total_savings: number
      average_monthly_savings: number
      savings_rate: number
    }
    monthly_trends: Array<{
      month: string
      income: number
      expenses: number
      savings: number
      savings_rate: number
    }>
  }
}

export default function CashFlowOverview({ data }: CashFlowOverviewProps) {
  const { overview, monthly_trends } = data

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Income</h3>
          <p className="text-2xl font-bold text-green-600">₹{overview.total_income.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Last 6 months</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Expenses</h3>
          <p className="text-2xl font-bold text-red-600">₹{overview.total_expenses.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Last 6 months</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Savings</h3>
          <p className="text-2xl font-bold text-blue-600">₹{overview.total_savings.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Last 6 months</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Savings Rate</h3>
          <p className="text-2xl font-bold text-purple-600">{overview.savings_rate}%</p>
          <p className="text-sm text-gray-500">Average monthly</p>
        </div>
      </div>

      {/* Cash Flow Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly_trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, '']} />
                <Area type="monotone" dataKey="income" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Income" />
                <Area type="monotone" dataKey="expenses" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Expenses" />
                <Area type="monotone" dataKey="savings" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Savings" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Savings Rate Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly_trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}%`, 'Savings Rate']} />
                <Line 
                  type="monotone" 
                  dataKey="savings_rate" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  name="Savings Rate"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Best month: <span className="font-semibold">Dec 2024 (36.7%)</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}