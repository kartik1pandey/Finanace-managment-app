"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Wallet, 
  TrendingUp, 
  Building2, 
  PieChart, 
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from 'recharts';

interface MCPSession {
  sessionId: string;
  loginUrl?: string;
  isLoggedIn: boolean;
}

interface FinancialData {
  summary: {
    net_worth: number;
    total_income: number;
    total_expenses: number;
    savings_rate: number;
    monthly_trend: string;
  };
  assets?: Array<{ type: string; value: number }>;
  liabilities?: Array<{ type: string; value: number }>;
  cash_flow?: {
    monthly_data: Array<{
      month: string;
      income: number;
      expenses: number;
      savings: number;
    }>;
    categories: Array<{
      name: string;
      amount: number;
      percentage: number;
    }>;
  };
  mcp_data_available: boolean;
}

interface Account {
  id: string;
  type: string;
  masked_number: string;
  fip: string;
  bank?: string;
  balance?: number;
  current_value?: number;
}

interface MutualFund {
  name: string;
  amc: string;
  asset_class: string;
  category: string;
  current_value: number;
  invested_value: number;
  absolute_returns: number;
  xirr: number;
  nav: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B9D'];

export default function IntegratedDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<MCPSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [mutualFunds, setMutualFunds] = useState<MutualFund[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const BACKEND = process.env.NEXT_PUBLIC_BACKEND || "http://localhost:8000";

  // Initialize MCP Session
  const initiateMCPSession = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${BACKEND}/api/mcp/initiate`);
      const data = await res.json();
      
      if (data.sessionId) {
        const newSession: MCPSession = {
          sessionId: data.sessionId,
          loginUrl: data.login_url || data.loginUrl,
          isLoggedIn: !data.login_required
        };
        
        setSession(newSession);
        
        if (newSession.isLoggedIn) {
          await fetchAllData(newSession.sessionId);
        }
      } else {
        setError("Failed to initialize session");
      }
    } catch (err) {
      setError(`Initialization failed: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // Check login status
  const checkLoginStatus = async (sessionId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/mcp/login-status?session_id=${sessionId}`);
      const data = await res.json();
      
      if (!data.login_required && data.result) {
        setSession(prev => prev ? {...prev, isLoggedIn: true} : null);
        await fetchAllData(sessionId);
        
        // Store session in localStorage
        localStorage.setItem('mcp_session_id', sessionId);
        
        // Redirect to dashboard after successful login
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
        
        return true;
      }
      return false;
    } catch (err) {
      console.error("Login check failed:", err);
      setError("Failed to check login status. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fetch all financial data
  const fetchAllData = async (sessionId: string) => {
    setLoading(true);
    try {
      // Fetch financial summary
      const summaryRes = await fetch(`${BACKEND}/api/financial/summary/1?session_id=${sessionId}`);
      const summaryData = await summaryRes.json();
      setFinancialData(summaryData);

      // Fetch accounts
      const accRes = await fetch(`${BACKEND}/api/financial/accounts/1?session_id=${sessionId}`);
      const accData = await accRes.json();
      if (accData.success) {
        setAccounts(accData.accounts);
      }

      // Fetch mutual funds
      const mfRes = await fetch(`${BACKEND}/api/financial/mutual-funds/1?session_id=${sessionId}`);
      const mfData = await mfRes.json();
      if (mfData.success) {
        setMutualFunds(mfData.funds);
      }

    } catch (err) {
      setError(`Data fetch failed: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate financial health score
  const calculateHealthScore = () => {
    if (!financialData) return { score: 0, level: "Getting Started" };
    
    const { savings_rate, net_worth } = financialData.summary;
    let score = 0;
    
    // Savings rate contribution (40 points)
    if (savings_rate >= 30) score += 40;
    else if (savings_rate >= 20) score += 30;
    else if (savings_rate >= 10) score += 20;
    else score += 10;
    
    // Net worth contribution (30 points)
    if (net_worth >= 1000000) score += 30;
    else if (net_worth >= 500000) score += 20;
    else if (net_worth >= 100000) score += 10;
    
    // Investment diversity (30 points)
    const investmentAccounts = accounts.filter(a => 
      ['EQUITIES', 'ETF', 'REIT', 'INVIT'].includes(a.type)
    ).length;
    if (investmentAccounts >= 5) score += 30;
    else if (investmentAccounts >= 3) score += 20;
    else if (investmentAccounts >= 1) score += 10;
    
    let level = "Getting Started";
    if (score >= 80) level = "Excellent";
    else if (score >= 60) level = "Good";
    else if (score >= 40) level = "Fair";
    
    return { score, level };
  };

  const healthScore = calculateHealthScore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ArthSahay Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Real-time Financial Intelligence</p>
          </div>
          
          {session && session.isLoggedIn && (
            <Button 
              onClick={() => session.sessionId && fetchAllData(session.sessionId)}
              disabled={loading}
              variant="outline"
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : <RefreshCw className="mr-2" />}
              Refresh Data
            </Button>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Session Status */}
        {!session ? (
          <Card className="border-2 border-dashed">
            <CardHeader>
              <CardTitle>Connect to Financial Data</CardTitle>
              <CardDescription>
                Initialize MCP session to access your real financial data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={initiateMCPSession} 
                disabled={loading}
                size="lg"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2" />
                    Connect Financial Accounts
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : !session.isLoggedIn && session.loginUrl ? (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Login Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  Complete the login process to access your financial data
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={() => window.open(session.loginUrl, '_blank')}
                size="lg"
                className="w-full"
              >
                Open Login Page
              </Button>
              
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Test Credentials:</strong></p>
                <p>Phone: 2222222222</p>
                <p>OTP: Any 6 digits</p>
              </div>
              
              <Button 
                onClick={() => session.sessionId && checkLoginStatus(session.sessionId)}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  "I've Completed Login - Check Status"
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Success Status with redirect message */}
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Connected successfully! Redirecting to your dashboard...
              </AlertDescription>
            </Alert>

            {/* ...rest of the financial data display... */}
            {/* Financial Summary Cards */}
            {financialData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Net Worth</CardTitle>
                    <Wallet className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(financialData.summary.net_worth)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Total assets minus liabilities</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Monthly Income</CardTitle>
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(financialData.summary.total_income)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Monthly Expenses</CardTitle>
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(financialData.summary.total_expenses)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Savings Rate</CardTitle>
                    <DollarSign className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {financialData.summary.savings_rate}%
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Of total income</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}