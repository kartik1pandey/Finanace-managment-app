'use client'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface InvestmentData {
  total_value: number
  total_return: number
  return_percentage: number
  holdings: Array<{
    name: string
    value: number
    return: number
    color: string
  }>
}

interface InvestmentPerformanceProps {
  data: InvestmentData
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function InvestmentPerformance({ data }: InvestmentPerformanceProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Portfolio</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.holdings}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.holdings.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Value']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-600">Total Portfolio Value</h4>
            <p className="text-2xl font-bold text-gray-900">
              ₹{data.total_value.toLocaleString()}
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-600">Total Returns</h4>
            <p className={`text-xl font-semibold ${
              data.total_return >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ₹{data.total_return.toLocaleString()} ({data.return_percentage}%)
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2">Holdings</h4>
            <div className="space-y-2">
              {data.holdings.map((holding, index) => (
                <div key={holding.name} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-sm">{holding.name}</span>
                  </div>
                  <span className="text-sm font-medium">
                    ₹{holding.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}