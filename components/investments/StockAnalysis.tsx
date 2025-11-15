'use client'
import { useState, useEffect } from 'react'

interface StockAnalysisProps {
  symbol: string
  onSymbolChange: (symbol: string) => void
}

const popularStocks = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy' },
  { symbol: 'INFY.NS', name: 'Infosys' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank' },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel' }
]

export default function StockAnalysis({ symbol, onSymbolChange }: StockAnalysisProps) {
  const [analysisData, setAnalysisData] = useState(null)
  const [predictionData, setPredictionData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (symbol) {
      fetchAnalysisData()
    }
  }, [symbol])

  const fetchAnalysisData = async () => {
    try {
      setLoading(true)
      
      // Fetch stock analysis
      const analysisResponse = await fetch(`http://localhost:8000/api/investments/analysis/${symbol}`)
      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json()
        setAnalysisData(analysisData)
      }

      // Fetch prediction
      const predictionResponse = await fetch(`http://localhost:8000/api/investments/predict/${symbol}`)
      if (predictionResponse.ok) {
        const predictionData = await predictionResponse.json()
        setPredictionData(predictionData)
      }

    } catch (error) {
      console.error('Error fetching stock analysis:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!analysisData || analysisData.error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="text-center text-red-600">
          Failed to load stock analysis data
        </div>
      </div>
    )
  }

  const {
    current_price,
    price_change,
    price_change_percent,
    technical_indicators,
    signals,
    recommendation,
    support_level,
    resistance_level
  } = analysisData

  return (
    <div className="space-y-6">
      {/* Stock Selector */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Stock for Analysis
        </label>
        <select
          value={symbol}
          onChange={(e) => onSymbolChange(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          {popularStocks.map((stock) => (
            <option key={stock.symbol} value={stock.symbol}>
              {stock.name} ({stock.symbol})
            </option>
          ))}
        </select>
      </div>

      {/* Price and Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Current Price</h3>
          <p className="text-3xl font-bold text-gray-900">₹{current_price?.toLocaleString()}</p>
          <div className={`flex items-center mt-2 ${price_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <span className="text-lg font-semibold">
              {price_change >= 0 ? '+' : ''}{price_change} ({price_change_percent}%)
            </span>
            <span className="ml-2 text-xl">{price_change >= 0 ? '↗' : '↘'}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Recommendation</h3>
          <div className={`text-2xl font-bold ${
            recommendation === 'BUY' ? 'text-green-600' :
            recommendation === 'SELL' ? 'text-red-600' : 'text-yellow-600'
          }`}>
            {recommendation}
          </div>
          <p className="text-sm text-gray-600 mt-2">Based on technical analysis</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Key Levels</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Support:</span>
              <span className="font-semibold text-green-600">₹{support_level?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Resistance:</span>
              <span className="font-semibold text-red-600">₹{resistance_level?.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Indicators</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">RSI (14)</div>
              <div className={`text-xl font-bold ${
                technical_indicators?.rsi > 70 ? 'text-red-600' :
                technical_indicators?.rsi < 30 ? 'text-green-600' : 'text-gray-600'
              }`}>
                {technical_indicators?.rsi}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {technical_indicators?.rsi > 70 ? 'Overbought' :
                 technical_indicators?.rsi < 30 ? 'Oversold' : 'Neutral'}
              </div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">SMA (20)</div>
              <div className="text-xl font-bold text-blue-600">
                ₹{technical_indicators?.sma_20?.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">Short-term trend</div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">SMA (50)</div>
              <div className="text-xl font-bold text-purple-600">
                ₹{technical_indicators?.sma_50?.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">Long-term trend</div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Volume</div>
              <div className="text-xl font-bold text-orange-600">
                {(technical_indicators?.volume / 1000000).toFixed(2)}M
              </div>
              <div className="text-xs text-gray-500 mt-1">Trading activity</div>
            </div>
          </div>
        </div>

        {/* Trading Signals */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trading Signals</h3>
          <div className="space-y-3">
            {signals && Object.entries(signals).map(([indicator, signal]) => (
              <div key={indicator} className="flex justify-between items-center p-3 border rounded-lg">
                <span className="font-medium text-gray-700 capitalize">{indicator}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  signal === 'Bullish' || signal === 'Oversold' ? 'bg-green-100 text-green-800' :
                  signal === 'Bearish' || signal === 'Overbought' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {signal}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Price Prediction */}
      {predictionData && !predictionData.error && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Price Prediction</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Current Price:</span>
                  <span className="font-semibold">₹{predictionData.current_price?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Predicted Price ({predictionData.prediction_days} days):</span>
                  <span className={`font-semibold ${
                    predictionData.predicted_price > predictionData.current_price ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ₹{predictionData.predicted_price?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Expected Change:</span>
                  <span className={`font-semibold ${
                    predictionData.predicted_change_percent > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {predictionData.predicted_change_percent > 0 ? '+' : ''}{predictionData.predicted_change_percent}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Confidence:</span>
                  <span className="font-semibold text-blue-600">
                    {(predictionData.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Trend:</span>
                  <span className={`font-semibold ${
                    predictionData.trend === 'Bullish' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {predictionData.trend}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Prediction Insights</h4>
              <p className="text-sm text-gray-600">
                This prediction is based on machine learning analysis of historical price patterns 
                and technical indicators. Consider this as one of many factors in your investment decision.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}