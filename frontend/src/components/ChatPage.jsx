import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Trash2, Sparkles, AlertCircle } from 'lucide-react'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import NLPPanel from './NLPPanel'
import { v4 as uuidv4 } from 'uuid'

const API_URL = 'http://localhost:8000'

export default function ChatPage({ backendOnline }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState(() => uuidv4())
  const [nlpAnalysis, setNlpAnalysis] = useState(null)
  const [memoryLength, setMemoryLength] = useState(0)
  const [nlpPanelOpen, setNlpPanelOpen] = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const getTimestamp = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || isLoading) return

    const userMsg = {
      id: uuidv4(),
      role: 'user',
      content: text,
      timestamp: getTimestamp(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          session_id: sessionId,
        }),
      })

      if (!res.ok) throw new Error('API request failed')

      const data = await res.json()

      // Update NLP analysis
      setNlpAnalysis({
        sentiment: data.sentiment,
        intent: data.intent,
        entities: data.entities,
      })
      setMemoryLength(data.memory_length)
      setSessionId(data.session_id)

      // Update user message with entities
      setMessages(prev => prev.map(msg =>
        msg.id === userMsg.id
          ? { ...msg, entities: data.entities }
          : msg
      ))

      // Add assistant response
      const assistantMsg = {
        id: uuidv4(),
        role: 'assistant',
        content: data.reply,
        timestamp: getTimestamp(),
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (err) {
      console.error('Chat error:', err)
      const errorMsg = {
        id: uuidv4(),
        role: 'assistant',
        content: backendOnline
          ? '⚠️ Something went wrong processing your message. Please try again.'
          : '⚠️ Backend is offline. Please start the FastAPI server with `uvicorn main:app --reload` and try again.',
        timestamp: getTimestamp(),
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const clearMemory = async () => {
    try {
      await fetch(`${API_URL}/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })
    } catch (err) {
      console.error('Clear error:', err)
    }
    setMessages([])
    setNlpAnalysis(null)
    setMemoryLength(0)
    setSessionId(uuidv4())
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="relative z-10 min-h-screen pt-20 flex">
      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${nlpPanelOpen ? 'lg:mr-[320px]' : ''}`}>
        {/* Chat Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-20 z-20 mx-4 mb-2"
        >
          <div className="glass-strong rounded-2xl px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-nova-primary to-nova-accent flex items-center justify-center animate-glow-pulse">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white/90">NOVA Chat</h2>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${backendOnline ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="text-[10px] text-white/40 font-mono">
                    {backendOnline ? 'Model ready • Session active' : 'Backend offline'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {memoryLength > 0 && (
                <span className="text-[10px] font-mono bg-nova-primary/15 text-nova-primary-light px-2 py-1 rounded-lg">
                  {memoryLength} msgs in memory
                </span>
              )}
              <button
                onClick={clearMemory}
                className="w-8 h-8 rounded-lg glass flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                title="Clear Memory"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Welcome message */}
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center justify-center h-[50vh] text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-nova-primary to-nova-accent flex items-center justify-center mb-6 animate-glow-pulse">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-nova-primary-light to-nova-accent-light bg-clip-text text-transparent">
                Welcome to NOVA
              </h3>
              <p className="text-sm text-white/40 max-w-md leading-relaxed mb-4">
                Start a conversation and watch real-time NLP analysis unfold.
                I'll analyze sentiment, detect intent, and extract named entities from every message.
              </p>
              {!backendOnline && (
                <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-500/10 px-4 py-2 rounded-xl border border-yellow-500/20">
                  <AlertCircle className="w-4 h-4" />
                  <span>Start the backend: <code className="font-mono">uvicorn main:app --reload</code></span>
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-6 justify-center max-w-lg">
                {[
                  'Tell me about Google and Apple',
                  'I\'m really happy today!',
                  'What is machine learning?',
                  'Hello NOVA!',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion)
                      inputRef.current?.focus()
                    }}
                    className="text-xs glass neon-border-purple rounded-xl px-3 py-2 text-white/50 hover:text-white/80 hover:bg-white/5 transition-all duration-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Message list */}
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isUser={msg.role === 'user'}
                entities={msg.entities}
              />
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {isLoading && <TypingIndicator />}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-0 px-4 pb-4 pt-2"
        >
          <div className="glass-strong rounded-2xl p-2 flex items-end gap-2 neon-border-purple">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="chat-input flex-1 bg-transparent text-sm text-white/90 placeholder-white/25 resize-none px-4 py-3 rounded-xl focus:outline-none max-h-32"
              style={{
                height: 'auto',
                minHeight: '44px',
                overflow: input.split('\n').length > 3 ? 'auto' : 'hidden',
              }}
              onInput={(e) => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
              }}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                input.trim() && !isLoading
                  ? 'bg-gradient-to-r from-nova-primary to-nova-accent text-white hover:scale-105 hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] active:scale-95'
                  : 'bg-white/5 text-white/20 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="text-center mt-2">
            <span className="text-[10px] text-white/15 font-mono">
              NOVA uses VADER • BART-MNLI • spaCy for real-time NLP
            </span>
          </div>
        </motion.div>
      </div>

      {/* NLP Panel */}
      <NLPPanel
        analysis={nlpAnalysis}
        memoryLength={memoryLength}
        isOpen={nlpPanelOpen}
        onToggle={() => setNlpPanelOpen(prev => !prev)}
      />
    </div>
  )
}
