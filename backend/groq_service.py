import os
import json
from groq import Groq
from dotenv import load_dotenv
from typing import Optional, Dict, Any

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
    
    def create_financial_context_prompt(
        self, 
        user_message: str, 
        financial_data: Optional[Dict[str, Any]] = None
    ) -> str:
        """Create a comprehensive prompt with real financial context from MCP"""
        
        # Build context from real data if available
        if financial_data and financial_data.get('mcp_data_available'):
            net_worth = financial_data.get('summary', {}).get('net_worth', 0)
            assets = financial_data.get('assets', [])
            liabilities = financial_data.get('liabilities', [])
            
            assets_text = "\n".join([
                f"  - {asset['type'].replace('_', ' ').title()}: ₹{asset['value']:,.0f}"
                for asset in assets
            ])
            
            liabilities_text = "\n".join([
                f"  - {liability['type'].replace('_', ' ').title()}: ₹{liability['value']:,.0f}"
                for liability in liabilities
            ])
            
            total_assets = sum(asset['value'] for asset in assets)
            total_liabilities = sum(liability['value'] for liability in liabilities)
            
            prompt = f"""
You are an expert AI financial advisor with access to the user's REAL financial data from their connected accounts.
Your role is to provide personalized, actionable financial advice based on their specific situation.

USER'S REAL FINANCIAL DATA (from connected accounts):

NET WORTH: ₹{net_worth:,.0f}

ASSETS BREAKDOWN (Total: ₹{total_assets:,.0f}):
{assets_text}

LIABILITIES BREAKDOWN (Total: ₹{total_liabilities:,.0f}):
{liabilities_text}

FINANCIAL RATIOS:
- Debt to Asset Ratio: {(total_liabilities / total_assets * 100) if total_assets > 0 else 0:.1f}%
- Net Worth: ₹{net_worth:,.0f}

USER'S QUESTION: "{user_message}"

GUIDELINES FOR YOUR RESPONSE:
1. Reference ACTUAL numbers from their real financial data
2. Provide specific, actionable advice tailored to their situation
3. Highlight opportunities for improvement based on their portfolio
4. Mention risks specific to their holdings
5. Keep responses concise but comprehensive (max 300 words)
6. Use Indian financial context and rupee currency
7. Suggest concrete next steps when appropriate
8. If discussing investments, reference their actual holdings

Please provide your financial advice:
"""
        else:
            # Fallback to generic context if no real data available
            prompt = f"""
You are an expert AI financial advisor providing general financial guidance.

USER'S QUESTION: "{user_message}"

GUIDELINES:
1. Provide helpful, actionable financial advice
2. Use Indian financial context and rupee currency
3. Keep responses concise (max 300 words)
4. Suggest specific actions the user can take
5. Mention relevant financial products or strategies

Please provide your financial advice:
"""
        
        return prompt
    
    async def get_financial_advice(
        self, 
        user_message: str, 
        user_id: int = 1,
        financial_context: Optional[Dict[str, Any]] = None
    ) -> dict:
        """Get AI-powered financial advice using Groq LLM with real financial context"""
        
        # If Groq client is not available, use mock responses
        if self.client is None:
            return self.get_mock_response(user_message, financial_context)
        
        try:
            print(f"🤖 Processing query with Groq: {user_message}")
            
            # Create context-rich prompt with real data
            prompt = self.create_financial_context_prompt(user_message, financial_context)
            
            # Call Groq API
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert financial advisor with deep knowledge of personal finance, investments, loans, and financial planning in India. You have access to the user's REAL financial data and should provide specific advice based on their actual holdings. Be concise, actionable, and reference specific numbers from their portfolio."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model="llama-3.1-8b-instant",
                temperature=0.3,
                max_tokens=800,
                top_p=1,
                stream=False
            )
            
            response_text = chat_completion.choices[0].message.content
            print("✅ Successfully received response from Groq API")
            
            # Generate relevant suggestions based on the query and real data
            suggestions = self.generate_suggestions(user_message, financial_context)
            
            return {
                "response": response_text,
                "suggestions": suggestions,
                "context_used": {
                    "real_financial_data": financial_context is not None and financial_context.get('mcp_data_available', False),
                    "net_worth": financial_context.get('summary', {}).get('net_worth') if financial_context else None,
                    "assets_count": len(financial_context.get('assets', [])) if financial_context else 0,
                    "liabilities_count": len(financial_context.get('liabilities', [])) if financial_context else 0
                }
            }
            
        except Exception as e:
            print(f"❌ Error in Groq service: {str(e)}")
            return self.get_mock_response(user_message, financial_context)
    
    def get_mock_response(
        self, 
        user_message: str, 
        financial_context: Optional[Dict[str, Any]] = None
    ) -> dict:
        """Provide mock responses when Groq is not available"""
        message_lower = user_message.lower()
        
        # Use real data in mock responses if available
        if financial_context and financial_context.get('mcp_data_available'):
            net_worth = financial_context.get('summary', {}).get('net_worth', 0)
            assets = financial_context.get('assets', [])
            
            if any(word in message_lower for word in ['hello', 'hi', 'hey', 'start']):
                response = f"Hello! I can see your complete financial profile from your connected accounts:\n\n- Net Worth: ₹{net_worth:,.0f}\n"
                for asset in assets[:3]:
                    response += f"- {asset['type'].replace('_', ' ').title()}: ₹{asset['value']:,.0f}\n"
                response += "\nHow can I help you optimize your finances today?"
                
            elif any(word in message_lower for word in ['asset', 'holding', 'portfolio', 'invest']):
                total_assets = sum(asset['value'] for asset in assets)
                response = f"Based on your real financial data:\n\n📊 Total Assets: ₹{total_assets:,.0f}\n\n"
                response += "Breakdown:\n"
                for asset in assets:
                    percentage = (asset['value'] / total_assets * 100) if total_assets > 0 else 0
                    response += f"• {asset['type'].replace('_', ' ').title()}: ₹{asset['value']:,.0f} ({percentage:.1f}%)\n"
                response += "\n💡 Consider diversifying if any single asset class exceeds 40% of your portfolio."
                
            elif any(word in message_lower for word in ['mutual fund', 'mf', 'sip']):
                mf_asset = next((a for a in assets if 'MUTUAL_FUND' in a['type']), None)
                if mf_asset:
                    response = f"Your mutual fund portfolio:\n\n💰 Total Value: ₹{mf_asset['value']:,.0f}\n\n"
                    response += "This represents a significant portion of your investments. Consider:\n"
                    response += "• Review fund performance quarterly\n"
                    response += "• Ensure adequate diversification across categories\n"
                    response += "• Continue SIPs for rupee cost averaging"
                else:
                    response = "I don't see mutual fund investments in your portfolio. Consider starting SIPs in diversified equity and debt funds based on your risk profile."
                    
            elif any(word in message_lower for word in ['loan', 'debt', 'liability', 'emi']):
                liabilities = financial_context.get('liabilities', [])
                if liabilities:
                    total_liabilities = sum(l['value'] for l in liabilities)
                    response = f"Your debt analysis:\n\n💳 Total Liabilities: ₹{total_liabilities:,.0f}\n\n"
                    for liability in liabilities:
                        response += f"• {liability['type'].replace('_', ' ').title()}: ₹{liability['value']:,.0f}\n"
                    response += "\n💡 Focus on high-interest debt first. Consider prepayment strategies for loans above 10% interest."
                else:
                    response = "Great news! You have no liabilities in your connected accounts. Maintain this debt-free status while building your assets."
                    
            else:
                response = f"Based on your financial profile with ₹{net_worth:,.0f} net worth, I can help you with specific advice on investments, savings, loans, or financial planning. What would you like to focus on?"
        else:
            # Generic responses when no real data is available
            if any(word in message_lower for word in ['hello', 'hi', 'hey']):
                response = "Hello! I'm your AI financial advisor. Connect your financial accounts to get personalized advice based on your real data. I can help with investments, savings, loans, and financial planning."
            else:
                response = f"I can provide better advice if you connect your financial accounts. This will allow me to analyze your real portfolio and give personalized recommendations. For now, I can offer general guidance on: {user_message}"
        
        return {
            "response": response,
            "suggestions": self.generate_suggestions(user_message, financial_context),
            "context_used": {
                "real_financial_data": financial_context is not None and financial_context.get('mcp_data_available', False),
                "net_worth": financial_context.get('summary', {}).get('net_worth') if financial_context else None
            }
        }
    
    def generate_suggestions(
        self, 
        user_message: str, 
        financial_context: Optional[Dict[str, Any]] = None
    ) -> list:
        """Generate relevant suggestions based on user query and real financial data"""
        
        message_lower = user_message.lower()
        suggestions = []
        
        # Customize suggestions based on real data if available
        if financial_context and financial_context.get('mcp_data_available'):
            assets = financial_context.get('assets', [])
            liabilities = financial_context.get('liabilities', [])
            
            asset_types = {asset['type'] for asset in assets}
            
            if 'MUTUAL_FUND' in asset_types:
                suggestions.append("Review mutual fund performance")
            if 'INDIAN_SECURITIES' in asset_types or 'US_SECURITIES' in asset_types:
                suggestions.append("Analyze stock portfolio allocation")
            if 'EPF' in asset_types:
                suggestions.append("Optimize EPF contributions")
            if liabilities:
                suggestions.append("Create debt repayment strategy")
            if 'SAVINGS_ACCOUNTS' in asset_types:
                suggestions.append("Optimize emergency fund allocation")
                
            # Add query-specific suggestions
            if any(word in message_lower for word in ['invest', 'portfolio']):
                suggestions.insert(0, "Get asset rebalancing recommendations")
            elif any(word in message_lower for word in ['tax', 'save']):
                suggestions.insert(0, "Explore tax-saving investments")
            elif any(word in message_lower for word in ['retire', 'future']):
                suggestions.insert(0, "Calculate retirement corpus needed")
                
        else:
            # Generic suggestions when no real data
            if any(word in message_lower for word in ['save', 'saving', 'savings', 'budget']):
                suggestions = [
                    "Connect accounts to analyze spending",
                    "Set monthly budget targets", 
                    "Create automated savings plan",
                    "Review discretionary expenses"
                ]
            elif any(word in message_lower for word in ['invest', 'portfolio', 'stock', 'mutual']):
                suggestions = [
                    "View portfolio recommendations",
                    "Check market opportunities",
                    "Research diversification options",
                    "Connect accounts for analysis"
                ]
            elif any(word in message_lower for word in ['loan', 'debt', 'emi']):
                suggestions = [
                    "Connect accounts to see loans",
                    "Calculate prepayment savings",
                    "Explore consolidation options",
                    "Review interest rates"
                ]
            else:
                suggestions = [
                    "Connect financial accounts",
                    "View spending patterns",
                    "Check investment opportunities",
                    "Get personalized recommendations"
                ]
        
        return suggestions[:4]  # Return max 4 suggestions

# Global instance
groq_advisor = GroqAdvisorService()