export interface FinancialSummary {
  net_worth: number
  total_income: number
  total_expenses: number
  savings_rate: number
  monthly_trend: string
}

export interface MonthlyData {
  month: string
  income: number
  expenses: number
  savings: number
}

export interface CategorySpending {
  name: string
  amount: number
  percentage: number
}

export interface CashFlowData {
  monthly_data: MonthlyData[]
  categories: CategorySpending[]
}

export interface InvestmentHolding {
  name: string
  value: number
  return: number
  color: string
}

export interface InvestmentData {
  total_value: number
  total_return: number
  return_percentage: number
  holdings: InvestmentHolding[]
}

export interface Transaction {
  id: string
  description: string
  amount: number
  category: string
  date: string
  type: string
}

export interface UserProfile {
  name: string
  risk_profile: string
  income_bracket: string
}

export interface FinancialData {
  summary: FinancialSummary
  cash_flow: CashFlowData
  investments: InvestmentData
  recent_transactions: Transaction[]
  user_profile: UserProfile
}