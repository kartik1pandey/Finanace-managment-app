'use client'

interface MarketOverviewProps {
  data: {
    market_indices: Array<{
      symbol: string
      name: string
      current: number
      change: number
      change_percent: number
    }>
    market_sentiment: string
    updated_at: string
  }
}

export default function MarketOverview({ data }: MarketOverviewProps) {
  const { market_indices, market_sentiment, updated_at } = data

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Bullish': return 'text-green-600 bg-green-100'
      case 'Bearish': return 'text-red-600 bg-red-100'
      default: return 'text-yellow-600 bg-yellow-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Market Sentiment */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Market Overview</h3>
            <p className="text-sm text-gray-600">Indian stock market performance</p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(market_sentiment)}`}>
              {market_sentiment} Market
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Updated: {new Date(updated_at).toLocaleTimeString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Market Indices */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {market_indices.map((index) => (
          <div key={index.symbol} className="bg-white p-6 rounded-lg shadow-sm border">
            <h4 className="text-sm font-medium text-gray-600 mb-2">{index.name}</h4>
            <p className="text-2xl font-bold text-gray-900">{index.current.toLocaleString()}</p>
            <div className={`flex items-center mt-2 ${index.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <span className="font-semibold">
                {index.change >= 0 ? '+' : ''}{index.change} ({index.change_percent}%)
              </span>
              <span className="ml-2">{index.change >= 0 ? '↗' : '↘'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Market Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Market Movers</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <span className="font-medium text-gray-700">Reliance Industries</span>
              <span className="text-green-600 font-semibold">+2.3%</span>
            </div>
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <span className="font-medium text-gray-700">Infosys</span>
              <span className="text-red-600 font-semibold">-1.2%</span>
            </div>
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <span className="font-medium text-gray-700">HDFC Bank</span>
              <span className="text-green-600 font-semibold">+1.8%</span>
            </div>
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <span className="font-medium text-gray-700">TCS</span>
              <span className="text-red-600 font-semibold">-0.7%</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Strategy</h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">📈 Bullish Signals</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Banking sector showing strength</li>
                <li>• FII turning net buyers</li>
                <li>• Strong quarterly results</li>
              </ul>
            </div>
            
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2">📉 Caution Areas</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• IT sector facing headwinds</li>
                <li>• Global market volatility</li>
                <li>• Currency fluctuations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}