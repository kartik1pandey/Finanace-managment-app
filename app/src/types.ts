// src/types.ts
export interface MCPSession {
  sessionId: string;
  loginUrl?: string;
  isLoggedIn: boolean;
}

export interface FinancialData {
  summary: {
    net_worth: number;
    total_income: number;
    total_expenses: number;
    savings_rate: number;
    monthly_trend: string;
  };
  assets?: Array<{ type: string; value: number }>;
  liabilities?: Array<{ type: string; value: number }>;
  cash_flow?: {
    monthly_data: Array<{
      month: string;
      income: number;
      expenses: number;
      savings: number;
    }>;
    categories: Array<{
      name: string;
      amount: number;
      percentage: number;
    }>;
  };
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

// ---- Constants ----
export const BACKEND = 'http://localhost:8000';
export const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B9D'];