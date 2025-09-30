'use client'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface AssetAllocationProps {
  data: Array<{
    asset_class: string
    value: number
    percentage: number
  }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function AssetAllocation({ data }: AssetAllocationProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Allocation</h3>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ asset_class, percentage }) => `${asset_class}: ${percentage}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              nameKey="asset_class"
            >
              {data.map((entry, index) => (
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
      
      <div className="mt-4 space-y-2">
        {data.map((asset, index) => (
          <div key={asset.asset_class} className="flex justify-between items-center">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              ></div>
              <span className="text-sm text-gray-700">{asset.asset_class}</span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-gray-900">{asset.percentage}%</span>
              <span className="text-xs text-gray-500 ml-2">₹{asset.value.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}