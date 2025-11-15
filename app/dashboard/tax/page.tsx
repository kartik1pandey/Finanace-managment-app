'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calculator,
  TrendingDown,
  TrendingUp,
  IndianRupee,
  Lightbulb,
  PieChart,
  BarChart3,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { loadRawMCPData } from '@/lib/dataStore';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

interface TaxCalculation {
  grossIncome: number;
  deductions: number;
  taxableIncome: number;
  taxAmount: number;
  effectiveRate: number;
  breakdown: Array<{ slab: string; amount: number; tax: number }>;
}

interface IncomeData {
  salary: number;
  otherIncome: number;
  capitalGains: number;
  rentalIncome: number;
}

interface DeductionData {
  section80C: number;
  section80D: number;
  homeLoanInterest: number;
  nps: number;
  other: number;
}

export default function TaxPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Income state
  const [income, setIncome] = useState<IncomeData>({
    salary: 0,
    otherIncome: 0,
    capitalGains: 0,
    rentalIncome: 0,
  });

  // Deductions state
  const [deductions, setDeductions] = useState<DeductionData>({
    section80C: 0,
    section80D: 0,
    homeLoanInterest: 0,
    nps: 0,
    other: 0,
  });

  const [taxCalculation, setTaxCalculation] = useState<TaxCalculation | null>(null);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [regime, setRegime] = useState<'old' | 'new'>('new');

  const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';

  useEffect(() => {
    const loadUserData = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;

      if (!token) {
        router.push('/login');
        return;
      }

      setUserEmail(email);

      // Try to load financial data to pre-fill some fields
      if (email) {
        try {
          const mcpData = await loadRawMCPData(email);
          if (mcpData) {
            // Pre-fill investment data for 80C
            const mfData = mcpData?.mfSchemeAnalytics?.schemeAnalytics || [];
            const totalMFInvestment = mfData.reduce((sum: number, scheme: any) => {
              return sum + (parseFloat(scheme?.enrichedAnalytics?.analytics?.schemeDetails?.investedValue?.units || 0));
            }, 0);
            
            if (totalMFInvestment > 0) {
              setDeductions(prev => ({ ...prev, section80C: Math.min(totalMFInvestment, 150000) }));
            }
          }
        } catch (err) {
          console.error('Failed to load MCP data:', err);
        }
      }

      setLoading(false);
    };

    loadUserData();
  }, [router]);

  const calculateTax = () => {
    setCalculating(true);
    setError(null);

    try {
      const grossIncome = income.salary + income.otherIncome + income.capitalGains + income.rentalIncome;
      
      let totalDeductions = 0;
      let taxableIncome = grossIncome;
      let breakdown: Array<{ slab: string; amount: number; tax: number }> = [];
      let taxAmount = 0;

      if (regime === 'old') {
        // Old regime with deductions
        totalDeductions = Math.min(
          deductions.section80C + deductions.section80D + deductions.homeLoanInterest + deductions.nps + deductions.other,
          250000 // Max deduction limit
        );
        taxableIncome = Math.max(grossIncome - totalDeductions, 0);

        // Old regime tax slabs (FY 2024-25)
        if (taxableIncome <= 250000) {
          breakdown.push({ slab: 'Up to ₹2.5L', amount: taxableIncome, tax: 0 });
        } else if (taxableIncome <= 500000) {
          breakdown.push({ slab: 'Up to ₹2.5L', amount: 250000, tax: 0 });
          const amount = taxableIncome - 250000;
          const tax = amount * 0.05;
          breakdown.push({ slab: '₹2.5L - ₹5L', amount, tax });
          taxAmount += tax;
        } else if (taxableIncome <= 1000000) {
          breakdown.push({ slab: 'Up to ₹2.5L', amount: 250000, tax: 0 });
          breakdown.push({ slab: '₹2.5L - ₹5L', amount: 250000, tax: 12500 });
          const amount = taxableIncome - 500000;
          const tax = amount * 0.20;
          breakdown.push({ slab: '₹5L - ₹10L', amount, tax });
          taxAmount += 12500 + tax;
        } else {
          breakdown.push({ slab: 'Up to ₹2.5L', amount: 250000, tax: 0 });
          breakdown.push({ slab: '₹2.5L - ₹5L', amount: 250000, tax: 12500 });
          breakdown.push({ slab: '₹5L - ₹10L', amount: 500000, tax: 100000 });
          const amount = taxableIncome - 1000000;
          const tax = amount * 0.30;
          breakdown.push({ slab: 'Above ₹10L', amount, tax });
          taxAmount += 112500 + tax;
        }
      } else {
        // New regime (no deductions except standard deduction)
        const standardDeduction = Math.min(income.salary, 50000);
        taxableIncome = Math.max(grossIncome - standardDeduction, 0);

        // New regime tax slabs (FY 2024-25)
        if (taxableIncome <= 300000) {
          breakdown.push({ slab: 'Up to ₹3L', amount: taxableIncome, tax: 0 });
        } else if (taxableIncome <= 600000) {
          breakdown.push({ slab: 'Up to ₹3L', amount: 300000, tax: 0 });
          const amount = taxableIncome - 300000;
          const tax = amount * 0.05;
          breakdown.push({ slab: '₹3L - ₹6L', amount, tax });
          taxAmount += tax;
        } else if (taxableIncome <= 900000) {
          breakdown.push({ slab: 'Up to ₹3L', amount: 300000, tax: 0 });
          breakdown.push({ slab: '₹3L - ₹6L', amount: 300000, tax: 15000 });
          const amount = taxableIncome - 600000;
          const tax = amount * 0.10;
          breakdown.push({ slab: '₹6L - ₹9L', amount, tax });
          taxAmount += 15000 + tax;
        } else if (taxableIncome <= 1200000) {
          breakdown.push({ slab: 'Up to ₹3L', amount: 300000, tax: 0 });
          breakdown.push({ slab: '₹3L - ₹6L', amount: 300000, tax: 15000 });
          breakdown.push({ slab: '₹6L - ₹9L', amount: 300000, tax: 30000 });
          const amount = taxableIncome - 900000;
          const tax = amount * 0.15;
          breakdown.push({ slab: '₹9L - ₹12L', amount, tax });
          taxAmount += 45000 + tax;
        } else if (taxableIncome <= 1500000) {
          breakdown.push({ slab: 'Up to ₹3L', amount: 300000, tax: 0 });
          breakdown.push({ slab: '₹3L - ₹6L', amount: 300000, tax: 15000 });
          breakdown.push({ slab: '₹6L - ₹9L', amount: 300000, tax: 30000 });
          breakdown.push({ slab: '₹9L - ₹12L', amount: 300000, tax: 45000 });
          const amount = taxableIncome - 1200000;
          const tax = amount * 0.20;
          breakdown.push({ slab: '₹12L - ₹15L', amount, tax });
          taxAmount += 90000 + tax;
        } else {
          breakdown.push({ slab: 'Up to ₹3L', amount: 300000, tax: 0 });
          breakdown.push({ slab: '₹3L - ₹6L', amount: 300000, tax: 15000 });
          breakdown.push({ slab: '₹6L - ₹9L', amount: 300000, tax: 30000 });
          breakdown.push({ slab: '₹9L - ₹12L', amount: 300000, tax: 45000 });
          breakdown.push({ slab: '₹12L - ₹15L', amount: 300000, tax: 60000 });
          const amount = taxableIncome - 1500000;
          const tax = amount * 0.30;
          breakdown.push({ slab: 'Above ₹15L', amount, tax });
          taxAmount += 150000 + tax;
        }
      }

      // Add cess (4%)
      taxAmount = taxAmount * 1.04;

      const effectiveRate = grossIncome > 0 ? (taxAmount / grossIncome) * 100 : 0;

      setTaxCalculation({
        grossIncome,
        deductions: regime === 'old' ? totalDeductions : 0,
        taxableIncome,
        taxAmount,
        effectiveRate,
        breakdown,
      });
    } catch (err) {
      setError('Failed to calculate tax. Please check your inputs.');
      console.error(err);
    } finally {
      setCalculating(false);
    }
  };

  const generateAIInsights = async () => {
    if (!taxCalculation) {
      setError('Please calculate tax first');
      return;
    }

    if (!OPENROUTER_API_KEY) {
      setError('OpenRouter API key not configured');
      return;
    }

    setGeneratingInsights(true);
    setError(null);

    try {
      const prompt = `You are a tax planning expert in India. Analyze this tax situation and provide actionable insights:

Income Details:
- Salary: ₹${income.salary.toLocaleString('en-IN')}
- Other Income: ₹${income.otherIncome.toLocaleString('en-IN')}
- Capital Gains: ₹${income.capitalGains.toLocaleString('en-IN')}
- Rental Income: ₹${income.rentalIncome.toLocaleString('en-IN')}
- Gross Income: ₹${taxCalculation.grossIncome.toLocaleString('en-IN')}

Current Deductions (${regime === 'old' ? 'Old Regime' : 'New Regime'}):
- Section 80C: ₹${deductions.section80C.toLocaleString('en-IN')}
- Section 80D: ₹${deductions.section80D.toLocaleString('en-IN')}
- Home Loan Interest: ₹${deductions.homeLoanInterest.toLocaleString('en-IN')}
- NPS: ₹${deductions.nps.toLocaleString('en-IN')}

Tax Calculation:
- Taxable Income: ₹${taxCalculation.taxableIncome.toLocaleString('en-IN')}
- Tax Amount: ₹${taxCalculation.taxAmount.toLocaleString('en-IN')}
- Effective Tax Rate: ${taxCalculation.effectiveRate.toFixed(2)}%

Provide:
1. Analysis of current tax situation
2. Specific recommendations to save more tax
3. Comparison between old and new regime (which is better)
4. Investment suggestions for tax saving
5. Any other deductions they might be missing

Keep it concise, actionable, and specific to Indian tax laws (FY 2024-25). Use bullet points and be practical.`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
          'X-Title': 'LUMEN AI Tax Planning',
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert Indian tax consultant providing personalized tax-saving advice.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('OpenRouter API error:', errorData);
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const insights = data.choices[0]?.message?.content || 'No insights generated';
      setAiInsights(insights);
    } catch (err) {
      console.error('Failed to generate insights:', err);
      setError('Failed to generate AI insights. Please try again.');
    } finally {
      setGeneratingInsights(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading tax calculator...</p>
        </div>
      </div>
    );
  }

  const incomeBreakdown = [
    { name: 'Salary', value: income.salary },
    { name: 'Other Income', value: income.otherIncome },
    { name: 'Capital Gains', value: income.capitalGains },
    { name: 'Rental Income', value: income.rentalIncome },
  ].filter(item => item.value > 0);

  const deductionBreakdown = [
    { name: '80C', value: deductions.section80C },
    { name: '80D', value: deductions.section80D },
    { name: 'Home Loan', value: deductions.homeLoanInterest },
    { name: 'NPS', value: deductions.nps },
    { name: 'Other', value: deductions.other },
  ].filter(item => item.value > 0);

  const taxBreakdownChart = taxCalculation?.breakdown.map(item => ({
    name: item.slab,
    amount: item.amount,
    tax: item.tax,
  })) || [];

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Tax Planning
          </h1>
          <p className="text-gray-600 mt-2">Calculate your tax and get AI-powered savings insights</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          FY 2024-25
        </Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Regime Selector */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Select Tax Regime
          </CardTitle>
          <CardDescription>Choose between old and new tax regime</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              variant={regime === 'new' ? 'default' : 'outline'}
              onClick={() => setRegime('new')}
              className="flex-1"
            >
              New Regime (Lower rates, no deductions)
            </Button>
            <Button
              variant={regime === 'old' ? 'default' : 'outline'}
              onClick={() => setRegime('old')}
              className="flex-1"
            >
              Old Regime (Higher rates, with deductions)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Income Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-green-600" />
            Income Details
          </CardTitle>
          <CardDescription>Enter all your income sources for the financial year</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Annual Salary</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  value={income.salary || ''}
                  onChange={(e) => setIncome({ ...income, salary: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Other Income</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  value={income.otherIncome || ''}
                  onChange={(e) => setIncome({ ...income, otherIncome: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Capital Gains</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  value={income.capitalGains || ''}
                  onChange={(e) => setIncome({ ...income, capitalGains: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Rental Income</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  value={income.rentalIncome || ''}
                  onChange={(e) => setIncome({ ...income, rentalIncome: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700">Total Gross Income</span>
              <span className="text-2xl font-bold text-blue-600">
                {formatCurrency(income.salary + income.otherIncome + income.capitalGains + income.rentalIncome)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deductions Section (Only for Old Regime) */}
      {regime === 'old' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-600" />
              Tax Deductions
            </CardTitle>
            <CardDescription>Enter your eligible deductions under old regime</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Section 80C (Max ₹1.5L)
                  <span className="text-xs text-gray-500 ml-2">PPF, ELSS, LIC, etc.</span>
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    value={deductions.section80C || ''}
                    onChange={(e) => setDeductions({ ...deductions, section80C: Math.min(parseFloat(e.target.value) || 0, 150000) })}
                    className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    max="150000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Section 80D (Max ₹25K)
                  <span className="text-xs text-gray-500 ml-2">Health Insurance</span>
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    value={deductions.section80D || ''}
                    onChange={(e) => setDeductions({ ...deductions, section80D: Math.min(parseFloat(e.target.value) || 0, 25000) })}
                    className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    max="25000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Home Loan Interest (Max ₹2L)
                  <span className="text-xs text-gray-500 ml-2">Section 24</span>
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    value={deductions.homeLoanInterest || ''}
                    onChange={(e) => setDeductions({ ...deductions, homeLoanInterest: Math.min(parseFloat(e.target.value) || 0, 200000) })}
                    className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    max="200000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  NPS (Max ₹50K)
                  <span className="text-xs text-gray-500 ml-2">Section 80CCD(1B)</span>
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    value={deductions.nps || ''}
                    onChange={(e) => setDeductions({ ...deductions, nps: Math.min(parseFloat(e.target.value) || 0, 50000) })}
                    className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    max="50000"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Other Deductions</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    value={deductions.other || ''}
                    onChange={(e) => setDeductions({ ...deductions, other: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700">Total Deductions</span>
                <span className="text-2xl font-bold text-orange-600">
                  {formatCurrency(deductions.section80C + deductions.section80D + deductions.homeLoanInterest + deductions.nps + deductions.other)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calculate Button */}
      <Button
        onClick={calculateTax}
        disabled={calculating}
        size="lg"
        className="w-full"
      >
        {calculating ? (
          <>
            <Loader2 className="mr-2 animate-spin" />
            Calculating...
          </>
        ) : (
          <>
            <Calculator className="mr-2" />
            Calculate Tax
          </>
        )}
      </Button>

      {/* Tax Calculation Results */}
      {taxCalculation && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-2 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Gross Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(taxCalculation.grossIncome)}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Deductions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(taxCalculation.deductions)}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Taxable Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(taxCalculation.taxableIncome)}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Tax Payable</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(taxCalculation.taxAmount)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Effective Rate: {taxCalculation.effectiveRate.toFixed(2)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income Breakdown */}
            {incomeBreakdown.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Income Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={incomeBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {incomeBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tax Slab Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Tax Slab Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={taxBreakdownChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Bar dataKey="amount" fill="#3B82F6" name="Income in Slab" />
                      <Bar dataKey="tax" fill="#EF4444" name="Tax" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Tax Calculation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Tax Slab</th>
                      <th className="text-right p-3">Income in Slab</th>
                      <th className="text-right p-3">Tax Rate</th>
                      <th className="text-right p-3">Tax Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxCalculation.breakdown.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{item.slab}</td>
                        <td className="text-right p-3">{formatCurrency(item.amount)}</td>
                        <td className="text-right p-3">
                          {item.tax === 0 ? 'Nil' : `${((item.tax / item.amount) * 100).toFixed(0)}%`}
                        </td>
                        <td className="text-right p-3 font-semibold text-red-600">
                          {formatCurrency(item.tax)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-bold">
                      <td className="p-3" colSpan={3}>Total Tax (including 4% cess)</td>
                      <td className="text-right p-3 text-red-600">
                        {formatCurrency(taxCalculation.taxAmount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* AI Insights Section */}
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-purple-600" />
                AI-Powered Tax Saving Insights
              </CardTitle>
              <CardDescription>Get personalized recommendations to optimize your tax</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!aiInsights ? (
                <Button
                  onClick={generateAIInsights}
                  disabled={generatingInsights || !OPENROUTER_API_KEY}
                  size="lg"
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {generatingInsights ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" />
                      Generating Insights...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="mr-2" />
                      Generate AI Insights
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap">{aiInsights}</div>
                    </div>
                  </div>
                  <Button
                    onClick={generateAIInsights}
                    disabled={generatingInsights}
                    variant="outline"
                    className="w-full"
                  >
                    Regenerate Insights
                  </Button>
                </div>
              )}

              {!OPENROUTER_API_KEY && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Add NEXT_PUBLIC_OPENROUTER_API_KEY to your .env.local to enable AI insights
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
