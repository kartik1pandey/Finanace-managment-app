'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, FileText, X, Paperclip, Send, Trash2 } from 'lucide-react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  suggestions?: string[]
  attachments?: Array<{ name: string; type: string; size: number }>
}

interface FinancialContext {
  mcp_data_available: boolean
  summary: {
    net_worth: number
    total_assets: number
    total_liabilities: number
  }
  assets: Array<{ type: string; value: number }>
  liabilities: Array<{ type: string; value: number }>
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND || 'http://localhost:8000'
const MCP_BACKEND_URL = 'http://localhost:5001'

export default function MultimodalAdvisorPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingData, setIsFetchingData] = useState(false)
  const [connectionError, setConnectionError] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [financialContext, setFinancialContext] = useState<FinancialContext | null>(null)

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)

  // File upload states
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch MCP financial data
  const fetchMCPData = async (sid: string) => {
    setIsFetchingData(true)
    try {
      const response = await fetch(`${MCP_BACKEND_URL}/mcp/networth?sessionId=${sid}`)
      if (!response.ok) throw new Error('Failed to fetch MCP data')
      
      const data = await response.json()
      if (data.result) {
        const parsedContext = parseMCPData(data.result)
        setFinancialContext(parsedContext)
        return parsedContext
      }
      throw new Error('No data available')
    } catch (error) {
      console.error('❌ Error fetching MCP data:', error)
      setConnectionError(true)
      return null
    } finally {
      setIsFetchingData(false)
    }
  }

  const parseMCPData = (result: any): FinancialContext => {
    try {
      const nwResponse = result.netWorthResponse || {}
      const totalNetWorth = parseInt(nwResponse.totalNetWorthValue?.units || '0')
      
      const assets = (nwResponse.assetValues || []).map((asset: any) => ({
        type: asset.netWorthAttribute?.replace('ASSET_TYPE_', '') || 'UNKNOWN',
        value: parseInt(asset.value?.units || '0')
      }))
      
      const liabilities = (nwResponse.liabilityValues || []).map((liability: any) => ({
        type: liability.netWorthAttribute?.replace('LIABILITY_TYPE_', '') || 'UNKNOWN',
        value: parseInt(liability.value?.units || '0')
      }))
      
      const totalAssets = assets.reduce((sum: number, a: { type: string; value: number }) => sum + a.value, 0)
      const totalLiabilities = liabilities.reduce((sum: number, l: { type: string; value: number }) => sum + l.value, 0)
      
      return {
        mcp_data_available: true,
        summary: {
          net_worth: totalNetWorth,
          total_assets: totalAssets,
          total_liabilities: totalLiabilities
        },
        assets,
        liabilities
      }
    } catch (error) {
      return {
        mcp_data_available: false,
        summary: { net_worth: 0, total_assets: 0, total_liabilities: 0 },
        assets: [],
        liabilities: []
      }
    }
  }

  useEffect(() => {
    const initializeAdvisor = async () => {
      if (typeof window !== 'undefined') {
        const savedSession = localStorage.getItem('mcp_session')
        if (savedSession) {
          const parsed = JSON.parse(savedSession)
          if (parsed.sessionId && parsed.isLoggedIn) {
            setSessionId(parsed.sessionId)
            const context = await fetchMCPData(parsed.sessionId)
            
            if (context && context.mcp_data_available) {
              const welcomeMessage: Message = {
                id: '1',
                text: `Hello! 👋 I'm your multimodal AI financial advisor.\n\n💰 Net Worth: ₹${context.summary.net_worth.toLocaleString('en-IN')}\n📊 Total Assets: ₹${context.summary.total_assets.toLocaleString('en-IN')}\n\n**I can help you with:**\n• 💬 Text conversations about your finances\n• 🎤 Voice queries (click mic icon)\n• 📊 CSV/Excel analysis (upload files)\n• 📄 Document analysis (bank statements, reports)\n\nHow can I assist you today?`,
                sender: 'bot',
                timestamp: new Date(),
                suggestions: [
                  "Analyze my portfolio",
                  "Upload transaction CSV",
                  "Voice query",
                  "Review my investments"
                ]
              }
              setMessages([welcomeMessage])
            }
          } else {
            router.push('/dashboard')
          }
        } else {
          router.push('/dashboard')
        }
      }
    }

    initializeAdvisor()
  }, [])

  // Audio Recording Functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      setRecordingDuration(0)

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(audioBlob)
        stream.getTracks().forEach(track => track.stop())
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)

      // Start duration timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Unable to access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleAudioSubmit = async () => {
    if (!audioBlob || !sessionId) return

    setIsLoading(true)
    const userMessage: Message = {
      id: Date.now().toString(),
      text: '🎤 [Voice message sent]',
      sender: 'user',
      timestamp: new Date(),
      attachments: [{ name: 'voice-message.webm', type: 'audio/webm', size: audioBlob.size }]
    }
    setMessages(prev => [...prev, userMessage])

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'voice-message.webm')
      formData.append('session_id', sessionId)

      const response = await fetch(`${API_BASE_URL}/api/advisor/audio`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Audio processing failed')

      const data = await response.json()
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `**🎤 Transcription:** "${data.transcription}"\n\n**💬 Response:**\n${data.response}`,
        sender: 'bot',
        timestamp: new Date(),
        suggestions: data.suggestions || []
      }
      setMessages(prev => [...prev, botMessage])
      setAudioBlob(null)
      setRecordingDuration(0)
    } catch (error) {
      console.error('Error processing audio:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I had trouble processing your voice message. Please try again or type your question.',
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // File Upload Functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter(file => {
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/pdf',
        'text/plain'
      ]
      return validTypes.includes(file.type) || file.name.endsWith('.csv')
    })

    if (validFiles.length !== files.length) {
      alert('Some files were rejected. Only CSV, Excel, PDF, and TXT files are supported.')
    }

    setUploadedFiles(prev => [...prev, ...validFiles])
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleFileUpload = async () => {
    if (uploadedFiles.length === 0 || !sessionId) return

    setIsLoading(true)
    const attachmentInfo = uploadedFiles.map(f => ({
      name: f.name,
      type: f.type,
      size: f.size
    }))

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input || `📎 Uploaded ${uploadedFiles.length} file(s) for analysis`,
      sender: 'user',
      timestamp: new Date(),
      attachments: attachmentInfo
    }
    setMessages(prev => [...prev, userMessage])

    const currentInput = input
    setInput('')

    try {
      const formData = new FormData()
      uploadedFiles.forEach(file => formData.append('files', file))
      formData.append('session_id', sessionId)
      formData.append('message', currentInput || 'Please analyze these files and provide financial insights')

      const response = await fetch(`${API_BASE_URL}/api/advisor/upload`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('File upload failed')

      const data = await response.json()
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'bot',
        timestamp: new Date(),
        suggestions: data.suggestions || []
      }
      setMessages(prev => [...prev, botMessage])
      setUploadedFiles([])
    } catch (error) {
      console.error('Error uploading files:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I had trouble processing your files. Please ensure they are valid CSV/Excel/PDF files and try again.',
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearHistory = async () => {
    if (!sessionId) return
    if (!confirm('Are you sure you want to clear the conversation history?')) return

    try {
      const formData = new FormData()
      formData.append('session_id', sessionId)

      await fetch(`${API_BASE_URL}/api/advisor/clear-history`, {
        method: 'POST',
        body: formData
      })

      setMessages([{
        id: Date.now().toString(),
        text: '🔄 Conversation history cleared. How can I help you today?',
        sender: 'bot',
        timestamp: new Date(),
        suggestions: [
          "Analyze my portfolio",
          "Upload transaction CSV",
          "Voice query",
          "Review my investments"
        ]
      }])
    } catch (error) {
      console.error('Error clearing history:', error)
    }
  }

  const handleSend = async () => {
    // Handle file upload if files present
    if (uploadedFiles.length > 0) {
      await handleFileUpload()
      return
    }

    // Handle audio if present
    if (audioBlob) {
      await handleAudioSubmit()
      return
    }

    // Handle text message
    if (!input.trim() || !sessionId) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    const currentInput = input
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/advisor/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
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
        timestamp: new Date(),
        suggestions: data.suggestions || []
      }
      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Connection error. Please check if the backend is running and try again.',
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="p-6 h-full flex flex-col bg-[#0a0a0a] min-h-screen">
      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-[#1a1a1a] rounded-xl shadow-lg border border-gray-800 p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent mb-2">
                Multimodal AI Advisor
              </h1>
              <p className="text-gray-400 flex items-center gap-2">
                <span>💬 Chat</span>
                <span>•</span>
                <span>🎤 Voice</span>
                <span>•</span>
                <span>📁 Files</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">Context Aware</span>
              </p>
            </div>
            <Button 
              onClick={handleClearHistory} 
              variant="outline" 
              size="sm" 
              className="hover:bg-[#0a0a0a] border-gray-700 text-gray-300"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear History
            </Button>
          </div>

          {financialContext && financialContext.mcp_data_available && (
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="bg-[#0a0a0a] p-4 rounded-lg border border-emerald-800">
                <p className="text-xs text-gray-400 mb-1">Net Worth</p>
                <p className="text-xl font-bold text-emerald-400">
                  ₹{financialContext.summary.net_worth.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-[#0a0a0a] p-4 rounded-lg border border-green-800">
                <p className="text-xs text-gray-400 mb-1">Total Assets</p>
                <p className="text-xl font-bold text-green-400">
                  ₹{financialContext.summary.total_assets.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-[#0a0a0a] p-4 rounded-lg border border-red-800">
                <p className="text-xs text-gray-400 mb-1">Total Liabilities</p>
                <p className="text-xl font-bold text-red-400">
                  ₹{financialContext.summary.total_liabilities.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Chat Container */}
        <div className="flex-1 bg-[#1a1a1a] rounded-xl shadow-lg border border-gray-800 p-6 mb-4 overflow-y-auto flex flex-col max-h-[calc(100vh-400px)]">
          <div className="space-y-4 flex-1">
            {messages.map((message) => (
              <div key={message.id}>
                <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-3xl px-5 py-3 rounded-2xl ${
                    message.sender === 'user' 
                      ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-md' 
                      : 'bg-[#0a0a0a] text-gray-300 border border-gray-800 shadow-sm'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-3 space-y-1 pt-2 border-t border-white/20">
                        {message.attachments.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs opacity-90">
                            <FileText className="h-3 w-3" />
                            <span>{file.name} ({formatFileSize(file.size)})</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className={`text-xs mt-2 ${
                      message.sender === 'user' ? 'text-emerald-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {message.sender === 'bot' && message.suggestions && message.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 ml-2">
                    {message.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInput(suggestion)}
                        disabled={isLoading}
                        className="text-xs bg-[#1a1a1a] text-gray-300 px-3 py-1.5 rounded-full border border-gray-700 hover:bg-[#0a0a0a] hover:border-emerald-500 hover:text-emerald-400 transition-all disabled:opacity-50 shadow-sm"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#0a0a0a] px-5 py-3 rounded-2xl border border-gray-800 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className="text-sm text-gray-400">Processing...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* File Upload Preview */}
        {uploadedFiles.length > 0 && (
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 mb-3 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-300">📎 Attached Files ({uploadedFiles.length})</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setUploadedFiles([])} 
                className="text-red-400 hover:bg-red-950/30"
              >
                Clear All
              </Button>
            </div>
            <div className="space-y-2">
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between bg-[#0a0a0a] p-3 rounded-lg border border-gray-800">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-emerald-400" />
                    <div>
                      <span className="text-sm font-medium text-white">{file.name}</span>
                      <span className="text-xs text-gray-500 ml-2">({formatFileSize(file.size)})</span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeFile(idx)} 
                    className="text-red-400 hover:bg-red-950/30"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audio Recording Preview */}
        {audioBlob && (
          <div className="bg-[#1a1a1a] border border-red-800 rounded-xl p-4 mb-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-950/30 rounded-full">
                  <Mic className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-white">Voice message ready</span>
                  <span className="text-xs text-gray-400 block">({formatFileSize(audioBlob.size)})</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setAudioBlob(null)} 
                className="text-red-400 hover:bg-red-950/30"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="bg-[#1a1a1a] rounded-xl shadow-lg border border-gray-800 p-4">
          <div className="flex space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".csv,.xlsx,.xls,.pdf,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title="Upload files (CSV, Excel, PDF, TXT)"
              className="hover:bg-[#0a0a0a] hover:border-emerald-500 transition-all border-gray-700"
            >
              <Paperclip className="h-5 w-5 text-gray-400" />
            </Button>
            <Button
              variant={isRecording ? "destructive" : "outline"}
              size="icon"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading}
              title={isRecording ? "Stop recording" : "Start voice recording"}
              className={isRecording ? "animate-pulse" : "hover:bg-red-950/30 hover:border-red-500 transition-all border-gray-700"}
            >
              {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5 text-gray-400" />}
            </Button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type, speak, or upload files..."
              className="flex-1 px-5 py-3 bg-[#0a0a0a] border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 transition-all text-white placeholder-gray-500"
              disabled={isLoading || !sessionId}
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || (!input.trim() && uploadedFiles.length === 0 && !audioBlob) || !sessionId}
              className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-24 flex items-center justify-center shadow-md"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
          <div className="flex justify-between items-center mt-3">
            <p className="text-xs text-gray-500">
              {isRecording && (
                <span className="text-red-400 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                  Recording... {formatDuration(recordingDuration)}
                </span>
              )}
            </p>
            <p className="text-xs text-gray-500">Conversation context is maintained</p>
          </div>
        </div>
      </div>
    </div>
  )
}
