'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut, ArrowLeft } from 'lucide-react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND || 'http://localhost:8000'

export default function AdvisorPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [connectionError, setConnectionError] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [netWorth, setNetWorth] = useState<number>(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mcp_session')
    }
    router.push('/')
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const initializeAdvisor = async () => {
      if (typeof window !== 'undefined') {
        const savedSession = localStorage.getItem('mcp_session')
        if (savedSession) {
          const parsed = JSON.parse(savedSession)
          if (parsed.sessionId && parsed.isLoggedIn) {
            setSessionId(parsed.sessionId)
            
            try {
              const response = await fetch(`${API_BASE_URL}/api/financial/summary/1?session_id=${parsed.sessionId}`)
              const data = await response.json()
              
              if (data.mcp_data_available) {
                setNetWorth(data.summary.net_worth)
                
                const welcomeMessage: Message = {
                  id: '1',
                  text: `Hello! I'm your AI financial advisor with access to your real financial data:\n\n• Net Worth: ₹${data.summary.net_worth.toLocaleString('en-IN')}\n• Total Assets: ₹${data.assets?.reduce((s: number, a: any) => s + a.value, 0).toLocaleString('en-IN')}\n• Total Liabilities: ₹${data.liabilities?.reduce((s: number, l: any) => s + l.value, 0).toLocaleString('en-IN')}\n\nHow can I help you optimize your finances today?`,
                  sender: 'bot',
                  timestamp: new Date()
                }
                setMessages([welcomeMessage])
              } else {
                throw new Error('No MCP data')
              }
            } catch (error) {
              const errorMsg: Message = {
                id: '1',
                text: "Please ensure your accounts are connected from the dashboard.",
                sender: 'bot',
                timestamp: new Date()
              }
              setMessages([errorMsg])
            }
          } else {
            router.push('/')
          }
        } else {
          router.push('/')
        }
      }
    }

    initializeAdvisor()
    checkBackendConnection()
  }, [])

  const checkBackendConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`)
      setConnectionError(!response.ok)
    } catch (error) {
      setConnectionError(true)
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/advisor/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          user_id: 1,
          session_id: sessionId
        })
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'bot',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
      
    } catch (error) {
      setConnectionError(true)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Connection error. Please try again.`,
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Financial Advisor</h1>
                <p className="text-gray-600">Powered by real-time financial data</p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="destructive" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Quick Questions */}
        {sessionId && netWorth > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Questions:</h3>
            <div className="flex flex-wrap gap-2">
              {[
                "Analyze my net worth",
                "Review my assets allocation",
                "Investment recommendations",
                "Debt management strategy"
              ].map((question, index) => (
                <button
                  key={index}
                  onClick={() => { setInput(question); setTimeout(handleSend, 100); }}
                  disabled={isLoading}
                  className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm hover:bg-blue-100 transition-colors border border-blue-200 disabled:opacity-50"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Chat Container */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border p-4 mb-4 overflow-y-auto flex flex-col">
          <div className="space-y-4 flex-1">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-2xl px-4 py-3 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900 border'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  <p className={`text-xs mt-2 ${
                    message.sender === 'user' ? 'text-blue-200' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-lg border">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className="text-sm text-gray-600">Analyzing...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex space-x-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your finances..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isLoading || !sessionId}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim() || !sessionId}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 min-w-20 flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Send'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}