'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface Holding {
  name: string
  value: number
  return: number
}

interface PortfolioAllocationProps {
  holdings: Holding[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d']

export default function PortfolioAllocation({ holdings }: PortfolioAllocationProps) {
  // Calculate total portfolio value
  const totalValue = holdings.reduce((sum, holding) => sum + holding.value, 0)

  // Prepare data for the chart, adding percentage for each holding
  const chartData = holdings.map(holding => ({
    ...holding,
    percentage: (holding.value / totalValue) * 100
  }))

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Allocation</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Value']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Holdings Breakdown</h4>
          <div className="space-y-3">
            {chartData.map((holding, index) => (
              <div key={holding.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-sm font-medium text-gray-700">{holding.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    ₹{holding.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{holding.percentage.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900">Total Portfolio</span>
              <span className="font-bold text-lg text-gray-900">
                ₹{totalValue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}