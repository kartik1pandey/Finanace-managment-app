from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from datetime import datetime
import uvicorn
import httpx
from typing import Optional, List, Dict, Any
import os
import random
import json

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# MCP Configuration
MCP_SERVER_URL = os.getenv("MCP_SERVER_URL", "https://finanace-managment-app-2.onrender.com")

app = FastAPI(title="ArthSahay Financial Advisor", version="2.0.0")

# Security
security = HTTPBearer()

# Enhanced CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000", 
        "http://localhost:3001",
        "https://*.vercel.app",
        "https://*.netlify.app",
        os.getenv("FRONTEND_URL", "")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class ChatRequest(BaseModel):
    message: str
    user_id: int = 1
    session_id: Optional[str] = None

class StockRequest(BaseModel):
    symbol: str

class BatchStockRequest(BaseModel):
    symbols: List[str]

class AuthUser(BaseModel):
    id: str
    email: str
    user_metadata: dict = {}

# Mock authentication function
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    return {"user_id": "mock_user", "email": "user@example.com"}

# Helper functions for stock data
def get_mock_stock_data(symbol: str) -> Dict[str, Any]:
    """Generate consistent mock stock data"""
    # Use symbol hash for consistent data
    random.seed(hash(symbol) % 1000)
    
    base_price = random.uniform(50, 500)
    change = random.uniform(-20, 20)
    change_percent = (change / base_price) * 100
    
    return {
        "symbol": symbol.upper(),
        "price": round(base_price, 2),
        "change": round(change, 2),
        "changePercent": round(change_percent, 2),
        "volume": random.randint(100000, 50000000),
        "marketCap": f"${random.randint(1, 500)}B",
        "pe": str(round(random.uniform(10, 35), 2)),
        "eps": str(round(random.uniform(1, 10), 2)),
        "dividendYield": f"{round(random.uniform(0, 5), 2)}%",
        "beta": str(round(random.uniform(0.5, 2.0), 2)),
        "high": round(base_price * random.uniform(1.01, 1.05), 2),
        "low": round(base_price * random.uniform(0.95, 0.99), 2),
        "open": round(base_price * random.uniform(0.98, 1.02), 2),
        "previousClose": round(base_price - change, 2)
    }

# API Routes
@app.get("/")
def read_root():
    return {
        "message": "ArthSahay Backend v2.0 - Simplified",
        "timestamp": datetime.now().isoformat(),
        "features": ["Stock Data", "Mock Financial Data", "Health Checks"],
        "status": "active"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "simplified-backend",
        "endpoints_available": True
    }

