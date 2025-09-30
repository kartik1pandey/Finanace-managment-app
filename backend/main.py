from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import uvicorn
import asyncio

# Import services
try:
    from groq_service import groq_advisor
    from investment_service import investment_service
    from loans_service import loans_service
    print("✅ Services imported successfully")
except ImportError as e:
    print(f"❌ Failed to import services: {e}")

# Create mock services if imports fail
class MockInvestmentService:
    def get_portfolio_summary(self, user_id):
        return {"total_value": 850000, "status": "mock"}
    
    def get_stock_analysis(self, symbol):
        return {"analysis": "mock", "symbol": symbol}
    
    def predict_stock_price(self, symbol, days):
        return {"symbol": symbol, "prediction": "mock", "days": days}
    
    def get_market_overview(self):
        return {"market": "mock"}

class MockLoansService:
    def get_loans_summary(self, user_id):
        return {"total_loans": 500000, "status": "mock"}
    
    def get_amortization_schedule(self, loan_id, user_id):
        return {"schedule": "mock"}
    
    def calculate_emi(self, principal, interest_rate, tenure_years):
        return {"emi": "mock"}
    
    def calculate_prepayment_savings(self, loan_id, user_id, prepayment_amount):
        return {"savings": "mock"}
    
    def get_debt_consolidation_advice(self, user_id):
        return {"advice": "mock"}

# Initialize services (use real services if available, else mock)
investment_service = investment_service if 'investment_service' in globals() else MockInvestmentService()
loans_service = loans_service if 'loans_service' in globals() else MockLoansService()
groq_advisor = groq_advisor if 'groq_advisor' in globals() else None

app = FastAPI(title="ArthSahay Financial Advisor", version="1.0.0")

# Enhanced CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request validation
class ChatRequest(BaseModel):
    message: str
    user_id: int = 1

class LoanCalculationRequest(BaseModel):
    principal: float
    interest_rate: float
    tenure_years: int

class PrepaymentRequest(BaseModel):
    prepayment_amount: float

# Health check endpoints
@app.get("/")
def read_root():
    return {
        "message": "ArthSahay Backend is running!",
        "timestamp": datetime.now().isoformat(),
        "endpoints": {
            "health": "/health",
            "advisor_chat": "POST /api/advisor/chat",
            "financial_data": "GET /api/financial/summary/1"
        }
    }

@app.get("/health")
def health_check():
    groq_status = "connected" if groq_advisor and groq_advisor.client else "mock_mode"
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "groq_service": groq_status,
        "endpoints_available": True
    }

# Advisor chat endpoint
@app.post("/api/advisor/chat")
async def chat_with_advisor(request: ChatRequest):
    """Enhanced AI financial advisor with Groq LLM and complete financial context"""
    print(f"📨 Received chat request: {request.message} from user {request.user_id}")
    
    if not request.message.strip():
        return {
            "response": "Please enter a message to get financial advice.",
            "suggestions": [
                "Ask about your savings",
                "Get investment advice", 
                "Discuss loan optimization",
                "Plan for retirement"
            ]
        }
    
    if not groq_advisor:
        return {
            "response": "Financial advisor service is currently initializing. Please try again in a moment.",
            "suggestions": ["Retry conversation", "Check financial dashboard"],
            "error": "Service not available"
        }
    
    try:
        advice_result = await groq_advisor.get_financial_advice(request.message, request.user_id)
        return advice_result
    except Exception as e:
        print(f"❌ Error in advisor chat: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="Financial advisor service is temporarily unavailable. Please try again in a moment."
        )

# Loans endpoints
@app.get("/api/loans/summary/{user_id}")
def get_loans_summary(user_id: int):
    """Get complete loans summary"""
    return loans_service.get_loans_summary(user_id)

@app.get("/api/loans/amortization/{user_id}/{loan_id}")
def get_amortization_schedule(user_id: int, loan_id: int):
    """Get amortization schedule for a loan"""
    return loans_service.get_amortization_schedule(loan_id, user_id)

@app.post("/api/loans/calculate-emi")
def calculate_emi(request: LoanCalculationRequest):
    """Calculate EMI for a new loan"""
    return loans_service.calculate_emi(request.principal, request.interest_rate, request.tenure_years)

