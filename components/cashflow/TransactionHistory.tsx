'use client'
import { useState } from 'react'

interface TransactionHistoryProps {
  data: {
    transactions: Array<{
      id: string
      date: string
      description: string
      amount: number
      category: string
      type: string
      account: string
    }>
    summary: {
      total_income: number
      total_expenses: number
      net_cash_flow: number
      transaction_count: number
    }
  }
}

export default function TransactionHistory({ data }: TransactionHistoryProps) {
  const [filter, setFilter] = useState('all')
  const { transactions, summary } = data

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true
    if (filter === 'income') return transaction.type === 'income'
    if (filter === 'expense') return transaction.type === 'expense'
    return transaction.category === filter
  })

  const categories = [...new Set(transactions.map(t => t.category))]

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Salary': 'bg-green-100 text-green-800',
      'Investment': 'bg-blue-100 text-blue-800',
      'Food & Dining': 'bg-red-100 text-red-800',
      'Shopping': 'bg-purple-100 text-purple-800',
      'Transport': 'bg-yellow-100 text-yellow-800',
      'Entertainment': 'bg-pink-100 text-pink-800',
      'Bills & Utilities': 'bg-indigo-100 text-indigo-800',
      'Healthcare': 'bg-teal-100 text-teal-800',
      'Travel': 'bg-orange-100 text-orange-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const getAccountColor = (account: string) => {
    const colors: { [key: string]: string } = {
      'HDFC Bank': 'bg-blue-50 text-blue-700 border-blue-200',
      'Credit Card': 'bg-red-50 text-red-700 border-red-200',
      'PhonePe': 'bg-purple-50 text-purple-700 border-purple-200',
      'Demat': 'bg-green-50 text-green-700 border-green-200',
      'Zomato Wallet': 'bg-orange-50 text-orange-700 border-orange-200'
    }
    return colors[account] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Income</h3>
          <p className="text-2xl font-bold text-green-600">₹{summary.total_income.toLocaleString()}</p>
          <p className="text-sm text-gray-500">This month</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Expenses</h3>
          <p className="text-2xl font-bold text-red-600">₹{summary.total_expenses.toLocaleString()}</p>
          <p className="text-sm text-gray-500">This month</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Net Cash Flow</h3>
          <p className="text-2xl font-bold text-blue-600">₹{summary.net_cash_flow.toLocaleString()}</p>
          <p className="text-sm text-gray-500">This month</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Transactions</h3>
          <p className="text-2xl font-bold text-purple-600">{summary.transaction_count}</p>
          <p className="text-sm text-gray-500">This month</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Transactions
          </button>
          <button
            onClick={() => setFilter('income')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'income' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Income
          </button>
          <button
            onClick={() => setFilter('expense')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'expense' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Expenses
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filter === category 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(transaction.date).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(transaction.category)}`}>
                      {transaction.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getAccountColor(transaction.account)}`}>
                      {transaction.account}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}₹{Math.abs(transaction.amount).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredTransactions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No transactions found for the selected filter.
          </div>
        )}
      </div>
    </div>
  )
}