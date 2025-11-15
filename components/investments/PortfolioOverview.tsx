'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

interface PortfolioOverviewProps {
  data: {
    total_value: number
    total_investment: number
    total_return: number
    total_return_percent: number
    daily_change: number
    daily_change_percent: number
  }
}

// Mock historical data for portfolio growth
const historicalData = [
  { month: 'Jul', value: 850000 },
  { month: 'Aug', value: 870000 },
  { month: 'Sep', value: 890000 },
  { month: 'Oct', value: 920000 },
  { month: 'Nov', value: 940000 },
  { month: 'Dec', value: 980000 },
  { month: 'Jan', value: 1020000 }
]

export default function PortfolioOverview({ data }: PortfolioOverviewProps) {
  const {
    total_value,
    total_investment,
    total_return,
    total_return_percent,
    daily_change,
    daily_change_percent
  } = data

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#1a1a1a] p-6 rounded-lg shadow-sm border border-gray-800">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Portfolio Value</h3>
          <p className="text-2xl font-bold text-white">₹{total_value.toLocaleString()}</p>
          <div className={`flex items-center mt-1 ${daily_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <span className="text-sm font-medium">
              {daily_change >= 0 ? '+' : ''}₹{Math.abs(daily_change).toLocaleString()} ({daily_change_percent}%)
            </span>
            <span className="ml-1">{daily_change >= 0 ? '↗' : '↘'}</span>
          </div>
        </div>
        
        <div className="bg-[#1a1a1a] p-6 rounded-lg shadow-sm border border-gray-800">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Total Investment</h3>
          <p className="text-2xl font-bold text-blue-400">₹{total_investment.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">Principal amount</p>
        </div>
        
        <div className="bg-[#1a1a1a] p-6 rounded-lg shadow-sm border border-gray-800">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Total Returns</h3>
          <p className={`text-2xl font-bold ${total_return >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            ₹{Math.abs(total_return).toLocaleString()}
          </p>
          <p className={`text-sm ${total_return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {total_return >= 0 ? '+' : ''}{total_return_percent}%
          </p>
        </div>
        
        <div className="bg-[#1a1a1a] p-6 rounded-lg shadow-sm border border-gray-800">
          <h3 className="text-sm font-medium text-gray-400 mb-2">CAGR</h3>
          <p className="text-2xl font-bold text-purple-400">14.2%</p>
          <p className="text-sm text-gray-500 mt-1">Annualized return</p>
        </div>
      </div>

      {/* Portfolio Growth Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1a1a1a] p-6 rounded-lg shadow-sm border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">Portfolio Growth</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Portfolio Value']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.3}
                  name="Portfolio Value"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#1a1a1a] p-6 rounded-lg shadow-sm border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">Performance Insights</h3>
          <div className="space-y-4">
            <div className="p-4 bg-green-950/30 border border-green-800 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium text-green-400">Best Performer</span>
                <span className="font-bold text-green-500">+28.5%</span>
              </div>
              <p className="text-sm text-green-600 mt-1">RELIANCE.NS</p>
            </div>
            
            <div className="p-4 bg-red-950/30 border border-red-800 rounded-lg">lg">
              <div className="flex items-center justify-between">
                <span className="font-medium text-red-400">Underperformer</span>
                <span className="font-bold text-red-500">-5.2%</span>
              </div>
              <p className="text-sm text-red-600 mt-1">TCS.NS</p>
            </div>
            
            <div className="p-4 bg-blue-950/30 border border-blue-800 rounded-lg">lg">
              <div className="flex items-center justify-between">
                <span className="font-medium text-blue-400">Risk Level</span>
                <span className="font-bold text-blue-500">Moderate</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">Well-diversified portfolio</p>
            </div>
            
            <div className="p-4 bg-purple-950/30 border border-purple-800 rounded-lg">lg">
              <div className="flex items-center justify-between">
                <span className="font-medium text-purple-400">Market Beat</span>
                <span className="font-bold text-purple-500">+4.7%</span>
              </div>
              <p className="text-sm text-purple-600 mt-1">Outperforming Nifty 50</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}