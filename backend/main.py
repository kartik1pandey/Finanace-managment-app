from fastapi import FastAPI, HTTPException, Query, File, UploadFile, Form, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from datetime import datetime
import uvicorn
import httpx
from typing import Optional, List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import yfinance as yf
import pandas as pd
import numpy as np
import shutil
from datetime import datetime, timedelta
import ta  # technical-analysis library
from groq import Groq
import os
import jwt
from supabase import create_client, Client

from gemini_multimodal_service import gemini_multimodal
# Install required packages:
# pip install yfinance ta-lib pandas-ta supabase

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

# Security
security = HTTPBearer()

class AuthUser(BaseModel):
    id: str
    email: str
    user_metadata: dict = {}

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> AuthUser:
    """Verify JWT token and return user info"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Supabase not configured")
        
        token = credentials.credentials
        
        # Verify token with Supabase
        response = supabase.auth.get_user(token)
        
        if not response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        return AuthUser(
            id=response.user.id,
            email=response.user.email,
            user_metadata=response.user.user_metadata or {}
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

async def get_optional_user(authorization: Optional[str] = Header(None)) -> Optional[AuthUser]:
    """Get user from token if provided, otherwise return None"""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    try:
        token = authorization.split(" ")[1]
        if not supabase:
            return None
            
        response = supabase.auth.get_user(token)
        if not response.user:
            return None
            
        return AuthUser(
            id=response.user.id,
            email=response.user.email,
            user_metadata=response.user.user_metadata or {}
        )
    except:
        return None

class StockAnalysisRequest(BaseModel):
    symbol: str
    quote: dict
    technicals: dict
    fundamentals: dict


# Import services
try:
    from groq_service import groq_advisor
    from investment_service import investment_service
    from loans_service import loans_service
    print("✅ Services imported successfully")
except ImportError as e:
    print(f"❌ Failed to import services: {e}")

app = FastAPI(title="ArthSahay Financial Advisor", version="2.0.0")

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Enhanced CORS configuration for production
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

# MCP Backend URL - use environment variable in production
MCP_BACKEND_URL = os.getenv("MCP_SERVER_URL", "http://localhost:5001")

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
    """
    AI financial advisor using OpenRouter with conversation history
    """
    print(f"📨 Received chat request: {request.message}")
    print(f"🔑 Session ID: {request.session_id}")
    
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
    
    if not groq_advisor or not groq_advisor.client:
        print("⚠ Groq client not available, using mock responses")
    
    try:
        # Call the Groq advisor service
        result = await groq_advisor.get_financial_advice(
            user_message=request.message,
            user_id=request.user_id,
            financial_context=None
        )
        
        # Also store in Gemini history for multimodal continuity
        if request.session_id:
            gemini_multimodal.add_to_history(
                request.session_id,
                "user",
                request.message
            )
            gemini_multimodal.add_to_history(
                request.session_id,
                "assistant",
                result.get("response", "")
            )
        
        print(f"✅ Generated response")
        print(f"📊 Context used: {result.get('context_used', {})}")
        
        return result
        
    except Exception as e:
        print(f"❌ Error in advisor chat: {str(e)}")
        import traceback
        traceback.print_exc()
        
        raise HTTPException(
            status_code=500, 
            detail=f"Financial advisor service error: {str(e)}"
        )

@app.post("/api/advisor/upload")
async def upload_files_endpoint(
    files: List[UploadFile] = File(...),
    session_id: str = Form(...),
    message: str = Form("")
):
    """
    Handle multimodal file uploads (CSV, Excel, PDF, Text)
    Uses Google Gemini for analysis with conversation context
    """
    print(f"📁 Received {len(files)} file(s) for analysis")
    print(f"📝 User message: {message}")
    print(f"🔑 Session ID: {session_id}")
    
    try:
        processed_files = []
        
        # Process each file
        for file in files:
            content = await file.read()
            filename = file.filename
            
            print(f"📄 Processing: {filename}")
            
            # Process based on file type
            if filename.endswith('.csv'):
                result = gemini_multimodal.process_csv_file(content, filename)
            elif filename.endswith(('.xlsx', '.xls')):
                result = gemini_multimodal.process_excel_file(content, filename)
            elif filename.endswith('.pdf'):
                result = gemini_multimodal.process_pdf_file(content, filename)
            elif filename.endswith('.txt'):
                result = gemini_multimodal.process_text_file(content, filename)
            else:
                result = {
                    "success": False,
                    "error": f"Unsupported file type: {filename}",
                    "filename": filename
                }
            
            processed_files.append(result)
            print(f"✅ Processed: {filename} - Success: {result.get('success', False)}")
        
        # Check if any files were successfully processed
        successful_files = [f for f in processed_files if f.get("success")]
        
        if not successful_files:
            error_msg = "Failed to process any files. "
            error_msg += " ".join([f.get("error", "") for f in processed_files if not f.get("success")])
            return {
                "response": f"❌ {error_msg}\n\nPlease ensure your files are valid CSV, Excel, PDF, or text files.",
                "suggestions": ["Try different files", "Check file format"],
                "processed_files": 0
            }
        
        # Fetch MCP context
        mcp_context = None
        if session_id:
            try:
                # Fetch financial data for context
                financial_data = await get_financial_summary(1, session_id)
                mcp_context = financial_data
            except Exception as e:
                print(f"⚠  Could not fetch MCP data: {e}")
        
        # Analyze with Gemini (includes conversation history)
        analysis_result = await gemini_multimodal.analyze_files_with_context(
            processed_files=successful_files,
            user_message=message or "Please analyze these files and provide financial insights",
            session_id=session_id,
            mcp_context=mcp_context
        )
        
        return {
            "response": analysis_result["response"],
            "suggestions": analysis_result["suggestions"],
            "processed_files": len(successful_files),
            "file_details": [f.get("filename") for f in successful_files]
        }
        
    except Exception as e:
        print(f"❌ Upload endpoint error: {e}")
        import traceback
        traceback.print_exc()
        
        raise HTTPException(
            status_code=500,
            detail=f"File processing error: {str(e)}"
        )

@app.post("/api/advisor/audio")
async def process_audio_endpoint(
    audio: UploadFile = File(...),
    session_id: str = Form(...)
):
    """
    Handle audio input with Gemini transcription and conversation context
    """
    print(f"🎤 Received audio file: {audio.filename}")
    
    try:
        # Save audio temporarily
        temp_dir = "/tmp"
        os.makedirs(temp_dir, exist_ok=True)
        temp_path = os.path.join(temp_dir, f"audio_{session_id}_{audio.filename}")
        
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)
        
        print(f"💾 Saved audio to: {temp_path}")
        
        # Fetch MCP context
        mcp_context = None
        if session_id:
            try:
                # Fetch financial data for context
                financial_data = await get_financial_summary(1, session_id)
                mcp_context = financial_data
            except Exception as e:
                print(f"⚠  Could not fetch MCP data: {e}")
        
        # Process with Gemini (includes conversation history)
        result = await gemini_multimodal.transcribe_and_respond(
            audio_path=temp_path,
            session_id=session_id,
            mcp_context=mcp_context
        )
        
        # Clean up
        try:
            os.remove(temp_path)
            print(f"🗑  Cleaned up temp file")
        except:
            pass
        
        return result
        
    except Exception as e:
        print(f"❌ Audio processing error: {e}")
        import traceback
        traceback.print_exc()
        
        raise HTTPException(
            status_code=500,
            detail=f"Audio processing error: {str(e)}"
        )

@app.post("/api/advisor/clear-history")
async def clear_conversation_history(session_id: str = Form(...)):
    """Clear conversation history for a session"""
    try:
        gemini_multimodal.clear_history(session_id)
        return {
            "success": True,
            "message": "Conversation history cleared"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error clearing history: {str(e)}"
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

@app.post("/api/investments/stocks/batch")
async def get_multiple_stocks(symbols: List[str]):
    """
    Fetch basic data for multiple stocks at once
    """
    try:
        results = {}
        
        for symbol in symbols:
            try:
                # Create ticker object
                ticker = yf.Ticker(symbol)
                hist = ticker.history(period="2d")
                
                if not hist.empty:
                    current_price = hist['Close'].iloc[-1]
                    previous_close = hist['Close'].iloc[-2] if len(hist) > 1 else current_price
                    change = current_price - previous_close
                    change_percent = (change / previous_close) * 100 if previous_close != 0 else 0
                    
                    # Get basic info
                    info = ticker.info
                    
                    results[symbol] = {
                        "symbol": symbol,
                        "price": round(current_price, 2),
                        "change": round(change, 2),
                        "changePercent": round(change_percent, 2),
                        "marketCap": format_market_cap(info.get('marketCap', 0)),
                        "success": True
                    }
                else:
                    results[symbol] = {
                        "symbol": symbol,
                        "success": False,
                        "error": "No data available"
                    }
                    
            except Exception as e:
                results[symbol] = {
                    "symbol": symbol,
                    "success": False,
                    "error": str(e)
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
    """
    Fetch real-time stock data using yfinance
    Free and reliable - no API key needed
    """
    try:
        # Create ticker object
        ticker = yf.Ticker(symbol)
        
        # Get current quote
        info = ticker.info
        hist = ticker.history(period="1y")
        
        if hist.empty:
            raise HTTPException(status_code=404, detail=f"No data found for {symbol}")
        
        # Current price data
        current_price = hist['Close'].iloc[-1]
        previous_close = hist['Close'].iloc[-2]
        change = current_price - previous_close
        change_percent = (change / previous_close) * 100
        
        quote = {
            "symbol": symbol,
            "price": round(current_price, 2),
            "change": round(change, 2),
            "changePercent": round(change_percent, 2),
            "volume": int(hist['Volume'].iloc[-1]),
            "high": round(hist['High'].iloc[-1], 2),
            "low": round(hist['Low'].iloc[-1], 2),
            "open": round(hist['Open'].iloc[-1], 2),
            "previousClose": round(previous_close, 2),
            "marketCap": format_market_cap(info.get('marketCap', 0)),
            "pe": str(round(info.get('trailingPE', 0), 2)) if info.get('trailingPE') else "N/A",
            "eps": str(round(info.get('trailingEps', 0), 2)) if info.get('trailingEps') else "N/A",
            "dividendYield": f"{round(info.get('dividendYield', 0) * 100, 2)}%" if info.get('dividendYield') else "N/A",
            "beta": str(round(info.get('beta', 1.0), 2)) if info.get('beta') else "N/A"
        }
        
        # Calculate technical indicators
        technicals = calculate_technical_indicators(hist)
        
        # Prepare historical data for chart
        historical = prepare_chart_data(hist, technicals)
        
        return {
            "quote": quote,
            "technicals": technicals,
            "historical": historical,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stock data: {str(e)}")

def calculate_technical_indicators(df):
    """Calculate technical indicators using pandas-ta"""
    try:
        # Make a copy to avoid modifying original
        data = df.copy()
        
        # RSI
        rsi = ta.momentum.RSIIndicator(data['Close'], window=14)
        current_rsi = rsi.rsi().iloc[-1]
        
        # MACD
        macd = ta.trend.MACD(data['Close'])
        current_macd = macd.macd().iloc[-1]
        current_signal = macd.macd_signal().iloc[-1]
        
        # Moving Averages
        sma_50 = data['Close'].rolling(window=50).mean().iloc[-1]
        sma_200 = data['Close'].rolling(window=200).mean().iloc[-1]
        
        # Determine signal
        signal_type = "neutral"
        signal_strength = "Weak"
        
        # RSI signals
        if current_rsi < 30:
            signal_type = "buy"
            signal_strength = "Strong" if current_rsi < 25 else "Medium"
        elif current_rsi > 70:
            signal_type = "sell"
            signal_strength = "Strong" if current_rsi > 75 else "Medium"
        
        # MACD crossover
        prev_macd = macd.macd().iloc[-2]
        prev_signal = macd.macd_signal().iloc[-2]
        
        if current_macd > current_signal and prev_macd <= prev_signal:
            signal_type = "buy"
            signal_strength = "Strong"
        elif current_macd < current_signal and prev_macd >= prev_signal:
            signal_type = "sell"
            signal_strength = "Strong"
        
        # Moving average crossover
        if sma_50 > sma_200:
            if signal_type == "neutral":
                signal_type = "buy"
                signal_strength = "Medium"
        elif sma_50 < sma_200:
            if signal_type == "neutral":
                signal_type = "sell"
                signal_strength = "Medium"
        
        return {
            "rsi": round(current_rsi, 2),
            "macd": round(current_macd, 4),
            "signal": round(current_signal, 4),
            "sma50": round(sma_50, 2),
            "sma200": round(sma_200, 2),
            "signal_type": signal_type,
            "signal_strength": signal_strength
        }
        
    except Exception as e:
        print(f"Error calculating indicators: {e}")
        return {
            "rsi": 50,
            "macd": 0,
            "signal": 0,
            "sma50": 0,
            "sma200": 0,
            "signal_type": "neutral",
            "signal_strength": "N/A"
        }

def prepare_chart_data(df, technicals):
    """Prepare historical data for charting"""
    # Get last 90 days
    data = df.tail(90).copy()
    
    # Calculate indicators for chart
    data['SMA50'] = data['Close'].rolling(window=50).mean()
    data['SMA200'] = data['Close'].rolling(window=200).mean()
    
    # RSI for chart
    rsi_indicator = ta.momentum.RSIIndicator(data['Close'], window=14)
    data['RSI'] = rsi_indicator.rsi()
    
    # Format for frontend
    chart_data = []
    for idx, row in data.iterrows():
        chart_data.append({
            "date": idx.strftime("%Y-%m-%d"),
            "close": round(row['Close'], 2),
            "volume": int(row['Volume']),
            "sma50": round(row['SMA50'], 2) if not pd.isna(row['SMA50']) else None,
            "sma200": round(row['SMA200'], 2) if not pd.isna(row['SMA200']) else None,
            "rsi": round(row['RSI'], 2) if not pd.isna(row['RSI']) else None
        })
    
    return chart_data

def format_market_cap(market_cap):
    """Format market cap to readable string"""
    if market_cap >= 1_000_000_000_000:
        return f"${market_cap / 1_000_000_000_000:.2f}T"
    elif market_cap >= 1_000_000_000:
        return f"${market_cap / 1_000_000_000:.2f}B"
    elif market_cap >= 1_000_000:
        return f"${market_cap / 1_000_000:.2f}M"
    else:
        return f"${market_cap:,.0f}"

@app.post("/api/investments/analyze")
async def analyze_stock(request: StockAnalysisRequest):
    """
    Generate AI analysis using Groq
    """
    try:
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        
        # Construct comprehensive prompt
        prompt = f"""Analyze {request.symbol} stock with the following data:

