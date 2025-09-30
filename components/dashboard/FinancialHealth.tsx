interface FinancialHealthProps {
  score: number
  level: string
  breakdown: {
    savings_rate: number
    net_worth: number
    investment_diversity: number
    monthly_trend: string
  }
  recommendations: string[]
}

export default function FinancialHealth({ score, level, breakdown, recommendations }: FinancialHealthProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'
  }

  const getTrendColor = (trend: string) => {
    return trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Health Score</h3>
      
      <div className="flex items-center space-x-6 mb-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-gray-200 flex items-center justify-center">
            <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
              {score}
            </span>
          </div>
          <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full ${getScoreBgColor(score)} border-2 border-white`}></div>
        </div>
        
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 text-lg">Level: {level}</h4>
          <p className="text-sm text-gray-600 mt-2">
            {score >= 80 
              ? "Excellent! Your finances are in great shape." 
              : score >= 60 
              ? "Good! There's room for improvement." 
              : "Let's work on improving your financial health."}
          </p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">Savings Rate</div>
          <div className="font-semibold text-green-600">{breakdown.savings_rate}%</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">Net Worth</div>
          <div className="font-semibold text-blue-600">₹{(breakdown.net_worth / 100000).toFixed(1)}L</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">Diversity</div>
          <div className="font-semibold text-purple-600">{breakdown.investment_diversity} assets</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">Trend</div>
          <div className={`font-semibold ${getTrendColor(breakdown.monthly_trend)}`}>
            {getTrendIcon(breakdown.monthly_trend)}
          </div>
        </div>
      </div>

      {recommendations.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Recommendations</h4>
          <ul className="space-y-2">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">•</span>
                <span className="text-sm text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}