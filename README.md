# LUMEN - Personal Financial Intelligence Platform

![LUMEN](https://img.shields.io/badge/LUMEN-Financial%20Intelligence-emerald?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?style=flat-square&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?style=flat-square&logo=fastapi)
![Go](https://img.shields.io/badge/Go-MCP%20Server-00ADD8?style=flat-square&logo=go)

LUMEN is a comprehensive financial intelligence platform that provides real-time insights into your financial health through AI-powered analysis, multimodal interactions, and seamless integration with financial accounts via the Model Context Protocol (MCP).

---

## 🌟 Features

### 1. **Dashboard Overview**
- **Real-time Net Worth Tracking**: View your complete financial position at a glance
- **Asset & Liability Breakdown**: Detailed categorization of all your financial holdings
- **Financial Health Score**: AI-calculated score (0-100) based on savings rate, net worth, and investment diversity
- **Quick Navigation**: Easy access to all platform features

### 2. **AI Financial Advisor** 🤖
- **Multimodal Interactions**:
  - 💬 **Text Chat**: Natural language conversations about your finances
  - 🎤 **Voice Input**: Speak your queries using voice recording
  - 📁 **File Analysis**: Upload CSV, Excel, PDF, or text files for instant analysis
- **Context-Aware Responses**: Maintains conversation history and understands your complete financial picture
- **Personalized Recommendations**: Tailored advice based on your actual financial data
- **Document Processing**: Analyze bank statements, transaction reports, and investment documents

### 3. **Cash Flow Analysis** 💰
- **Income vs Expenses**: Visual breakdown of your financial inflows and outflows
- **Asset Distribution**: Pie charts showing asset allocation across categories
- **Liability Tracking**: Monitor all debts and liabilities
- **Financial Insights**: 
  - Asset-to-Liability Ratio
  - Liability Percentage
  - Diversification Score
- **Net Position Summary**: Clear view of your overall cash flow health

### 4. **Investment Portfolio** 📈
- **Stock Explorer**:
  - Real-time stock data using Yahoo Finance
  - Technical indicators (RSI, MACD, Moving Averages)
  - AI-powered stock analysis using Groq LLM
  - Interactive price charts with volume data
  - Buy/Sell/Hold recommendations
- **Portfolio Optimizer**:
  - Modern Portfolio Theory implementation
  - Sharpe Ratio calculation
  - Value at Risk (VaR) analysis
  - Diversification scoring
  - AI-driven rebalancing suggestions
- **Mutual Funds Tracking**:
  - Complete fund holdings from connected accounts
  - XIRR (Extended Internal Rate of Return) calculations
  - Current value vs invested value comparison
  - Returns analysis and performance metrics

### 5. **Loans & Debt Management** 💳
- **Comprehensive Debt Overview**:
  - Total liabilities tracking
  - Debt-to-Asset ratio analysis
  - Individual loan breakdowns
- **Debt Health Analysis**:
  - Color-coded health indicators (Excellent/Good/Needs Attention)
  - Available coverage calculations
  - Debt-free amount projections
- **Actionable Recommendations**:
  - Prioritize high-interest debt
  - Emergency fund guidance
  - Debt reduction strategies
- **Debt-Free Celebration**: Special UI for users with no liabilities

### 6. **MCP Integration** 🔗
- **Account Aggregation**: Connect multiple financial institutions
- **Real-time Data Sync**: Automatic updates from connected accounts
- **Secure Authentication**: OAuth-based login flow
- **Supported Account Types**:
  - Bank Deposits (Savings, Current)
  - Equities
  - Mutual Funds
  - ETFs, REITs, InvITs
  - Loans and Credit

---

## 🏗️ Architecture

```
LUMEN/
├── frontend/          # Next.js 15 + React 19 + TypeScript
├── backend/           # FastAPI + Python (AI & Data Processing)
├── fi-mcp-dev/        # Go MCP Server (Financial Data Aggregation)
└── mcp-test/          # MCP Testing & Integration
```

### Technology Stack

**Frontend:**
- Next.js 15.5.4 with Turbopack
- React 19.1.0
- TypeScript 5.9.3
- Tailwind CSS 4
- Radix UI Components
- Recharts for data visualization
- Supabase for data storage

**Backend:**
- FastAPI (Python)
- Groq AI (LLaMA 3.3 70B)
- Google Gemini (Multimodal AI)
- yfinance (Stock data)
- pandas-ta (Technical analysis)
- httpx (Async HTTP)

**MCP Server:**
- Go 1.x
- Custom middleware
- Financial data aggregation
- OAuth authentication

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+
- **Go** 1.19+
- **Git**

### Installation & Setup

Follow these steps **in order** to run the complete application:

#### **Step 1: MCP Server (Go)**

The MCP server handles financial account connections and data aggregation.

```bash
# Navigate to MCP server directory
cd fi-mcp-dev

# Install Go dependencies
go mod tidy

# Run the MCP server
go run .
```

The MCP server will start on `http://localhost:5001`

---

#### **Step 2: Backend API (Python)**

The backend provides AI analysis, data processing, and API endpoints.

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install fastapi uvicorn httpx pydantic yfinance pandas numpy ta groq google-generativeai python-multipart

# Set up environment variables
# Create a .env file with:
# GROQ_API_KEY=your_groq_api_key
# GEMINI_API_KEY=your_gemini_api_key

# Run the backend server
uvicorn main:app --reload
```

The backend API will start on `http://localhost:8000`

---

#### **Step 3: MCP Test/Integration (Optional)**

```bash
# Navigate to mcp-test directory
cd mcp-test

# Install dependencies
npm install

# Start the test server
npm start
```

---

#### **Step 4: Frontend (Next.js)**

The frontend provides the user interface and dashboard.

```bash
# Navigate to project root (where package.json is)
cd ..

# Install dependencies
npm install

# Set up environment variables
# Create .env.local file with:
# NEXT_PUBLIC_BACKEND=http://localhost:8000

# Run the development server
npm run dev
```

The frontend will start on `http://localhost:3000`

---

### 🎯 Quick Start Summary

**Terminal 1 - MCP Server:**
```bash
cd fi-mcp-dev
go mod tidy
go run .
```

**Terminal 2 - Backend:**
```bash
cd backend
uvicorn main:app --reload
```

**Terminal 3 - MCP Test (Optional):**
```bash
cd mcp-test
npm i
npm start
```

**Terminal 4 - Frontend:**
```bash
npm run dev
```

---

## 📖 Usage Guide

### First Time Setup

1. **Open the application** at `http://localhost:3000`
2. **Sign up** or **Login** with your credentials
3. **Connect Financial Accounts**:
   - Click "Connect Financial Accounts"
   - You'll be redirected to the MCP login page
   - Use test credentials:
     - Phone: `2222222222`
     - OTP: Any 6 digits
4. **Return to Dashboard** after successful authentication
5. Your financial data will be automatically synced

### Using the AI Advisor

1. Navigate to **Dashboard → AI Advisor**
2. **Text Chat**: Type your financial questions
3. **Voice Input**: Click the microphone icon and speak
4. **File Upload**: Click the paperclip icon to upload:
   - CSV files (transaction data)
   - Excel spreadsheets
   - PDF documents (bank statements)
   - Text files
5. The AI maintains conversation context across all interactions

### Analyzing Investments

1. Go to **Dashboard → Investments**
2. **Stock Explorer**:
   - Enter a stock symbol (e.g., AAPL, TSLA, GOOGL)
   - View real-time data and technical indicators
   - Get AI-powered analysis and recommendations
3. **Portfolio Optimizer**:
   - Enter your holdings with percentages
   - Get optimization suggestions
   - View risk metrics and Sharpe ratio
4. **Mutual Funds**:
   - View all funds from connected accounts
   - Track XIRR and returns
   - Analyze performance

### Managing Loans

1. Navigate to **Dashboard → Loans**
2. View all liabilities from connected accounts
3. Check your **Debt Health Score**
4. Follow **Recommended Actions** for debt reduction
5. Monitor **Debt-to-Asset Ratio**

---

## 🔑 API Endpoints

### MCP Integration
- `GET /api/mcp/initiate` - Initialize MCP session
- `GET /api/mcp/login-status` - Check login status
- `GET /api/mcp/networth` - Fetch net worth data
- `POST /api/mcp/call` - Generic MCP tool caller

### Financial Data
- `GET /api/financial/summary/{user_id}` - Get financial summary
- `GET /api/financial/accounts/{user_id}` - Get account details
- `GET /api/financial/mutual-funds/{user_id}` - Get mutual fund holdings

### AI Advisor
- `POST /api/advisor/chat` - Text-based chat
- `POST /api/advisor/upload` - File upload and analysis
- `POST /api/advisor/audio` - Voice input processing
- `POST /api/advisor/clear-history` - Clear conversation history

### Investments
- `GET /api/investments/stock/{symbol}` - Get stock data
- `POST /api/investments/analyze` - AI stock analysis
- `POST /api/investments/optimize-portfolio` - Portfolio optimization

---

## 🔐 Security & Privacy

- **OAuth Authentication**: Secure account connections
- **Session Management**: Encrypted session storage
- **No Data Storage**: Financial data is fetched in real-time
- **API Key Protection**: Environment variables for sensitive keys
- **CORS Protection**: Configured for localhost development

---

## 🛠️ Development

### Project Structure

```
app/
├── dashboard/          # Dashboard pages
│   ├── advisor/       # AI Advisor page
│   ├── cashflow/      # Cash Flow page
│   ├── investments/   # Investments page
│   └── loans/         # Loans page
├── login/             # Authentication pages
└── signup/

backend/
├── main.py                      # FastAPI main application
├── groq_service.py             # Groq AI integration
├── gemini_multimodal_service.py # Gemini multimodal AI
├── investment_service.py        # Investment logic
└── loans_service.py            # Loans logic

components/
├── dashboard/         # Dashboard components
├── investments/       # Investment components
├── loans/            # Loan components
└── ui/               # Reusable UI components

fi-mcp-dev/
├── main.go           # MCP server entry point
├── middlewares/      # Custom middleware
└── pkg/              # Go packages
```

### Environment Variables

**Frontend (.env.local):**
```env
NEXT_PUBLIC_BACKEND=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

**Backend (.env):**
```env
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- **Groq** for fast LLM inference
- **Google Gemini** for multimodal AI capabilities
- **Yahoo Finance** for stock market data
- **Radix UI** for accessible components
- **Recharts** for beautiful data visualizations

---

## 📧 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact the development team

---

## 🚧 Roadmap

- [ ] Mobile app (React Native)
- [ ] Tax planning module
- [ ] Expense categorization with ML
- [ ] Budget recommendations
- [ ] Goal-based financial planning
- [ ] Multi-currency support
- [ ] Export reports (PDF/Excel)
- [ ] Email notifications
- [ ] Social features (compare with peers)

---

**Built with ❤️ for better financial intelligence**
