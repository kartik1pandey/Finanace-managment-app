"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, ExternalLink, Loader2, XCircle, CheckCircle2 } from "lucide-react";

interface MCPSession {
  sessionId: string;
  loginUrl?: string;
  isLoggedIn: boolean;
}

export default function HomePage() {
  const router = useRouter();
  const [session, setSession] = useState<MCPSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const BACKEND = process.env.NEXT_PUBLIC_BACKEND || "http://localhost:8000";

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
          isLoggedIn: !data.login_required,
        };
        setSession(newSession);
        if (typeof window !== "undefined") {
          localStorage.setItem("mcp_session", JSON.stringify(newSession));
        }
        if (newSession.isLoggedIn) {
          router.push("/dashboard");
        }
      } else {
        setError("Failed to initialize session");
      }
    } catch (err) {
      setError(`Initialization failed: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const checkLoginStatus = async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND}/api/mcp/login-status?session_id=${sessionId}`);
      const data = await res.json();

      if (!data.login_required && data.result) {
        const updated = { 
          sessionId, 
          isLoggedIn: true,
          loginUrl: session?.loginUrl 
        };
        if (typeof window !== "undefined") {
          localStorage.setItem("mcp_session", JSON.stringify(updated));
        }
        router.push("/dashboard");
        return true;
      } else {
        setError("Login not completed yet. Please complete the login process.");
      }
      return false;
    } catch (err) {
      setError("Login check failed. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            LUMEN
          </h1>
          <p className="text-gray-600">Your Personal Financial Intelligence Platform</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Connect Your Financial Accounts</CardTitle>
            <CardDescription>Link your accounts to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!session ? (
              <Button onClick={initiateMCPSession} disabled={loading} size="lg" className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" /> Initializing...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2" /> Connect Financial Accounts
                  </>
                )}
              </Button>
            ) : !session.isLoggedIn && session.loginUrl ? (
              <>
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription className="text-blue-800">
                    Click the button below to open the login page. After logging in, return here and click "Check Status".
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3">
                  <Button 
                    onClick={() => window.open(session.loginUrl, "_blank")} 
                    className="w-full"
                    size="lg"
                  >
                    <ExternalLink className="mr-2" /> Open Login Page
                  </Button>
                  
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Test Credentials:</p>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>📱 Phone: <span className="font-mono bg-white px-2 py-1 rounded">2222222222</span></p>
                      <p>🔐 OTP: <span className="font-mono bg-white px-2 py-1 rounded">Any 6 digits</span></p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => session.sessionId && checkLoginStatus(session.sessionId)}
                    variant="outline"
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin mr-2" /> Checking...
                      </>
                    ) : (
                      "✓ I've Completed Login - Check Status"
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Connected successfully! Redirecting to dashboard...
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>Secure • Real-time • Powered by MCP</p>
        </div>
      </div>
    </div>
  );
}