Current Price: ${request.quote['price']}
Change: {request.quote['change']} ({request.quote['changePercent']}%)
Volume: {request.quote['volume']:,}

Technical Indicators:
- RSI: {request.technicals['rsi']} ({get_rsi_interpretation(request.technicals['rsi'])})
- MACD: {request.technicals['macd']} (Signal: {request.technicals['signal']})
- SMA 50: ${request.technicals['sma50']}
- SMA 200: ${request.technicals['sma200']}
- Current Signal: {request.technicals['signal_type'].upper()} ({request.technicals['signal_strength']})

Fundamentals:
- P/E Ratio: {request.fundamentals['pe']}
- EPS: {request.fundamentals['eps']}
- Market Cap: {request.fundamentals['marketCap']}

Provide a comprehensive analysis including:
1. Technical Analysis Summary
2. Trend Analysis (short-term and long-term)
3. Key Support and Resistance Levels
4. Entry and Exit Strategies
5. Risk Assessment
6. Price Targets (conservative, moderate, aggressive)
7. Investment Recommendation (Buy/Hold/Sell with reasoning)

Be specific, actionable, and concise. Focus on practical trading insights."""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1000,
            temperature=0.7
        )
        
        return {
            "analysis": response.choices[0].message.content,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating analysis: {str(e)}")

def get_rsi_interpretation(rsi):
    """Get RSI interpretation"""
    if rsi < 30:
        return "Oversold - Potential Buy Signal"
    elif rsi > 70:
        return "Overbought - Potential Sell Signal"
    else:
        return "Neutral"

# Additional endpoint for portfolio optimization
@app.post("/api/investments/optimize-portfolio")
async def optimize_portfolio(holdings: dict):
    """
    Optimize portfolio allocation using Modern Portfolio Theory
    """
    try:
        tickers = list(holdings.keys())
        weights = np.array(list(holdings.values()))
        
        # Fetch historical data
        data = yf.download(tickers, period="1y")['Close']
        
        # Calculate returns
        returns = data.pct_change().dropna()
        
        # Calculate portfolio metrics
        portfolio_return = (returns.mean() * weights).sum() * 252
        portfolio_volatility = np.sqrt(np.dot(weights.T, np.dot(returns.cov() * 252, weights)))
        sharpe_ratio = portfolio_return / portfolio_volatility
        
        # Value at Risk (VaR) at 95% confidence
        var_95 = np.percentile(returns.dot(weights), 5) * np.sqrt(252)
        
        # Diversification score
        correlation_matrix = returns.corr()
        avg_correlation = correlation_matrix.values[np.triu_indices_from(correlation_matrix.values, k=1)].mean()
        diversification_score = 1 - avg_correlation
        
        # Generate AI recommendations
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        
        prompt = f"""Analyze this portfolio:
