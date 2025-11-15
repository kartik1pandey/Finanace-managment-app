
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, LogOut, ArrowLeft, CreditCard, TrendingDown, TrendingUp, DollarSign, PieChart, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND || 'http://localhost:8000'

interface LiabilityType {
  type: string
  value: number
}

interface AssetType {
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

export default function LoansPage() {
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
        setError('Loan data not available. Please reconnect your accounts.')
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to fetch loan data')
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

  const calculateMetrics = () => {
    if (!financialData) return {
      totalLiabilities: 0,
      totalAssets: 0,
      debtToAssetRatio: 0,
      debtPercentage: 0
    }

    const totalLiabilities = financialData.liabilities?.reduce((sum, l) => sum + l.value, 0) || 0
    const totalAssets = financialData.assets?.reduce((sum, a) => sum + a.value, 0) || 0
    const debtToAssetRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) : 0
    const debtPercentage = totalAssets > 0 ? (totalLiabilities / totalAssets * 100) : 0

    return { totalLiabilities, totalAssets, debtToAssetRatio, debtPercentage }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading loan data...</p>
        </div>
      </div>
    )
  }

  const { totalLiabilities, totalAssets, debtToAssetRatio, debtPercentage } = calculateMetrics()
  const hasLiabilities = financialData?.liabilities && financialData.liabilities.length > 0

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')} className="border-gray-800 bg-[#1a1a1a] text-white hover:bg-gray-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Loans & Debt Management</h1>
              <p className="text-gray-400">Your liabilities and debt overview</p>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center text-red-100">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Total Liabilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatCurrency(totalLiabilities)}</div>
                  <p className="text-xs text-red-100 mt-1">{financialData.liabilities?.length || 0} loan types</p>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a1a] border-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-400">Total Assets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-400">{formatCurrency(totalAssets)}</div>
                  <p className="text-xs text-gray-500 mt-1">Available to cover debt</p>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a1a] border-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-400">Debt Ratio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-400">
                    {debtPercentage.toFixed(1)}%
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Of total assets</p>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a1a] border-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-400">Net Worth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-400">
                    {formatCurrency(financialData.summary.net_worth)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">After liabilities</p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            {hasLiabilities ? (
              <>
                {/* Liabilities Breakdown */}
                <Card className="bg-[#1a1a1a] border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <TrendingDown className="h-5 w-5 text-red-500" />
                      Liabilities Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {financialData.liabilities?.map((liability, idx) => {
                        const percentage = totalLiabilities > 0 ? (liability.value / totalLiabilities * 100) : 0
                        return (
                          <div key={idx} className="p-4 bg-red-950/20 border border-red-800 rounded-lg hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-950/40 rounded-full flex items-center justify-center">
                                  <CreditCard className="h-5 w-5 text-red-400" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-white">
                                    {liability.type.replace(/LIABILITY_TYPE_|_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </h3>
                                  <p className="text-sm text-gray-400">Outstanding balance</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-red-400">
                                  {formatCurrency(liability.value)}
                                </div>
                                <Badge variant="outline" className="mt-1 border-red-700 text-red-400">
                                  {percentage.toFixed(1)}% of total
                                </Badge>
                              </div>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Debt Health Analysis */}
                <Card className={`border-2 ${debtPercentage < 30 ? 'border-green-500 bg-green-950/20' : debtPercentage < 50 ? 'border-yellow-500 bg-yellow-950/20' : 'border-red-500 bg-red-950/20'}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <PieChart className="h-5 w-5" />
                      Debt Health Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="text-center p-4 bg-[#0a0a0a] border border-gray-800 rounded-lg shadow-sm">
                        <p className="text-sm text-gray-400 mb-2">Debt-to-Asset Ratio</p>
                        <p className={`text-3xl font-bold ${debtToAssetRatio < 0.3 ? 'text-green-400' : debtToAssetRatio < 0.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {(debtToAssetRatio * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {debtToAssetRatio < 0.3 ? 'Excellent' : debtToAssetRatio < 0.5 ? 'Good' : 'Needs Attention'}
                        </p>
                      </div>

                      <div className="text-center p-4 bg-[#0a0a0a] border border-gray-800 rounded-lg shadow-sm">
                        <p className="text-sm text-gray-400 mb-2">Available Coverage</p>
                        <p className="text-3xl font-bold text-blue-400">
                          {totalLiabilities > 0 ? (totalAssets / totalLiabilities).toFixed(2) : '∞'}x
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Assets can cover debt</p>
                      </div>

                      <div className="text-center p-4 bg-[#0a0a0a] border border-gray-800 rounded-lg shadow-sm">
                        <p className="text-sm text-gray-400 mb-2">Debt-Free Amount</p>
                        <p className="text-3xl font-bold text-green-400">
                          {formatCurrency(Math.max(0, totalAssets - totalLiabilities))}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">After paying all debt</p>
                      </div>
                    </div>

                    {/* Health Status */}
                    <div className="p-4 bg-[#0a0a0a] border border-gray-800 rounded-lg">
                      <h4 className="font-semibold text-white mb-3">Health Status & Recommendations</h4>
                      <div className="space-y-2 text-sm">
                        {debtPercentage < 30 ? (
                          <>
                            <div className="flex items-start gap-2 text-green-400">
                              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <p><strong>Excellent debt management!</strong> Your liabilities are only {debtPercentage.toFixed(1)}% of your total assets.</p>
                            </div>
                            <div className="flex items-start gap-2 text-green-400">
                              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <p>You're in a strong financial position with assets covering debt {(totalAssets / totalLiabilities).toFixed(2)}x over.</p>
                            </div>
                            <div className="flex items-start gap-2 text-gray-300">
                              <div className="w-4 h-4 mt-0.5"></div>
                              <p><strong>Recommendation:</strong> Continue maintaining low debt levels. Consider investing surplus funds for wealth growth.</p>
                            </div>
                          </>
                        ) : debtPercentage < 50 ? (
                          <>
                            <div className="flex items-start gap-2 text-yellow-400">
                              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <p><strong>Moderate debt levels.</strong> Your liabilities are {debtPercentage.toFixed(1)}% of your total assets.</p>
                            </div>
                            <div className="flex items-start gap-2 text-yellow-400">
                              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <p>While manageable, consider creating a debt reduction plan to improve your financial flexibility.</p>
                            </div>
                            <div className="flex items-start gap-2 text-gray-300">
                              <div className="w-4 h-4 mt-0.5"></div>
                              <p><strong>Recommendation:</strong> Focus on paying down high-interest loans first. Aim to reduce debt below 30% of assets.</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-start gap-2 text-red-400">
                              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <p><strong>High debt levels require attention.</strong> Your liabilities are {debtPercentage.toFixed(1)}% of your total assets.</p>
                            </div>
                            <div className="flex items-start gap-2 text-red-400">
                              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <p>This debt-to-asset ratio suggests you should prioritize debt reduction to improve financial health.</p>
                            </div>
                            <div className="flex items-start gap-2 text-gray-300">
                              <div className="w-4 h-4 mt-0.5"></div>
                              <p><strong>Recommendation:</strong> Create an aggressive debt repayment plan. Consider debt consolidation if multiple high-interest loans exist.</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Asset vs Liability Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Position Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Total Assets</span>
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          </div>
                          <p className="text-2xl font-bold text-green-700">{formatCurrency(totalAssets)}</p>
                          <p className="text-xs text-gray-600 mt-1">What you own</p>
                        </div>

                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Total Liabilities</span>
                            <TrendingDown className="h-5 w-5 text-red-600" />
                          </div>
                          <p className="text-2xl font-bold text-red-700">{formatCurrency(totalLiabilities)}</p>
                          <p className="text-xs text-gray-600 mt-1">What you owe</p>
                        </div>
                      </div>

                      <div className="p-6 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg text-white border-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-emerald-100 mb-1">Net Worth (Assets - Liabilities)</p>
                            <p className="text-3xl font-bold">{formatCurrency(financialData.summary.net_worth)}</p>
                          </div>
                          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                            <DollarSign className="h-8 w-8" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Items */}
                <Card className="bg-blue-950/30 border-blue-800">
                  <CardHeader>
                    <CardTitle className="text-blue-400">Recommended Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-[#0a0a0a] border border-gray-800 rounded-lg">
                        <div className="w-6 h-6 bg-blue-950 border border-blue-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-blue-400 font-bold text-sm">1</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-white mb-1">Prioritize High-Interest Debt</h4>
                          <p className="text-sm text-gray-400">Focus on paying off loans with interest rates above 10% first to minimize interest costs.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-[#0a0a0a] border border-gray-800 rounded-lg">
                        <div className="w-6 h-6 bg-blue-950 border border-blue-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-blue-400 font-bold text-sm">2</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-white mb-1">Build Emergency Fund</h4>
                          <p className="text-sm text-gray-400">Maintain 3-6 months of expenses in liquid savings to avoid taking on more debt during emergencies.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-[#0a0a0a] border border-gray-800 rounded-lg">
                        <div className="w-6 h-6 bg-blue-950 border border-blue-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-blue-400 font-bold text-sm">3</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-white mb-1">Avoid New Debt</h4>
                          <p className="text-sm text-gray-400">Focus on reducing existing liabilities before taking on new loans or credit.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-[#0a0a0a] border border-gray-800 rounded-lg">
                        <div className="w-6 h-6 bg-blue-950 border border-blue-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-blue-400 font-bold text-sm">4</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-white mb-1">Track Progress Monthly</h4>
                          <p className="text-sm text-gray-400">Monitor your debt-to-asset ratio regularly to ensure you're moving in the right direction.</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              // No Liabilities - Debt Free!
              <Card className="border-2 border-green-500 bg-gradient-to-br from-green-950/30 to-emerald-950/30">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-green-950/40 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-10 w-10 text-green-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-green-400 mb-4">🎉 Congratulations! You're Debt-Free!</h2>
                  <p className="text-lg text-gray-300 mb-6">
                    You have no liabilities in your connected accounts. This is an excellent financial position!
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
                    <div className="p-4 bg-[#0a0a0a] border border-gray-800 rounded-lg shadow-sm">
                      <p className="text-sm text-gray-400 mb-1">Total Assets</p>
                      <p className="text-2xl font-bold text-green-400">{formatCurrency(totalAssets)}</p>
                    </div>
                    <div className="p-4 bg-[#0a0a0a] border border-gray-800 rounded-lg shadow-sm">
                      <p className="text-sm text-gray-400 mb-1">Total Liabilities</p>
                      <p className="text-2xl font-bold text-gray-400">{formatCurrency(0)}</p>
                    </div>
                    <div className="p-4 bg-[#0a0a0a] border border-gray-800 rounded-lg shadow-sm">
                      <p className="text-sm text-gray-400 mb-1">Net Worth</p>
                      <p className="text-2xl font-bold text-blue-400">{formatCurrency(financialData.summary.net_worth)}</p>
                    </div>
                  </div>

                  <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6 text-left max-w-2xl mx-auto">
                    <h3 className="font-semibold text-white mb-4">Maintaining Your Debt-Free Status:</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <p className="text-gray-300"><strong>Build emergency fund:</strong> Keep 6 months of expenses in liquid savings to avoid future debt.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <p className="text-gray-300"><strong>Invest wisely:</strong> Use your debt-free status to grow wealth through strategic investments.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <p className="text-gray-300"><strong>Plan major purchases:</strong> Save up for big expenses rather than taking loans.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <p className="text-gray-300"><strong>Use credit strategically:</strong> If you take future loans, ensure they're for appreciating assets.</p>
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="mt-6 bg-emerald-600 hover:bg-emerald-700" 
                    size="lg"
                    onClick={() => router.push('/dashboard/investments')}
                  >
                    Explore Investment Opportunities
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {(!financialData || !financialData.mcp_data_available) && !loading && (
          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Loan Data Available</h3>
              <p className="text-gray-400 mb-4">Please connect your financial accounts to view loan and liability information.</p>
              <Button onClick={() => router.push('/')} className="bg-emerald-600 hover:bg-emerald-700">
                Connect Accounts
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}