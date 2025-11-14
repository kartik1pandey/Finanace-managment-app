from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import uvicorn
import httpx
from typing import Optional

# Import services
try:
    from groq_service import groq_advisor
    from investment_service import investment_service
    from loans_service import loans_service
    print("✅ Services imported successfully")
except ImportError as e:
    print(f"❌ Failed to import services: {e}")

app = FastAPI(title="ArthSahay Financial Advisor", version="2.0.0")

# Enhanced CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MCP Backend URL
MCP_BACKEND_URL = "http://localhost:5001"

# Pydantic models
class ChatRequest(BaseModel):
    message: str
    user_id: int = 1
    session_id: Optional[str] = None

class LoanCalculationRequest(BaseModel):
    principal: float
    interest_rate: float
    tenure_years: int

class PrepaymentRequest(BaseModel):
    prepayment_amount: float

class MCPToolRequest(BaseModel):
    tool: str
    args: dict = {}

# ============= MCP PROXY ENDPOINTS =============

@app.get("/api/mcp/initiate")
async def mcp_initiate():
    """Initiate MCP session and get login URL if needed"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{MCP_BACKEND_URL}/mcp/initiate")
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MCP initiate failed: {str(e)}")

@app.get("/api/mcp/login-status")
async def mcp_login_status(session_id: str = Query(...)):
    """Check MCP login status"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{MCP_BACKEND_URL}/mcp/login-status",
                params={"sessionId": session_id}
            )
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login status check failed: {str(e)}")

@app.get("/api/mcp/networth")
async def mcp_networth(session_id: str = Query(...)):
    """Fetch net worth data from MCP"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{MCP_BACKEND_URL}/mcp/networth",
                params={"sessionId": session_id}
            )
            data = response.json()
            
            # Parse and structure the response
            if data.get("result"):
                return {
                    "success": True,
                    "data": data["result"],
                    "raw": data.get("raw")
                }
            elif data.get("login_required"):
                return {
                    "success": False,
                    "login_required": True,
                    "login_url": data.get("login_url")
                }
            return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Networth fetch failed: {str(e)}")

@app.post("/api/mcp/call")
async def mcp_call_tool(request: MCPToolRequest, session_id: str = Query(...)):
    """Generic MCP tool caller"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{MCP_BACKEND_URL}/mcp/call",
                params={"sessionId": session_id},
                json={"tool": request.tool, "args": request.args}
            )
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MCP tool call failed: {str(e)}")

# ============= ENHANCED FINANCIAL DATA ENDPOINTS =============

