import { motion, AnimatePresence } from 'framer-motion'
import { 
  BarChart3, Target, Tags, Database, ChevronRight,
  Eye, EyeOff, TrendingUp, TrendingDown, Minus
} from 'lucide-react'
import SentimentGauge from './SentimentGauge'
import EntityChips from './EntityChips'

export default function NLPPanel({ analysis, memoryLength, isOpen, onToggle }) {
  const sentiment = analysis?.sentiment
  const intent = analysis?.intent
  const entities = analysis?.entities || []

  const getIntentIcon = (intentLabel) => {
    const icons = {
      question: '❓',
      greeting: '👋',
      command: '⚡',
      complaint: '😤',
      compliment: '😊',
      farewell: '👋',
      information: 'ℹ️',
      request: '📝',
    }
    return icons[intentLabel] || '💬'
  }

  const getSentimentIcon = () => {
    if (!sentiment) return <Minus className="w-4 h-4" />
    if (sentiment.label === 'positive') return <TrendingUp className="w-4 h-4 text-green-400" />
    if (sentiment.label === 'negative') return <TrendingDown className="w-4 h-4 text-red-400" />
    return <Minus className="w-4 h-4 text-yellow-400" />
  }

  return (
    <>
      {/* Toggle Button (always visible) */}
      <button
        onClick={onToggle}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 glass-strong py-4 px-1.5 rounded-l-xl 
          neon-border-cyan transition-all duration-300 hover:bg-white/10 ${isOpen ? 'opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto' : ''}`}
        title="NLP Inspector"
      >
        <div className="flex flex-col items-center gap-2 text-nova-accent">
          {isOpen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span className="text-[9px] font-mono [writing-mode:vertical-lr] tracking-widest">NLP</span>
        </div>
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 350, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 350, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-[320px] z-30 pt-20 pb-4 px-3 overflow-y-auto"
          >
            <div className="glass-strong rounded-2xl p-4 h-full flex flex-col gap-4 neon-border-cyan overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nova-accent to-cyan-300 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white/90">NLP Inspector</h3>
                    <p className="text-[10px] text-white/30">Real-time analysis</p>
                  </div>
                </div>
                <button
                  onClick={onToggle}
                  className="w-7 h-7 rounded-lg glass flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              {/* Sentiment Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-white/60 uppercase tracking-wider">
                  {getSentimentIcon()}
                  <span>Sentiment Score</span>
                </div>
                {sentiment ? (
                  <SentimentGauge sentiment={sentiment} />
                ) : (
                  <div className="text-center py-4 text-white/20 text-xs">
                    Send a message to analyze
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              {/* Intent Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-white/60 uppercase tracking-wider">
                  <Target className="w-4 h-4 text-nova-primary-light" />
                  <span>Detected Intent</span>
                </div>
                {intent ? (
                  <div className="space-y-2">
                    <motion.div
                      key={intent.top_intent}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2"
                    >
                      <span className="text-xl">{getIntentIcon(intent.top_intent)}</span>
                      <div>
                        <div className="text-sm font-bold capitalize neon-text-purple">
                          {intent.top_intent}
                        </div>
                        <div className="text-[10px] text-white/30 font-mono">
                          confidence: {(intent.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                    </motion.div>

                    {/* Confidence bars for all intents */}
                    <div className="space-y-1.5 mt-2">
                      {intent.all_intents && Object.entries(intent.all_intents)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 5)
                        .map(([label, score]) => (
                          <div key={label} className="flex items-center gap-2">
                            <span className="text-[10px] text-white/40 w-16 truncate capitalize">{label}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${score * 100}%` }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="h-full rounded-full bg-gradient-to-r from-nova-primary to-nova-accent"
                              />
                            </div>
                            <span className="text-[10px] text-white/30 font-mono w-10 text-right">
                              {(score * 100).toFixed(0)}%
                            </span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2 text-white/20 text-xs">
                    Waiting for input...
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              {/* Entities Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-white/60 uppercase tracking-wider">
                  <Tags className="w-4 h-4 text-nova-accent" />
                  <span>Named Entities</span>
                  {entities.length > 0 && (
                    <span className="ml-auto text-[10px] font-mono bg-nova-accent/15 text-nova-accent px-1.5 py-0.5 rounded">
                      {entities.length}
                    </span>
                  )}
                </div>
                <EntityChips entities={entities} />
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              {/* Memory Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-white/60 uppercase tracking-wider">
                  <Database className="w-4 h-4 text-pink-400" />
                  <span>Context Memory</span>
                </div>
                <div className="flex items-center gap-3">
                  {/* Memory bar */}
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] text-white/40 font-mono">{memoryLength}/20 msgs</span>
                      <span className="text-[10px] text-white/40 font-mono">{Math.min(10, Math.ceil(memoryLength / 2))}/10 turns</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (memoryLength / 20) * 100)}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-auto pt-2 border-t border-white/5">
                <div className="flex items-center gap-2 text-[10px] text-white/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-nova-accent animate-pulse" />
                  <span className="font-mono">Pipeline: VADER + BART + spaCy</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
