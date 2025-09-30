'use client'
import { useState } from 'react'

interface HoldingsListProps {
  holdings: Array<{
    symbol: string
    name: string
    quantity: number
    avg_price: number
    current_price: number
    current_value: number
    investment: number
    profit_loss: number
    profit_loss_percent: number
  }>
  mutualFunds: Array<{
    name: string
    units: number
    nav: number
    investment: number
  }>
  fixedDeposits: Array<{
    bank: string
    amount: number
    interest_rate: number
    maturity: string
  }>
}

export default function HoldingsList({ holdings, mutualFunds, fixedDeposits }: HoldingsListProps) {
  const [activeTab, setActiveTab] = useState('stocks')

  const totalMFValue = mutualFunds.reduce((sum, mf) => sum + (mf.units * mf.nav), 0)
  const totalMFInvestment = mutualFunds.reduce((sum, mf) => sum + mf.investment, 0)
  const totalFDValue = fixedDeposits.reduce((sum, fd) => sum + fd.amount, 0)

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['stocks', 'mutual_funds', 'fixed_deposits'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'stocks' && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Investment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    P&L
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {holdings.map((holding) => (
                  <tr key={holding.symbol} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{holding.name}</div>
                        <div className="text-sm text-gray-500">{holding.symbol}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {holding.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{holding.avg_price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{holding.current_price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{holding.investment.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{holding.current_value.toLocaleString()}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      holding.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ₹{Math.abs(holding.profit_loss).toLocaleString()} ({holding.profit_loss_percent}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'mutual_funds' && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fund Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Units
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NAV
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Investment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Returns
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mutualFunds.map((fund, index) => {
                  const currentValue = fund.units * fund.nav
                  const returns = currentValue - fund.investment
                  const returnsPercent = (returns / fund.investment) * 100
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {fund.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {fund.units.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{fund.nav.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{fund.investment.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{currentValue.toLocaleString()}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        returns >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ₹{Math.abs(returns).toLocaleString()} ({returnsPercent.toFixed(2)}%)
                      </td>
                    </tr>
                  )
                })}
                <tr className="bg-gray-50">
                  <td colSpan={4} className="px-6 py-4 text-sm font-medium text-gray-900">
                    Total
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    ₹{totalMFValue.toLocaleString()}
                  </td>
                  <td className={`px-6 py-4 text-sm font-medium ${
                    (totalMFValue - totalMFInvestment) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ₹{Math.abs(totalMFValue - totalMFInvestment).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'fixed_deposits' && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Interest Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Maturity Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Maturity Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fixedDeposits.map((fd, index) => {
                  const maturityDate = new Date(fd.maturity)
                  const today = new Date()
                  const timeDiff = maturityDate.getTime() - today.getTime()
                  const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24))
                  const maturityAmount = fd.amount * (1 + fd.interest_rate/100)
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {fd.bank}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{fd.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {fd.interest_rate}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(fd.maturity).toLocaleDateString('en-IN')}
                        <div className="text-xs text-gray-500">{daysLeft} days left</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        ₹{maturityAmount.toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
                <tr className="bg-gray-50">
                  <td colSpan={1} className="px-6 py-4 text-sm font-medium text-gray-900">
                    Total
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    ₹{totalFDValue.toLocaleString()}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}