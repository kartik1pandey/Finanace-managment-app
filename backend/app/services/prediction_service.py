import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
import yfinance as yf

class PredictionService:
    def __init__(self):
        self.expense_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.investment_model = LinearRegression()
        self.models_trained = False

    def predict_expenses(self, historical_data: List[Dict], months: int = 3) -> Dict:
        """Predict future expenses using machine learning"""
        if len(historical_data) < 3:
            return self._get_fallback_prediction(historical_data, months)
        
        df = pd.DataFrame(historical_data)
        df['month_index'] = range(len(df))
        
        # Prepare features
        X = df[['month_index']].values
        y = df['expenses'].values
        
        # Train model
        self.expense_model.fit(X, y)
        
        # Predict future
        future_indices = np.array(range(len(df), len(df) + months)).reshape(-1, 1)
        predictions = self.expense_model.predict(future_indices)
        
        # Calculate confidence based on historical variance
        confidence = max(0.6, 1 - (np.std(y) / np.mean(y)))
        
        return {
            "predictions": [
                {
                    "month": (datetime.now() + timedelta(days=30*i)).strftime('%b %Y'),
                    "predicted_expenses": round(float(pred), 2),
                    "confidence": round(confidence, 2)
                }
                for i, pred in enumerate(predictions, 1)
            ],
            "trend": "increasing" if predictions[-1] > predictions[0] else "decreasing",
            "average_predicted": round(float(np.mean(predictions)), 2),
            "model_used": "Random Forest"
        }

    def predict_investment_trend(self, symbol: str = "RELIANCE.NS", days: int = 30) -> Dict:
        """Predict stock price trends using historical data"""
        try:
            stock = yf.Ticker(symbol)
            hist = stock.history(period="6mo")
            
            if hist.empty:
                return {"error": f"No data found for {symbol}"}
            
            hist = hist.reset_index()
            hist['days'] = (hist['Date'] - hist['Date'].min()).dt.days
            
            X = hist[['days']].values[-60:]  # Last 60 days
            y = hist['Close'].values[-60:]
            
            self.investment_model.fit(X, y)
            
            # Predict next 30 days
            future_days = np.array(range(hist['days'].max() + 1, hist['days'].max() + days + 1)).reshape(-1, 1)
            predictions = self.investment_model.predict(future_days)
            
            current_price = y[-1]
            predicted_price = predictions[-1]
            trend = "bullish" if predicted_price > current_price else "bearish"
            
            return {
                "symbol": symbol,
                "current_price": round(current_price, 2),
                "predicted_price": round(predicted_price, 2),
                "trend": trend,
                "confidence": round(0.75, 2),
                "change_percentage": round(((predicted_price - current_price) / current_price) * 100, 2),
                "recommendation": self._get_investment_recommendation(trend, abs(predicted_price - current_price) / current_price)
            }
        except Exception as e:
            return {"error": f"Prediction failed: {str(e)}"}

    def _get_fallback_prediction(self, historical_data: List[Dict], months: int) -> Dict:
        """Fallback prediction when insufficient data"""
        if not historical_data:
            avg_expense = 50000
        else:
            avg_expense = np.mean([d['expenses'] for d in historical_data])
        
        predictions = [avg_expense * (1 + 0.02 * i) for i in range(months)]
        
        return {
            "predictions": [
                {
                    "month": (datetime.now() + timedelta(days=30*i)).strftime('%b %Y'),
                    "predicted_expenses": round(pred, 2),
                    "confidence": 0.5
                }
                for i, pred in enumerate(predictions, 1)
            ],
            "trend": "stable",
            "average_predicted": round(avg_expense, 2),
            "model_used": "Moving Average (Fallback)"
        }

    def _get_investment_recommendation(self, trend: str, volatility: float) -> str:
        if trend == "bullish" and volatility > 0.05:
            return "STRONG BUY"
        elif trend == "bullish":
            return "BUY"
        elif trend == "bearish" and volatility > 0.05:
            return "STRONG SELL"
        else:
            return "HOLD"

# Global instance
prediction_service = PredictionService()