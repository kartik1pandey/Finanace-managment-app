from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class FinancialSummary(BaseModel):
    net_worth: float
    total_income: float
    total_expenses: float
    savings_rate: float

class MonthlyData(BaseModel):
    month: str
    income: float
    expenses: float
    savings: float

class CategorySpending(BaseModel):
    name: str
    amount: float
    percentage: float

class CashFlowData(BaseModel):
    monthly_data: List[MonthlyData]
    categories: List[CategorySpending]

class InvestmentHolding(BaseModel):
    name: str
    value: float
    return_: float
    color: str

class InvestmentData(BaseModel):
    total_value: float
    total_return: float
    return_percentage: float
    holdings: List[InvestmentHolding]

class Transaction(BaseModel):
    id: str
    description: str
    amount: float
    category: str
    date: str
    type: str

class FinancialData(BaseModel):
    summary: FinancialSummary
    cash_flow: CashFlowData
    investments: InvestmentData
    recent_transactions: List[Transaction]

class ChatRequest(BaseModel):
    message: str
    user_id: int

class ChatResponse(BaseModel):
    response: str
    suggestions: List[str]