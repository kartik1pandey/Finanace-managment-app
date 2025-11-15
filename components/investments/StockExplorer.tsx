'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { TrendingUp, TrendingDown, AlertCircle, Loader2, Search, Plus, X } from 'lucide-react'

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND || 'http://localhost:8000'

interface StockData {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  high: number
  low: number
  open: number
  previousClose: number
  marketCap: string
  pe: string
  eps: string
  dividendYield: string
  beta: string
}

interface TechnicalIndicator {
  rsi: number
  macd: number
  signal: number
  sma50: number
  sma200: number
  signal_type: 'buy' | 'sell' | 'neutral'
  signal_strength: string
}

interface ChartData {
  date: string
  close: number
  volume: number
  sma50?: number
  sma200?: number
  rsi?: number
}

export default function StockExplorer() {
  const [ticker, setTicker] = useState('')
  const [watchlist, setWatchlist] = useState<string[]>(['AAPL', 'MSFT', 'GOOGL'])
  const [selectedStock, setSelectedStock] = useState<string | null>(null)
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [technicals, setTechnicals] = useState<TechnicalIndicator | null>(null)
  const [analysis, setAnalysis] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeIndicator, setActiveIndicator] = useState<'price' | 'rsi'>('price')

  const fetchStockData = async (symbol: string) => {
    setLoading(true)
    setError(null)
    setSelectedStock(symbol)

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/investments/stock/${symbol}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch stock data')
      }

      const data = await response.json()
      
      setStockData(data.quote)
      setChartData(data.historical)
      setTechnicals(data.technicals)
      
      await fetchAIAnalysis(symbol, data)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stock data')
    } finally {
      setLoading(false)
    }
  }

  const fetchAIAnalysis = async (symbol: string, data: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/investments/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol,
          quote: data.quote,
          technicals: data.technicals,
          fundamentals: {
            pe: data.quote.pe,
            eps: data.quote.eps,
            marketCap: data.quote.marketCap
          }
        })
      })

      const analysisData = await response.json()
      setAnalysis(analysisData.analysis)
    } catch (err) {
      console.error('Failed to fetch AI analysis:', err)
    }
  }

  const addToWatchlist = () => {
    if (ticker && !watchlist.includes(ticker.toUpperCase())) {
      setWatchlist([...watchlist, ticker.toUpperCase()])
      setTicker('')
    }
  }

  const removeFromWatchlist = (symbol: string) => {
    setWatchlist(watchlist.filter(s => s !== symbol))
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'buy': return 'bg-green-500'
      case 'sell': return 'bg-red-500'
      default: return 'bg-yellow-500'
    }
  }

  const getRSIColor = (rsi: number) => {
    if (rsi > 70) return 'text-red-600'
    if (rsi < 30) return 'text-green-600'
    return 'text-yellow-600'
  }

  return (
    <div className="space-y-6">
      {/* Watchlist & Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Stock Explorer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add to Watchlist */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter ticker symbol (e.g., AAPL)"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && addToWatchlist()}
            />
            <Button onClick={addToWatchlist} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Watchlist */}
          <div className="flex flex-wrap gap-2">
            {watchlist.map((symbol) => (
              <div
                key={symbol}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                  selectedStock === symbol
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                onClick={() => fetchStockData(symbol)}
              >
                <span className="font-medium">{symbol}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFromWatchlist(symbol)
                  }}
                  className="hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading stock data...</span>
          </CardContent>
        </Card>
      )}

      {/* Stock Data Display */}
      {stockData && !loading && (
        <>
          {/* Quote Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{selectedStock}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Real-time Quote</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{formatCurrency(stockData.price)}</div>
                  <div className={`flex items-center gap-1 ${stockData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stockData.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span className="font-semibold">
                      {formatNumber(stockData.change)} ({formatNumber(stockData.changePercent)}%)
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Open</p>
                  <p className="font-semibold">{formatCurrency(stockData.open)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">High</p>
                  <p className="font-semibold">{formatCurrency(stockData.high)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Low</p>
                  <p className="font-semibold">{formatCurrency(stockData.low)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Volume</p>
                  <p className="font-semibold">{stockData.volume.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Market Cap</p>
                  <p className="font-semibold">{stockData.marketCap}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">P/E Ratio</p>
                  <p className="font-semibold">{stockData.pe}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">EPS</p>
                  <p className="font-semibold">{stockData.eps}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Div Yield</p>
                  <p className="font-semibold">{stockData.dividendYield}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Indicators */}
          {technicals && (
            <Card>
              <CardHeader>
                <CardTitle>Technical Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Signal</p>
                    <p className="text-2xl font-bold capitalize">{technicals.signal_type}</p>
                  </div>
                  <Badge className={getSignalColor(technicals.signal_type)}>
                    {technicals.signal_strength}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">RSI</p>
                    <p className={`text-xl font-bold ${getRSIColor(technicals.rsi)}`}>
                      {formatNumber(technicals.rsi)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {technicals.rsi > 70 ? 'Overbought' : technicals.rsi < 30 ? 'Oversold' : 'Neutral'}
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">MACD</p>
                    <p className="text-xl font-bold">{formatNumber(technicals.macd)}</p>
                    <p className="text-xs text-gray-500">Signal: {formatNumber(technicals.signal)}</p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">SMA 50</p>
                    <p className="text-xl font-bold">{formatCurrency(technicals.sma50)}</p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">SMA 200</p>
                    <p className="text-xl font-bold">{formatCurrency(technicals.sma200)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Price Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Price Chart</CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={activeIndicator === 'price' ? 'default' : 'outline'}
                    onClick={() => setActiveIndicator('price')}
                  >
                    Price
                  </Button>
                  <Button
                    size="sm"
                    variant={activeIndicator === 'rsi' ? 'default' : 'outline'}
                    onClick={() => setActiveIndicator('rsi')}
                  >
                    RSI
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  {activeIndicator === 'price' ? (
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={['auto', 'auto']} />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), '']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="close" 
                        stroke="#3b82f6" 
                        fillOpacity={1} 
                        fill="url(#colorPrice)" 
                        name="Price"
                      />
                      {chartData[0]?.sma50 && (
                        <Line 
                          type="monotone" 
                          dataKey="sma50" 
                          stroke="#f59e0b" 
                          strokeWidth={2}
                          dot={false}
                          name="SMA 50"
                        />
                      )}
                      {chartData[0]?.sma200 && (
                        <Line 
                          type="monotone" 
                          dataKey="sma200" 
                          stroke="#ef4444" 
                          strokeWidth={2}
                          dot={false}
                          name="SMA 200"
                        />
                      )}
                    </AreaChart>
                  ) : (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="rsi" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        name="RSI"
                      />
                      <Line y={70} stroke="#ef4444" strokeDasharray="5 5" />
                      <Line y={30} stroke="#10b981" strokeDasharray="5 5" />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis */}
          {analysis && (
            <Card>
              <CardHeader>
                <CardTitle>AI Analysis & Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap text-gray-700">{analysis}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}