@app.post("/api/loans/prepayment/{user_id}/{loan_id}")
def calculate_prepayment_savings(user_id: int, loan_id: int, request: PrepaymentRequest):
    """Calculate prepayment savings"""
    return loans_service.calculate_prepayment_savings(loan_id, user_id, request.prepayment_amount)

@app.get("/api/loans/debt-consolidation/{user_id}")
def get_debt_consolidation_advice(user_id: int):
    """Get debt consolidation advice"""
    return loans_service.get_debt_consolidation_advice(user_id)

@app.get("/api/loans/repayment-strategy/{user_id}")
def get_repayment_strategy(user_id: int):
    """Get optimal repayment strategy"""
    user_data = loans_service.get_loans_summary(user_id)
    return {
        "recommended_strategy": user_data.get("debt_analysis", {}).get("recommended_strategy", "avalanche"),
        "reasoning": "Focus on high-interest debts first to minimize total interest paid.",
        "steps": [
            "List all debts by interest rate (highest first)",
            "Make minimum payments on all debts",
            "Put extra money toward the highest interest debt",
            "Repeat until all debts are paid off"
        ]
    }

# Investment endpoints
@app.get("/api/investments/portfolio/{user_id}")
def get_investment_portfolio(user_id: int):
    """Get complete investment portfolio"""
    return investment_service.get_portfolio_summary(user_id)

@app.get("/api/investments/analysis/{symbol}")
def get_stock_analysis(symbol: str):
    """Get technical analysis for a stock"""
    return investment_service.get_stock_analysis(symbol)

@app.get("/api/investments/predict/{symbol}")
def predict_stock_price(symbol: str, days: int = 30):
    """Predict stock price using ML"""
    return investment_service.predict_stock_price(symbol, days)

@app.get("/api/investments/market-overview")
def get_market_overview():
    """Get market overview"""
    return investment_service.get_market_overview()

@app.get("/api/investments/watchlist/{user_id}")
def get_watchlist(user_id: int):
    """Get user watchlist"""
    return {
        "watchlist": [
            {"symbol": "RELIANCE.NS", "name": "Reliance Industries", "current_price": 2850.50, "change_percent": 1.2},
            {"symbol": "TCS.NS", "name": "Tata Consultancy Services", "current_price": 3650.75, "change_percent": -0.5},
            {"symbol": "INFY.NS", "name": "Infosys", "current_price": 1650.25, "change_percent": 0.8},
            {"symbol": "HDFCBANK.NS", "name": "HDFC Bank", "current_price": 1550.60, "change_percent": 1.5},
            {"symbol": "BAJFINANCE.NS", "name": "Bajaj Finance", "current_price": 7200.80, "change_percent": -1.2}
        ]
    }

