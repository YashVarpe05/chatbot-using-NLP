import { motion } from 'framer-motion'
import { Copy, Check, User, Bot } from 'lucide-react'
import { useState } from 'react'
import EntityChips from './EntityChips'

export default function MessageBubble({ message, isUser, entities = [] }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Render message content with basic markdown-like formatting
  const renderContent = (text) => {
    // Split by bold markers **text**
    const parts = text.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>
      }
      // Convert newlines to <br>
      return part.split('\n').map((line, j) => (
        <span key={`${i}-${j}`}>
          {j > 0 && <br />}
          {line}
        </span>
      ))
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`flex gap-3 group ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {/* Avatar (assistant only) */}
      {!isUser && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-nova-accent to-cyan-300 flex items-center justify-center mt-1"
        >
          <Bot className="w-4 h-4 text-white" />
        </motion.div>
      )}

      {/* Bubble */}
      <div className={`relative max-w-[75%] sm:max-w-[65%]`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed message-content ${
            isUser
              ? 'user-bubble text-white/90 rounded-tr-md'
              : 'assistant-bubble text-white/85 rounded-tl-md'
          }`}
        >
          {renderContent(message.content)}
          
          {/* Entity chips inline for user messages */}
          {isUser && entities.length > 0 && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <EntityChips entities={entities} compact />
            </div>
          )}
        </div>

        {/* Copy button on hover */}
        <motion.button
          initial={{ opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          onClick={handleCopy}
          className={`absolute top-2 ${isUser ? 'left-0 -translate-x-10' : 'right-0 translate-x-10'} 
            opacity-0 group-hover:opacity-100 transition-opacity duration-200
            w-7 h-7 rounded-lg glass flex items-center justify-center text-white/40 hover:text-white/70`}
          title="Copy message"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
        </motion.button>

        {/* Timestamp */}
        <div className={`text-[10px] text-white/20 mt-1 font-mono ${isUser ? 'text-right' : 'text-left'}`}>
          {message.timestamp}
        </div>
      </div>

      {/* Avatar (user only) */}
      {isUser && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-nova-primary to-purple-400 flex items-center justify-center mt-1"
        >
          <User className="w-4 h-4 text-white" />
        </motion.div>
      )}
    </motion.div>
  )
}
