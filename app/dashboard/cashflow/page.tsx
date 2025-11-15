
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, LogOut, ArrowLeft, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND || 'http://localhost:8000'

interface AssetType {
  type: string
  value: number
}

interface LiabilityType {
  type: string
  value: number
}

interface FinancialData {
  summary: {
    net_worth: number
  }
  assets?: AssetType[]
  liabilities?: LiabilityType[]
  mcp_data_available: boolean
}

export default function CashFlowPage() {
  const router = useRouter()
  const [financialData, setFinancialData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mcp_session')
    }
    router.push('/')
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSession = localStorage.getItem('mcp_session')
      if (savedSession) {
        const parsed = JSON.parse(savedSession)
        if (parsed.sessionId && parsed.isLoggedIn) {
          setSessionId(parsed.sessionId)
          fetchData(parsed.sessionId)
        } else {
          router.push('/')
        }
      } else {
        router.push('/')
      }
    }
  }, [])

  const fetchData = async (sid: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`${API_BASE_URL}/api/financial/summary/1?session_id=${sid}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }
      
      const data = await response.json()
      
      if (data.mcp_data_available) {
        setFinancialData(data)
      } else {
        setError('Financial data not available. Please reconnect your accounts.')
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to fetch financial data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const calculateTotals = () => {
    if (!financialData) return { totalAssets: 0, totalLiabilities: 0, netPosition: 0 }
    
    const totalAssets = financialData.assets?.reduce((sum, asset) => sum + asset.value, 0) || 0
    const totalLiabilities = financialData.liabilities?.reduce((sum, liability) => sum + liability.value, 0) || 0
    const netPosition = totalAssets - totalLiabilities
    
    return { totalAssets, totalLiabilities, netPosition }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading cash flow data...</p>
        </div>
      </div>
    )
  }

  const { totalAssets, totalLiabilities, netPosition } = calculateTotals()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cash Flow Analysis</h1>
              <p className="text-gray-600">Your financial inflows and outflows</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {financialData && financialData.mcp_data_available && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center text-blue-100">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Net Worth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatCurrency(financialData.summary.net_worth)}</div>
                  <p className="text-xs text-blue-100 mt-1">Total financial position</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center text-green-100">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Total Assets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatCurrency(totalAssets)}</div>
                  <p className="text-xs text-green-100 mt-1">{financialData.assets?.length || 0} asset categories</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center text-red-100">
                    <TrendingDown className="h-4 w-4 mr-2" />
                    Total Liabilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatCurrency(totalLiabilities)}</div>
                  <p className="text-xs text-red-100 mt-1">{financialData.liabilities?.length || 0} liability types</p>
                </CardContent>
              </Card>
            </div>

            {/* Assets Breakdown */}
            {financialData.assets && financialData.assets.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Assets Breakdown (Inflows)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {financialData.assets.map((asset, idx) => {
                      const percentage = (asset.value / totalAssets * 100).toFixed(1)
                      return (
                        <div key={idx} className="flex items-center justify-between p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">
                                {asset.type.replace(/ASSET_TYPE_|_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                              <Badge variant="outline" className="ml-2">{percentage}%</Badge>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full transition-all duration-500" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                          <div className="ml-6 text-right">
                            <span className="text-xl font-bold text-green-700">
                              {formatCurrency(asset.value)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Total Assets</span>
                      <span className="text-2xl font-bold text-green-700">{formatCurrency(totalAssets)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Liabilities Breakdown */}
            {financialData.liabilities && financialData.liabilities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    Liabilities Breakdown (Outflows)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {financialData.liabilities.map((liability, idx) => {
                      const percentage = (liability.value / totalLiabilities * 100).toFixed(1)
                      return (
                        <div key={idx} className="flex items-center justify-between p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">
                                {liability.type.replace(/LIABILITY_TYPE_|_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                              <Badge variant="outline" className="ml-2">{percentage}%</Badge>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-red-600 h-2 rounded-full transition-all duration-500" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                          <div className="ml-6 text-right">
                            <span className="text-xl font-bold text-red-700">
                              {formatCurrency(liability.value)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Total Liabilities</span>
                      <span className="text-2xl font-bold text-red-700">{formatCurrency(totalLiabilities)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Net Position Summary */}
            <Card className={`border-2 ${netPosition >= 0 ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
              <CardHeader>
                <CardTitle>Net Cash Flow Position</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-white rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Total Inflows (Assets)</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalAssets)}</p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Total Outflows (Liabilities)</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(totalLiabilities)}</p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Net Position</p>
                    <p className={`text-2xl font-bold ${netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(netPosition)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Insights Card */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">Financial Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></div>
                    <p className="text-gray-700">
                      <strong>Asset-to-Liability Ratio:</strong> {totalLiabilities > 0 ? (totalAssets / totalLiabilities).toFixed(2) : '∞'}
                      {totalLiabilities > 0 && (totalAssets / totalLiabilities) > 2 && ' - Excellent! Your assets significantly exceed liabilities.'}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></div>
                    <p className="text-gray-700">
                      <strong>Liability Percentage:</strong> {totalAssets > 0 ? ((totalLiabilities / totalAssets) * 100).toFixed(1) : '0'}% of total assets
                      {totalAssets > 0 && (totalLiabilities / totalAssets) < 0.3 && ' - Great! Keep your debt low relative to assets.'}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></div>
                    <p className="text-gray-700">
                      <strong>Diversification:</strong> You have {financialData.assets?.length || 0} different asset types
                      {(financialData.assets?.length || 0) >= 4 && ' - Good diversification across multiple categories.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {(!financialData || !financialData.mcp_data_available) && !loading && (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Cash Flow Data Available</h3>
              <p className="text-gray-600">Please connect your financial accounts to view cash flow analysis.</p>
              <Button className="mt-4" onClick={() => router.push('/')}>
                Connect Accounts
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