# Financial data endpoints
@app.get("/api/financial/summary/1")
def get_financial_data():
    """Complete financial data for user 1"""
    return {
        "summary": {
            "net_worth": 1250000,
            "total_income": 95000,
            "total_expenses": 65000,
            "savings_rate": 31.6,
            "monthly_trend": "up"
        },
        "cash_flow": {
            "monthly_data": [
                {"month": "Aug 2024", "income": 92000, "expenses": 62000, "savings": 30000},
                {"month": "Sep 2024", "income": 94000, "expenses": 64000, "savings": 30000},
                {"month": "Oct 2024", "income": 95000, "expenses": 65000, "savings": 30000},
                {"month": "Nov 2024", "income": 97000, "expenses": 63000, "savings": 34000},
                {"month": "Dec 2024", "income": 98000, "expenses": 62000, "savings": 36000},
                {"month": "Jan 2025", "income": 95000, "expenses": 65000, "savings": 30000}
            ],
            "categories": [
                {"name": "Food & Dining", "amount": 12000, "percentage": 18.5},
                {"name": "Shopping", "amount": 8500, "percentage": 13.1},
                {"name": "Bills & Utilities", "amount": 7800, "percentage": 12.0},
                {"name": "Transport", "amount": 6500, "percentage": 10.0},
                {"name": "Entertainment", "amount": 5200, "percentage": 8.0},
                {"name": "Healthcare", "amount": 3200, "percentage": 4.9},
                {"name": "Travel", "amount": 15000, "percentage": 23.1},
                {"name": "Investments", "amount": 8000, "percentage": 12.3}
            ]
        },
        "investments": {
            "total_value": 850000,
            "total_return": 125000,
            "return_percentage": 17.2,
            "holdings": [
                {"name": "Stocks", "value": 350000, "return": 75000, "color": "#0088FE"},
                {"name": "Mutual Funds", "value": 250000, "return": 35000, "color": "#00C49F"},
                {"name": "Fixed Deposits", "value": 150000, "return": 12000, "color": "#FFBB28"},
                {"name": "Gold", "value": 80000, "return": 8000, "color": "#FF8042"},
                {"name": "Cryptocurrency", "value": 20000, "return": 5000, "color": "#8884D8"}
            ]
        },
        "recent_transactions": [
            {"id": "1", "description": "Salary - TechCorp", "amount": 95000, "category": "Salary", "date": "2025-01-15", "type": "income"},
            {"id": "2", "description": "Stock Dividend - RELIANCE", "amount": 2500, "category": "Investment", "date": "2025-01-14", "type": "income"},
            {"id": "3", "description": "BigBasket Groceries", "amount": 3500, "category": "Food & Dining", "date": "2025-01-14", "type": "expense"},
            {"id": "4", "description": "Amazon Shopping", "amount": 5200, "category": "Shopping", "date": "2025-01-13", "type": "expense"},
            {"id": "5", "description": "Uber Rides", "amount": 1200, "category": "Transport", "date": "2025-01-12", "type": "expense"},
            {"id": "6", "description": "Netflix Subscription", "amount": 649, "category": "Entertainment", "date": "2025-01-11", "type": "expense"},
            {"id": "7", "description": "Electricity Bill", "amount": 1800, "category": "Bills & Utilities", "date": "2025-01-10", "type": "expense"},
            {"id": "8", "description": "Apollo Pharmacy", "amount": 850, "category": "Healthcare", "date": "2025-01-09", "type": "expense"}
        ],
        "user_profile": {
            "name": "Aarav Sharma",
            "risk_profile": "moderate",
            "income_bracket": "high"
        }
    }

@app.get("/api/financial/cashflow/1")
def get_cashflow_data():
    """Get cashflow data for user 1"""
    return {
        "monthly_data": [
            {"month": "Aug 2024", "income": 92000, "expenses": 62000, "savings": 30000},
            {"month": "Sep 2024", "income": 94000, "expenses": 64000, "savings": 30000},
            {"month": "Oct 2024", "income": 95000, "expenses": 65000, "savings": 30000},
            {"month": "Nov 2024", "income": 97000, "expenses": 63000, "savings": 34000},
            {"month": "Dec 2024", "income": 98000, "expenses": 62000, "savings": 36000},
            {"month": "Jan 2025", "income": 95000, "expenses": 65000, "savings": 30000}
        ],
        "categories": [
            {"name": "Food & Dining", "amount": 12000, "percentage": 18.5},
            {"name": "Shopping", "amount": 8500, "percentage": 13.1},
            {"name": "Bills & Utilities", "amount": 7800, "percentage": 12.0},
            {"name": "Transport", "amount": 6500, "percentage": 10.0},
            {"name": "Entertainment", "amount": 5200, "percentage": 8.0},
            {"name": "Healthcare", "amount": 3200, "percentage": 4.9},
            {"name": "Travel", "amount": 15000, "percentage": 23.1},
            {"name": "Investments", "amount": 8000, "percentage": 12.3}
        ]
    }

@app.get("/api/financial/investments/1")
def get_investment_data():
    """Get investment data for user 1"""
    return {
        "total_value": 850000,
        "total_return": 125000,
        "return_percentage": 17.2,
        "holdings": [
            {"name": "Stocks", "value": 350000, "return": 75000, "color": "#0088FE"},
            {"name": "Mutual Funds", "value": 250000, "return": 35000, "color": "#00C49F"},
            {"name": "Fixed Deposits", "value": 150000, "return": 12000, "color": "#FFBB28"},
            {"name": "Gold", "value": 80000, "return": 8000, "color": "#FF8042"},
            {"name": "Cryptocurrency", "value": 20000, "return": 5000, "color": "#8884D8"}
        ]
    }

