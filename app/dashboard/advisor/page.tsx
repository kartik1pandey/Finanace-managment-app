'use client'
import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

interface AdvisorResponse {
  response: string
  suggestions: string[]
}

// API URL configuration - Fixed to ensure correct URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function AdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your AI financial advisor. I have access to your complete financial data including:\n\n• Net Worth: ₹12,50,000\n• Monthly Income: ₹95,000\n• Investment Portfolio: ₹8,50,000\n• Loan Portfolio: ₹5,00,000\n\nHow can I help you optimize your finances today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [connectionError, setConnectionError] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Test backend connection on component mount
  useEffect(() => {
    checkBackendConnection()
  }, [])

  const checkBackendConnection = async () => {
    try {
      console.log(`🔍 Checking backend connection at: ${API_BASE_URL}/health`)
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Backend connection successful:', data)
        setConnectionError(false)
      } else {
        console.error('❌ Backend health check failed:', response.status)
        setConnectionError(true)
      }
    } catch (error) {
      console.error('❌ Backend connection failed:', error)
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
    setConnectionError(false)

    try {
      const requestBody = {
        message: input,
        user_id: 1
      }

      console.log('📤 Sending message to:', `${API_BASE_URL}/api/advisor/chat`)
      console.log('Request body:', requestBody)
      
      const response = await fetch(`${API_BASE_URL}/api/advisor/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      console.log('📥 Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Server response error:', errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: AdvisorResponse = await response.json()
      console.log('✅ Received response:', data)
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'bot',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
      
    } catch (error) {
      console.error('❌ Error sending message:', error)
      setConnectionError(true)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `I'm having trouble connecting to the financial advisor service. 

Error Details: ${error instanceof Error ? error.message : 'Unknown error'}

Please ensure:
1. The backend server is running on ${API_BASE_URL}
2. Check the backend terminal for any errors
3. Refresh the page and try again

You can also try these troubleshooting steps:
• Run the backend with: python main.py
• Check if port 8000 is available
• Verify CORS settings in the backend`,
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickQuestion = (question: string) => {
    setInput(question)
    // Auto-send after a short delay
    setTimeout(() => {
      if (input === question) { // Ensure input hasn't changed
        handleSend()
      }
    }, 100)
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Financial Advisor</h1>
              <p className="text-gray-600">Powered by Groq AI with complete financial context</p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                connectionError ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${
                  connectionError ? 'bg-red-500' : 'bg-green-500'
                }`}></span>
                {connectionError ? 'Backend Offline' : 'Backend Online'}
              </div>
            </div>
          </div>
          
          {connectionError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm font-medium">
                ⚠️ Cannot connect to backend at {API_BASE_URL}
              </p>
              <p className="text-red-600 text-xs mt-1">
                Make sure the backend server is running on port 8000
              </p>
            </div>
          )}
        </div>

        {/* Quick Questions */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Questions:</h3>
          <div className="flex flex-wrap gap-2">
            {[
              "How can I save more money?",
              "Analyze my investment portfolio",
              "Help with my loans",
              "Budgeting advice",
              "Retirement planning"
            ].map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(question)}
                disabled={isLoading || connectionError}
                className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm hover:bg-blue-100 transition-colors border border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
        
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
                    <span className="text-sm text-gray-600">Analyzing your finances...</span>
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
              placeholder="Ask me about savings, investments, loans, or budgeting..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              disabled={isLoading || connectionError}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim() || connectionError}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-20 flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Send'
              )}
            </button>
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">
              💡 I have access to your complete financial data including net worth, cash flow, investments, and loans
            </p>
            <p className="text-xs text-gray-400">
              Backend: {API_BASE_URL}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}