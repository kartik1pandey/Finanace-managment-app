'use client'
import { useState, useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND || 'http://localhost:8000'

export default function InvestmentsPage() {
  const [mutualFunds, setMutualFunds] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('portfolio')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSession = localStorage.getItem('mcp_session')
      if (savedSession) {
        const parsed = JSON.parse(savedSession)
        if (parsed.sessionId && parsed.isLoggedIn) {
          setSessionId(parsed.sessionId)
          fetchData(parsed.sessionId)
        } else {
          setError('Please connect your financial accounts from the dashboard')
          setLoading(false)
        }
      } else {
        setError('No session found. Please connect your accounts from the dashboard')
        setLoading(false)
      }
    }
  }, [])

  const fetchData = async (sid: string) => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch mutual funds
      const mfRes = await fetch(`${API_BASE_URL}/api/financial/mutual-funds/1?session_id=${sid}`)
      const mfData = await mfRes.json()
      if (mfData.success) {
        setMutualFunds(mfData.funds)
      }

      // Fetch investment accounts
      const accRes = await fetch(`${API_BASE_URL}/api/financial/accounts/1?session_id=${sid}`)
      const accData = await accRes.json()
      if (accData.success) {
        setAccounts(accData.accounts.filter((a: any) => 
          ['EQUITIES', 'ETF', 'REIT', 'INVIT'].includes(a.type)
        ))
      }

    } catch (error) {
      console.error('Error fetching investment data:', error)
      setError('Failed to fetch investment data')
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

  // Calculate portfolio summary
  const totalMFValue = mutualFunds.reduce((sum, mf) => sum + mf.current_value, 0)
  const totalInvested = mutualFunds.reduce((sum, mf) => sum + mf.invested_value, 0)
  const totalReturns = mutualFunds.reduce((sum, mf) => sum + mf.absolute_returns, 0)
  const totalEquityValue = accounts.reduce((sum, acc) => sum + (acc.current_value || 0), 0)
  const totalPortfolioValue = totalMFValue + totalEquityValue

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Investment Portfolio</h1>
          <p className="text-gray-600">Track your investments and market performance</p>
        </div>
        <div className="text-sm text-gray-500">
          Real-time data • {new Date().toLocaleDateString('en-IN')}
        </div>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPortfolioValue)}</div>
            <p className="text-xs text-muted-foreground">Across all investments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mutual Funds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMFValue)}</div>
            <p className="text-xs text-muted-foreground">{mutualFunds.length} funds</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold flex items-center ${totalReturns >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalReturns >= 0 ? <TrendingUp className="mr-2 h-4 w-4" /> : <TrendingDown className="mr-2 h-4 w-4" />}
              {formatCurrency(totalReturns)}
            </div>
            <p className="text-xs text-muted-foreground">
              {((totalReturns / totalInvested) * 100).toFixed(2)}% overall
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equity Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalEquityValue)}</div>
            <p className="text-xs text-muted-foreground">{accounts.length} accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['portfolio', 'mutual-funds', 'equity'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'portfolio' && (
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">Mutual Funds</span>
                    <span className="text-lg font-bold">{formatCurrency(totalMFValue)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Equity Holdings</span>
                    <span className="text-lg font-bold">{formatCurrency(totalEquityValue)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'mutual-funds' && (
          <div className="grid gap-4">
            {mutualFunds.map((fund, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{fund.name}</CardTitle>
                      <p className="text-sm text-gray-600">{fund.amc} • {fund.category}</p>
                    </div>
                    <Badge variant={fund.absolute_returns >= 0 ? "default" : "destructive"}>
                      {fund.xirr > 0 ? '+' : ''}{fund.xirr.toFixed(2)}% XIRR
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Current Value</p>
                      <p className="text-lg font-semibold">{formatCurrency(fund.current_value)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Invested</p>
                      <p className="text-lg font-semibold">{formatCurrency(fund.invested_value)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Returns</p>
                      <p className={`text-lg font-semibold ${fund.absolute_returns >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(fund.absolute_returns)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'equity' && (
          <div className="grid gap-4">
            {accounts.map((account) => (
              <Card key={account.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{account.fip}</CardTitle>
                      <p className="text-sm text-gray-600">{account.masked_number}</p>
                    </div>
                    <Badge>{account.type.replace(/_/g, ' ')}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(account.current_value || 0)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}