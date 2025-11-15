'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, TrendingUp, TrendingDown, PieChart, Brain, Target, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND || 'http://localhost:8000'

interface Holding {
  symbol: string
  name: string
  qty: number
  avg_cost: number
  market_price: number
  market_value: number
  unrealized_pnl: number
  unrealized_pnl_pct: number
  sector?: string
  beta?: number
  dividend_yield?: number
}

interface AIAnalysisResponse {
  summary: string
  risk_score: number
  diversification_score: number
  top_performers: string[]
  underperformers: string[]
  recommendations: string[]
  sector_allocation: { [key: string]: number }
  market_insights: string[]
}

interface AIAnalysisProps {
  accounts: any[]
}
export default function AIAnalysis({ accounts }: AIAnalysisProps) {
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Memoize holdings so reference doesn't change every render
  const holdings: Holding[] = useMemo(
    () =>
      accounts.flatMap((acc) =>
        ['EQUITIES', 'ETF', 'REIT', 'INVIT'].includes(acc.type)
          ? (acc.holdings || []).map((h: any) => ({
              symbol: h.symbol,
              name: h.name,
              qty: h.qty,
              avg_cost: h.avg_cost,
              market_price: h.market_price,
              market_value: h.market_value,
              unrealized_pnl: h.unrealized_pnl,
              unrealized_pnl_pct: h.unrealized_pnl_pct,
              sector: h.sector,
              beta: h.beta,
              dividend_yield: h.dividend_yield,
            }))
          : []
      ),
    // depend on accounts shape changes
    [JSON.stringify(accounts)]
  )

  // Ensure safe numeric sum
  const totalValue = useMemo(
    () => holdings.reduce((sum, h) => sum + (Number(h.market_value) || 0), 0),
    [JSON.stringify(holdings)]
  )

  // Generate AI analysis locally if backend fails
  const generateLocalAnalysis = (): AIAnalysisResponse => {
    // Calculate basic metrics
    const sectorsRaw: { [key: string]: number } = {}
    const performers: { symbol: string; pct: number }[] = []
    const underperformers: { symbol: string; pct: number }[] = []

    const tv = totalValue || 0

    holdings.forEach(h => {
      // Sector allocation accumulate raw values
      const sector = h.sector || 'Unknown'
      sectorsRaw[sector] = (sectorsRaw[sector] || 0) + (Number(h.market_value) || 0)

      // Performance classification
      const pct = Number(h.unrealized_pnl_pct) || 0
      if (pct > 5) {
        performers.push({ symbol: h.symbol, pct })
      } else if (pct < -5) {
        underperformers.push({ symbol: h.symbol, pct })
      }
    })

    // Convert to percentages safely
    const sectors: { [key: string]: number } = {}
    Object.entries(sectorsRaw).forEach(([k, v]) => {
      sectors[k] = tv > 0 ? (v / tv) * 100 : 0
    })

    // Risk score based on volatility and concentration
    const maxSectorPct = Math.max(...Object.values(sectors), 0)
    const concentrationRisk = maxSectorPct > 40 ? 0.3 : 0
    const volatilityRisk = holdings.some(h => (h.beta ?? 1) > 1.5) ? 0.3 : 0
    const riskScore = Math.min(10, 5 + concentrationRisk * 10 + volatilityRisk * 10)

    // Diversification score
    const sectorCount = Object.keys(sectors).length || 1
    const diversificationScore = Math.min(100, (sectorCount / 8) * 100 + 40) // Base 40 + up to 60 for diversity

    const top_performers = performers
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 5)
      .map(p => `${p.symbol} (+${p.pct.toFixed(1)}%)`)

    const under_performers = underperformers
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 5)
      .map(p => `${p.symbol} (${p.pct.toFixed(1)}%)`)

    const recommendations: string[] = []
    if (diversificationScore < 40) recommendations.push('Consider adding exposure to different sectors for better diversification')
    if (riskScore >= 7) recommendations.push('High volatility detected; review high-beta positions.')
    if (holdings.length === 0) recommendations.push('No equity holdings found for analysis.')

    const summary = `Local analysis generated ${holdings.length} holdings valued at ₹${(tv).toLocaleString('en-IN')}. ${recommendations.length ? recommendations.join(' ') : 'No major issues found.'}`

    return {
      summary,
      risk_score: Number.isFinite(riskScore) ? Number(riskScore) : 0,
      diversification_score: Number.isFinite(diversificationScore) ? Math.round(diversificationScore) : 0,
      top_performers,
      underperformers: under_performers,
      recommendations,
      sector_allocation: Object.fromEntries(Object.entries(sectors).map(([k, v]) => [k, Math.round(v)])),
      market_insights: [
        "Monitor macro and interest-rate sensitive names",
        "Consider gradual rebalancing to target allocations"
      ]
    }
  }

  useEffect(() => {
    if (holdings.length === 0) return

    const fetchAIAnalysis = async () => {
      setLoading(true)
      setError(null)

      try {
        // Try backend API first
        let headers: Record<string, string> = { 'Content-Type': 'application/json' }

        try {
          if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('mcp_session')
            if (saved) {
              const parsed = JSON.parse(saved)
              if (parsed?.sessionId) {
                headers['Authorization'] = `Bearer ${parsed.sessionId}`
              }
            }
          }
        } catch (e) {
          console.warn('Failed reading session from localStorage', e)
        }

        const response = await fetch(`${API_BASE_URL}/api/investments/portfolio-analysis`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            holdings,
            total_value: totalValue,
            timestamp: new Date().toISOString()
          }),
        })

        if (response.ok) {
          const data: AIAnalysisResponse = await response.json()
          setAnalysis(data)
          setLoading(false)
          return
        }

        // If endpoint not found or returns error, fallback to local analysis
        let bodyText = ''
        try { bodyText = await response.text() } catch (_) { bodyText = '' }
        console.warn('Backend AI analysis unavailable, status:', response.status, bodyText)
        const local = generateLocalAnalysis()
        setAnalysis(local)
      } catch (err) {
        console.warn('API call failed, using local analysis:', err)
        setAnalysis(generateLocalAnalysis())
      } finally {
        setLoading(false)
      }
    }

    fetchAIAnalysis()
    // Depend on stable stringified holdings and totalValue
  }, [JSON.stringify(holdings), totalValue])


  if (holdings.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No equity holdings found for analysis.</p>
          <p className="text-sm mt-2">Add some stocks to your portfolio to get AI insights.</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <span className="text-lg font-medium">Running AI Analysis</span>
          <span className="text-sm text-gray-500 mt-2">Analyzing {holdings.length} holdings across {Object.keys(analysis?.sector_allocation || {}).length} sectors</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!analysis) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Brain className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI Portfolio Analysis</h2>
              <p className="text-gray-600">Smart insights based on your {holdings.length} holdings</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">{analysis.summary}</p>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="p-2 bg-red-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Risk Score</p>
              <div className={`text-2xl font-bold ${
                analysis.risk_score < 4 ? 'text-green-600' : 
                analysis.risk_score < 7 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {analysis.risk_score.toFixed(1)} / 10
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {analysis.risk_score < 4 ? 'Low Risk' : 
                 analysis.risk_score < 7 ? 'Moderate Risk' : 'High Risk'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="p-2 bg-green-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <PieChart className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Diversification</p>
              <div className={`text-2xl font-bold ${
                analysis.diversification_score > 80 ? 'text-green-600' : 
                analysis.diversification_score > 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {analysis.diversification_score}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Across {Object.keys(analysis.sector_allocation).length} sectors
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="p-2 bg-blue-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Portfolio Value</p>
              <div className="text-2xl font-bold text-gray-900">
                ₹{totalValue.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-gray-500 mt-1">{holdings.length} holdings</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <TrendingUp className="h-5 w-5" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.top_performers.length > 0 ? (
              <div className="space-y-3">
                {analysis.top_performers.map((performer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">{performer.split(' (')[0]}</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {performer.split('(')[1]?.replace(')', '')}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No significant outperformers detected</p>
            )}
          </CardContent>
        </Card>

        {/* Underperformers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <TrendingDown className="h-5 w-5" />
              Underperformers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.underperformers.length > 0 ? (
              <div className="space-y-3">
                {analysis.underperformers.map((underperformer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="font-medium">{underperformer.split(' (')[0]}</span>
                    <Badge variant="destructive" className="bg-red-100 text-red-800">
                      {underperformer.split('(')[1]?.replace(')', '')}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No significant underperformers detected</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sector Allocation */}
      {Object.keys(analysis.sector_allocation).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sector Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analysis.sector_allocation)
                .sort(([, a], [, b]) => b - a)
                .map(([sector, pct]) => (
                  <div key={sector} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium capitalize">{sector}</span>
                      <span className="text-sm font-semibold">{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>AI Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-blue-600 text-sm font-bold">{index + 1}</span>
                </div>
                <div>
                  <p className="text-gray-800 leading-relaxed">{recommendation}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      Priority: {index < 2 ? 'High' : 'Medium'}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Timeline: {index < 3 ? 'Immediate' : '1-3 months'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Market Insights */}
      {analysis.market_insights && analysis.market_insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Market Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.market_insights.map((insight, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-700">{insight}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