Holdings: {holdings}

Metrics:
- Expected Annual Return: {portfolio_return*100:.2f}%
- Volatility (Risk): {portfolio_volatility*100:.2f}%
- Sharpe Ratio: {sharpe_ratio:.2f}
- Value at Risk (95%): {var_95*100:.2f}%
- Diversification Score: {diversification_score:.2f}

Provide:
1. Portfolio Health Assessment
2. Risk Analysis
3. Diversification Recommendations
4. Rebalancing Suggestions
5. Specific Actions to Improve Returns
"""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=800
        )
        
        return {
            "metrics": {
                "expected_return": round(portfolio_return * 100, 2),
                "volatility": round(portfolio_volatility * 100, 2),
                "sharpe_ratio": round(sharpe_ratio, 2),
                "var_95": round(var_95 * 100, 2),
                "diversification_score": round(diversification_score, 2)
            },
            "recommendations": response.choices[0].message.content
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error optimizing portfolio: {str(e)}")


# ============= FAVORITE STOCKS ENDPOINTS =============

class FavoriteStocksRequest(BaseModel):
    stocks: List[str]

@app.get("/api/investments/favorites")
async def get_favorite_stocks(user: AuthUser = Depends(verify_token)):
    """Get user's favorite stocks"""
    try:
        # Import here to avoid circular imports
        import sys
        import os
        sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
        
        from lib.dataStore import loadFavoriteStocks
        favorites = await loadFavoriteStocks(user.email)
        return {
            "success": True,
            "favorites": favorites,
            "user_id": user.id
        }
    except Exception as e:
        print(f"❌ Error loading favorite stocks: {str(e)}")
        return {
            "success": False,
            "favorites": ["AAPL", "GOOGL"],  # Default fallback
            "error": str(e)
        }

