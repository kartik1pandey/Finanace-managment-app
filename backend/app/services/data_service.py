import json
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from app.models.financial import *
import numpy as np

class EnhancedFinancialDataService:
    def __init__(self):
        self.sample_data = {}
        self.user_profiles = {
            1: {"name": "Aarav Sharma", "risk_profile": "moderate", "income_bracket": "high"},
            2: {"name": "Priya Patel", "risk_profile": "conservative", "income_bracket": "medium"},
            3: {"name": "Rohan Kumar", "risk_profile": "aggressive", "income_bracket": "high"}
        }
        self._initialize_data()

    def _initialize_data(self):
        for user_id in self.user_profiles.keys():
            self.sample_data[user_id] = self._generate_enhanced_user_data(user_id)

    def _generate_enhanced_user_data(self, user_id: int) -> FinancialData:
        profile = self.user_profiles[user_id]
        
        # Generate 12 months of historical data
        monthly_data = []
        base_income = 80000 if profile["income_bracket"] == "medium" else 120000
        
        for i in range(12):
            month = (datetime.now() - timedelta(days=30*(11-i))).strftime('%b %Y')
            income_variation = random.uniform(0.9, 1.1)
            income = base_income * income_variation
            
            # Expense patterns based on risk profile
            if profile["risk_profile"] == "conservative":
                expenses = income * random.uniform(0.5, 0.6)
            elif profile["risk_profile"] == "moderate":
                expenses = income * random.uniform(0.6, 0.7)
            else:  # aggressive
                expenses = income * random.uniform(0.7, 0.8)
                
            monthly_data.append(MonthlyData(
                month=month,
                income=round(income, 2),
                expenses=round(expenses, 2),
                savings=round(income - expenses, 2)
            ))

        # Enhanced category spending with realistic patterns
        categories = ['Food & Dining', 'Shopping', 'Transport', 'Entertainment', 'Bills & Utilities', 'Healthcare', 'Travel', 'Investments']
        category_spending = []
        
        for category in categories:
            if category == 'Food & Dining':
                amount = random.randint(8000, 15000)
            elif category == 'Shopping':
                amount = random.randint(5000, 12000)
            elif category == 'Transport':
                amount = random.randint(3000, 8000)
            elif category == 'Bills & Utilities':
                amount = random.randint(4000, 9000)
            else:
                amount = random.randint(1000, 5000)
            percentage = (amount / monthly_data[-1].expenses) * 100
            category_spending.append(CategorySpending(
                name=category,
                amount=amount,
                percentage=round(percentage, 1)
            ))

        # Enhanced investment portfolio based on risk profile
        if profile["risk_profile"] == "conservative":
            holdings = [
                InvestmentHolding(name="Fixed Deposits", value=600000, return_=45000, color="#0088FE"),
                InvestmentHolding(name="Debt Funds", value=300000, return_=25000, color="#00C49F"),
                InvestmentHolding(name="Gold", value=100000, return_=8000, color="#FFBB28"),
            ]
        elif profile["risk_profile"] == "moderate":
            holdings = [
                InvestmentHolding(name="Equity Stocks", value=450000, return_=75000, color="#0088FE"),
                InvestmentHolding(name="Mutual Funds", value=350000, return_=45000, color="#00C49F"),
                InvestmentHolding(name="Fixed Deposits", value=150000, return_=12000, color="#FFBB28"),
                InvestmentHolding(name="Gold", value=50000, return_=5000, color="#FF8042"),
            ]
        else:  # aggressive
            holdings = [
                InvestmentHolding(name="Equity Stocks", value=600000, return_=120000, color="#0088FE"),
                InvestmentHolding(name="Cryptocurrency", value=200000, return_=50000, color="#8884D8"),
                InvestmentHolding(name="Mutual Funds", value=150000, return_=20000, color="#00C49F"),
                InvestmentHolding(name="Startup Investments", value=50000, return_=15000, color="#FF8042"),
            ]

        # Enhanced transactions with realistic descriptions
        transactions = [
            Transaction(id="1", description="Monthly Salary - TechCorp", amount=95000, category="Salary", date=(datetime.now() - timedelta(days=2)).strftime('%Y-%m-%d'), type="income"),
            Transaction(id="2", description="Stock Dividend - RELIANCE", amount=2500, category="Investment", date=(datetime.now() - timedelta(days=3)).strftime('%Y-%m-%d'), type="income"),
            Transaction(id="3", description="BigBasket Grocery Delivery", amount=3500, category="Food & Dining", date=(datetime.now() - timedelta(days=4)).strftime('%Y-%m-%d'), type="expense"),
            Transaction(id="4", description="Amazon Online Shopping", amount=5200, category="Shopping", date=(datetime.now() - timedelta(days=5)).strftime('%Y-%m-%d'), type="expense"),
            Transaction(id="5", description="Uber Rides", amount=1200, category="Transport", date=(datetime.now() - timedelta(days=6)).strftime('%Y-%m-%d'), type="expense"),
            Transaction(id="6", description="Netflix Subscription", amount=649, category="Entertainment", date=(datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d'), type="expense"),
            Transaction(id="7", description="Electricity Bill", amount=1800, category="Bills & Utilities", date=(datetime.now() - timedelta(days=8)).strftime('%Y-%m-%d'), type="expense"),
            Transaction(id="8", description="Apollo Pharmacy", amount=850, category="Healthcare", date=(datetime.now() - timedelta(days=9)).strftime('%Y-%m-%d'), type="expense"),
        ]

        current_month = monthly_data[-1]
        savings_rate = ((current_month.income - current_month.expenses) / current_month.income) * 100

        return FinancialData(
            summary=FinancialSummary(
                net_worth=sum(h.value for h in holdings) + random.randint(50000, 200000),
                total_income=current_month.income,
                total_expenses=current_month.expenses,
                savings_rate=round(savings_rate, 1),
                monthly_trend="up" if current_month.savings > monthly_data[-2].savings else "down"
            ),
            cash_flow=CashFlowData(
                monthly_data=monthly_data[-6:],  # Last 6 months
                categories=category_spending
            ),
            investments=InvestmentData(
                total_value=sum(h.value for h in holdings),
                total_return=sum(h.return_ for h in holdings),
                return_percentage=round((sum(h.return_ for h in holdings) / sum(h.value for h in holdings)) * 100, 1),
                holdings=holdings
            ),
            recent_transactions=sorted(transactions, key=lambda x: x.date, reverse=True)[:8],
            user_profile=profile
        )

    def get_financial_summary(self, user_id: int) -> FinancialData:
        return self.sample_data.get(user_id, self._generate_enhanced_user_data(user_id))

    def get_cash_flow_data(self, user_id: int) -> CashFlowData:
        data = self.sample_data.get(user_id, self._generate_enhanced_user_data(user_id))
        return data.cash_flow

    def get_investment_data(self, user_id: int) -> InvestmentData:
        data = self.sample_data.get(user_id, self._generate_enhanced_user_data(user_id))
        return data.investments

    def get_user_profile(self, user_id: int) -> Dict:
        return self.user_profiles.get(user_id, {"name": "User", "risk_profile": "moderate", "income_bracket": "medium"})

# Global instance
financial_service = EnhancedFinancialDataService()

def generate_sample_data():
    print("📈 Generating enhanced financial data for all users...")
    for user_id in [1, 2, 3]:
        financial_service.get_financial_summary(user_id)
    print("✅ Enhanced sample data generated successfully!")