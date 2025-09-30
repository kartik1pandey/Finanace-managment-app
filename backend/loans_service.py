from datetime import datetime, timedelta
from typing import Dict, List, Optional
import math

class LoansService:
    def __init__(self):
        self.loans_data = self._initialize_loans_data()
        
    def _initialize_loans_data(self) -> Dict:
        """Initialize sample loans data for different users"""
        return {
            1: {
                "active_loans": [
                    {
                        "id": 1,
                        "name": "Home Loan",
                        "type": "home",
                        "lender": "HDFC Bank",
                        "principal_amount": 4500000,
                        "outstanding_amount": 4200000,
                        "interest_rate": 8.5,
                        "tenure_months": 240,
                        "emi_amount": 39150,
                        "start_date": "2022-03-15",
                        "emi_day": 15,
                        "paid_emis": 22,
                        "remaining_emis": 218,
                        "total_interest_paid": 185000,
                        "total_principal_paid": 300000
                    },
                    {
                        "id": 2,
                        "name": "Car Loan", 
                        "type": "car",
                        "lender": "SBI",
                        "principal_amount": 800000,
                        "outstanding_amount": 650000,
                        "interest_rate": 9.2,
                        "tenure_months": 60,
                        "emi_amount": 16680,
                        "start_date": "2023-06-10",
                        "emi_day": 10,
                        "paid_emis": 12,
                        "remaining_emis": 48,
                        "total_interest_paid": 42000,
                        "total_principal_paid": 150000
                    },
                    {
                        "id": 3,
                        "name": "Personal Loan",
                        "type": "personal",
                        "lender": "ICICI Bank",
                        "principal_amount": 500000,
                        "outstanding_amount": 480000,
                        "interest_rate": 12.5,
                        "tenure_months": 36,
                        "emi_amount": 16750,
                        "start_date": "2024-01-05",
                        "emi_day": 5,
                        "paid_emis": 2,
                        "remaining_emis": 34,
                        "total_interest_paid": 8500,
                        "total_principal_paid": 20000
                    }
                ],
                "credit_cards": [
                    {
                        "id": 1,
                        "bank": "HDFC Bank",
                        "card_name": "Regalia",
                        "credit_limit": 300000,
                        "outstanding_amount": 85000,
                        "due_date": "2024-02-15",
                        "min_amount_due": 4250,
                        "interest_rate": 36.0
                    }
                ]
            }
        }

    def get_loans_summary(self, user_id: int) -> Dict:
        """Get comprehensive loans summary"""
        user_loans = self.loans_data.get(user_id, self.loans_data[1])
        active_loans = user_loans["active_loans"]
        credit_cards = user_loans["credit_cards"]
        
        total_outstanding = sum(loan["outstanding_amount"] for loan in active_loans)
        total_credit_card_outstanding = sum(card["outstanding_amount"] for card in credit_cards)
        total_monthly_emi = sum(loan["emi_amount"] for loan in active_loans)
        total_interest_paid = sum(loan["total_interest_paid"] for loan in active_loans)
        
        # Calculate debt-to-income ratio (assuming monthly income of 150,000)
        monthly_income = 150000
        debt_to_income = (total_monthly_emi / monthly_income) * 100
        
        # Calculate average interest rate
        weighted_interest = sum(loan["outstanding_amount"] * loan["interest_rate"] for loan in active_loans)
        avg_interest_rate = weighted_interest / total_outstanding if total_outstanding > 0 else 0
        
        return {
            "summary": {
                "total_loans": len(active_loans),
                "total_outstanding": total_outstanding,
                "total_credit_card_debt": total_credit_card_outstanding,
                "total_monthly_emi": total_monthly_emi,
                "debt_to_income_ratio": round(debt_to_income, 1),
                "avg_interest_rate": round(avg_interest_rate, 2),
                "total_interest_paid": total_interest_paid
            },
            "active_loans": active_loans,
            "credit_cards": credit_cards,
            "upcoming_payments": self._get_upcoming_payments(active_loans, credit_cards),
            "debt_analysis": self._analyze_debt(active_loans, credit_cards)
        }

    def _get_upcoming_payments(self, loans: List, credit_cards: List) -> List:
        """Get upcoming loan and credit card payments"""
        upcoming = []
        today = datetime.now()
        
        for loan in loans:
            # Calculate next EMI date
            next_payment = self._calculate_next_payment_date(loan["start_date"], loan["emi_day"])
            days_until_due = (next_payment - today).days
            
            upcoming.append({
                "type": "loan",
                "name": loan["name"],
                "amount": loan["emi_amount"],
                "due_date": next_payment.strftime("%Y-%m-%d"),
                "days_until_due": days_until_due,
                "lender": loan["lender"]
            })
        
        for card in credit_cards:
            due_date = datetime.strptime(card["due_date"], "%Y-%m-%d")
            days_until_due = (due_date - today).days
            
            upcoming.append({
                "type": "credit_card",
                "name": f"{card['bank']} {card['card_name']}",
                "amount": card["min_amount_due"],
                "due_date": card["due_date"],
                "days_until_due": days_until_due,
                "lender": card["bank"]
            })
        
        return sorted(upcoming, key=lambda x: x["days_until_due"])[:5]

    def _calculate_next_payment_date(self, start_date: str, emi_day: int) -> datetime:
        """Calculate next EMI payment date"""
        today = datetime.now()
        start = datetime.strptime(start_date, "%Y-%m-%d")
        
        # Find next payment date
        next_payment = datetime(today.year, today.month, emi_day)
        if next_payment < today:
            next_payment = datetime(today.year, today.month + 1, emi_day)
            if next_payment.month > 12:
                next_payment = datetime(today.year + 1, 1, emi_day)
        
        return next_payment

    def _analyze_debt(self, loans: List, credit_cards: List) -> Dict:
        """Analyze debt portfolio and provide insights"""
        high_interest_debt = sum(loan["outstanding_amount"] for loan in loans if loan["interest_rate"] > 10)
        total_debt = sum(loan["outstanding_amount"] for loan in loans) + sum(card["outstanding_amount"] for card in credit_cards)
        
        return {
            "high_interest_debt": high_interest_debt,
            "high_interest_percentage": round((high_interest_debt / total_debt) * 100, 1) if total_debt > 0 else 0,
            "recommended_strategy": self._get_repayment_strategy(loans, credit_cards),
            "potential_savings": self._calculate_potential_savings(loans),
            "risk_level": self._assess_risk_level(loans, credit_cards)
        }

    def _get_repayment_strategy(self, loans: List, credit_cards: List) -> str:
        """Determine optimal repayment strategy"""
        # Avalanche method: Pay highest interest first
        high_interest_loans = [loan for loan in loans if loan["interest_rate"] > 10]
        if high_interest_loans:
            return "avalanche"
        
        # Snowball method: Pay smallest balance first for motivation
        small_balance_loans = [loan for loan in loans if loan["outstanding_amount"] < 200000]
        if small_balance_loans:
            return "snowball"
        
        return "balanced"

    def _calculate_potential_savings(self, loans: List) -> float:
        """Calculate potential interest savings through prepayment"""
        potential_savings = 0
        for loan in loans:
            if loan["interest_rate"] > 9:
                # Rough estimate: 15% of remaining interest could be saved with prepayment
                remaining_interest = self._calculate_remaining_interest(loan)
                potential_savings += remaining_interest * 0.15
        
        return round(potential_savings, 2)

    def _calculate_remaining_interest(self, loan: Dict) -> float:
        """Calculate remaining interest for a loan"""
        principal = loan["outstanding_amount"]
        rate = loan["interest_rate"] / 100 / 12
        tenure = loan["remaining_emis"]
        
        # Using amortization formula
        if rate > 0:
            remaining_interest = (principal * rate * tenure) - principal
        else:
            remaining_interest = 0
            
        return max(0, remaining_interest)

    def _assess_risk_level(self, loans: List, credit_cards: List) -> str:
        """Assess debt risk level"""
        total_monthly_emi = sum(loan["emi_amount"] for loan in loans)
        total_credit_utilization = sum(card["outstanding_amount"] / card["credit_limit"] for card in credit_cards) / len(credit_cards) if credit_cards else 0
        
        if total_monthly_emi > 50000 or total_credit_utilization > 0.7:
            return "high"
        elif total_monthly_emi > 30000 or total_credit_utilization > 0.5:
            return "medium"
        else:
            return "low"

    def calculate_emi(self, principal: float, interest_rate: float, tenure_years: int) -> Dict:
        """Calculate EMI for a new loan"""
        monthly_rate = interest_rate / 100 / 12
        tenure_months = tenure_years * 12
        
        if monthly_rate > 0:
            emi = principal * monthly_rate * math.pow(1 + monthly_rate, tenure_months) / (math.pow(1 + monthly_rate, tenure_months) - 1)
        else:
            emi = principal / tenure_months
        
        total_payment = emi * tenure_months
        total_interest = total_payment - principal
        
        return {
            "emi": round(emi, 2),
            "total_interest": round(total_interest, 2),
            "total_payment": round(total_payment, 2),
            "principal": principal,
            "interest_rate": interest_rate,
            "tenure_years": tenure_years,
            "tenure_months": tenure_months
        }

    def calculate_prepayment_savings(self, loan_id: int, user_id: int, prepayment_amount: float) -> Dict:
        """Calculate savings from loan prepayment"""
        user_loans = self.loans_data.get(user_id, self.loans_data[1])
        loan = next((loan for loan in user_loans["active_loans"] if loan["id"] == loan_id), None)
        
        if not loan:
            return {"error": "Loan not found"}
        
        principal = loan["outstanding_amount"]
        rate = loan["interest_rate"] / 100 / 12
        remaining_emis = loan["remaining_emis"]
        current_emi = loan["emi_amount"]
        
        # Calculate current remaining interest
        current_remaining_interest = self._calculate_remaining_interest(loan)
        
        # Calculate new scenario with prepayment
        new_principal = principal - prepayment_amount
        if new_principal <= 0:
            return {"error": "Prepayment amount exceeds outstanding amount"}
        
        # Calculate new tenure with same EMI
        if rate > 0:
            new_tenure = math.log(current_emi / (current_emi - new_principal * rate)) / math.log(1 + rate)
            new_tenure = math.ceil(new_tenure)
        else:
            new_tenure = new_principal / current_emi
        
        new_remaining_interest = (new_principal * rate * new_tenure) - new_principal if rate > 0 else 0
        
        interest_savings = current_remaining_interest - new_remaining_interest
        time_savings = remaining_emis - new_tenure
        
        return {
            "prepayment_amount": prepayment_amount,
            "interest_savings": round(max(0, interest_savings), 2),
            "time_savings_months": max(0, time_savings),
            "new_tenure_months": new_tenure,
            "current_tenure_months": remaining_emis,
            "percentage_savings": round((interest_savings / current_remaining_interest) * 100, 1) if current_remaining_interest > 0 else 0
        }

    def get_amortization_schedule(self, loan_id: int, user_id: int) -> List:
        """Generate amortization schedule for a loan"""
        user_loans = self.loans_data.get(user_id, self.loans_data[1])
        loan = next((loan for loan in user_loans["active_loans"] if loan["id"] == loan_id), None)
        
        if not loan:
            return []
        
        principal = loan["outstanding_amount"]
        rate = loan["interest_rate"] / 100 / 12
        emi = loan["emi_amount"]
        remaining_emis = loan["remaining_emis"]
        
        schedule = []
        current_principal = principal
        
        for month in range(1, remaining_emis + 1):
            interest = current_principal * rate
            principal_payment = emi - interest
            current_principal -= principal_payment
            
            # Avoid negative principal
            if current_principal < 0:
                principal_payment += current_principal
                current_principal = 0
                emi = principal_payment + interest
            
            schedule.append({
                "month": month,
                "emi": round(emi, 2),
                "principal": round(principal_payment, 2),
                "interest": round(interest, 2),
                "outstanding_principal": round(max(0, current_principal), 2),
                "total_interest_paid": round(sum(s["interest"] for s in schedule) + interest, 2)
            })
            
            if current_principal <= 0:
                break
        
        return schedule[:24]  # Return first 24 months for performance

    def get_debt_consolidation_advice(self, user_id: int) -> Dict:
        """Provide debt consolidation advice"""
        user_loans = self.loans_data.get(user_id, self.loans_data[1])
        loans = user_loans["active_loans"]
        credit_cards = user_loans["credit_cards"]
        
        high_interest_loans = [loan for loan in loans if loan["interest_rate"] > 11]
        total_high_interest = sum(loan["outstanding_amount"] for loan in high_interest_loans)
        total_credit_card_debt = sum(card["outstanding_amount"] for card in credit_cards)
        
        consolidation_candidates = high_interest_loans + [
            {"name": f"{card['bank']} Credit Card", "outstanding_amount": card["outstanding_amount"], "interest_rate": card["interest_rate"]}
            for card in credit_cards
        ]
        
        total_consolidation_amount = total_high_interest + total_credit_card_debt
        
        # Suggest personal loan for consolidation if amount is reasonable
        if total_consolidation_amount > 0:
            suggested_loan = {
                "amount": total_consolidation_amount,
                "interest_rate": 10.5,  # Lower than credit cards
                "tenure_years": 3,
                "monthly_savings": self._calculate_consolidation_savings(consolidation_candidates, total_consolidation_amount)
            }
        else:
            suggested_loan = None
        
        return {
            "consolidation_recommended": len(consolidation_candidates) >= 2,
            "candidates": consolidation_candidates,
            "suggested_loan": suggested_loan,
            "potential_monthly_savings": suggested_loan["monthly_savings"] if suggested_loan else 0,
            "reasoning": "Consolidating high-interest debts can reduce your monthly payments and total interest cost."
        }

    def _calculate_consolidation_savings(self, candidates: List, consolidation_amount: float) -> float:
        """Calculate monthly savings from debt consolidation"""
        current_total_payment = sum(
            candidate.get("emi_amount", candidate["outstanding_amount"] * 0.05)  # Use EMI for loans, min payment for cards
            for candidate in candidates
        )
        
        # Calculate new EMI for consolidation loan
        new_emi = self.calculate_emi(consolidation_amount, 10.5, 3)["emi"]
        
        return current_total_payment - new_emi

# Global instance
loans_service = LoansService()