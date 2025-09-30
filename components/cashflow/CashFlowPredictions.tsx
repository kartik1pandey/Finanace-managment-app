'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

interface CashFlowPredictionsProps {
  data: {
    predictions: Array<{
      month: string
      predicted_income: number
      predicted_expenses: number
      predicted_savings: number
      confidence: number
      factors: string[]
    }>
    recommendations: string[]
  }
}

export default function CashFlowPredictions({ data }: CashFlowPredictionsProps) {
  const { predictions, recommendations } = data

  return (
    <div className="space-y-6">
      {/* Prediction Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {predictions.map((prediction, index) => (
          <div key={prediction.month} className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{prediction.month}</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Predicted Income</span>
                <span className="font-semibold text-green-600">
                  ₹{prediction.predicted_income.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Predicted Expenses</span>
                <span className="font-semibold text-red-600">
                  ₹{prediction.predicted_expenses.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-medium text-gray-900">Predicted Savings</span>
                <span className="font-bold text-blue-600">
                  ₹{prediction.predicted_savings.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Confidence</span>
                <span className={`text-sm font-medium ${
                  prediction.confidence > 0.8 ? 'text-green-600' :
                  prediction.confidence > 0.6 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {(prediction.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Factors */}
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Key Factors</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                {prediction.factors.map((factor, i) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-2">•</span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Prediction Trend Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow Forecast</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={predictions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, '']} />
              <Area 
                type="monotone" 
                dataKey="predicted_income" 
                stackId="1" 
                stroke="#10b981" 
                fill="#10b981" 
                fillOpacity={0.3} 
                name="Predicted Income" 
              />
              <Area 
                type="monotone" 
                dataKey="predicted_expenses" 
                stackId="1" 
                stroke="#ef4444" 
                fill="#ef4444" 
                fillOpacity={0.3} 
                name="Predicted Expenses" 
              />
              <Area 
                type="monotone" 
                dataKey="predicted_savings" 
                stackId="1" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.3} 
                name="Predicted Savings" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Savings Recommendations</h3>
        <div className="space-y-3">
          {recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <span className="text-blue-600 mt-1">💡</span>
              <p className="text-sm text-blue-800">{recommendation}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}