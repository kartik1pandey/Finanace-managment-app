'use client'
import { useState, useEffect } from 'react'
import PortfolioOverview from '@/components/investments/PortfolioOverview'
import HoldingsList from '@/components/investments/HoldingsList'
import AssetAllocation from '@/components/investments/AssetAllocation'
import MarketOverview from '@/components/investments/MarketOverview'
import StockAnalysis from '@/components/investments/StockAnalysis'
import Watchlist from '@/components/investments/Watchlist'

export default function InvestmentsPage() {
  const [portfolioData, setPortfolioData] = useState(null)
  const [marketData, setMarketData] = useState(null)
  const [watchlistData, setWatchlistData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('portfolio')
  const [selectedStock, setSelectedStock] = useState('RELIANCE.NS')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch portfolio data
        const portfolioResponse = await fetch('http://localhost:8000/api/investments/portfolio/1')
        if (portfolioResponse.ok) {
          const portfolioData = await portfolioResponse.json()
          setPortfolioData(portfolioData)
        }

        // Fetch market overview
        const marketResponse = await fetch('http://localhost:8000/api/investments/market/overview')
        if (marketResponse.ok) {
          const marketData = await marketResponse.json()
          setMarketData(marketData)
        }

        // Fetch watchlist
        const watchlistResponse = await fetch('http://localhost:8000/api/investments/watchlist/1')
        if (watchlistResponse.ok) {
          const watchlistData = await watchlistResponse.json()
          setWatchlistData(watchlistData)
        }

      } catch (error) {
        console.error('Error fetching investment data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['portfolio', 'holdings', 'analysis', 'market', 'watchlist'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'analysis' ? 'Stock Analysis' : tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'portfolio' && portfolioData && (
          <div className="space-y-6">
            <PortfolioOverview data={portfolioData.portfolio_summary} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AssetAllocation data={portfolioData.asset_allocation} />
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sector Allocation</h3>
                {/* Sector allocation component would go here */}
                <div className="space-y-3">
                  {portfolioData.sector_allocation?.map((sector: any) => (
                    <div key={sector.sector} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">{sector.sector}</span>
                      <span className="font-semibold">{sector.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'holdings' && portfolioData && (
          <HoldingsList 
            holdings={portfolioData.holdings} 
            mutualFunds={portfolioData.mutual_funds}
            fixedDeposits={portfolioData.fixed_deposits}
          />
        )}

        {activeTab === 'analysis' && (
          <StockAnalysis 
            symbol={selectedStock}
            onSymbolChange={setSelectedStock}
          />
        )}

        {activeTab === 'market' && marketData && (
          <MarketOverview data={marketData} />
        )}

        {activeTab === 'watchlist' && watchlistData && (
          <Watchlist data={watchlistData} onSelectStock={setSelectedStock} />
        )}
      </div>
    </div>
  )
}