'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Eye,
  FileText,
  IndianRupee,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { saveReceipt, loadReceipts, deleteReceipt as deleteReceiptFromDB, uploadReceiptImage } from '@/lib/dataStore';

interface ExtractedData {
  store_name?: string;
  total_amount?: number;
  date?: string;
  items?: Array<{ name: string; price: number; quantity: number }>;
  category?: string;
  raw_text?: string; // added to keep raw OCR output when parsing fails
}

interface Receipt {
  id: string;
  filename: string;
  uploadDate: string;
  extractedData: ExtractedData;
  imageUrl: string;
  status: 'processing' | 'completed' | 'failed';
  error?: string;
}

export default function ReceiptsPage() {
  const router = useRouter();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || 'AIzaSyBRLUBQW__rO5hV7WqP3d7mau16bTz11NQ';
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND || 'http://localhost:8000';

  // Load receipts from Supabase on mount
  useEffect(() => {
    const loadUserReceipts = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;

      if (!token) {
        router.push('/login');
        return;
      }

      if (!email) {
        setError('User email not found');
        setLoading(false);
        return;
      }

      setUserEmail(email);

      try {
        const loadedReceipts = await loadReceipts(email);
        // Convert Supabase format to Receipt format
        const formattedReceipts: Receipt[] = loadedReceipts.map((r: any) => ({
          id: r.id,
          filename: r.filename,
          uploadDate: r.upload_date,
          extractedData: {
            store_name: r.store_name,
            total_amount: r.total_amount ? parseFloat(r.total_amount) : undefined,
            date: r.purchase_date,
            items: r.items,
            category: r.category,
            raw_text: r.raw_text,
          },
          imageUrl: r.image_url || '',
          status: r.status as 'processing' | 'completed' | 'failed',
          error: r.error_message,
        }));
        setReceipts(formattedReceipts);
      } catch (err) {
        console.error('Failed to load receipts:', err);
        setError('Failed to load receipts from database');
      } finally {
        setLoading(false);
      }
    };

    loadUserReceipts();
  }, [router]);

  // Enhanced image encoding with better error handling
  const encodeImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to read file as base64'));
        }
      };
      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsDataURL(file);
    });
  };

  // Enhanced OCR processing with proper error handling and rupee formatting
  const processReceiptWithOCR = async (base64Image: string, filename: string): Promise<ExtractedData> => {
    if (!GOOGLE_API_KEY) {
      throw new Error('Google API key is not configured. Please check your environment variables.');
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`;

    const promptText = `
        "You are an expert receipt processing assistant. "
        "Analyze this receipt image and extract the following information. "
        "Your response must be a single, valid JSON object and nothing else."
        "\n\n"
        "Follow this exact structure:"
        "\n"
        "1. store_name: The exact store name as it appears on the receipt. "
        "If not found, use null."
        "\n"
        "2. total_amount: The final total amount paid (in rupees, as a float). "
        "If not found, use null."
        "\n"
        "3. date: The transaction date (in YYYY-MM-DD format). "
        "If not found, use null."
        "\n"
        "4. items: A list of all purchased items. Each item in the list must be an object with the following fields:"
        "    - name: The item's name, exactly as it appears on the receipt."
        "    - price: The price of the item (in rupees, as a float)."
        "    - quantity: The quantity of the item (as an integer). If quantity is not explicitly listed for an item, default to 1."
        "   If no items are found, use an empty list []."
        "\n"
        "5. category: Infer an appropriate category for the purchase "
        "(e.g., 'Groceries', 'Restaurant', 'Electronics', 'Utilities', 'Other'). "
        "If no clear category, use 'Other'."
        "\n\n"
        "Respond ONLY with the valid JSON object. Do not include any introductory text, explanations, or markdown."
    )`

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: promptText },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: base64Image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            topK: 32,
            topP: 1,
            maxOutputTokens: 2048,
            response_mime_type: 'application/json'
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google API response error:', response.status, errorText);
        if (response.status === 400) {
          throw new Error('Invalid API request. Check your API key and request format.');
        } else if (response.status === 403) {
          throw new Error('API key is invalid or has insufficient permissions.');
        } else if (response.status === 429) {
          throw new Error('API rate limit exceeded. Please try again later.');
        } else if (response.status === 500) {
          throw new Error('Google API server error. Please try again.');
        } else {
          throw new Error(`Google API error: ${response.status} - ${errorText}`);
        }
      }

      const apiResponse = await response.json();

      const rawText =
        apiResponse?.candidates?.[0]?.content?.parts?.[0]?.text ??
        (typeof apiResponse === 'string' ? apiResponse : JSON.stringify(apiResponse));

      if (!rawText) {
        console.error('Invalid API response structure:', apiResponse);
        throw new Error('Invalid response format from Google API - no text content found');
      }

      // Clean the response
      const cleaned = String(rawText).replace(/```json\n?|\n?```/g, '').trim();

      // Try direct JSON parse first
      try {
        const parsed = JSON.parse(cleaned) as ExtractedData;
        // normalize numeric fields if present as strings
        if (parsed.total_amount && typeof parsed.total_amount === 'string') {
          parsed.total_amount = parseFloat(parsed.total_amount.replace(/[^\d.]/g, '')) || parsed.total_amount;
        }
        if (parsed.items) {
          parsed.items = parsed.items.map((it: any) => ({
            ...it,
            price: typeof it.price === 'string' ? parseFloat(it.price.replace(/[^\d.]/g, '')) : it.price,
            quantity: Number(it.quantity) || (it.quantity ?? 1),
          }));
        }
        parsed.raw_text = cleaned;
        return parsed;
      } catch (jsonErr) {
        // Attempt to extract JSON-like substring
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            const parsed = JSON.parse(match[0]) as ExtractedData;
            if (parsed.total_amount && typeof parsed.total_amount === 'string') {
              parsed.total_amount = parseFloat(parsed.total_amount.replace(/[^\d.]/g, '')) || parsed.total_amount;
            }
            if (parsed.items) {
              parsed.items = parsed.items.map((it: any) => ({
                ...it,
                price: typeof it.price === 'string' ? parseFloat(it.price.replace(/[^\d.]/g, '')) : it.price,
                quantity: Number(it.quantity) || (it.quantity ?? 1),
              }));
            }
            parsed.raw_text = cleaned;
            return parsed;
          } catch (innerErr) {
            // fall through to heuristic extraction
            console.warn('Failed to parse JSON substring:', innerErr);
          }
        }

        // Heuristic extraction: look for store name, total amount and date in free text
        const fallback: ExtractedData = { raw_text: cleaned };

        // total amount: look for first rupee-like number
        const amtMatch = cleaned.match(/(?:₹|Rs\.?|INR)?\s?([0-9]+(?:[.,][0-9]{2})?(?:[0-9,]*)?)/i);
        if (amtMatch) {
          // normalize number
          const num = parseFloat(amtMatch[1].replace(/,/g, '').replace(/^\./, '0.'));
          if (!Number.isNaN(num)) fallback.total_amount = num;
        }

        // date: look for YYYY-MM-DD or DD/MM/YYYY or DD-MM-YYYY
        const dateMatch =
          cleaned.match(/\b(\d{4}-\d{2}-\d{2})\b/) ||
          cleaned.match(/\b(\d{2}[\/-]\d{2}[\/-]\d{4})\b/);
        if (dateMatch) {
          let d = dateMatch[1];
          // normalize DD/MM/YYYY to YYYY-MM-DD if possible
          if (/\d{2}[\/-]\d{2}[\/-]\d{4}/.test(d)) {
            const parts = d.split(/[\/-]/);
            const [dd, mm, yyyy] = parts;
            d = `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
          }
          fallback.date = d;
        }

        // store name: look for lines with capitalized words, fallback to first non-empty line
        const lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length) {
          // prefer first short line (likely store name)
          const candidate = lines.find(l => l.length > 2 && l.length < 60) || lines[0];
          fallback.store_name = candidate;
        }

        // If we have at least an amount or store, return partial result; otherwise fail
        if (fallback.total_amount || fallback.store_name) {
          return fallback;
        }

        console.error('Failed to parse OCR response as JSON and heuristics did not find required fields. Raw:', cleaned);
        throw new Error('Failed to parse OCR response as valid JSON. The AI returned an unexpected format.');
      }
    } catch (error) {
      console.error('OCR processing error:', error);
      throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const saveReceiptToBackend = async (receipt: Receipt): Promise<void> => {
    try {
      const session = typeof window !== 'undefined' ? localStorage.getItem('mcp_session') : null;
      if (!session) {
        console.warn('No session found, skipping backend save');
        return;
      }

      const sessionData = JSON.parse(session);
      const response = await fetch(`${BACKEND}/api/receipts/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionData.sessionId}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: receipt.filename,
          extracted_data: receipt.extractedData,
          status: receipt.status,
          upload_date: receipt.uploadDate
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend save failed with status ${response.status}`);
      }
    } catch (err) {
      console.warn('Failed to save receipt to backend:', err);
      // Don't throw error here - we still want to keep the receipt locally
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, etc.)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      return;
    }

    if (!userEmail) {
      setError('User not authenticated');
      return;
    }

    setUploading(true);
    setError(null);

    const tempId = Date.now().toString();
    const tempReceipt: Receipt = {
      id: tempId,
      filename: file.name,
      uploadDate: new Date().toISOString(),
      extractedData: {},
      imageUrl: URL.createObjectURL(file),
      status: 'processing',
    };

    try {
      setReceipts((prev) => [tempReceipt, ...prev]);

      // Step 1: Upload image to Supabase Storage
      console.log('Uploading image to Supabase...');
      const { path: imagePath, url: imageUrl } = await uploadReceiptImage(userEmail, file);

      // Step 2: Encode image to base64 for OCR
      console.log('Encoding image to base64...');
      const base64Image = await encodeImageToBase64(file);
      
      // Step 3: Process with Google Gemini OCR
      console.log('Processing with Google Gemini OCR...');
      const extractedData = await processReceiptWithOCR(base64Image, file.name);

      // Step 4: Save to Supabase database
      console.log('Saving receipt data to Supabase...');
      const savedReceipt = await saveReceipt(userEmail, {
        filename: file.name,
        store_name: extractedData.store_name,
        total_amount: extractedData.total_amount,
        purchase_date: extractedData.date,
        category: extractedData.category,
        items: extractedData.items,
        raw_text: extractedData.raw_text,
        image_path: imagePath,
        image_url: imageUrl,
        status: 'completed',
        upload_date: new Date().toISOString(),
      });

      // Update receipt with saved data
      const updatedReceipt: Receipt = {
        id: savedReceipt.id,
        filename: savedReceipt.filename,
        uploadDate: savedReceipt.upload_date,
        extractedData: {
          store_name: savedReceipt.store_name,
          total_amount: savedReceipt.total_amount ? parseFloat(savedReceipt.total_amount) : undefined,
          date: savedReceipt.purchase_date,
          items: savedReceipt.items,
          category: savedReceipt.category,
          raw_text: savedReceipt.raw_text,
        },
        imageUrl: savedReceipt.image_url || imageUrl,
        status: 'completed',
      };

      setReceipts((prev) =>
        prev.map((r) => (r.id === tempId ? updatedReceipt : r))
      );

      console.log('Receipt saved successfully!');

    } catch (err) {
      console.error('Receipt processing error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown processing error';
      
      setError(`Failed to process receipt: ${errorMessage}`);
      setReceipts((prev) =>
        prev.map((r) =>
          r.id === tempId
            ? {
                ...r,
                status: 'failed',
                error: errorMessage,
              }
            : r
        )
      );
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleDeleteReceipt = async (id: string) => {
    if (!userEmail) return;

    try {
      await deleteReceiptFromDB(userEmail, id);
      setReceipts((prev) => prev.filter((r) => r.id !== id));
      if (selectedReceipt?.id === id) setSelectedReceipt(null);
    } catch (err) {
      console.error('Failed to delete receipt:', err);
      setError('Failed to delete receipt');
    }
  };

  const calculateTotalSpending = () => {
    return receipts
      .filter((r) => r.status === 'completed')
      .reduce((sum, r) => sum + (r.extractedData.total_amount || 0), 0);
  };

  const getCategoryBreakdown = () => {
    const breakdown: Record<string, number> = {};
    receipts
      .filter((r) => r.status === 'completed')
      .forEach((r) => {
        const category = r.extractedData.category || 'Other';
        breakdown[category] = (breakdown[category] || 0) + (r.extractedData.total_amount || 0);
      });
    return breakdown;
  };

  const formatRupee = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const categoryBreakdown = getCategoryBreakdown();
  const totalSpending = calculateTotalSpending();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading receipts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-[#0a0a0a] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
            Receipt Scanner
          </h1>
          <p className="text-gray-400 mt-2">Upload receipts and track expenses with AI-powered OCR</p>
        </div>
        <Button
          onClick={() => setShowGallery(true)}
          variant="outline"
          className="flex items-center gap-2"
          disabled={receipts.length === 0}
        >
          <ImageIcon className="h-4 w-4" />
          Show Uploaded Receipts ({receipts.length})
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!GOOGLE_API_KEY && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Google API key not configured. Please set NEXT_PUBLIC_GOOGLE_API_KEY in your environment variables.
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Section */}
      <Card className="border-2 border-dashed border-gray-700 bg-[#1a1a1a]">
        <CardHeader>
          <CardTitle className="text-white">Upload Receipt</CardTitle>
          <CardDescription className="text-gray-400">Upload receipt images for automatic processing and expense tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-700 rounded-lg bg-[#0a0a0a] hover:bg-gray-900 transition-colors">
            <Upload className="h-12 w-12 text-gray-400 mb-4" />
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading || !GOOGLE_API_KEY}
                className="hidden"
                id="receipt-upload"
              />
              <Button asChild variant="outline" disabled={uploading || !GOOGLE_API_KEY}>
                <span>
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing with AI...
                    </>
                  ) : !GOOGLE_API_KEY ? (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      API Key Missing
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Receipt Image
                    </>
                  )}
                </span>
              </Button>
            </label>
            <p className="text-xs text-gray-500 mt-4">Supports JPG, PNG, WebP up to 10MB</p>
            {GOOGLE_API_KEY && (
              <p className="text-xs text-green-600 mt-2">
                ✓ Using Google Gemini AI for accurate receipt scanning
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#1a1a1a] border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Receipts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{receipts.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {receipts.filter((r) => r.status === 'completed').length} processed successfully
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400 flex items-center">
              <IndianRupee className="h-5 w-5 mr-1" />
              {totalSpending.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Across {receipts.filter((r) => r.status === 'completed').length} receipts
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Average Purchase</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400 flex items-center">
              <IndianRupee className="h-5 w-5 mr-1" />
              {receipts.filter((r) => r.status === 'completed').length > 0
                ? (totalSpending / receipts.filter((r) => r.status === 'completed').length).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : '0.00'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Average per receipt</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Receipts ({receipts.length})</TabsTrigger>
          <TabsTrigger value="analysis">
            Spending Analysis ({receipts.filter((r) => r.status === 'completed').length})
          </TabsTrigger>
        </TabsList>

        {/* All Receipts Tab */}
        <TabsContent value="all" className="space-y-4">
          {receipts.length === 0 ? (
            <Card className="bg-[#1a1a1a] border-gray-800">
              <CardContent className="py-12 text-center text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No receipts uploaded yet.</p>
                <p className="text-sm mt-2">Start by uploading a receipt image above.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {receipts.map((receipt) => (
                <Card key={receipt.id} className="bg-[#1a1a1a] border-gray-800 hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{receipt.filename}</CardTitle>
                        <CardDescription>
                          Uploaded: {new Date(receipt.uploadDate).toLocaleDateString('en-IN')}
                          {receipt.extractedData.date && ` • Purchase: ${new Date(receipt.extractedData.date).toLocaleDateString('en-IN')}`}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          receipt.status === 'completed'
                            ? 'default'
                            : receipt.status === 'processing'
                              ? 'secondary'
                              : 'destructive'
                        }
                        className="flex items-center gap-1"
                      >
                        {receipt.status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                        {receipt.status === 'processing' && <Loader2 className="h-3 w-3 animate-spin" />}
                        {receipt.status === 'failed' && <AlertTriangle className="h-3 w-3" />}
                        {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>

                  {receipt.status === 'completed' && (
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-400">Store</p>
                          <p className="font-semibold text-sm text-white">{receipt.extractedData.store_name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Amount</p>
                          <p className="font-semibold text-sm text-green-400 flex items-center">
                            <IndianRupee className="h-3 w-3 mr-1" />
                            {receipt.extractedData.total_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Date</p>
                          <p className="font-semibold text-sm text-white">
                            {receipt.extractedData.date ? new Date(receipt.extractedData.date).toLocaleDateString('en-IN') : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Category</p>
                          <Badge variant="outline" className="text-xs capitalize">
                            {receipt.extractedData.category || 'Other'}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedReceipt(receipt)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteReceipt(receipt.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  )}

                  {receipt.status === 'failed' && (
                    <CardContent>
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {receipt.error || 'Failed to process receipt'}
                        </AlertDescription>
                      </Alert>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteReceipt(receipt.id)}
                        className="mt-4"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          {receipts.filter((r) => r.status === 'completed').length === 0 ? (
            <Card className="bg-[#1a1a1a] border-gray-800">
              <CardContent className="py-12 text-center text-gray-400">
                <p>Upload and process receipts to see spending analysis.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="bg-[#1a1a1a] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Spending by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(categoryBreakdown).map(([category, amount]) => {
                      const percentage = (amount / totalSpending) * 100;
                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium capitalize">{category}</span>
                            <div className="text-right">
                              <div className="font-semibold text-green-600 flex items-center justify-end">
                                <IndianRupee className="h-3 w-3 mr-1" />
                                {amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a1a] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Spending Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Tracked Spending</span>
                        <span className="font-bold text-lg text-green-600 flex items-center">
                          <IndianRupee className="h-4 w-4 mr-1" />
                          {totalSpending.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Receipts Processed</span>
                        <span className="font-bold text-lg text-blue-600">
                          {receipts.filter((r) => r.status === 'completed').length}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Average per Receipt</span>
                        <span className="font-bold text-lg text-purple-600 flex items-center">
                          <IndianRupee className="h-4 w-4 mr-1" />
                          {(totalSpending / receipts.filter((r) => r.status === 'completed').length).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Categories Tracked</span>
                        <span className="font-bold text-lg text-orange-600">
                          {Object.keys(categoryBreakdown).length}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Receipt Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
          <div className="w-full max-w-7xl max-h-[90vh] overflow-hidden bg-[#1a1a1a] rounded-lg">
            <div className="sticky top-0 bg-[#1a1a1a] border-b border-gray-800 z-10 p-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Uploaded Receipts Gallery</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowGallery(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {receipts.length} receipt{receipts.length !== 1 ? 's' : ''} uploaded
              </p>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-6">
              {receipts.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>No receipts uploaded yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {receipts.map((receipt) => (
                    <div
                      key={receipt.id}
                      className="group relative bg-[#0a0a0a] rounded-lg border border-gray-800 shadow-sm hover:shadow-lg transition-all overflow-hidden cursor-pointer"
                      onClick={() => {
                        setSelectedReceipt(receipt);
                        setShowGallery(false);
                      }}
                    >
                      {/* Receipt Image */}
                      <div className="aspect-[3/4] bg-gray-100 dark:bg-slate-700 overflow-hidden">
                        <img
                          src={receipt.imageUrl}
                          alt={receipt.filename}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      
                      {/* Receipt Info Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                        <p className="text-white text-sm font-semibold truncate">
                          {receipt.extractedData.store_name || receipt.filename}
                        </p>
                        {receipt.extractedData.total_amount && (
                          <p className="text-white text-xs flex items-center mt-1">
                            <IndianRupee className="h-3 w-3 mr-1" />
                            {receipt.extractedData.total_amount.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        )}
                        {receipt.extractedData.date && (
                          <p className="text-white text-xs mt-1">
                            {new Date(receipt.extractedData.date).toLocaleDateString('en-IN')}
                          </p>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div className="absolute top-2 right-2">
                        <Badge
                          variant={
                            receipt.status === 'completed'
                              ? 'default'
                              : receipt.status === 'processing'
                                ? 'secondary'
                                : 'destructive'
                          }
                          className="text-xs"
                        >
                          {receipt.status === 'completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {receipt.status === 'processing' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                          {receipt.status === 'failed' && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {receipt.status}
                        </Badge>
                      </div>

                      {/* Delete Button */}
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteReceipt(receipt.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Receipt Detail Modal */}
      {selectedReceipt && selectedReceipt.status === 'completed' && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-[#1a1a1a] border-gray-800">
            <CardHeader className="sticky top-0 bg-[#1a1a1a] border-b border-gray-800 z-10">
              <div className="flex justify-between items-center">
                <CardTitle className="text-white">{selectedReceipt.filename}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedReceipt(null)}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4">Receipt Image</h3>
                  <img
                    src={selectedReceipt.imageUrl}
                    alt={selectedReceipt.filename}
                    className="w-full rounded-lg border shadow-sm max-h-96 object-contain"
                  />
                </div>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4 text-white">Extracted Details</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 uppercase tracking-wide">Store Name</p>
                        <p className="font-semibold text-lg">{selectedReceipt.extractedData.store_name || 'N/A'}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 uppercase tracking-wide">Total Amount</p>
                        <p className="font-semibold text-2xl text-green-600 flex items-center">
                          <IndianRupee className="h-5 w-5 mr-1" />
                          {selectedReceipt.extractedData.total_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 uppercase tracking-wide">Date</p>
                        <p className="font-semibold">
                          {selectedReceipt.extractedData.date
                            ? new Date(selectedReceipt.extractedData.date).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            : 'N/A'}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 uppercase tracking-wide">Category</p>
                        <Badge variant="secondary" className="text-sm capitalize">
                          {selectedReceipt.extractedData.category || 'Other'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {selectedReceipt.extractedData.items && selectedReceipt.extractedData.items.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Purchased Items</h3>
                      <div className="space-y-2">
                        {selectedReceipt.extractedData.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <span className="font-medium">{item.name}</span>
                              {item.quantity > 1 && (
                                <span className="text-sm text-gray-500 ml-2">×{item.quantity}</span>
                              )}
                            </div>
                            <span className="font-semibold text-green-600 flex items-center">
                              <IndianRupee className="h-3 w-3 mr-1" />
                              {item.price?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}