@app.get("/api/financial/health/1")
def get_financial_health():
    """Get financial health score for user 1"""
    return {
        "score": 82,
        "level": "Excellent",
        "breakdown": {
            "savings_rate": 31.6,
            "net_worth": 1250000,
            "investment_diversity": 5,
            "monthly_trend": "up"
        },
        "recommendations": [
            "Maintain your current savings rate of 31.6%",
            "Consider diversifying into international markets",
            "Review your travel expenses for optimization"
        ]
    }

@app.get("/api/advisor/financial-context/{user_id}")
def get_financial_context(user_id: int):
    """Get the complete financial context used by the AI advisor"""
    if groq_advisor:
        return groq_advisor.get_complete_financial_data(user_id)
    return {"error": "Advisor service not available"}

@app.get("/api/cashflow/analysis/1")
def get_cashflow_analysis():
    """Comprehensive cash flow analysis with insights"""
    return {
        "overview": {
            "total_income": 570000,
            "total_expenses": 380000,
            "total_savings": 190000,
            "average_monthly_savings": 31667,
            "savings_rate": 33.3
        },
        "monthly_trends": [
            {"month": "Aug 2024", "income": 92000, "expenses": 62000, "savings": 30000, "savings_rate": 32.6},
            {"month": "Sep 2024", "income": 94000, "expenses": 64000, "savings": 30000, "savings_rate": 31.9},
            {"month": "Oct 2024", "income": 95000, "expenses": 65000, "savings": 30000, "savings_rate": 31.6},
            {"month": "Nov 2024", "income": 97000, "expenses": 63000, "savings": 34000, "savings_rate": 35.1},
            {"month": "Dec 2024", "income": 98000, "expenses": 62000, "savings": 36000, "savings_rate": 36.7},
            {"month": "Jan 2025", "income": 95000, "expenses": 65000, "savings": 30000, "savings_rate": 31.6}
        ],
        "category_analysis": [
            {"name": "Food & Dining", "amount": 72000, "percentage": 18.9, "trend": "up", "budget": 60000, "status": "over_budget"},
            {"name": "Shopping", "amount": 51000, "percentage": 13.4, "trend": "stable", "budget": 50000, "status": "within_budget"},
            {"name": "Travel", "amount": 90000, "percentage": 23.7, "trend": "up", "budget": 60000, "status": "over_budget"},
            {"name": "Bills & Utilities", "amount": 46800, "percentage": 12.3, "trend": "stable", "budget": 45000, "status": "within_budget"},
            {"name": "Transport", "amount": 39000, "percentage": 10.3, "trend": "down", "budget": 40000, "status": "within_budget"},
            {"name": "Entertainment", "amount": 31200, "percentage": 8.2, "trend": "stable", "budget": 30000, "status": "within_budget"},
            {"name": "Healthcare", "amount": 19200, "percentage": 5.1, "trend": "down", "budget": 20000, "status": "within_budget"},
            {"name": "Investments", "amount": 30000, "percentage": 7.9, "trend": "up", "budget": 25000, "status": "over_budget"}
        ],
        "spending_insights": [
            {
                "type": "highest_spending",
                "category": "Travel",
                "amount": 90000,
                "message": "Travel expenses are 50% over budget. Consider planning trips in off-season."
            },
            {
                "type": "savings_opportunity", 
                "category": "Food & Dining",
                "amount": 12000,
                "message": "You could save ₹12,000 by reducing dining out by 30%."
            },
            {
                "type": "positive_trend",
                "category": "Transport",
                "amount": 1000,
                "message": "Transport costs decreased by 2.5% this month. Great job!"
            }
        ],
        "budget_summary": {
            "total_budget": 330000,
            "actual_spending": 380000,
            "remaining_budget": -50000,
            "budget_utilization": 115.2,
            "over_budget_categories": ["Travel", "Food & Dining", "Investments"]
        }
    }

