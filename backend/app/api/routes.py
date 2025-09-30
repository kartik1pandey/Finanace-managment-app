from fastapi import APIRouter, HTTPException
from app.models.financial import *
from app.services.data_service import financial_service
from app.services.advisor_service import advisor_service
from app.services.prediction_service import prediction_service

router = APIRouter()

@router.get("/financial/summary/{user_id}", response_model=FinancialData)
async def get_financial_summary(user_id: int):
    try:
        return financial_service.get_financial_summary(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/financial/cashflow/{user_id}", response_model=CashFlowData)
async def get_cash_flow_data(user_id: int):
    try:
        return financial_service.get_cash_flow_data(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/financial/investments/{user_id}", response_model=InvestmentData)
async def get_investment_data(user_id: int):
    try:
        return financial_service.get_investment_data(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/advisor/chat", response_model=ChatResponse)
async def chat_with_advisor(request: ChatRequest):
    try:
        return advisor_service.get_advice(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/predict/expenses/{user_id}")
async def predict_expenses(user_id: int, months: int = 3):
    try:
        cash_flow_data = financial_service.get_cash_flow_data(user_id)
        historical_data = [
            {"month": item.month, "expenses": item.expenses, "income": item.income}
            for item in cash_flow_data.monthly_data
        ]
        prediction = prediction_service.predict_expenses(historical_data, months)
        return prediction
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/predict/investment/{symbol}")
async def predict_investment(symbol: str, days: int = 30):
    try:
        prediction = prediction_service.predict_investment_trend(symbol, days)
        return prediction
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/{user_id}/profile")
async def get_user_profile(user_id: int):
    try:
        profile = financial_service.get_user_profile(user_id)
        financial_data = financial_service.get_financial_summary(user_id)
        
        return {
            "user_profile": profile,
            "financial_health": {
                "score": min(85, int(financial_data.summary.savings_rate * 2 + 30)),
                "level": "Excellent" if financial_data.summary.savings_rate > 20 else "Good",
                "message": self._get_health_message(financial_data)
            },
            "quick_stats": {
                "months_of_data": len(financial_data.cash_flow.monthly_data),
                "investment_diversity": len(financial_data.investments.holdings),
                "active_categories": len(financial_data.cash_flow.categories)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def _get_health_message(self, financial_data: FinancialData) -> str:
    if financial_data.summary.savings_rate > 25:
        return "Excellent savings rate! Consider increasing investments."
    elif financial_data.summary.savings_rate > 15:
        return "Good financial health. Focus on debt reduction if any."
    else:
        return "Monitor expenses closely. Try to increase savings rate."

@router.get("/financial/health/{user_id}")
async def get_financial_health(user_id: int):
    try:
        data = financial_service.get_financial_summary(user_id)
        
        # Enhanced financial health scoring
        score = 0
        
        # Savings rate component (30 points)
        if data.summary.savings_rate > 25:
            score += 30
        elif data.summary.savings_rate > 15:
            score += 20
        else:
            score += 10

        # Net worth component (25 points)
        if data.summary.net_worth > 0:
            score += 25

        # Investment diversity (20 points)
        diversity_score = min(20, len(data.investments.holdings) * 5)
        score += diversity_score

        # Expense control (25 points)
        if data.summary.savings_rate > 10:
            score += 25
        elif data.summary.savings_rate > 0:
            score += 15
        else:
            score += 5

        return {
            "score": min(score, 100),
            "level": "Excellent" if score >= 85 else "Good" if score >= 70 else "Needs Improvement",
            "breakdown": {
                "savings_rate": data.summary.savings_rate,
                "net_worth": data.summary.net_worth,
                "investment_diversity": len(data.investments.holdings),
                "monthly_trend": data.summary.monthly_trend
            },
            "recommendations": self._generate_recommendations(data)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def _generate_recommendations(self, data: FinancialData) -> List[str]:
    recommendations = []
    
    if data.summary.savings_rate < 15:
        recommendations.append("Increase monthly savings rate to at least 15%")
    
    if len(data.investments.holdings) < 3:
        recommendations.append("Diversify investments across more asset classes")
    
    if data.summary.monthly_trend == "down":
        recommendations.append("Review recent expense increases")
    
    recommendations.extend([
        "Maintain emergency fund of 6 months expenses",
        "Review insurance coverage annually"
    ])
    
    return recommendations[:4]  # Return top 4 recommendations