# Stock endpoints
@app.post("/api/investments/stocks/batch")
async def get_multiple_stocks(request: BatchStockRequest):
    """Fetch basic data for multiple stocks at once"""
    try:
        results = {}
        
        for symbol in request.symbols:
            stock_data = get_mock_stock_data(symbol)
            results[symbol] = {
                "symbol": stock_data["symbol"],
                "price": stock_data["price"],
                "change": stock_data["change"],
                "changePercent": stock_data["changePercent"],
                "marketCap": stock_data["marketCap"],
                "success": True
            }
        
        return {
            "success": True,
            "data": results,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching batch stock data: {str(e)}")

@app.get("/api/investments/stock/{symbol}")
async def get_stock_data(symbol: str):
    """Fetch stock data for a single symbol"""
    try:
        stock_data = get_mock_stock_data(symbol)
        
        quote = {
            "symbol": stock_data["symbol"],
            "price": stock_data["price"],
            "change": stock_data["change"],
            "changePercent": stock_data["changePercent"],
            "volume": stock_data["volume"],
            "high": stock_data["high"],
            "low": stock_data["low"],
            "open": stock_data["open"],
            "previousClose": stock_data["previousClose"],
            "marketCap": stock_data["marketCap"],
            "pe": stock_data["pe"],
            "eps": stock_data["eps"],
            "dividendYield": stock_data["dividendYield"],
            "beta": stock_data["beta"]
        }
        
        # Mock technical indicators
        technicals = {
            "rsi": round(random.uniform(30, 70), 2),
            "macd": round(random.uniform(-2, 2), 4),
            "signal": round(random.uniform(-2, 2), 4),
            "sma50": round(stock_data["price"] * random.uniform(0.95, 1.05), 2),
            "sma200": round(stock_data["price"] * random.uniform(0.90, 1.10), 2),
            "signal_type": random.choice(["buy", "sell", "neutral"]),
            "signal_strength": random.choice(["Strong", "Medium", "Weak"])
        }
        
        # Mock historical data (last 30 days)
        historical = []
        base_date = datetime.now()
        for i in range(30):
            date = base_date - timedelta(days=i)
            price_variation = random.uniform(0.95, 1.05)
            historical.append({
                "date": date.strftime("%Y-%m-%d"),
                "close": round(stock_data["price"] * price_variation, 2),
                "volume": random.randint(100000, 10000000),
                "sma50": round(stock_data["price"] * random.uniform(0.95, 1.05), 2),
                "sma200": round(stock_data["price"] * random.uniform(0.90, 1.10), 2),
                "rsi": round(random.uniform(30, 70), 2)
            })
        
        return {
            "quote": quote,
            "technicals": technicals,
            "historical": historical[::-1],  # Reverse to get chronological order
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stock data: {str(e)}")

# Favorites endpoints
@app.get("/api/investments/favorites")
async def get_favorite_stocks():
    """Get user's favorite stocks"""
    try:
        # Mock favorites
        mock_favorites = ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN"]
        
        return {
            "success": True,
            "favorites": mock_favorites,
            "data": [get_mock_stock_data(symbol) for symbol in mock_favorites]
        }
    except Exception as e:
        return {
            "success": False,
            "favorites": ["AAPL", "GOOGL"],
            "error": str(e)
        }

@app.post("/api/investments/favorites")
async def save_favorite_stocks(request: dict):
    """Save user's favorite stocks"""
    try:
        stocks = request.get("stocks", [])
        return {
            "success": True,
            "message": "Favorite stocks saved successfully",
            "saved_stocks": stocks
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save favorite stocks: {str(e)}"
        )

# Financial summary endpoint
@app.get("/api/financial/summary/{user_id}")
async def get_financial_summary(user_id: int, session_id: str = None):
    """Get comprehensive financial summary with MCP data if available"""
    
    financial_data = {
        "summary": {
            "net_worth": random.randint(50000, 500000),
            "total_income": 95000,
            "total_expenses": 65000,
            "savings_rate": 31.6,
            "monthly_trend": "up"
        },
        "mcp_data_available": False,
        "assets": [
            {"type": "SAVINGS", "value": random.randint(10000, 50000)},
            {"type": "INVESTMENTS", "value": random.randint(20000, 100000)},
            {"type": "REAL_ESTATE", "value": random.randint(100000, 300000)}
        ],
        "liabilities": [
            {"type": "HOME_LOAN", "value": random.randint(50000, 200000)},
            {"type": "CREDIT_CARD", "value": random.randint(5000, 20000)}
        ],
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
        }
    }
    
    # Try to fetch real MCP data using provided session_id
    try:
        if MCP_SERVER_URL and MCP_SERVER_URL != "http://localhost:5001" and session_id:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Use the provided session_id to get networth data directly
                networth_response = await client.get(
                    f"{MCP_SERVER_URL}/mcp/networth",
                    params={"sessionId": session_id}
                )
                networth_data = networth_response.json()
                
                if networth_data.get("result") and not networth_data.get("login_required"):
                    financial_data["mcp_data_available"] = True
                    financial_data["mcp_session_id"] = session_id
                    financial_data["raw_mcp_data"] = networth_data
                    
                    # Parse MCP data if available
                    result = networth_data["result"]
                    if result.get("netWorthResponse"):
                        nw_response = result["netWorthResponse"]
                        if nw_response.get("totalNetWorthValue"):
                            net_worth_value = nw_response["totalNetWorthValue"]
                            financial_data["summary"]["net_worth"] = int(net_worth_value.get("units", 0))
                
                elif networth_data.get("login_required"):
                    financial_data["mcp_login_required"] = True
                    financial_data["mcp_login_url"] = networth_data.get("login_url")
                    
    except Exception as e:
        print(f"⚠️ MCP data fetch failed: {e}")
        # Continue with mock data
    
    return financial_data

# Chat endpoint
@app.post("/api/advisor/chat")
async def chat_with_advisor(request: ChatRequest):
    """AI financial advisor with mock responses"""
    
    if not request.message.strip():
        return {
            "response": "Please enter a message to get financial advice.",
            "suggestions": [
                "Analyze my net worth",
                "Review my assets",
                "Check my investments",
                "Debt management tips"
            ]
        }
    
    # Mock responses based on message content
    message_lower = request.message.lower()
    
    if "portfolio" in message_lower or "investment" in message_lower:
        response = """Based on your portfolio analysis:

📊 **Current Holdings**: Your diversified portfolio shows good balance across tech stocks (AAPL, GOOGL, MSFT) and growth stocks (TSLA).

💡 **Recommendations**:
- Consider rebalancing if tech allocation exceeds 60%
- Add some defensive stocks or bonds for stability
- Monitor TSLA volatility closely

📈 **Performance**: Overall portfolio showing positive momentum with moderate risk profile."""
        
        suggestions = [
            "Show me sector allocation",
            "Risk analysis",
            "Rebalancing suggestions",
            "Add defensive stocks"
        ]
    
    elif "budget" in message_lower or "expense" in message_lower:
        response = """📋 **Budget Analysis**:

💰 **Monthly Overview**:
- Income: ₹95,000
- Expenses: ₹65,000  
- Savings: ₹30,000 (31.6% savings rate)

🎯 **Top Expense Categories**:
1. Travel (23.1%) - ₹15,000
2. Food & Dining (18.5%) - ₹12,000
3. Shopping (13.1%) - ₹8,500

💡 **Optimization Tips**:
- Great savings rate! Consider investing more in equity
- Travel expenses are high - budget for planned trips
- Food expenses are reasonable for your income level"""
        
        suggestions = [
            "Investment recommendations",
            "Reduce travel expenses",
            "Increase SIP amount",
            "Emergency fund check"
        ]
    
    else:
        response = f"""Hello! I'm your AI financial advisor. I can help you with:

💼 **Investment Planning**: Portfolio analysis, stock recommendations, risk assessment
💰 **Budget Management**: Expense tracking, savings optimization, financial goals
📊 **Market Insights**: Stock analysis, market trends, sector recommendations
🎯 **Financial Goals**: Retirement planning, wealth building strategies

Your current financial health looks good with a 31.6% savings rate. How can I assist you today?"""
        
        suggestions = [
            "Analyze my portfolio",
            "Review my budget",
            "Investment recommendations",
            "Market outlook"
        ]
    
    return {
        "response": response,
        "suggestions": suggestions,
        "context_used": {
            "user_data": True,
            "market_data": True,
            "ai_analysis": True
        }
    }

if __name__ == "__main__":
    print("🚀 Starting ArthSahay Financial Advisor API v2.0...")
    print("📍 Endpoints available at:")
    print("   - http://localhost:8000")
    print("   - http://localhost:8000/health")
    print("   - http://localhost:8000/api/financial/summary/1")
    print(f"📡 MCP Server: {MCP_SERVER_URL}")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        log_level="info"
    )

