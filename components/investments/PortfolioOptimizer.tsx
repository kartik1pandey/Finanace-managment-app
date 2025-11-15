'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { Download, TrendingUp, TrendingDown, AlertTriangle, PieChart as PieChartIcon, BarChart3, Building2, Cpu, Heart, CreditCard, Car, Zap, Wifi, Home, Factory } from 'lucide-react'

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND || 'http://localhost:8000'
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || 'AIzaSyBRLUBQW__rO5hV7WqP3d7mau16bTz11NQ'


interface PortfolioHolding {
  symbol: string
  allocation: number
  currentPrice?: number
  volatility?: number
  expectedReturn?: number
  sector?: string
  industry?: string
  companyName?: string
}

interface PortfolioAnalysis {
  var95: number
  sharpeRatio: number
  diversification: 'Low' | 'Medium' | 'High'
  concentrationRisk: boolean
  topHoldings: { symbol: string; allocation: number; sector: string }[]
  sectorAllocation: { sector: string; allocation: number; icon: JSX.Element; color: string }[]
  industryAllocation: { industry: string; allocation: number; sector: string }[]
  analysis: string
  recommendations: string
}

interface StockData {
  symbol: string
  price: number
  change: number
  changePercent: number
  volatility: number
}

// Sector icons and colors mapping
const SECTOR_CONFIG: { [key: string]: { icon: JSX.Element; color: string } } = {
  'Technology': { icon: <Cpu className="h-4 w-4" />, color: '#3B82F6' },
  'Information Technology': { icon: <Cpu className="h-4 w-4" />, color: '#3B82F6' },
  'Financial Services': { icon: <CreditCard className="h-4 w-4" />, color: '#10B981' },
  'Financial': { icon: <CreditCard className="h-4 w-4" />, color: '#10B981' },
  'Healthcare': { icon: <Heart className="h-4 w-4" />, color: '#EF4444' },
  'Consumer Cyclical': { icon: <Car className="h-4 w-4" />, color: '#F59E0B' },
  'Consumer Defensive': { icon: <Home className="h-4 w-4" />, color: '#8B5CF6' },
  'Energy': { icon: <Zap className="h-4 w-4" />, color: '#F97316' },
  'Industrial': { icon: <Factory className="h-4 w-4" />, color: '#6B7280' },
  'Communication Services': { icon: <Wifi className="h-4 w-4" />, color: '#EC4899' },
  'Utilities': { icon: <Building2 className="h-4 w-4" />, color: '#06B6D4' },
  'Real Estate': { icon: <Home className="h-4 w-4" />, color: '#84CC16' },
  'Materials': { icon: <Factory className="h-4 w-4" />, color: '#6366F1' },
  'Basic Materials': { icon: <Factory className="h-4 w-4" />, color: '#6366F1' },
  'Consumer Goods': { icon: <Home className="h-4 w-4" />, color: '#8B5CF6' },
  'Services': { icon: <Building2 className="h-4 w-4" />, color: '#06B6D4' }
}