@app.post("/api/investments/favorites")
async def save_favorite_stocks(request: FavoriteStocksRequest, user: AuthUser = Depends(verify_token)):
    """Save user's favorite stocks"""
    try:
        # Import here to avoid circular imports
        import sys
        import os
        sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
        
        from lib.dataStore import saveFavoriteStocks
        await saveFavoriteStocks(user.email, request.stocks)
        return {
            "success": True,
            "message": "Favorite stocks saved successfully",
            "user_id": user.id
        }
    except Exception as e:
        print(f"❌ Error saving favorite stocks: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save favorite stocks: {str(e)}"
        )

# ============= RECEIPTS ENDPOINTS =============

class ReceiptSaveRequest(BaseModel):
    filename: str
    extracted_data: dict
    status: str
    upload_date: str

@app.post("/api/receipts/save")
async def save_receipt_endpoint(request: ReceiptSaveRequest):
    """Save receipt data to backend storage"""
    try:
        # For now, just return success since we don't have a database setup
        # In a real implementation, you would save to your database here
        
        receipt_id = f"receipt_{int(datetime.now().timestamp())}"
        
        return {
            "success": True,
            "receipt_id": receipt_id,
            "message": "Receipt saved successfully",
            "data": {
                "id": receipt_id,
                "filename": request.filename,
                "extracted_data": request.extracted_data,
                "status": request.status,
                "upload_date": request.upload_date
            }
        }
        
    except Exception as e:
        print(f"❌ Error saving receipt: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save receipt: {str(e)}"
        )

# ============= CONVERSATION HISTORY ENDPOINT =============

@app.post("/api/advisor/clear-history")
async def clear_conversation_history(session_id: str = Form(...)):
    """Clear conversation history for a session"""
    try:
        from gemini_multimodal_service import gemini_multimodal
        gemini_multimodal.clear_history(session_id)
        return {
            "success": True,
            "message": "Conversation history cleared"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error clearing history: {str(e)}"
        )

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