# MCP Proxy Endpoints
@app.get("/api/mcp/initiate")
async def mcp_initiate():
    """Initiate MCP session"""
    try:
        if not MCP_SERVER_URL or MCP_SERVER_URL == "http://localhost:5001":
            return {"error": "MCP server not configured", "mock": True}
            
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{MCP_SERVER_URL}/mcp/initiate")
            return response.json()
    except Exception as e:
        return {"error": f"MCP initiate failed: {str(e)}", "mock": True}

@app.get("/api/mcp/login-status")
async def mcp_login_status(session_id: str):
    """Check MCP login status"""
    try:
        if not MCP_SERVER_URL or MCP_SERVER_URL == "http://localhost:5001":
            return {"error": "MCP server not configured", "mock": True}
            
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{MCP_SERVER_URL}/mcp/login-status",
                params={"sessionId": session_id}
            )
            return response.json()
    except Exception as e:
        return {"error": f"MCP login status failed: {str(e)}", "mock": True}

@app.get("/api/mcp/networth")
async def mcp_networth(session_id: str):
    """Get networth data from MCP"""
    try:
        if not MCP_SERVER_URL or MCP_SERVER_URL == "http://localhost:5001":
            return {"error": "MCP server not configured", "mock": True}
            
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{MCP_SERVER_URL}/mcp/networth",
                params={"sessionId": session_id}
            )
            return response.json()
    except Exception as e:
        return {"error": f"MCP networth failed: {str(e)}", "mock": True}

@app.post("/api/mcp/call")
async def mcp_call_tool(request: dict, session_id: str):
    """Generic MCP tool caller"""
    try:
        if not MCP_SERVER_URL or MCP_SERVER_URL == "http://localhost:5001":
            return {"error": "MCP server not configured", "mock": True}
            
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{MCP_SERVER_URL}/mcp/call",
                params={"sessionId": session_id},
                json=request
            )
            return response.json()
    except Exception as e:
        return {"error": f"MCP tool call failed: {str(e)}", "mock": True}