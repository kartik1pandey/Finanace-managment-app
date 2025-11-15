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
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  MessageSquare,
  BarChart3,
  CreditCard,
  LogOut,
} from "lucide-react";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

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
    categories: Array<{ name: string; amount: number; percentage: number }>;
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
  units: number;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#FF6B9D"];

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

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("mcp_session");
    }
    setSession(null);
    setFinancialData(null);
    setAccounts([]);
    setMutualFunds([]);
    router.push("/");
  };

  const fetchAllData = async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch financial summary
      const summaryRes = await fetch(
        `${BACKEND}/api/financial/summary/1?session_id=${sessionId}`
      );
      const summaryData = await summaryRes.json();
      if (summaryData.mcp_data_available) {
        setFinancialData(summaryData);
      } else {
        setError("MCP data not available. Please reconnect your accounts.");
        return;
      }

      // Fetch accounts
      const accRes = await fetch(
        `${BACKEND}/api/financial/accounts/1?session_id=${sessionId}`
      );
      const accData = await accRes.json();
      if (accData.success && accData.accounts) {
        setAccounts(accData.accounts);
      }

      // Fetch mutual funds
      const mfRes = await fetch(
        `${BACKEND}/api/financial/mutual-funds/1?session_id=${sessionId}`
      );
      const mfData = await mfRes.json();
      if (mfData.success && mfData.funds) {
        setMutualFunds(mfData.funds);
      }
    } catch (err) {
      setError(`Data fetch failed: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSession = localStorage.getItem("mcp_session");
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed.sessionId && parsed.isLoggedIn) {
          setSession(parsed);
          fetchAllData(parsed.sessionId);
        } else {
          router.push("/");
        }
      } else {
        router.push("/");
      }
    }
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateHealthScore = () => {
    if (!financialData) return { score: 0, level: "Getting Started" };

    const { savings_rate, net_worth } = financialData.summary;
    let score = 0;

    if (savings_rate >= 30) score += 40;
    else if (savings_rate >= 20) score += 30;
    else if (savings_rate >= 10) score += 20;
    else score += 10;

    if (net_worth >= 1000000) score += 30;
    else if (net_worth >= 500000) score += 20;
    else if (net_worth >= 100000) score += 10;

    const investmentAccounts = accounts.filter((a) =>
      ["EQUITIES", "ETF", "REIT", "INVIT"].includes(a.type)
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

  const navigationCards = [
    {
      title: "AI Advisor",
      description: "Get personalized financial advice",
      icon: MessageSquare,
      color: "from-purple-500 to-pink-500",
      route: "/dashboard/advisor",
    },
    {
      title: "Cash Flow",
      description: "Track income and expenses",
      icon: BarChart3,
      color: "from-blue-500 to-cyan-500",
      route: "/dashboard/cashflow",
    },
    {
      title: "Investments",
      description: "Manage your portfolio",
      icon: TrendingUp,
      color: "from-green-500 to-emerald-500",
      route: "/dashboard/investments",
    },
    {
      title: "Loans",
      description: "Debt management tools",
      icon: CreditCard,
      color: "from-orange-500 to-red-500",
      route: "/dashboard/loans",
    },
  ];

  if (loading && !financialData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              LUMEN Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Real-time Financial Intelligence</p>
          </div>
          <div className="flex gap-3">
            {session && (
              <>
                <Button
                  onClick={() => session.sessionId && fetchAllData(session.sessionId)}
                  disabled={loading}
                  variant="outline"
                >
                  {loading ? (
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Refresh
                </Button>
                <Button onClick={handleLogout} variant="destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {financialData && financialData.mcp_data_available && (
          <>
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Connected successfully! Showing real-time data from your accounts.
              </AlertDescription>
            </Alert>

            {/* Quick Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {navigationCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Card
                    key={card.title}
                    className="cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => router.push(card.route)}
                  >
                    <CardContent className="p-6">
                      <div
                        className={`w-12 h-12 rounded-lg bg-gradient-to-r ${card.color} flex items-center justify-center mb-4`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-lg mb-1">{card.title}</h3>
                      <p className="text-sm text-gray-600">{card.description}</p>
                    </CardContent>
                  </Card>
                );
              })}</div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Net Worth
                  </CardTitle>
                  <Wallet className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(financialData.summary.net_worth)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Total assets minus liabilities
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Assets
                  </CardTitle>
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(
                      financialData.assets?.reduce((sum, a) => sum + a.value, 0) || 0
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {financialData.assets?.length || 0} asset types
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Liabilities
                  </CardTitle>
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(
                      financialData.liabilities?.reduce((sum, l) => sum + l.value, 0) ||
                        0
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {financialData.liabilities?.length || 0} liability types
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Health Score
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {healthScore.score}/100
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{healthScore.level}</p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="accounts">Accounts</TabsTrigger>
                <TabsTrigger value="mutual-funds">Mutual Funds</TabsTrigger>
                <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
                <TabsTrigger value="health">Health Score</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {financialData.assets && financialData.assets.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Asset Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPie>
                              <Pie
                                data={financialData.assets}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ type, percent }) =>
                                  `${type.replace(/ASSET_TYPE_|_/g, " ")} (${
                                    (percent * 100).toFixed(0)
                                  }%)`
                                }
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {financialData.assets.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value) => [
                                  formatCurrency(Number(value)),
                                  "Value",
                                ]}
                              />
                            </RechartsPie>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium">Bank Accounts</span>
                        <span className="text-xl font-bold text-blue-600">
                          {accounts.filter((a) => a.type === "DEPOSIT").length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="font-medium">Investment Accounts</span>
                        <span className="text-xl font-bold text-green-600">
                          {
                            accounts.filter((a) =>
                              ["EQUITIES", "ETF", "REIT", "INVIT"].includes(a.type)
                            ).length
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                        <span className="font-medium">Mutual Funds</span>
                        <span className="text-xl font-bold text-purple-600">
                          {mutualFunds.length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <span className="font-medium">Total Accounts</span>
                        <span className="text-xl font-bold text-orange-600">
                          {accounts.length}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Accounts Tab */}
              <TabsContent value="accounts" className="space-y-4">
                {accounts.length > 0 ? (
                  <div className="grid gap-4">
                    {accounts.map((account) => (
                      <Card key={account.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{account.fip}</CardTitle>
                              <CardDescription>{account.masked_number}</CardDescription>
                            </div>
                            <Badge>
                              {account.type.replace(/ACC_INSTRUMENT_TYPE_|_/g, " ")}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {account.balance !== undefined && (
                            <div className="text-2xl font-bold text-green-600">
                              Balance: {formatCurrency(account.balance)}
                            </div>
                          )}
                          {account.current_value !== undefined && (
                            <div className="text-2xl font-bold text-blue-600">
                              Value: {formatCurrency(account.current_value)}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center text-gray-500">
                      No account data available
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Mutual Funds Tab */}
              <TabsContent value="mutual-funds" className="space-y-4">
                {mutualFunds.length > 0 ? (
                  <div className="grid gap-4">
                    {mutualFunds.map((fund, idx) => (
                      <Card key={idx}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-base">{fund.name}</CardTitle>
                              <CardDescription>
                                {fund.amc.replace(/_/g, " ")} •{" "}
                                {fund.category.replace(/_/g, " ")}
                              </CardDescription>
                            </div>
                            <Badge
                              variant={
                                fund.absolute_returns >= 0 ? "default" : "destructive"
                              }
                            >
                              {fund.xirr > 0 ? "+" : ""}
                              {fund.xirr.toFixed(2)}% XIRR
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Current Value</p>
                              <p className="text-lg font-semibold">
                                {formatCurrency(fund.current_value)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Invested</p>
                              <p className="text-lg font-semibold">
                                {formatCurrency(fund.invested_value)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Returns</p>
                              <p
                                className={`text-lg font-semibold ${
                                  fund.absolute_returns >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {formatCurrency(fund.absolute_returns)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Units</p>
                              <p className="text-lg font-semibold">
                                {fund.units.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center text-gray-500">
                      No mutual fund data available
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Breakdown Tab */}
              <TabsContent value="breakdown" className="space-y-4">
                {financialData.assets && financialData.assets.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Assets Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {financialData.assets.map((asset, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                        >
                          <span className="font-medium">
                            {asset.type.replace(/ASSET_TYPE_|_/g, " ")}
                          </span>
                          <span className="text-lg font-bold">
                            {formatCurrency(asset.value)}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {financialData.liabilities && financialData.liabilities.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Liabilities Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {financialData.liabilities.map((liability, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                        >
                          <span className="font-medium">
                            {liability.type.replace(/LIABILITY_TYPE_|_/g, " ")}
                          </span>
                          <span className="text-lg font-bold">
                            {formatCurrency(liability.value)}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Health Score Tab */}
              <TabsContent value="health">
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Health Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-6 mb-6">
                      <div className="relative">
                        <div
                          className={`w-32 h-32 rounded-full border-8 flex items-center justify-center ${
                            healthScore.score >= 80
                              ? "border-green-500"
                              : healthScore.score >= 60
                              ? "border-yellow-500"
                              : "border-red-500"
                          }`}
                        >
                          <span
                            className={`text-4xl font-bold ${
                              healthScore.score >= 80
                                ? "text-green-600"
                                : healthScore.score >= 60
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {healthScore.score}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-2xl">
                          Level: {healthScore.level}
                        </h4>
                        <p className="text-gray-600 mt-2">
                          {healthScore.score >= 80
                            ? "Excellent! Your finances are in great shape."
                            : healthScore.score >= 60
                            ? "Good! There's room for improvement."
                            : "Let's work on improving your financial health."}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-sm text-gray-600">Net Worth</div>
                        <div className="font-semibold text-xl text-blue-600">
                          {formatCurrency(financialData.summary.net_worth)}
                        </div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-sm text-gray-600">Investment Diversity</div>
                        <div className="font-semibold text-xl text-purple-600">
                          {
                            accounts.filter((a) =>
                              ["EQUITIES", "ETF", "REIT", "INVIT"].includes(a.type)
                            ).length
                          }{" "}
                          assets
                        </div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-sm text-gray-600">Total Assets</div>
                        <div className="font-semibold text-xl text-green-600">
                          {formatCurrency(
                            financialData.assets?.reduce((sum, a) => sum + a.value, 0) ||
                              0
                          )}
                        </div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-sm text-gray-600">Total Liabilities</div>
                        <div className="font-semibold text-xl text-orange-600">
                          {formatCurrency(
                            financialData.liabilities?.reduce(
                              (sum, l) => sum + l.value,
                              0
                            ) || 0
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}
