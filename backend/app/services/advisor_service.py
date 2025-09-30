import random
from datetime import datetime
from typing import Dict, List
from app.models.financial import ChatRequest, ChatResponse
from app.services.data_service import financial_service

class EnhancedAdvisorService:
    def __init__(self):
        self.financial_advice = {
            "savings": [
                "Based on your spending pattern, you could save ₹{amount} more per month by reducing {category} expenses.",
                "Consider automating your savings by setting up a SIP of ₹{amount} in mutual funds.",
                "Your emergency fund should cover 6 months of expenses. Currently you have {coverage} months covered."
            ],
            "investments": [
                "Your portfolio is returning {return_percentage}%. Consider rebalancing to maintain your target allocation.",
                "Diversification looks good! {best_performer} is your best performing asset.",
                "Market trends suggest increasing exposure to {sector} sector for better returns."
            ],
            "expenses": [
                "Your {category} spending is {percentage}% higher than last month. Consider setting a budget.",
                "I found recurring subscriptions costing ₹{amount} monthly. Review if you need all of them.",
                "Your savings rate is {savings_rate}%. Target 20% for optimal financial health."
            ],
            "loans": [
                "You're paying {interest_rate}% interest on loans. Consider debt consolidation.",
                "Make extra payments on high-interest debts to save on interest costs.",
                "Your debt-to-income ratio is {ratio}. Aim for below 30%."
            ]
        }

        self.greetings = [
            "Hello! I'm your AI financial advisor. I can help with savings, investments, expenses, and loans.",
            "Hi there! Ready to optimize your financial health?",
            "Welcome back! I've analyzed your latest financial data. Ask me anything!"
        ]

    def get_advice(self, request: ChatRequest) -> ChatResponse:
        user_data = financial_service.get_financial_summary(request.user_id)
        message = request.message.lower()
        
        response = self._analyze_message(message, user_data)
        suggestions = self._generate_suggestions(user_data)
        
        return ChatResponse(
            response=response,
            suggestions=suggestions,
            timestamp=datetime.utcnow().isoformat()
        )

    def _analyze_message(self, message: str, user_data: Dict) -> str:
        if any(word in message for word in ['hello', 'hi', 'hey', 'start']):
            return random.choice(self.greetings)
        
        elif any(word in message for word in ['save', 'saving', 'savings']):
            return self._get_savings_advice(user_data)
        
        elif any(word in message for word in ['invest', 'portfolio', 'stock', 'return']):
            return self._get_investment_advice(user_data)
        
        elif any(word in message for word in ['spend', 'expense', 'budget']):
            return self._get_expense_advice(user_data)
        
        elif any(word in message for word in ['loan', 'debt', 'emi']):
            return self._get_loan_advice(user_data)
        
        else:
            return self._get_general_advice(user_data)

    def _get_savings_advice(self, user_data: Dict) -> str:
        savings_opportunity = user_data.summary.total_income * 0.15
        largest_category = max(user_data.cash_flow.categories, key=lambda x: x.amount)
        
        advice = random.choice(self.financial_advice["savings"])
        return advice.format(
            amount=int(savings_opportunity),
            category=largest_category.name.lower(),
            coverage=3  # Simplified calculation
        )

    def _get_investment_advice(self, user_data: Dict) -> str:
        best_performer = max(user_data.investments.holdings, key=lambda x: x.return_)
        
        advice = random.choice(self.financial_advice["investments"])
        return advice.format(
            return_percentage=user_data.investments.return_percentage,
            best_performer=best_performer.name,
            sector="technology"  # Simplified
        )

    def _get_expense_advice(self, user_data: Dict) -> str:
        largest_category = max(user_data.cash_flow.categories, key=lambda x: x.amount)
        
        advice = random.choice(self.financial_advice["expenses"])
        return advice.format(
            category=largest_category.name.lower(),
            percentage=25,  # Simplified calculation
            amount=5000,    # Simplified calculation
            savings_rate=user_data.summary.savings_rate
        )

    def _get_loan_advice(self, user_data: Dict) -> str:
        # Simplified loan advice
        advice = random.choice(self.financial_advice["loans"])
        return advice.format(
            interest_rate=12.5,  # Simplified
            ratio=28  # Simplified debt-to-income ratio
        )

    def _get_general_advice(self, user_data: Dict) -> str:
        if user_data.summary.savings_rate < 15:
            return f"Your savings rate is {user_data.summary.savings_rate}%. Try to increase it to 20% by reducing discretionary spending."
        elif user_data.investments.return_percentage < 10:
            return f"Your investments are returning {user_data.investments.return_percentage}%. Consider diversifying into different asset classes."
        else:
            return "Your financial health looks good! Consider increasing your emergency fund or exploring tax-saving investments."

    def _generate_suggestions(self, user_data: Dict) -> List[str]:
        base_suggestions = [
            "Set up automatic savings transfer",
            "Review your investment portfolio allocation",
            "Create a monthly budget for variable expenses",
            "Check your credit score and report",
            "Explore tax-saving investment options",
            "Set up financial goals for this year"
        ]
        
        # Context-aware suggestions
        if user_data.summary.savings_rate < 15:
            base_suggestions.append("Increase monthly savings by 5%")
        if len(user_data.investments.holdings) < 4:
            base_suggestions.append("Diversify your investment portfolio")
        
        return random.sample(base_suggestions, 3)

# Global instance
advisor_service = EnhancedAdvisorService()