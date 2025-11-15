'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface BudgetAnalysisProps {
  data: {
    category_analysis: Array<{
      name: string
      amount: number
      budget: number
      status: string
    }>
    budget_summary: {
      total_budget: number
      actual_spending: number
      remaining_budget: number
      budget_utilization: number
      over_budget_categories: string[]
    }
  }
}

export default function BudgetAnalysis({ data }: BudgetAnalysisProps) {
  const { category_analysis, budget_summary } = data

  const budgetData = category_analysis.map(category => ({
    name: category.name,
    budget: category.budget,
    actual: category.amount,
    difference: category.amount - category.budget,
    status: category.status
  }))

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'over_budget': return '#ef4444'
      case 'within_budget': return '#10b981'
      default: return '#6b7280'
    }
  }

  return (
    <div className="space-y-6">
      {/* Budget Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#1a1a1a] p-6 rounded-lg shadow-sm border border-gray-800">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Total Budget</h3>
          <p className="text-2xl font-bold text-blue-400">₹{budget_summary.total_budget.toLocaleString()}</p>
          <p className="text-sm text-gray-500">6 months</p>
        </div>
        
        <div className="bg-[#1a1a1a] p-6 rounded-lg shadow-sm border border-gray-800">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Actual Spending</h3>
          <p className="text-2xl font-bold text-purple-400">₹{budget_summary.actual_spending.toLocaleString()}</p>
          <p className="text-sm text-gray-500">6 months</p>
        </div>
        
        <div className="bg-[#1a1a1a] p-6 rounded-lg shadow-sm border border-gray-800">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Remaining Budget</h3>
          <p className={`text-2xl font-bold ${
            budget_summary.remaining_budget >= 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            ₹{Math.abs(budget_summary.remaining_budget).toLocaleString()}
            {budget_summary.remaining_budget < 0 && ' Over'}
          </p>
          <p className="text-sm text-gray-500">Balance</p>
        </div>
        
        <div className="bg-[#1a1a1a] p-6 rounded-lg shadow-sm border border-gray-800">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Budget Utilization</h3>
          <p className={`text-2xl font-bold ${
            budget_summary.budget_utilization <= 100 ? 'text-green-500' : 'text-red-500'
          }`}>
            {budget_summary.budget_utilization}%
          </p>
          <p className="text-sm text-gray-500">Of total budget</p>
        </div>
      </div>

      {/* Budget vs Actual Chart */}
      <div className="bg-[#1a1a1a] p-6 rounded-lg shadow-sm border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Budget vs Actual Spending</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={budgetData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  `₹${Number(value).toLocaleString()}`,
                  name === 'budget' ? 'Budget' : 'Actual Spending'
                ]}
              />
              <Bar dataKey="budget" fill="#3b82f6" name="Budget" radius={[2, 2, 0, 0]} />
              <Bar dataKey="actual" fill="#ef4444" name="Actual Spending" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Budget Status by Category */}
      <div className="bg-[#1a1a1a] p-6 rounded-lg shadow-sm border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Budget Status by Category</h3>
        <div className="space-y-4">
          {category_analysis.map((category, index) => (
            <div key={category.name} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: getStatusColor(category.status) }}
                ></div>
                <span className="font-medium text-gray-900">{category.name}</span>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <div className="text-sm text-gray-600">Budget</div>
                  <div className="font-semibold">₹{category.budget.toLocaleString()}</div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-600">Actual</div>
                  <div className={`font-semibold ${
                    category.amount > category.budget ? 'text-red-600' : 'text-green-600'
                  }`}>
                    ₹{category.amount.toLocaleString()}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-600">Difference</div>
                  <div className={`font-semibold ${
                    category.amount > category.budget ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {category.amount > category.budget ? '+' : ''}
                    ₹{Math.abs(category.amount - category.budget).toLocaleString()}
                  </div>
                </div>
                
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  category.status === 'over_budget' 
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {category.status === 'over_budget' ? 'Over Budget' : 'Within Budget'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}