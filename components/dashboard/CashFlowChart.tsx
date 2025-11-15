'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface CashFlowData {
  monthly_data: Array<{
    month: string
    income: number
    expenses: number
    savings: number
  }>
}

interface CashFlowChartProps {
  data: CashFlowData
}

export default function CashFlowChart({ data }: CashFlowChartProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow Trend</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.monthly_data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip 
              formatter={(value) => [`₹${Number(value).toLocaleString()}`, '']}
              labelFormatter={(label) => `Month: ${label}`}
            />
            <Line 
              type="monotone" 
              dataKey="income" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Income"
            />
            <Line 
              type="monotone" 
              dataKey="expenses" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="Expenses"
            />
            <Line 
              type="monotone" 
              dataKey="savings" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Savings"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}