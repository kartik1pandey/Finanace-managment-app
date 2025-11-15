'use client'
import { useState, useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Updated imports
import StockExplorer from '@/components/investments/StockExplorer'
import PortfolioOptimizer from '@/components/investments/PortfolioOptimizer'
import MutualFundsList from '@/components/investments/MutualFundsList'
import AIAnalysis from '@/components/investments/AIAnalysis'  // ← NEW

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND || 'http://localhost:8000'

export default function InvestmentsPage() {
  const [mutualFunds, setMutualFunds] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('explorer')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSession = localStorage.getItem('mcp_session')
      if (savedSession) {
        const parsed = JSON.parse(savedSession)
        if (parsed.sessionId && parsed.isLoggedIn) {
          setSessionId(parsed.sessionId)
          fetchMCPData(parsed.sessionId)
        } else {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }
  }, [])

  const fetchMCPData = async (sid: string) => {
    try {
      setLoading(true)
      
      const [mfRes, accRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/financial/mutual-funds/1?session_id=${sid}`),
        fetch(`${API_BASE_URL}/api/financial/accounts/1?session_id=${sid}`)
      ])
      
      const mfData = await mfRes.json()
      const accData = await accRes.json()
      
      if (mfData.success) setMutualFunds(mfData.funds)
      if (accData.success) {
        setAccounts(accData.accounts.filter((a: any) => 
          ['EQUITIES', 'ETF', 'REIT', 'INVIT'].includes(a.type)
        ))
      }
    } catch (error) {
      console.error('Error fetching MCP data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6 bg-[#0a0a0a] min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Investment Portfolio</h1>
          <p className="text-gray-400">Advanced analytics and AI-powered insights</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 bg-[#1a1a1a] border border-gray-800">
          <TabsTrigger value="explorer" className="data-[state=active]:bg-emerald-600 text-white">Stock Explorer</TabsTrigger>
          <TabsTrigger value="optimizer" className="data-[state=active]:bg-emerald-600 text-white">Optimizer</TabsTrigger>
          <TabsTrigger value="mutual-funds" className="data-[state=active]:bg-emerald-600 text-white">Mutual Funds</TabsTrigger>

        </TabsList>

        <TabsContent value="explorer">
          <StockExplorer />
        </TabsContent>

        <TabsContent value="optimizer">
          <PortfolioOptimizer />
        </TabsContent>

        <TabsContent value="mutual-funds">
          {loading ? <div className="text-gray-400">Loading...</div> : <MutualFundsList funds={mutualFunds} />}
        </TabsContent>


      </Tabs>
    </div>
  )
}