export default function PortfolioOptimizer() {
  const [portfolioInput, setPortfolioInput] = useState('')
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([])
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('analysis')

  // Enhanced function to get stock sector and industry using Gemini API
  const getStockSectorAndIndustry = async (symbol: string): Promise<{ sector: string; industry: string; companyName: string }> => {
    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`;

      const promptText = `For the stock ticker symbol ${symbol}, provide the following information in JSON format only:
{
  "sector": "main business sector",
  "industry": "specific industry",
  "companyName": "full company name"
}

Use standard GICS sector classifications. Be accurate and specific.`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: promptText }
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 500,
            response_mime_type: "application/json",
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const jsonString = data.candidates[0].content.parts[0].text;
      
      // Clean JSON string
      const cleanedJson = jsonString.replace(/```json\n?|```\n?/g, '').trim();
      const result = JSON.parse(cleanedJson);
      
      return {
        sector: result.sector || 'Unknown',
        industry: result.industry || 'Unknown',
        companyName: result.companyName || symbol
      };
    } catch (error) {
      console.warn(`Failed to get sector info for ${symbol} from Gemini:`, error);
      
      // Fallback to backend API
      try {
        const backendResponse = await fetch(`${API_BASE_URL}/api/investments/stock/${symbol}`);
        if (backendResponse.ok) {
          const backendData = await backendResponse.json();
          return {
            sector: backendData.quote?.sector || 'Unknown',
            industry: backendData.quote?.industry || 'Unknown',
            companyName: backendData.quote?.companyName || symbol
          };
        }
      } catch (backendError) {
        console.warn(`Backend also failed for ${symbol}:`, backendError);
      }
      
      // Final fallback to predefined mappings for common stocks
      const commonStocks: { [key: string]: { sector: string; industry: string; companyName: string } } = {
        'AAPL': { sector: 'Technology', industry: 'Consumer Electronics', companyName: 'Apple Inc.' },
        'MSFT': { sector: 'Technology', industry: 'Software', companyName: 'Microsoft Corporation' },
        'GOOGL': { sector: 'Technology', industry: 'Internet Services', companyName: 'Alphabet Inc.' },
        'AMZN': { sector: 'Consumer Cyclical', industry: 'E-Commerce', companyName: 'Amazon.com Inc.' },
        'TSLA': { sector: 'Consumer Cyclical', industry: 'Automotive', companyName: 'Tesla Inc.' },
        'META': { sector: 'Technology', industry: 'Social Media', companyName: 'Meta Platforms Inc.' },
        'NVDA': { sector: 'Technology', industry: 'Semiconductors', companyName: 'NVIDIA Corporation' },
        'JPM': { sector: 'Financial Services', industry: 'Banking', companyName: 'JPMorgan Chase & Co.' },
        'JNJ': { sector: 'Healthcare', industry: 'Pharmaceuticals', companyName: 'Johnson & Johnson' },
        'XOM': { sector: 'Energy', industry: 'Oil & Gas', companyName: 'Exxon Mobil Corporation' },
        'WMT': { sector: 'Consumer Defensive', industry: 'Discount Stores', companyName: 'Walmart Inc.' },
        'PG': { sector: 'Consumer Defensive', industry: 'Household Products', companyName: 'Procter & Gamble Co.' },
        'DIS': { sector: 'Communication Services', industry: 'Entertainment', companyName: 'The Walt Disney Company' },
        'NFLX': { sector: 'Communication Services', industry: 'Streaming', companyName: 'Netflix Inc.' },
        'ADBE': { sector: 'Technology', industry: 'Software', companyName: 'Adobe Inc.' },
        'CRM': { sector: 'Technology', industry: 'Software', companyName: 'Salesforce Inc.' },
        'INTC': { sector: 'Technology', industry: 'Semiconductors', companyName: 'Intel Corporation' },
        'CSCO': { sector: 'Technology', industry: 'Networking', companyName: 'Cisco Systems Inc.' },
        'PEP': { sector: 'Consumer Defensive', industry: 'Beverages', companyName: 'PepsiCo Inc.' },
        'KO': { sector: 'Consumer Defensive', industry: 'Beverages', companyName: 'The Coca-Cola Company' },
        'T': { sector: 'Communication Services', industry: 'Telecom', companyName: 'AT&T Inc.' },
        'VZ': { sector: 'Communication Services', industry: 'Telecom', companyName: 'Verizon Communications Inc.' },
        'HD': { sector: 'Consumer Cyclical', industry: 'Home Improvement', companyName: 'The Home Depot Inc.' },
        'NKE': { sector: 'Consumer Cyclical', industry: 'Apparel', companyName: 'Nike Inc.' },
        'BA': { sector: 'Industrial', industry: 'Aerospace', companyName: 'Boeing Company' },
        'CAT': { sector: 'Industrial', industry: 'Farm & Construction', companyName: 'Caterpillar Inc.' },
        'GE': { sector: 'Industrial', industry: 'Conglomerate', companyName: 'General Electric Company' },
        'IBM': { sector: 'Technology', industry: 'IT Services', companyName: 'International Business Machines Corp.' },
        'ORCL': { sector: 'Technology', industry: 'Software', companyName: 'Oracle Corporation' },
        'SAP': { sector: 'Technology', industry: 'Software', companyName: 'SAP SE' },
        'BABA': { sector: 'Consumer Cyclical', industry: 'E-Commerce', companyName: 'Alibaba Group Holding Ltd.' },
        'TSM': { sector: 'Technology', industry: 'Semiconductors', companyName: 'Taiwan Semiconductor Manufacturing Co.' },
        'ASML': { sector: 'Technology', industry: 'Semiconductor Equipment', companyName: 'ASML Holding NV' },
        'UNH': { sector: 'Healthcare', industry: 'Managed Care', companyName: 'UnitedHealth Group Inc.' },
        'PFE': { sector: 'Healthcare', industry: 'Pharmaceuticals', companyName: 'Pfizer Inc.' },
        'LLY': { sector: 'Healthcare', industry: 'Pharmaceuticals', companyName: 'Eli Lilly and Company' },
        'ABT': { sector: 'Healthcare', industry: 'Medical Devices', companyName: 'Abbott Laboratories' },
        'TMO': { sector: 'Healthcare', industry: 'Life Sciences', companyName: 'Thermo Fisher Scientific Inc.' },
        'DHR': { sector: 'Healthcare', industry: 'Medical Devices', companyName: 'Danaher Corporation' },
        'NEE': { sector: 'Utilities', industry: 'Electric Utilities', companyName: 'NextEra Energy Inc.' },
        'DUK': { sector: 'Utilities', industry: 'Electric Utilities', companyName: 'Duke Energy Corporation' },
        'SO': { sector: 'Utilities', industry: 'Electric Utilities', companyName: 'The Southern Company' },
        'AEP': { sector: 'Utilities', industry: 'Electric Utilities', companyName: 'American Electric Power Company Inc.' },
        'AMT': { sector: 'Real Estate', industry: 'REIT', companyName: 'American Tower Corporation' },
        'PLD': { sector: 'Real Estate', industry: 'REIT', companyName: 'Prologis Inc.' },
        'EQIX': { sector: 'Real Estate', industry: 'REIT', companyName: 'Equinix Inc.' },
        'SPG': { sector: 'Real Estate', industry: 'REIT', companyName: 'Simon Property Group Inc.' },
        'V': { sector: 'Financial Services', industry: 'Payment Processing', companyName: 'Visa Inc.' },
        'MA': { sector: 'Financial Services', industry: 'Payment Processing', companyName: 'Mastercard Inc.' },
        'AXP': { sector: 'Financial Services', industry: 'Payment Processing', companyName: 'American Express Company' },
        'GS': { sector: 'Financial Services', industry: 'Investment Banking', companyName: 'The Goldman Sachs Group Inc.' },
        'MS': { sector: 'Financial Services', industry: 'Investment Banking', companyName: 'Morgan Stanley' },
        'BLK': { sector: 'Financial Services', industry: 'Asset Management', companyName: 'BlackRock Inc.' },
        'SCHW': { sector: 'Financial Services', industry: 'Capital Markets', companyName: 'The Charles Schwab Corporation' },
        'COST': { sector: 'Consumer Defensive', industry: 'Discount Stores', companyName: 'Costco Wholesale Corporation' },
        'TGT': { sector: 'Consumer Defensive', industry: 'Discount Stores', companyName: 'Target Corporation' },
        'LOW': { sector: 'Consumer Cyclical', industry: 'Home Improvement', companyName: "Lowe's Companies Inc." },
        'SBUX': { sector: 'Consumer Cyclical', industry: 'Restaurants', companyName: 'Starbucks Corporation' },
        'MCD': { sector: 'Consumer Cyclical', industry: 'Restaurants', companyName: "McDonald's Corporation" },
        'YUM': { sector: 'Consumer Cyclical', industry: 'Restaurants', companyName: 'Yum! Brands Inc.' },
        'CMG': { sector: 'Consumer Cyclical', industry: 'Restaurants', companyName: 'Chipotle Mexican Grill Inc.' },
        'NOC': { sector: 'Industrial', industry: 'Aerospace & Defense', companyName: 'Northrop Grumman Corporation' },
        'LMT': { sector: 'Industrial', industry: 'Aerospace & Defense', companyName: 'Lockheed Martin Corporation' },
        'RTX': { sector: 'Industrial', industry: 'Aerospace & Defense', companyName: 'RTX Corporation' },
        'GD': { sector: 'Industrial', industry: 'Aerospace & Defense', companyName: 'General Dynamics Corporation' },
        'DE': { sector: 'Industrial', industry: 'Farm & Construction', companyName: 'Deere & Company' },
        'MMM': { sector: 'Industrial', industry: 'Conglomerate', companyName: '3M Company' },
        'HON': { sector: 'Industrial', industry: 'Conglomerate', companyName: 'Honeywell International Inc.' },
        'UPS': { sector: 'Industrial', industry: 'Logistics', companyName: 'United Parcel Service Inc.' },
        'FDX': { sector: 'Industrial', industry: 'Logistics', companyName: 'FedEx Corporation' },
        'LUV': { sector: 'Industrial', industry: 'Airlines', companyName: 'Southwest Airlines Co.' },
        'DAL': { sector: 'Industrial', industry: 'Airlines', companyName: 'Delta Air Lines Inc.' },
        'UAL': { sector: 'Industrial', industry: 'Airlines', companyName: 'United Airlines Holdings Inc.' },
        'AAL': { sector: 'Industrial', industry: 'Airlines', companyName: 'American Airlines Group Inc.' },
        'CVX': { sector: 'Energy', industry: 'Oil & Gas', companyName: 'Chevron Corporation' },
        'COP': { sector: 'Energy', industry: 'Oil & Gas', companyName: 'ConocoPhillips' },
        'SLB': { sector: 'Energy', industry: 'Oil Services', companyName: 'Schlumberger Limited' },
        'EOG': { sector: 'Energy', industry: 'Oil & Gas', companyName: 'EOG Resources Inc.' },
        'MPC': { sector: 'Energy', industry: 'Oil & Gas Refining', companyName: 'Marathon Petroleum Corporation' },
        'PSX': { sector: 'Energy', industry: 'Oil & Gas Refining', companyName: 'Phillips 66' },
        'VLO': { sector: 'Energy', industry: 'Oil & Gas Refining', companyName: 'Valero Energy Corporation' },
        'LIN': { sector: 'Materials', industry: 'Chemicals', companyName: 'Linde plc' },
        'APD': { sector: 'Materials', industry: 'Chemicals', companyName: 'Air Products and Chemicals Inc.' },
        'FCX': { sector: 'Materials', industry: 'Metals & Mining', companyName: 'Freeport-McMoRan Inc.' },
        'NEM': { sector: 'Materials', industry: 'Metals & Mining', companyName: 'Newmont Corporation' },
        'GOLD': { sector: 'Materials', industry: 'Metals & Mining', companyName: 'Barrick Gold Corporation' }
      };

      const commonStock = commonStocks[symbol.toUpperCase()];
      if (commonStock) {
        return commonStock;
      }

      return {
        sector: 'Unknown',
        industry: 'Unknown',
        companyName: symbol
      };
    }
  };

  const parsePortfolioInput = async (input: string): Promise<PortfolioHolding[]> => {
    const holdings: PortfolioHolding[] = []
    const parts = input.split(',').map(part => part.trim())
    
    for (const part of parts) {
      const match = part.match(/([A-Za-z]+)\s+(\d+(?:\.\d+)?)%/)
      if (match) {
        const [, symbol, allocation] = match
        const sectorInfo = await getStockSectorAndIndustry(symbol.toUpperCase())
        
        holdings.push({
          symbol: symbol.toUpperCase(),
          allocation: parseFloat(allocation),
          sector: sectorInfo.sector,
          industry: sectorInfo.industry,
          companyName: sectorInfo.companyName
        })
      }
    }
    
    // Normalize allocations to sum to 100%
    const totalAllocation = holdings.reduce((sum, holding) => sum + holding.allocation, 0)
    if (totalAllocation !== 100) {
      return holdings.map(holding => ({
        ...holding,
        allocation: (holding.allocation / totalAllocation) * 100
      }))
    }
    
    return holdings
  }

  const calculateSectorAllocation = (holdings: PortfolioHolding[]): { sector: string; allocation: number; icon: JSX.Element; color: string }[] => {
    const sectorMap = new Map<string, number>()
    
    // Calculate total allocation per sector
    holdings.forEach(holding => {
      const sector = holding.sector || 'Unknown'
      const currentAllocation = sectorMap.get(sector) || 0
      sectorMap.set(sector, currentAllocation + holding.allocation)
    })
    
    // Convert to array and add icons/colors
    return Array.from(sectorMap.entries())
      .map(([sector, allocation]) => ({
        sector,
        allocation: Number(allocation.toFixed(2)),
        icon: SECTOR_CONFIG[sector]?.icon || <Building2 className="h-4 w-4" />,
        color: SECTOR_CONFIG[sector]?.color || '#6B7280'
      }))
      .sort((a, b) => b.allocation - a.allocation)
  }

  const calculateIndustryAllocation = (holdings: PortfolioHolding[]): { industry: string; allocation: number; sector: string }[] => {
    const industryMap = new Map<string, { allocation: number; sector: string }>()
    
    holdings.forEach(holding => {
      const industry = holding.industry || 'Unknown'
      const current = industryMap.get(industry) || { allocation: 0, sector: holding.sector || 'Unknown' }
      industryMap.set(industry, {
        allocation: current.allocation + holding.allocation,
        sector: holding.sector || 'Unknown'
      })
    })
    
    return Array.from(industryMap.entries())
      .map(([industry, data]) => ({
        industry,
        allocation: Number(data.allocation.toFixed(2)),
        sector: data.sector
      }))
      .sort((a, b) => b.allocation - a.allocation)
      .slice(0, 10) // Top 10 industries
  }

  const fetchStockPriceData = async (symbol: string): Promise<StockData> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/investments/stock/${symbol}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch price data for ${symbol}`)
      }
      
      const data = await response.json()
      
      return {
        symbol,
        price: data.quote?.price || 100,
        change: data.quote?.change || 0,
        changePercent: data.quote?.changePercent || 0,
        volatility: calculateVolatility(data.historical || [])
      }
    } catch (error) {
      console.warn(`Could not fetch price data for ${symbol}:`, error)
      return {
        symbol,
        price: 100,
        change: 0,
        changePercent: 0,
        volatility: 0.2 // Default volatility
      }
    }
  }

  const calculateVolatility = (historicalData: any[]): number => {
    if (!historicalData || historicalData.length < 2) return 0.2
    
    const returns = []
    for (let i = 1; i < historicalData.length; i++) {
      const current = historicalData[i].close
      const previous = historicalData[i-1].close
      if (previous > 0) {
        returns.push((current - previous) / previous)
      }
    }
    
    if (returns.length === 0) return 0.2
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length
    const variance = returns.reduce((acc, ret) => acc + Math.pow(ret - mean, 2), 0) / returns.length
    return Math.sqrt(variance) * Math.sqrt(252) // Annualized volatility
  }

  const optimizePortfolio = async () => {
    if (!portfolioInput.trim()) {
      setError('Please enter portfolio holdings')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const parsedHoldings = await parsePortfolioInput(portfolioInput)
      
      if (parsedHoldings.length === 0) {
        setError('Invalid portfolio format. Use: "AAPL 60%, MSFT 40%"')
        setLoading(false)
        return
      }

      setHoldings(parsedHoldings)

      // Fetch current prices and volatility data
      const stockDataPromises = parsedHoldings.map(holding =>
        fetchStockPriceData(holding.symbol)
      )

      const stockData = await Promise.all(stockDataPromises)

      // Calculate real sector allocation
      const sectorAllocation = calculateSectorAllocation(parsedHoldings)
      const industryAllocation = calculateIndustryAllocation(parsedHoldings)

      // Calculate portfolio metrics using real data
      const portfolioAnalysis: PortfolioAnalysis = {
        var95: calculateVaR(parsedHoldings, stockData),
        sharpeRatio: calculateSharpeRatio(parsedHoldings, stockData),
        diversification: calculateDiversification(parsedHoldings),
        concentrationRisk: parsedHoldings.some(h => h.allocation > 50),
        topHoldings: parsedHoldings
          .sort((a, b) => b.allocation - a.allocation)
          .slice(0, 3)
          .map(h => ({ symbol: h.symbol, allocation: h.allocation, sector: h.sector || 'Unknown' })),
        sectorAllocation,
        industryAllocation,
        analysis: generatePortfolioAnalysis(parsedHoldings, stockData, sectorAllocation),
        recommendations: await generateAIPortfolioRecommendations(parsedHoldings, stockData, sectorAllocation)
      }

      setAnalysis(portfolioAnalysis)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to optimize portfolio')
    } finally {
      setLoading(false)
    }
  }

  const calculateVaR = (holdings: PortfolioHolding[], stockData: StockData[]): number => {
    const portfolioVolatility = holdings.reduce((vol, holding) => {
      const stock = stockData.find(s => s.symbol === holding.symbol)
      return vol + (stock?.volatility || 0.2) * (holding.allocation / 100)
    }, 0)
    return Math.round(portfolioVolatility * 100 * 1.645) // 95% confidence
  }

  const calculateSharpeRatio = (holdings: PortfolioHolding[], stockData: StockData[]): number => {
    const expectedReturn = holdings.reduce((ret, holding) => {
      const stock = stockData.find(s => s.symbol === holding.symbol)
      // Use historical performance or default expected returns
      const stockReturn = stock?.changePercent ? (stock.changePercent / 100) * 252 : 0.08
      return ret + stockReturn * (holding.allocation / 100)
    }, 0)
    
    const riskFreeRate = 0.02
    const volatility = holdings.reduce((vol, holding) => {
      const stock = stockData.find(s => s.symbol === holding.symbol)
      return vol + (stock?.volatility || 0.2) * (holding.allocation / 100)
    }, 0)
    
    return Number(((expectedReturn - riskFreeRate) / Math.max(volatility, 0.01)).toFixed(2))
  }

  const calculateDiversification = (holdings: PortfolioHolding[]): 'Low' | 'Medium' | 'High' => {
    const herfindahl = holdings.reduce((sum, holding) => 
      sum + Math.pow(holding.allocation / 100, 2), 0
    )
    if (herfindahl > 0.25) return 'Low'
    if (herfindahl > 0.15) return 'Medium'
    return 'High'
  }

  const generatePortfolioAnalysis = (
    holdings: PortfolioHolding[], 
    stockData: StockData[],
    sectorAllocation: { sector: string; allocation: number }[]
  ): string => {
    const sectorsCount = new Set(holdings.map(h => h.sector)).size
    const topSector = sectorAllocation[0]
    const totalValue = holdings.reduce((sum, holding) => {
      const stock = stockData.find(s => s.symbol === holding.symbol)
      return sum + (stock?.price || 0) * (holding.allocation / 100)
    }, 0)
    
    return `Portfolio Analysis:
• Total Holdings: ${holdings.length} assets across ${sectorsCount} sectors
• Estimated Portfolio Value: $${totalValue.toFixed(2)}
• Top Sector: ${topSector?.sector || 'N/A'} (${topSector?.allocation || 0}%)
• Weighted Average Volatility: ${calculateVaR(holdings, stockData)}%
• Risk-Adjusted Return (Sharpe): ${calculateSharpeRatio(holdings, stockData)}
• Top 3 Holdings: ${holdings.slice(0, 3).map(h => `${h.symbol} (${h.sector})`).join(', ')}
• Risk Assessment: ${calculateDiversification(holdings)} diversification
• Sector Concentration: ${sectorAllocation[0]?.allocation > 40 ? 'High sector concentration' : 'Well diversified across sectors'}
    
Based on current market data and sector allocations.`
  }

  const generateAIPortfolioRecommendations = async (
    holdings: PortfolioHolding[], 
    stockData: StockData[],
    sectorAllocation: { sector: string; allocation: number }[]
  ): Promise<string> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/investments/analyze-portfolio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          holdings: holdings.map(h => ({
            symbol: h.symbol,
            allocation: h.allocation,
            sector: h.sector,
            industry: h.industry
          })),
          sectorAllocation,
          metrics: {
            var95: calculateVaR(holdings, stockData),
            sharpeRatio: calculateSharpeRatio(holdings, stockData),
            diversification: calculateDiversification(holdings)
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        return data.recommendations || generateFallbackRecommendations(holdings, sectorAllocation)
      }
    } catch (error) {
      console.warn('AI analysis failed, using fallback recommendations:', error)
    }
    
    return generateFallbackRecommendations(holdings, sectorAllocation)
  }

  const generateFallbackRecommendations = (
    holdings: PortfolioHolding[],
    sectorAllocation: { sector: string; allocation: number }[]
  ): string => {
    const topHolding = holdings[0]
    const topSector = sectorAllocation[0]
    const needsRebalancing = topHolding.allocation > 40
    const sectorConcentration = topSector.allocation > 50
    
    return `Portfolio Recommendations:
${needsRebalancing ? `⚠️ Reduce ${topHolding.symbol} exposure from ${topHolding.allocation}% to under 25%` : '✅ Individual stock allocation appears balanced'}
${sectorConcentration ? `⚠️ High ${topSector.sector} sector concentration (${topSector.allocation}%) - consider diversifying` : '✅ Sector allocation appears diversified'}

Key Recommendations:
1. ${sectorAllocation.find(s => s.sector === 'Technology') ? 'Technology sector shows strong momentum' : 'Consider adding technology exposure for growth'}
2. ${sectorAllocation.find(s => s.sector === 'Healthcare') ? 'Healthcare provides defensive characteristics' : 'Add healthcare for defensive positioning'}
3. ${sectorAllocation.find(s => s.sector === 'Financial Services') ? 'Financials benefit from current rate environment' : 'Consider financials for income generation'}
4. Implement trailing stop-loss at 15% for high-volatility positions
5. Quarterly rebalancing recommended to maintain target allocations

Target Allocation Strategy:
• Growth Sectors (Tech, Comm): 30-40%
• Defensive Sectors (Healthcare, Consumer): 30-40%
• Cyclical Sectors (Financial, Industrial): 20-30%`
  }

  const exportReport = () => {
    if (!analysis) return
    
    const report = `
Portfolio Optimization Report
Generated: ${new Date().toLocaleDateString()}

Holdings:
${holdings.map(h => `${h.symbol} (${h.companyName}): ${h.allocation}% - ${h.sector} / ${h.industry}`).join('\n')}

Sector Allocation:
${analysis.sectorAllocation.map(s => `${s.sector}: ${s.allocation}%`).join('\n')}

Key Metrics:
• Value at Risk (95%): ${analysis.var95}%
• Sharpe Ratio: ${analysis.sharpeRatio}
• Diversification: ${analysis.diversification}
• Concentration Risk: ${analysis.concentrationRisk ? 'Yes' : 'No'}

Analysis:
${analysis.analysis}

Recommendations:
${analysis.recommendations}
    `.trim()

    const blob = new Blob([report], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'portfolio-optimization-report.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const pieData = holdings.map((holding, index) => ({
    name: holding.symbol,
    value: holding.allocation,
    color: `hsl(${index * 137.5}, 70%, 50%)`
  }))

  const sectorData = analysis?.sectorAllocation || []
  const industryData = analysis?.industryAllocation || []

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card className="bg-[#1a1a1a] border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <PieChartIcon className="h-5 w-5 text-emerald-400" />
            Portfolio Optimizer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Enter portfolio holdings (e.g., &quot;AAPL 60%, MSFT 40%&quot;)"
              value={portfolioInput}
              onChange={(e) => setPortfolioInput(e.target.value)}
              rows={3}
              className="bg-[#0a0a0a] border-gray-700 text-white placeholder-gray-500"
            />
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={() => setPortfolioInput('AAPL 40%, JPM 25%, JNJ 20%, XOM 15%')}
                variant="outline"
                size="sm"
              >
                Try Diversified Sample
              </Button>
              <Button 
                onClick={() => setPortfolioInput('AAPL 70%, MSFT 30%')}
                variant="outline"
                size="sm"
              >
                Try Tech Sample
              </Button>
              <Button 
                onClick={optimizePortfolio}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Optimizing...' : '🚀 Optimize Portfolio'}
              </Button>
            </div>
            <p className="text-sm text-gray-400">
              Enter holdings in format: "SYMBOL allocation%, SYMBOL allocation%". The system will fetch real sector data and prices.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Card className="bg-[#1a1a1a] border-gray-800">
          <CardContent className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            <span className="ml-3 text-gray-400">Fetching stock data and optimizing portfolio...</span>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {analysis && !loading && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-[#1a1a1a] border-gray-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-400">VaR (95%)</p>
                  <p className={`text-2xl font-bold ${analysis.var95 > 15 ? 'text-red-400' : 'text-green-400'}`}>
                    {analysis.var95}%
                  </p>
                  <p className="text-xs text-gray-500">Value at Risk</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a1a] border-gray-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-400">Sharpe Ratio</p>
                  <p className={`text-2xl font-bold ${analysis.sharpeRatio > 1 ? 'text-green-400' : analysis.sharpeRatio > 0.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {analysis.sharpeRatio}
                  </p>
                  <p className="text-xs text-gray-500">Risk-Adjusted Return</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a1a] border-gray-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-400">Diversification</p>
                  <Badge 
                    className={`
                      ${analysis.diversification === 'High' ? 'bg-green-500' : 
                        analysis.diversification === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'}
                    `}
                  >
                    {analysis.diversification}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">Portfolio Spread</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a1a] border-gray-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-400">Concentration</p>
                  <div className={`text-2xl font-bold ${analysis.concentrationRisk ? 'text-red-400' : 'text-green-400'}`}>
                    {analysis.concentrationRisk ? '⚠️' : '✅'}
                  </div>
                  <p className="text-xs text-gray-500">Risk Level</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 bg-[#1a1a1a] border border-gray-800">
              <TabsTrigger value="analysis" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Portfolio Analysis</TabsTrigger>
              <TabsTrigger value="sectors" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Sector Allocation</TabsTrigger>
              <TabsTrigger value="recommendations" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Holdings Pie Chart */}
                <Card className="bg-[#1a1a1a] border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Asset Allocation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [`${value}%`, 'Allocation']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Sector Allocation */}
                <Card className="bg-[#1a1a1a] border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Sector Allocation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sectorData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="sector" angle={-45} textAnchor="end" height={80} />
                          <YAxis />
                          <Tooltip formatter={(value: number) => [`${value}%`, 'Allocation']} />
                          <Legend />
                          <Bar dataKey="allocation" name="Sector Weight">
                            {sectorData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sector Breakdown */}
              <Card className="bg-[#1a1a1a] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Sector Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sectorData.map((sector, index) => (
                      <div key={sector.sector} className="flex items-center justify-between p-4 border border-gray-800 rounded-lg bg-[#0a0a0a]">
                        <div className="flex items-center gap-3">
                          <div className="text-gray-400">{sector.icon}</div>
                          <div>
                            <div className="font-medium text-white">{sector.sector}</div>
                            <div className="text-sm text-gray-400">{sector.allocation}%</div>
                          </div>
                        </div>
                        <div className="w-20 bg-gray-700 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full"
                            style={{ 
                              width: `${sector.allocation}%`,
                              backgroundColor: sector.color
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Holdings */}
              <Card className="bg-[#1a1a1a] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Top Holdings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.topHoldings.map((holding, index) => (
                      <div key={holding.symbol} className="flex items-center justify-between p-3 bg-[#0a0a0a] border border-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: pieData[index]?.color }} />
                          <div>
                            <span className="font-medium text-white">{holding.symbol}</span>
                            <div className="text-sm text-gray-400">{holding.sector}</div>
                          </div>
                        </div>
                        <Badge variant="secondary">{holding.allocation}%</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sectors">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Detailed Sector Analysis */}
                <Card className="bg-[#1a1a1a] border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Sector Allocation Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sectorData.map((sector) => (
                        <div key={sector.sector} className="flex items-center justify-between p-3 border border-gray-800 rounded-lg bg-[#0a0a0a]">
                          <div className="flex items-center gap-3">
                            <div className="text-gray-400">{sector.icon}</div>
                            <span className="font-medium text-white">{sector.sector}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-medium text-white">{sector.allocation}%</span>
                            <div className="w-32 bg-gray-700 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full"
                                style={{ 
                                  width: `${sector.allocation}%`,
                                  backgroundColor: sector.color
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Industry Breakdown */}
                <Card className="bg-[#1a1a1a] border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Industry Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {industryData.map((industry, index) => (
                        <div key={industry.industry} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm text-white">{industry.industry}</div>
                            <div className="text-xs text-gray-400">{industry.sector}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-sm text-white">{industry.allocation}%</span>
                            <div className="w-24 bg-gray-700 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full"
                                style={{ 
                                  width: `${industry.allocation}%`,
                                  backgroundColor: SECTOR_CONFIG[industry.sector]?.color || '#6B7280'
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="recommendations">
              <Card className="bg-[#1a1a1a] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Portfolio Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-gray-300 bg-[#0a0a0a] border border-gray-800 p-4 rounded-lg">
                      {analysis.recommendations}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4">
                    <div className="text-sm text-gray-400">
                      Analysis generated on {new Date().toLocaleDateString()}
                    </div>
                    <Button onClick={exportReport} className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Export Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}