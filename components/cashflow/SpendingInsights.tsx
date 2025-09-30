interface SpendingInsightsProps {
  data: {
    spending_insights: Array<{
      type: string
      category: string
      amount: number
      message: string
    }>
    category_analysis: Array<{
      name: string
      amount: number
      percentage: number
      trend: string
    }>
  }
}

export default function SpendingInsights({ data }: SpendingInsightsProps) {
  const { spending_insights, category_analysis } = data

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'highest_spending': return '💰'
      case 'savings_opportunity': return '💡'
      case 'positive_trend': return '📈'
      default: return 'ℹ️'
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'highest_spending': return 'border-orange-200 bg-orange-50'
      case 'savings_opportunity': return 'border-blue-200 bg-blue-50'
      case 'positive_trend': return 'border-green-200 bg-green-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className="space-y-6">
      {/* Key Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending Insights</h3>
          <div className="space-y-4">
            {spending_insights.map((insight, index) => (
              <div 
                key={index}
                className={`p-4 border-l-4 rounded-r-lg ${getInsightColor(insight.type)}`}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{getInsightIcon(insight.type)}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 capitalize">
                      {insight.type.replace('_', ' ')}
                    </h4>
                    <p className="text-sm text-gray-700 mt-1">{insight.message}</p>
                    {insight.amount && (
                      <p className="text-sm font-medium text-gray-900 mt-2">
                        Amount: ₹{insight.amount.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Trends */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Trends</h3>
          <div className="space-y-4">
            {category_analysis.map((category) => (
              <div key={category.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    category.trend === 'up' ? 'bg-red-500' :
                    category.trend === 'down' ? 'bg-green-500' : 'bg-gray-500'
                  }`}></div>
                  <span className="font-medium text-gray-900">{category.name}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    ₹{category.amount.toLocaleString()} ({category.percentage}%)
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    category.trend === 'up' ? 'bg-red-100 text-red-800' :
                    category.trend === 'down' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {category.trend === 'up' ? 'Increasing' :
                     category.trend === 'down' ? 'Decreasing' : 'Stable'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimization Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">🚗 Transport Optimization</h4>
            <p className="text-sm text-yellow-700">
              Consider carpooling or using public transport 2 days/week to save ~₹2,000 monthly
            </p>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">🍽️ Dining Strategy</h4>
            <p className="text-sm text-blue-700">
              Reduce restaurant visits by 30% and cook at home to save ~₹3,600 monthly
            </p>
          </div>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">✈️ Travel Planning</h4>
            <p className="text-sm text-green-700">
              Book flights 2-3 months in advance and travel off-season to save 20-30%
            </p>
          </div>
          
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-2">📱 Subscriptions Review</h4>
            <p className="text-sm text-purple-700">
              Audit streaming services and cancel unused subscriptions to save ~₹500 monthly
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}