'use client'

interface WatchlistProps {
  data: {
    watchlist: Array<{
      symbol: string
      name: string
      current_price: number
      change_percent: number
    }>
  }
  onSelectStock: (symbol: string) => void
}

export default function Watchlist({ data, onSelectStock }: WatchlistProps) {
  const { watchlist } = data

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900">My Watchlist</h3>
        <p className="text-sm text-gray-600">Track your favorite stocks</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Change
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {watchlist.map((stock) => (
              <tr key={stock.symbol} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{stock.name}</div>
                    <div className="text-sm text-gray-500">{stock.symbol}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₹{stock.current_price.toLocaleString()}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                  stock.change_percent >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onSelectStock(stock.symbol)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Analyze
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}