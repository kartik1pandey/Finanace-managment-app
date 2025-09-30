interface FinancialSummaryProps {
  data: {
    net_worth: number
    total_income: number
    total_expenses: number
    savings_rate: number
  }
}

export default function FinancialSummary({ data }: FinancialSummaryProps) {
  const cards = [
    {
      title: 'Net Worth',
      value: `₹${data.net_worth.toLocaleString()}`,
      description: 'Total assets minus liabilities',
      trend: data.net_worth > 0 ? 'positive' : 'negative'
    },
    {
      title: 'Monthly Income',
      value: `₹${data.total_income.toLocaleString()}`,
      description: 'Last 30 days',
      trend: 'positive'
    },
    {
      title: 'Monthly Expenses',
      value: `₹${data.total_expenses.toLocaleString()}`,
      description: 'Last 30 days',
      trend: 'negative'
    },
    {
      title: 'Savings Rate',
      value: `${data.savings_rate}%`,
      description: 'Of total income',
      trend: data.savings_rate > 20 ? 'positive' : 'neutral'
    }
  ]

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'positive': return 'text-green-600'
      case 'negative': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-600 mb-2">{card.title}</h3>
          <p className={`text-2xl font-bold ${getTrendColor(card.trend)} mb-1`}>
            {card.value}
          </p>
          <p className="text-sm text-gray-500">{card.description}</p>
        </div>
      ))}
    </div>
  )
}