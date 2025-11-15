import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from datetime import datetime, timedelta
import pandas_ta as ta
from typing import Dict, List, Optional

class InvestmentService:
    def __init__(self):
        self.model = LinearRegression()
        self.portfolio_data = self._initialize_portfolio_data()
        
    def _initialize_portfolio_data(self) -> Dict:
        """Initialize sample portfolio data"""
        return {
            1: {
                "holdings": [
                    {"symbol": "RELIANCE.NS", "name": "Reliance Industries", "quantity": 50, "avg_price": 2450, "current_price": 2850},
                    {"symbol": "TCS.NS", "name": "Tata Consultancy Services", "quantity": 30, "avg_price": 3200, "current_price": 3650},
                    {"symbol": "INFY.NS", "name": "Infosys", "quantity": 40, "avg_price": 1500, "current_price": 1650},
                    {"symbol": "HDFCBANK.NS", "name": "HDFC Bank", "quantity": 25, "avg_price": 1450, "current_price": 1550},
                    {"symbol": "ICICIBANK.NS", "name": "ICICI Bank", "quantity": 35, "avg_price": 850, "current_price": 980}
                ],
                "mutual_funds": [
                    {"name": "Axis Bluechip Fund", "units": 150, "nav": 45.6, "investment": 6500},
                    {"name": "Mirae Asset Emerging Bluechip", "units": 200, "nav": 32.1, "investment": 6200},
                    {"name": "Parag Parikh Flexi Cap", "units": 180, "nav": 38.9, "investment": 6800}
                ],
                "fixed_deposits": [
                    {"bank": "SBI", "amount": 200000, "interest_rate": 6.5, "maturity": "2025-12-31"},
                    {"bank": "HDFC", "amount": 150000, "interest_rate": 7.0, "maturity": "2026-06-30"}
                ]
            }
        }

    def get_portfolio_summary(self, user_id: int) -> Dict:
        """Get complete portfolio summary with real-time prices"""
        portfolio = self.portfolio_data.get(user_id, self.portfolio_data[1])
        total_value = 0
        total_investment = 0
        holdings_data = []
        
        # Update stock prices with real-time data
        for holding in portfolio["holdings"]:
            try:
                stock = yf.Ticker(holding["symbol"])
                hist = stock.history(period="1d")
                if not hist.empty:
                    current_price = hist['Close'].iloc[-1]
                    holding["current_price"] = round(current_price, 2)
            except:
                # Use existing price if API fails
                pass
            
            current_value = holding["quantity"] * holding["current_price"]
            investment = holding["quantity"] * holding["avg_price"]
            profit_loss = current_value - investment
            profit_loss_percent = (profit_loss / investment) * 100
            
            total_value += current_value
            total_investment += investment
            
            holdings_data.append({
                **holding,
                "current_value": round(current_value, 2),
                "investment": round(investment, 2),
                "profit_loss": round(profit_loss, 2),
                "profit_loss_percent": round(profit_loss_percent, 2)
            })
        
        # Calculate MF values
        mf_value = sum(mf["units"] * mf["nav"] for mf in portfolio["mutual_funds"])
        mf_investment = sum(mf["investment"] for mf in portfolio["mutual_funds"])
        
        # FD values
        fd_value = sum(fd["amount"] for fd in portfolio["fixed_deposits"])
        
        total_value += mf_value + fd_value
        total_investment += mf_investment + fd_value
        
        total_return = total_value - total_investment
        total_return_percent = (total_return / total_investment) * 100
        
        return {
            "portfolio_summary": {
                "total_value": round(total_value, 2),
                "total_investment": round(total_investment, 2),
                "total_return": round(total_return, 2),
                "total_return_percent": round(total_return_percent, 2),
                "daily_change": round(total_return * 0.01, 2),  # Simulated daily change
                "daily_change_percent": 0.85
            },
            "holdings": holdings_data,
            "mutual_funds": portfolio["mutual_funds"],
            "fixed_deposits": portfolio["fixed_deposits"],
            "asset_allocation": self._calculate_asset_allocation(holdings_data, mf_value, fd_value, total_value),
            "sector_allocation": self._calculate_sector_allocation(holdings_data)
        }

    def _calculate_asset_allocation(self, holdings: List, mf_value: float, fd_value: float, total_value: float) -> List:
        """Calculate asset allocation percentages"""
        equity_value = sum(h["current_value"] for h in holdings)
        mf_percent = (mf_value / total_value) * 100
        fd_percent = (fd_value / total_value) * 100
        equity_percent = (equity_value / total_value) * 100
        
        return [
            {"asset_class": "Equity", "value": equity_value, "percentage": round(equity_percent, 2)},
            {"asset_class": "Mutual Funds", "value": mf_value, "percentage": round(mf_percent, 2)},
            {"asset_class": "Fixed Deposits", "value": fd_value, "percentage": round(fd_percent, 2)}
        ]

    def _calculate_sector_allocation(self, holdings: List) -> List:
        """Calculate sector allocation"""
        sectors = {
            "Energy": ["RELIANCE.NS"],
            "IT Services": ["TCS.NS", "INFY.NS"],
            "Banking": ["HDFCBANK.NS", "ICICIBANK.NS"]
        }
        
        sector_data = []
        for sector, stocks in sectors.items():
            sector_value = sum(h["current_value"] for h in holdings if h["symbol"] in stocks)
            sector_data.append({
                "sector": sector,
                "value": sector_value,
                "percentage": round((sector_value / sum(h["current_value"] for h in holdings)) * 100, 2)
            })
        
        return sector_data

    def get_stock_analysis(self, symbol: str) -> Dict:
        """Get detailed technical analysis for a stock"""
        try:
            stock = yf.Ticker(symbol)
            hist = stock.history(period="6mo")
            
            if hist.empty:
                return {"error": f"No data found for {symbol}"}
            
            # Calculate technical indicators
            hist['SMA_20'] = ta.sma(hist['Close'], length=20)
            hist['SMA_50'] = ta.sma(hist['Close'], length=50)
            rsi = ta.rsi(hist['Close'], length=14)
            macd = ta.macd(hist['Close'])
            
            current_price = hist['Close'].iloc[-1]
            prev_price = hist['Close'].iloc[-2]
            price_change = current_price - prev_price
            price_change_percent = (price_change / prev_price) * 100
            
            # Generate signals
            signals = self._generate_signals(hist, rsi, macd)
            
            return {
                "symbol": symbol,
                "current_price": round(current_price, 2),
                "price_change": round(price_change, 2),
                "price_change_percent": round(price_change_percent, 2),
                "technical_indicators": {
                    "rsi": round(rsi.iloc[-1], 2) if not rsi.empty else 50,
                    "sma_20": round(hist['SMA_20'].iloc[-1], 2),
                    "sma_50": round(hist['SMA_50'].iloc[-1], 2),
                    "volume": int(hist['Volume'].iloc[-1])
                },
                "signals": signals,
                "recommendation": self._generate_recommendation(signals),
                "support_level": round(current_price * 0.95, 2),
                "resistance_level": round(current_price * 1.05, 2)
            }
        except Exception as e:
            return {"error": f"Analysis failed: {str(e)}"}

    def _generate_signals(self, hist: pd.DataFrame, rsi: pd.Series, macd: pd.DataFrame) -> Dict:
        """Generate trading signals based on technical indicators"""
        signals = {}
        
        # RSI signals
        if not rsi.empty:
            current_rsi = rsi.iloc[-1]
            if current_rsi > 70:
                signals["rsi"] = "Overbought"
            elif current_rsi < 30:
                signals["rsi"] = "Oversold"
            else:
                signals["rsi"] = "Neutral"
        
        # Moving average signals
        if not hist['SMA_20'].isna().iloc[-1] and not hist['SMA_50'].isna().iloc[-1]:
            if hist['SMA_20'].iloc[-1] > hist['SMA_50'].iloc[-1]:
                signals["moving_average"] = "Bullish"
            else:
                signals["moving_average"] = "Bearish"
        
        # MACD signals
        if macd is not None and not macd.empty:
            if macd['MACD_12_26_9'].iloc[-1] > macd['MACDs_12_26_9'].iloc[-1]:
                signals["macd"] = "Bullish"
            else:
                signals["macd"] = "Bearish"
        
        return signals

    def _generate_recommendation(self, signals: Dict) -> str:
        """Generate investment recommendation based on signals"""
        bullish_count = sum(1 for signal in signals.values() if signal in ["Bullish", "Oversold"])
        bearish_count = sum(1 for signal in signals.values() if signal in ["Bearish", "Overbought"])
        
        if bullish_count > bearish_count:
            return "BUY"
        elif bearish_count > bullish_count:
            return "SELL"
        else:
            return "HOLD"

    def predict_stock_price(self, symbol: str, days: int = 30) -> Dict:
        """Predict stock price using machine learning"""
        try:
            stock = yf.Ticker(symbol)
            hist = stock.history(period="1y")
            
            if hist.empty:
                return {"error": f"No data found for {symbol}"}
            
            # Prepare data
            hist = hist.reset_index()
            hist['days'] = (hist['Date'] - hist['Date'].min()).dt.days
            
            X = hist[['days']].values
            y = hist['Close'].values
            
            # Train model
            self.model.fit(X, y)
            
            # Predict future
            last_day = hist['days'].max()
            future_days = np.array(range(last_day + 1, last_day + days + 1)).reshape(-1, 1)
            predictions = self.model.predict(future_days)
            
            current_price = y[-1]
            predicted_price = predictions[-1]
            
            return {
                "symbol": symbol,
                "current_price": round(current_price, 2),
                "predicted_price": round(predicted_price, 2),
                "predicted_change_percent": round(((predicted_price - current_price) / current_price) * 100, 2),
                "confidence": 0.75,
                "prediction_days": days,
                "trend": "Bullish" if predicted_price > current_price else "Bearish"
            }
        except Exception as e:
            return {"error": f"Prediction failed: {str(e)}"}

    def get_market_overview(self) -> Dict:
        """Get overall market overview"""
        indices = ["^NSEI", "^BSESN", "NIFTY_FIN_SERVICE.NS", "NIFTY_IT.NS"]
        market_data = []
        
        for index in indices:
            try:
                ticker = yf.Ticker(index)
                hist = ticker.history(period="1d")
                
                if not hist.empty:
                    current = hist['Close'].iloc[-1]
                    prev_close = hist['Open'].iloc[-1] if len(hist) > 1 else current * 0.99
                    change = current - prev_close
                    change_percent = (change / prev_close) * 100
                    
                    market_data.append({
                        "symbol": index,
                        "name": self._get_index_name(index),
                        "current": round(current, 2),
                        "change": round(change, 2),
                        "change_percent": round(change_percent, 2)
                    })
            except:
                continue
        
        return {
            "market_indices": market_data,
            "market_sentiment": self._calculate_market_sentiment(market_data),
            "updated_at": datetime.now().isoformat()
        }

    def _get_index_name(self, symbol: str) -> str:
        """Get index name from symbol"""
        names = {
            "^NSEI": "Nifty 50",
            "^BSESN": "Sensex",
            "NIFTY_FIN_SERVICE.NS": "Nifty Financial Services",
            "NIFTY_IT.NS": "Nifty IT"
        }
        return names.get(symbol, symbol)

    def _calculate_market_sentiment(self, market_data: List) -> str:
        """Calculate overall market sentiment"""
        if not market_data:
            return "Neutral"
        
        positive_count = sum(1 for index in market_data if index["change_percent"] > 0)
        sentiment_ratio = positive_count / len(market_data)
        
        if sentiment_ratio >= 0.7:
            return "Bullish"
        elif sentiment_ratio <= 0.3:
            return "Bearish"
        else:
            return "Neutral"

# Global instance
investment_service = InvestmentService()