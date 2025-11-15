'use client'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

interface CategoryData {
  name: string
  amount: number
  percentage: number
  trend: string
  budget: number
  status: string
}

interface ExpenseCategoriesProps {
  data: CategoryData[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ff6b6b', '#51cf66']

export default function ExpenseCategories({ data }: ExpenseCategoriesProps) {
  const totalSpending = data.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="space-y-6">
      {/* Pie Chart */}
      <div className="bg-[#1a1a1a] p-6 rounded-lg shadow-sm border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Spending Distribution</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="amount"
                nameKey="name"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Amount']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-[#1a1a1a] p-6 rounded-lg shadow-sm border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Category Analysis</h3>
        <div className="space-y-4">
          {data.map((category, index) => (
            <div key={category.name} className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-medium text-white">{category.name}</span>
                    <span className="font-semibold text-white">
                      ₹{category.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="h-2 rounded-full"
                      style={{ 
                        width: `${category.percentage}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{category.percentage}% of total</span>
                    <span className={`flex items-center ${
                      category.trend === 'up' ? 'text-red-600' :
                      category.trend === 'down' ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {category.trend === 'up' ? '↗ Increasing' :
                       category.trend === 'down' ? '↘ Decreasing' : '→ Stable'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-6 border-t">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-white">Total Spending (6 months)</span>
            <span className="font-bold text-lg text-white">
              ₹{totalSpending.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}