@app.get("/api/cashflow/transactions/1")
def get_detailed_transactions():
    """Get detailed transaction history"""
    return {
        "transactions": [
            {"id": "1", "date": "2025-01-15", "description": "Salary - TechCorp", "amount": 95000, "category": "Salary", "type": "income", "account": "HDFC Bank"},
            {"id": "2", "date": "2025-01-14", "description": "Stock Dividend - RELIANCE", "amount": 2500, "category": "Investment", "type": "income", "account": "Demat"},
            {"id": "3", "date": "2025-01-14", "description": "BigBasket Groceries", "amount": 3500, "category": "Food & Dining", "type": "expense", "account": "HDFC Bank"},
            {"id": "4", "date": "2025-01-13", "description": "Amazon Shopping - Electronics", "amount": 5200, "category": "Shopping", "type": "expense", "account": "Credit Card"},
            {"id": "5", "date": "2025-01-12", "description": "Uber Rides", "amount": 1200, "category": "Transport", "type": "expense", "account": "PhonePe"},
            {"id": "6", "date": "2025-01-11", "description": "Netflix Subscription", "amount": 649, "category": "Entertainment", "type": "expense", "account": "Credit Card"},
            {"id": "7", "date": "2025-01-10", "description": "Electricity Bill", "amount": 1800, "category": "Bills & Utilities", "type": "expense", "account": "HDFC Bank"},
            {"id": "8", "date": "2025-01-09", "description": "Apollo Pharmacy", "amount": 850, "category": "Healthcare", "type": "expense", "account": "Credit Card"},
            {"id": "9", "date": "2025-01-08", "description": "Goa Flight Tickets", "amount": 12500, "category": "Travel", "type": "expense", "account": "Credit Card"},
            {"id": "10", "date": "2025-01-07", "description": "Hotel Booking - Goa", "amount": 8000, "category": "Travel", "type": "expense", "account": "Credit Card"},
            {"id": "11", "date": "2025-01-06", "description": "Restaurant - Social", "amount": 2200, "category": "Food & Dining", "type": "expense", "account": "PhonePe"},
            {"id": "12", "date": "2025-01-05", "description": "Mutual Fund SIP", "amount": 10000, "category": "Investments", "type": "expense", "account": "HDFC Bank"},
            {"id": "13", "date": "2025-01-04", "description": "Petrol", "amount": 3000, "category": "Transport", "type": "expense", "account": "Credit Card"},
            {"id": "14", "date": "2025-01-03", "description": "Mobile Recharge", "amount": 599, "category": "Bills & Utilities", "type": "expense", "account": "PhonePe"},
            {"id": "15", "date": "2025-01-02", "description": "Zomato Order", "amount": 850, "category": "Food & Dining", "type": "expense", "account": "Zomato Wallet"}
        ],
        "summary": {
            "total_income": 97500,
            "total_expenses": 47348,
            "net_cash_flow": 50152,
            "transaction_count": 15
        }
    }

@app.get("/api/cashflow/predictions/1")
def get_cashflow_predictions():
    """Get cash flow predictions for next 3 months"""
    return {
        "predictions": [
            {
                "month": "Feb 2025",
                "predicted_income": 96000,
                "predicted_expenses": 63000,
                "predicted_savings": 33000,
                "confidence": 0.85,
                "factors": ["Expected bonus", "Reduced travel plans"]
            },
            {
                "month": "Mar 2025", 
                "predicted_income": 97000,
                "predicted_expenses": 61000,
                "predicted_savings": 36000,
                "confidence": 0.78,
                "factors": ["Regular salary", "Optimized shopping"]
            },
            {
                "month": "Apr 2025",
                "predicted_income": 98000,
                "predicted_expenses": 62000,
                "predicted_savings": 36000,
                "confidence": 0.72,
                "factors": ["Salary increment", "Summer vacation planning"]
            }
        ],
        "recommendations": [
            "Reduce dining out by 20% to save ₹6,000 monthly",
            "Consider carpooling to save ₹2,000 on transport",
            "Review subscription services - potential savings of ₹1,500"
        ]
    }

if __name__ == "__main__":
    print("🚀 Starting ArthSahay Financial Advisor API...")
    print("📍 Endpoints available at:")
    print("   - http://localhost:8000")
    print("   - http://localhost:8000/health")
    print("   - POST http://localhost:8000/api/advisor/chat")
    print("   - GET http://localhost:8000/api/financial/summary/1")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        log_level="info"
    )