@app.get("/api/financial/summary/{user_id}")
async def get_financial_summary(user_id: int, session_id: Optional[str] = None):
    """Get comprehensive financial summary with real MCP data if available"""
    
    financial_data = {
        "summary": {
            "net_worth": 0,
            "total_income": 95000,
            "total_expenses": 65000,
            "savings_rate": 31.6,
            "monthly_trend": "up"
        },
        "mcp_data_available": False
    }
    
    # Try to fetch real data from MCP if session_id provided
    if session_id:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{MCP_BACKEND_URL}/mcp/networth",
                    params={"sessionId": session_id}
                )
                mcp_data = response.json()
                
                if mcp_data.get("result") and not mcp_data.get("login_required"):
                    result = mcp_data["result"]
                    
                    # Extract net worth
                    if result.get("netWorthResponse"):
                        nw_response = result["netWorthResponse"]
                        if nw_response.get("totalNetWorthValue"):
                            net_worth_value = nw_response["totalNetWorthValue"]
                            financial_data["summary"]["net_worth"] = int(net_worth_value.get("units", 0))
                        
                        # Extract asset breakdown
                        assets = []
                        if nw_response.get("assetValues"):
                            for asset in nw_response["assetValues"]:
                                assets.append({
                                    "type": asset.get("netWorthAttribute", "").replace("ASSET_TYPE_", ""),
                                    "value": int(asset.get("value", {}).get("units", 0))
                                })
                        financial_data["assets"] = assets
                        
                        # Extract liabilities
                        liabilities = []
                        if nw_response.get("liabilityValues"):
                            for liability in nw_response["liabilityValues"]:
                                liabilities.append({
                                    "type": liability.get("netWorthAttribute", "").replace("LIABILITY_TYPE_", ""),
                                    "value": int(liability.get("value", {}).get("units", 0))
                                })
                        financial_data["liabilities"] = liabilities
                        
                    financial_data["mcp_data_available"] = True
                    financial_data["raw_mcp_data"] = result
        except Exception as e:
            print(f"⚠️ MCP data fetch failed: {e}")
    
    # Add static cash flow data
    financial_data["cash_flow"] = {
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
    
    return financial_data

@app.get("/api/financial/accounts/{user_id}")
async def get_accounts_detail(user_id: int, session_id: Optional[str] = None):
    """Get detailed account information from MCP"""
    
    if not session_id:
        return {"error": "session_id required", "accounts": []}
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{MCP_BACKEND_URL}/mcp/networth",
                params={"sessionId": session_id}
            )
            mcp_data = response.json()
            
            if mcp_data.get("result") and not mcp_data.get("login_required"):
                result = mcp_data["result"]
                accounts = []
                
                if result.get("accountDetailsBulkResponse"):
                    account_map = result["accountDetailsBulkResponse"].get("accountDetailsMap", {})
                    
                    for account_id, account_info in account_map.items():
                        account_details = account_info.get("accountDetails", {})
                        
                        account_obj = {
                            "id": account_id,
                            "type": account_details.get("accInstrumentType", "").replace("ACC_INSTRUMENT_TYPE_", ""),
                            "masked_number": account_details.get("maskedAccountNumber", ""),
                            "fip": account_details.get("fipMeta", {}).get("displayName", ""),
                            "bank": account_details.get("fipMeta", {}).get("bank", "")
                        }
                        
                        # Add type-specific data
                        if "depositSummary" in account_info:
                            deposit = account_info["depositSummary"]
                            account_obj["balance"] = int(deposit.get("currentBalance", {}).get("units", 0))
                            account_obj["account_type"] = deposit.get("depositAccountType", "").replace("DEPOSIT_ACCOUNT_TYPE_", "")
                        
                        elif "equitySummary" in account_info:
                            equity = account_info["equitySummary"]
                            account_obj["current_value"] = int(equity.get("currentValue", {}).get("units", 0))
                            account_obj["holdings"] = equity.get("holdingsInfo", [])
                        
                        elif "etfSummary" in account_info:
                            etf = account_info["etfSummary"]
                            account_obj["current_value"] = float(etf.get("currentValue", {}).get("units", 0))
                            account_obj["holdings"] = etf.get("holdingsInfo", [])
                        
                        elif "reitSummary" in account_info:
                            reit = account_info["reitSummary"]
                            account_obj["current_value"] = float(reit.get("currentValue", {}).get("units", 0))
                            account_obj["holdings"] = reit.get("holdingsInfo", [])
                        
                        elif "invitSummary" in account_info:
                            invit = account_info["invitSummary"]
                            account_obj["current_value"] = float(invit.get("currentValue", {}).get("units", 0))
                            account_obj["holdings"] = invit.get("holdingsInfo", [])
                        
                        accounts.append(account_obj)
                
                return {
                    "success": True,
                    "accounts": accounts,
                    "total_accounts": len(accounts)
                }
        
        return {"error": "Failed to fetch accounts", "accounts": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Account fetch failed: {str(e)}")

@app.get("/api/financial/mutual-funds/{user_id}")
async def get_mutual_funds(user_id: int, session_id: Optional[str] = None):
    """Get mutual fund holdings from MCP"""
    
    if not session_id:
        return {"error": "session_id required", "funds": []}
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{MCP_BACKEND_URL}/mcp/networth",
                params={"sessionId": session_id}
            )
            mcp_data = response.json()
            
            if mcp_data.get("result") and not mcp_data.get("login_required"):
                result = mcp_data["result"]
                funds = []
                
                if result.get("mfSchemeAnalytics"):
                    schemes = result["mfSchemeAnalytics"].get("schemeAnalytics", [])
                    
                    for scheme in schemes:
                        scheme_detail = scheme.get("schemeDetail", {})
                        analytics = scheme.get("enrichedAnalytics", {}).get("analytics", {}).get("schemeDetails", {})
                        
                        fund_obj = {
                            "name": scheme_detail.get("nameData", {}).get("longName", ""),
                            "amc": scheme_detail.get("amc", "").replace("_", " ").title(),
                            "plan_type": scheme_detail.get("planType", ""),
                            "asset_class": scheme_detail.get("assetClass", ""),
                            "category": scheme_detail.get("categoryName", "").replace("_", " ").title(),
                            "risk_level": scheme_detail.get("fundhouseDefinedRiskLevel", "").replace("_", " ").title(),
                            "isin": scheme_detail.get("isinNumber", ""),
                            "nav": float(scheme_detail.get("nav", {}).get("units", 0)),
                            "current_value": float(analytics.get("currentValue", {}).get("units", 0)),
                            "invested_value": float(analytics.get("investedValue", {}).get("units", 0)),
                            "units": float(analytics.get("units", 0)),
                            "xirr": float(analytics.get("XIRR", 0)),
                            "absolute_returns": float(analytics.get("absoluteReturns", {}).get("units", 0)),
                            "unrealised_returns": float(analytics.get("unrealisedReturns", {}).get("units", 0))
                        }
                        
                        funds.append(fund_obj)
                
                # Calculate summary
                total_current = sum(f["current_value"] for f in funds)
                total_invested = sum(f["invested_value"] for f in funds if f["invested_value"] > 0)
                total_returns = sum(f["absolute_returns"] for f in funds)
                
                return {
                    "success": True,
                    "funds": funds,
                    "summary": {
                        "total_funds": len(funds),
                        "total_current_value": total_current,
                        "total_invested": total_invested,
                        "total_returns": total_returns,
                        "overall_return_percentage": (total_returns / total_invested * 100) if total_invested > 0 else 0
                    }
                }
        
        return {"error": "Failed to fetch mutual funds", "funds": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mutual funds fetch failed: {str(e)}")

# ============= ADVISOR CHAT ENDPOINT =============

@app.post("/api/advisor/chat")
async def chat_with_advisor(request: ChatRequest):
    """Enhanced AI financial advisor with real MCP data context"""
    print(f"📨 Received chat request: {request.message} from user {request.user_id}")
    
    if not request.message.strip():
        return {
            "response": "Please enter a message to get financial advice.",
            "suggestions": [
                "Analyze my net worth",
                "Review my mutual fund portfolio", 
                "Check my bank accounts",
                "Investment recommendations"
            ]
        }
    
    if not groq_advisor:
        return {
            "response": "Financial advisor service is currently initializing. Please try again in a moment.",
            "suggestions": ["Retry conversation", "Check financial dashboard"],
            "error": "Service not available"
        }
    
    try:
        # Fetch real financial data if session_id provided
        financial_context = None
        if request.session_id:
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.get(
                        f"http://localhost:8000/api/financial/summary/{request.user_id}",
                        params={"session_id": request.session_id}
                    )
                    financial_context = response.json()
            except Exception as e:
                print(f"⚠️ Could not fetch financial context: {e}")
        
        advice_result = await groq_advisor.get_financial_advice(
            request.message, 
            request.user_id,
            financial_context
        )
        return advice_result
    except Exception as e:
        print(f"❌ Error in advisor chat: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="Financial advisor service is temporarily unavailable. Please try again in a moment."
        )

# ============= EXISTING ENDPOINTS (Loans & Investments) =============

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

@app.get("/api/investments/portfolio/{user_id}")
def get_investment_portfolio(user_id: int):
    """Get complete investment portfolio"""
    return investment_service.get_portfolio_summary(user_id)

@app.get("/api/investments/analysis/{symbol}")
def get_stock_analysis(symbol: str):
    """Get technical analysis for a stock"""
    return investment_service.get_stock_analysis(symbol)

@app.get("/api/investments/market-overview")
def get_market_overview():
    """Get market overview"""
    return investment_service.get_market_overview()

# ============= HEALTH CHECK =============

@app.get("/")
def read_root():
    return {
        "message": "ArthSahay Backend v2.0 - MCP Integrated",
        "timestamp": datetime.now().isoformat(),
        "mcp_backend": MCP_BACKEND_URL,
        "features": ["MCP Integration", "Real Financial Data", "AI Advisor"]
    }

@app.get("/health")
def health_check():
    groq_status = "connected" if groq_advisor and groq_advisor.client else "mock_mode"
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "groq_service": groq_status,
        "mcp_backend": MCP_BACKEND_URL,
        "endpoints_available": True
    }

if __name__ == "__main__":
    print("🚀 Starting ArthSahay Financial Advisor API v2.0...")
    print(f"📍 MCP Backend: {MCP_BACKEND_URL}")
    print("📍 Endpoints available at:")
    print("   - http://localhost:8000")
    print("   - http://localhost:8000/api/mcp/initiate")
    print("   - http://localhost:8000/api/financial/summary/1")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        log_level="info"
    )