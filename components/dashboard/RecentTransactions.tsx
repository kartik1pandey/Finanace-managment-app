interface Transaction {
  id: string
  description: string
  amount: number
  category: string
  date: string
  type: 'income' | 'expense'
}

interface RecentTransactionsProps {
  transactions: Transaction[]
}

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Salary': 'bg-green-100 text-green-800',
      'Investment': 'bg-blue-100 text-blue-800',
      'Food': 'bg-red-100 text-red-800',
      'Shopping': 'bg-purple-100 text-purple-800',
      'Transport': 'bg-yellow-100 text-yellow-800',
      'Entertainment': 'bg-pink-100 text-pink-800',
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
      
      <div className="space-y-3">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
            <div className="flex items-center space-x-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <span className={`text-sm font-semibold ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'income' ? '↑' : '↓'}
                </span>
              </div>
              
              <div>
                <p className="font-medium text-gray-900">{transaction.description}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(transaction.category)}`}>
                    {transaction.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(transaction.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            
            <p className={`font-semibold ${
              transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
            }`}>
              {transaction.type === 'income' ? '+' : '-'}₹{Math.abs(transaction.amount).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}