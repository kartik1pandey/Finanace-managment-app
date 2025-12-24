'use client'
import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { TrendingUp, TrendingDown, AlertCircle, Loader2, Search, Plus, X, Star, Heart, RefreshCw } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { createAuthHeaders } from '@/lib/auth-client'
import { apiConfig } from '@/lib/env'

const API_BASE_URL = apiConfig.backend
const MCP_BASE_URL = apiConfig.mcpServer

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

interface FavoriteStockCard {
  symbol: string
  price: number
  change: number
  changePercent: number
  marketCap: string
  loading: boolean
  error?: string
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
  const { user, token, loading: authLoading } = useAuth()
  const [ticker, setTicker] = useState('')
  const [watchlist, setWatchlist] = useState<string[]>(['AAPL', 'MSFT', 'GOOGL'])
  const [favoriteStocks, setFavoriteStocks] = useState<string[]>(['AAPL', 'GOOGL'])
  const [favoriteStockData, setFavoriteStockData] = useState<Record<string, FavoriteStockCard>>({})
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [selectedStock, setSelectedStock] = useState<string | null>(null)
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [technicals, setTechnicals] = useState<TechnicalIndicator | null>(null)
  const [analysis, setAnalysis] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeIndicator, setActiveIndicator] = useState<'price' | 'rsi'>('price')

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-gray-400">Loading...</span>
      </div>
    )
  }

  // Show login prompt if not authenticated
  if (!user || !token) {
    return (
      <Card className="bg-[#1a1a1a] border-gray-800">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Authentication Required</h3>
            <p className="text-gray-400 mb-4">Please sign in to access the Stock Explorer</p>
            <Button onClick={() => window.location.href = '/auth/signin'}>
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Load favorites from backend on component mount
  useEffect(() => {
    loadFavoritesFromBackend()
  }, [])

  // Fetch basic data for favorite stocks when favorites change
  useEffect(() => {
    if (favoriteStocks.length > 0) {
      fetchFavoriteStockData()
    }
  }, [favoriteStocks])

  // Auto-refresh favorite stocks every 30 seconds
  useEffect(() => {
    if (favoriteStocks.length === 0) return

    const interval = setInterval(() => {
      fetchFavoriteStockData()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [favoriteStocks])

  const fetchBasicStockData = async (symbol: string): Promise<FavoriteStockCard> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/investments/stock/${symbol}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch stock data')
      }

      const data = await response.json()
      const quote = data.quote

      return {
        symbol,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        marketCap: quote.marketCap,
        loading: false
      }
    } catch (error) {
      return {
        symbol,
        price: 0,
        change: 0,
        changePercent: 0,
        marketCap: 'N/A',
        loading: false,
        error: 'Failed to load'
      }
    }
  }

  const fetchFavoriteStockData = async () => {
    if (favoriteStocks.length === 0) return

    // Initialize loading state for all favorites
    const loadingData: Record<string, FavoriteStockCard> = {}
    favoriteStocks.forEach(symbol => {
      loadingData[symbol] = {
        symbol,
        price: 0,
        change: 0,
        changePercent: 0,
        marketCap: 'Loading...',
        loading: true
      }
    })
    setFavoriteStockData(loadingData)

    try {
      // Use batch endpoint for better performance
      const response = await fetch(`${API_BASE_URL}/api/investments/stocks/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(favoriteStocks)
      })

      if (!response.ok) {
        throw new Error('Failed to fetch batch stock data')
      }

      const batchData = await response.json()
      
      if (batchData.success) {
        const newData: Record<string, FavoriteStockCard> = {}
        
        Object.entries(batchData.data).forEach(([symbol, data]: [string, any]) => {
          if (data.success) {
            newData[symbol] = {
              symbol,
              price: data.price,
              change: data.change,
              changePercent: data.changePercent,
              marketCap: data.marketCap,
              loading: false
            }
          } else {
            newData[symbol] = {
              symbol,
              price: 0,
              change: 0,
              changePercent: 0,
              marketCap: 'N/A',
              loading: false,
              error: data.error || 'Failed to load'
            }
          }
        })
        
        setFavoriteStockData(newData)
        setLastUpdated(new Date())
      } else {
        throw new Error('Batch request failed')
      }
    } catch (error) {
      console.error('Failed to fetch favorite stock data:', error)
      
      // Fallback to individual requests
      const promises = favoriteStocks.map(async (symbol) => {
        const stockCard = await fetchBasicStockData(symbol)
        return { symbol, data: stockCard }
      })

      try {
        const results = await Promise.all(promises)
        const newData: Record<string, FavoriteStockCard> = {}
        
        results.forEach(({ symbol, data }) => {
          newData[symbol] = data
        })
        
        setFavoriteStockData(newData)
        setLastUpdated(new Date())
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError)
      }
    }
  }

  const loadFavoritesFromBackend = async () => {
    if (!token) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/investments/favorites`, {
        headers: createAuthHeaders(token)
      })
      const data = await response.json()
      
      if (data.success) {
        setFavoriteStocks(data.favorites)
      } else {
        // Fallback to localStorage if backend fails
        const savedFavorites = localStorage.getItem('favoriteStocks')
        if (savedFavorites) {
          setFavoriteStocks(JSON.parse(savedFavorites))
        }
      }
    } catch (error) {
      console.error('Failed to load favorites from backend:', error)
      // Fallback to localStorage
      const savedFavorites = localStorage.getItem('favoriteStocks')
      if (savedFavorites) {
        setFavoriteStocks(JSON.parse(savedFavorites))
      }
    }
  }

  const saveFavoritesToBackend = async (favorites: string[]) => {
    if (!token) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/investments/favorites`, {
        method: 'POST',
        headers: createAuthHeaders(token),
        body: JSON.stringify({
          stocks: favorites
        })
      })

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to save favorites')
      }
      
      // Also save to localStorage as backup
      localStorage.setItem('favoriteStocks', JSON.stringify(favorites))
    } catch (error) {
      console.error('Failed to save favorites to backend:', error)
      // Fallback to localStorage only
      localStorage.setItem('favoriteStocks', JSON.stringify(favorites))
    }
  }

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

  const toggleFavorite = async (symbol: string) => {
    const newFavorites = favoriteStocks.includes(symbol)
      ? favoriteStocks.filter(s => s !== symbol)
      : [...favoriteStocks, symbol]
    
    setFavoriteStocks(newFavorites)
    await saveFavoritesToBackend(newFavorites)

    // Update favorite stock data - remove if unfavorited
    if (!newFavorites.includes(symbol)) {
      setFavoriteStockData(prev => {
        const updated = { ...prev }
        delete updated[symbol]
        return updated
      })
    }
  }

  const addCurrentStockToFavorites = async () => {
    if (selectedStock && !favoriteStocks.includes(selectedStock)) {
      const newFavorites = [...favoriteStocks, selectedStock]
      setFavoriteStocks(newFavorites)
      await saveFavoritesToBackend(newFavorites)
    }
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
    if (rsi > 70) return 'text-red-400'
    if (rsi < 30) return 'text-green-400'
    return 'text-yellow-400'
  }

  // Component for individual favorite stock cards
  const FavoriteStockCard = ({ stockCard }: { stockCard: FavoriteStockCard }) => {
    const isSelected = selectedStock === stockCard.symbol
    const isPositive = stockCard.change >= 0

    return (
      <Card 
        className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
          isSelected 
            ? 'bg-red-600 border-red-500' 
            : 'bg-[#1a1a1a] border-gray-700 hover:border-red-400'
        }`}
        onClick={() => fetchStockData(stockCard.symbol)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="font-bold text-white text-lg">{stockCard.symbol}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFavorite(stockCard.symbol)
              }}
              className="hover:text-red-400 transition-colors"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
          
          {stockCard.loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
              <span className="text-gray-400 text-sm">Loading...</span>
            </div>
          ) : stockCard.error ? (
            <div className="text-red-400 text-sm">{stockCard.error}</div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-white">
                  {formatCurrency(stockCard.price)}
                </span>
                <div className={`flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span className="text-sm font-medium">
                    {formatNumber(stockCard.changePercent)}%
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Market Cap</span>
                <span className="text-xs text-gray-300">{stockCard.marketCap}</span>
              </div>
              
              <div className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}{formatNumber(stockCard.change)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Watchlist & Search */}
      <Card className="bg-[#1a1a1a] border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Search className="h-5 w-5 text-emerald-400" />
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
              onKeyDown={(e) => e.key === 'Enter' && addToWatchlist()}
              className="bg-[#0a0a0a] border-gray-700 text-white placeholder-gray-500"
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
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#1a1a1a] hover:bg-gray-800 border border-gray-700 text-white'
                }`}
                onClick={() => fetchStockData(symbol)}
              >
                <span className="font-medium">{symbol}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFavorite(symbol)
                  }}
                  className={`hover:scale-110 transition-transform ${
                    favoriteStocks.includes(symbol) ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-400'
                  }`}
                >
                  <Star className={`h-3 w-3 ${favoriteStocks.includes(symbol) ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFromWatchlist(symbol)
                  }}
                  className="hover:text-red-400"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Favorite Stocks */}
      <Card className="bg-[#1a1a1a] border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Heart className="h-5 w-5 text-red-400" />
              Favorite Stocks
              {favoriteStocks.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {favoriteStocks.length}
                </Badge>
              )}
            </CardTitle>
            {favoriteStocks.length > 0 && (
              <div className="flex items-center gap-3">
                {lastUpdated && (
                  <span className="text-xs text-gray-500">
                    Updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
                <Button
                  onClick={fetchFavoriteStockData}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {favoriteStocks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {favoriteStocks.map((symbol) => (
                <FavoriteStockCard 
                  key={symbol} 
                  stockCard={favoriteStockData[symbol] || {
                    symbol,
                    price: 0,
                    change: 0,
                    changePercent: 0,
                    marketCap: 'Loading...',
                    loading: true
                  }} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Heart className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No favorite stocks yet</p>
              <p className="text-gray-500 text-sm">
                Click the star icon on any stock to add it to your favorites
              </p>
            </div>
          )}
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
        <Card className="bg-[#1a1a1a] border-gray-800">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <span className="ml-3 text-gray-400">Loading stock data...</span>
          </CardContent>
        </Card>
      )}

      {/* Stock Data Display */}
      {stockData && !loading && (
        <>
          {/* Quote Card */}
          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-white flex items-center gap-2">
                    {selectedStock}
                    {selectedStock && favoriteStocks.includes(selectedStock) && (
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    )}
                  </CardTitle>
                  <p className="text-sm text-gray-400 mt-1">Real-time Quote</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={addCurrentStockToFavorites}
                    disabled={!selectedStock || favoriteStocks.includes(selectedStock)}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Heart className="h-4 w-4" />
                    {selectedStock && favoriteStocks.includes(selectedStock) ? 'Favorited' : 'Add to Favorites'}
                  </Button>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">{formatCurrency(stockData.price)}</div>
                    <div className={`flex items-center gap-1 ${stockData.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {stockData.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      <span className="font-semibold">
                        {formatNumber(stockData.change)} ({formatNumber(stockData.changePercent)}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Open</p>
                  <p className="font-semibold text-white">{formatCurrency(stockData.open)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">High</p>
                  <p className="font-semibold text-white">{formatCurrency(stockData.high)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Low</p>
                  <p className="font-semibold text-white">{formatCurrency(stockData.low)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Volume</p>
                  <p className="font-semibold text-white">{stockData.volume.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Market Cap</p>
                  <p className="font-semibold text-white">{stockData.marketCap}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">P/E Ratio</p>
                  <p className="font-semibold text-white">{stockData.pe}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">EPS</p>
                  <p className="font-semibold text-white">{stockData.eps}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Div Yield</p>
                  <p className="font-semibold text-white">{stockData.dividendYield}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Indicators */}
          {technicals && (
            <Card className="bg-[#1a1a1a] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Technical Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg">
                  <div>
                    <p className="text-sm text-gray-400">Signal</p>
                    <p className="text-2xl font-bold capitalize text-white">{technicals.signal_type}</p>
                  </div>
                  <Badge className={getSignalColor(technicals.signal_type)}>
                    {technicals.signal_strength}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-[#1a1a1a] rounded-lg">
                    <p className="text-sm text-gray-400">RSI</p>
                    <p className={`text-xl font-bold ${getRSIColor(technicals.rsi)}`}>
                      {formatNumber(technicals.rsi)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {technicals.rsi > 70 ? 'Overbought' : technicals.rsi < 30 ? 'Oversold' : 'Neutral'}
                    </p>
                  </div>

                  <div className="p-3 bg-[#1a1a1a] rounded-lg">
                    <p className="text-sm text-gray-400">MACD</p>
                    <p className="text-xl font-bold text-white">{formatNumber(technicals.macd)}</p>
                    <p className="text-xs text-gray-500">Signal: {formatNumber(technicals.signal)}</p>
                  </div>

                  <div className="p-3 bg-[#1a1a1a] rounded-lg">
                    <p className="text-sm text-gray-400">SMA 50</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(technicals.sma50)}</p>
                  </div>

                  <div className="p-3 bg-[#1a1a1a] rounded-lg">
                    <p className="text-sm text-gray-400">SMA 200</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(technicals.sma200)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Price Chart */}
          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Price Chart</CardTitle>
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
            <Card className="bg-[#1a1a1a] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">AI Analysis & Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert max-w-none text-gray-300">
                  <ReactMarkdown>{analysis}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}