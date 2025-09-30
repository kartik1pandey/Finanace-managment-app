import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

class GroqAdvisorService:
    def __init__(self):
        api_key = os.getenv('GROQ_API_KEY')
        if not api_key:
            print("⚠️  GROQ_API_KEY not found. Using mock responses.")
            self.client = None
        else:
            try:
                self.client = Groq(api_key=api_key)
                print("✅ Groq client initialized successfully")
            except Exception as e:
                print(f"❌ Failed to initialize Groq client: {e}")
                self.client = None
    
    def get_complete_financial_data(self, user_id: int = 1):
        """Get complete financial context for the user"""
        financial_summary = {
            "net_worth": 1250000,
            "total_income": 95000,
            "total_expenses": 65000,
            "savings_rate": 31.6,
            "monthly_trend": "up"
        }
        
        cash_flow = {
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
        
        investments = {
            "total_value": 850000,
            "total_return": 125000,
            "return_percentage": 17.2,
            "holdings": [
                {"name": "Stocks", "value": 350000, "return": 75000},
                {"name": "Mutual Funds", "value": 250000, "return": 35000},
                {"name": "Fixed Deposits", "value": 150000, "return": 12000},
                {"name": "Gold", "value": 80000, "return": 8000},
                {"name": "Cryptocurrency", "value": 20000, "return": 5000}
            ]
        }
        
        loans = {
            "total_loans": 500000,
            "monthly_emi": 45000,
            "interest_paid": 75000,
            "loans": [
                {"name": "Home Loan", "balance": 300000, "interest_rate": 8.5, "emi": 25000},
                {"name": "Car Loan", "balance": 150000, "interest_rate": 9.2, "emi": 15000},
                {"name": "Personal Loan", "balance": 50000, "interest_rate": 12.5, "emi": 5000}
            ]
        }
        
        return {
            "financial_summary": financial_summary,
            "cash_flow": cash_flow,
            "investments": investments,
            "loans": loans,
            "user_profile": {
                "name": "Aarav Sharma",
                "risk_profile": "moderate",
                "income_bracket": "high"
            }
        }
    
    def create_financial_context_prompt(self, user_message: str, financial_data: dict) -> str:
        """Create a comprehensive prompt with financial context"""
        
        prompt = f"""
        You are an expert AI financial advisor with access to the user's complete financial data.
        Your role is to provide personalized, actionable financial advice based on their specific situation.
        
        USER'S FINANCIAL PROFILE:
        - Name: {financial_data['user_profile']['name']}
        - Risk Profile: {financial_data['user_profile']['risk_profile']}
        - Income Bracket: {financial_data['user_profile']['income_bracket']}
        
        FINANCIAL SUMMARY:
        - Net Worth: ₹{financial_data['financial_summary']['net_worth']:,.0f}
        - Monthly Income: ₹{financial_data['financial_summary']['total_income']:,.0f}
        - Monthly Expenses: ₹{financial_data['financial_summary']['total_expenses']:,.0f}
        - Savings Rate: {financial_data['financial_summary']['savings_rate']}%
        
        CASH FLOW ANALYSIS:
        Monthly Income: ₹{financial_data['financial_summary']['total_income']:,.0f}
        Monthly Expenses: ₹{financial_data['financial_summary']['total_expenses']:,.0f}
        Monthly Savings: ₹{financial_data['financial_summary']['total_income'] - financial_data['financial_summary']['total_expenses']:,.0f}
        
        Expense Categories:
        {chr(10).join([f"  - {cat['name']}: ₹{cat['amount']:,.0f} ({cat['percentage']}%)" for cat in financial_data['cash_flow']['categories']])}
        
        INVESTMENT PORTFOLIO:
        Total Value: ₹{financial_data['investments']['total_value']:,.0f}
        Total Returns: ₹{financial_data['investments']['total_return']:,.0f}
        Return Percentage: {financial_data['investments']['return_percentage']}%
        
        Holdings:
        {chr(10).join([f"  - {holding['name']}: ₹{holding['value']:,.0f} (Returns: ₹{holding['return']:,.0f})" for holding in financial_data['investments']['holdings']])}
        
        LOANS AND DEBT:
        Total Loans: ₹{financial_data['loans']['total_loans']:,.0f}
        Monthly EMI: ₹{financial_data['loans']['monthly_emi']:,.0f}
        Total Interest Paid: ₹{financial_data['loans']['interest_paid']:,.0f}
        
        Individual Loans:
        {chr(10).join([f"  - {loan['name']}: ₹{loan['balance']:,.0f} at {loan['interest_rate']}% (EMI: ₹{loan['emi']:,.0f})" for loan in financial_data['loans']['loans']])}
        
        USER'S QUESTION: "{user_message}"
        
        GUIDELINES FOR YOUR RESPONSE:
        1. Be specific and reference actual numbers from their financial data
        2. Provide actionable advice tailored to their situation
        3. Highlight opportunities for improvement
        4. Mention risks and considerations
        5. Keep responses concise but comprehensive
        6. Use Indian financial context and rupee currency
        7. Suggest concrete next steps when appropriate
        
        Please provide your financial advice:
        """
        
        return prompt
    
    async def get_financial_advice(self, user_message: str, user_id: int = 1) -> dict:
        """Get AI-powered financial advice using Groq LLM with full financial context"""
        
        # If Groq client is not available, use mock responses
        if self.client is None:
            return self.get_mock_response(user_message)
        
        try:
            print(f"🤖 Processing query with Groq: {user_message}")
            
            # Get complete financial data
            financial_data = self.get_complete_financial_data(user_id)
            
            # Create context-rich prompt
            prompt = self.create_financial_context_prompt(user_message, financial_data)
            
            # Call Groq API
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert financial advisor with deep knowledge of personal finance, investments, loans, and financial planning. Provide specific, actionable advice based on the user's actual financial data."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model="llama-3.1-8b-instant",
                temperature=0.3,
                max_tokens=1024,
                top_p=1,
                stream=False
            )
            
            response_text = chat_completion.choices[0].message.content
            print("✅ Successfully received response from Groq API")
            
            # Generate relevant suggestions based on the query
            suggestions = self.generate_suggestions(user_message, financial_data)
            
            return {
                "response": response_text,
                "suggestions": suggestions,
                "context_used": {
                    "financial_summary": True,
                    "cash_flow": True,
                    "investments": True,
                    "loans": True
                }
            }
            
        except Exception as e:
            print(f"❌ Error in Groq service: {str(e)}")
            return self.get_mock_response(user_message)
    
    def get_mock_response(self, user_message: str) -> dict:
        """Provide mock responses when Groq is not available"""
        message_lower = user_message.lower()
        
        if any(word in message_lower for word in ['hello', 'hi', 'hey']):
            response = "Hello! I'm your AI financial advisor. I can see your complete financial profile:\n\n- Net Worth: ₹12,50,000\n- Monthly Income: ₹95,000\n- Savings Rate: 31.6%\n- Investment Portfolio: ₹8,50,000 (17.2% returns)\n\nHow can I help you optimize your finances today?"
        elif any(word in message_lower for word in ['save', 'saving', 'savings']):
            response = "Based on your financial data:\n\n💰 Your savings rate is excellent at 31.6% (₹30,000 monthly)\n📊 Your largest expense is Travel (₹15,000 - 23.1%)\n💡 Recommendation: Reduce dining out by 20% to save additional ₹2,400 monthly\n🎯 Consider increasing your SIP investments to ₹15,000 monthly"
        elif any(word in message_lower for word in ['invest', 'portfolio', 'stock']):
            response = "Your investment portfolio analysis:\n\n📈 Total Value: ₹8,50,000\n📊 Total Returns: ₹1,25,000 (17.2%)\n🏆 Best Performer: Stocks (₹3,50,000 with ₹75,000 returns)\n⚖️ Allocation: Stocks 41%, Mutual Funds 29%, FDs 18%, Gold 9%, Crypto 2%\n💡 Recommendation: Consider rebalancing - reduce crypto exposure and increase mutual funds"
        elif any(word in message_lower for word in ['loan', 'debt', 'emi']):
            response = "Loan Portfolio Analysis:\n\n🏠 Total Loans: ₹5,00,000\n💰 Monthly EMI: ₹45,000\n📊 Highest Interest: Personal Loan (12.5%)\n💡 Strategy: Focus on prepaying personal loan first to save ₹6,250 annually in interest\n🎯 Consider: Debt consolidation if you can get rate below 10%"
        else:
            response = f"I've analyzed your complete financial situation:\n\n- Net Worth: ₹12,50,000\n- Monthly Cash Flow: ₹30,000 savings\n- Investments: ₹8,50,000 growing at 17.2%\n- Loans: ₹5,00,000 at weighted 9.2% interest\n\nCould you specify what aspect you'd like me to help with? I can provide advice on savings, investments, loans, or overall financial planning."
        
        return {
            "response": response,
            "suggestions": self.generate_suggestions(user_message, self.get_complete_financial_data()),
            "context_used": {
                "financial_summary": True,
                "cash_flow": True,
                "investments": True,
                "loans": True
            }
        }
    
    def generate_suggestions(self, user_message: str, financial_data: dict) -> list:
        """Generate relevant suggestions based on user query and financial context"""
        
        message_lower = user_message.lower()
        
        if any(word in message_lower for word in ['save', 'saving', 'savings', 'budget']):
            suggestions = [
                "Analyze expense categories",
                "Set monthly budget targets", 
                "Create savings plan",
                "Review discretionary spending"
            ]
        elif any(word in message_lower for word in ['invest', 'portfolio', 'stock', 'mutual']):
            suggestions = [
                "View portfolio allocation",
                "Check recent returns",
                "Rebalance portfolio",
                "Research new investments"
            ]
        elif any(word in message_lower for word in ['loan', 'debt', 'emi', 'repayment']):
            suggestions = [
                "Check loan amortization",
                "Calculate prepayment savings",
                "Explore debt consolidation",
                "Optimize repayment strategy"
            ]
        elif any(word in message_lower for word in ['retire', 'future', 'goal', 'plan']):
            suggestions = [
                "Set retirement goals",
                "Calculate required corpus",
                "Review investment strategy",
                "Plan emergency fund"
            ]
        else:
            suggestions = [
                "View detailed spending breakdown",
                "Check investment performance",
                "Review loan repayment strategy",
                "Get financial health score"
            ]
        
        return suggestions

# Global instance
groq_advisor = GroqAdvisorService()