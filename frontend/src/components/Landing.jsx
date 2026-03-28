import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  Sparkles, MessageCircle, Brain, BarChart3, 
  Zap, ArrowRight, Bot, Shield
} from 'lucide-react'

export default function Landing() {
  const features = [
    {
      icon: BarChart3,
      title: 'Sentiment Analysis',
      description: 'Real-time VADER sentiment scoring with animated gauge visualization',
      color: 'from-green-400 to-emerald-500',
    },
    {
      icon: Brain,
      title: 'Intent Detection',
      description: 'Zero-shot classification using Facebook BART-MNLI transformer model',
      color: 'from-nova-primary to-purple-400',
    },
    {
      icon: Zap,
      title: 'Entity Recognition',
      description: 'spaCy NER identifies people, organizations, places, and dates',
      color: 'from-nova-accent to-cyan-300',
    },
    {
      icon: Shield,
      title: 'Context Memory',
      description: 'Maintains 10-turn conversation history for contextual responses',
      color: 'from-pink-500 to-rose-400',
    },
  ]

  return (
    <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 pt-20">
      {/* Orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center max-w-4xl mx-auto mb-16"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-8 neon-border-purple"
        >
          <Bot className="w-4 h-4 text-nova-accent" />
          <span className="text-xs font-medium text-white/70">
            Neural Optimized Virtual Assistant
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-6xl sm:text-7xl lg:text-8xl font-black mb-6 tracking-tight"
        >
          <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
            Meet{' '}
          </span>
          <span className="bg-gradient-to-r from-nova-primary-light via-nova-accent to-nova-accent-light bg-clip-text text-transparent">
            NOVA
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          An advanced AI assistant powered by real-time NLP analysis.
          Watch sentiment, intent, and entity recognition unfold live
          as you chat.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/chat"
            className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-nova-primary to-nova-accent text-white font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] active:scale-95"
          >
            <MessageCircle className="w-5 h-5" />
            Start Chatting
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/about"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl glass neon-border-purple text-white/80 font-medium text-lg transition-all duration-300 hover:text-white hover:bg-white/10"
          >
            <Sparkles className="w-5 h-5" />
            Learn More
          </Link>
        </motion.div>
      </motion.div>

      {/* Feature Cards */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.8 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto w-full pb-20"
      >
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 + i * 0.15, duration: 0.5 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="glass-card rounded-2xl p-6 group cursor-default"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
              <feature.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white/90">
              {feature.title}
            </h3>
            <p className="text-sm text-white/40 leading-relaxed">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Tech Stack Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="fixed bottom-0 left-0 right-0 glass py-3 px-4 border-t border-white/5"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-6 text-xs text-white/30 font-mono">
          <span>React</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span>FastAPI</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span>spaCy</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span>VADER</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span>HuggingFace</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span>Framer Motion</span>
        </div>
      </motion.div>
    </div>
  )
}
