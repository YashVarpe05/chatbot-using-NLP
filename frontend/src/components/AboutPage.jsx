import { motion } from 'framer-motion'
import { 
  BarChart3, Brain, Tags, Database, ArrowLeft,
  Cpu, Zap, BookOpen, ExternalLink
} from 'lucide-react'
import { Link } from 'react-router-dom'

const techniques = [
  {
    id: 'sentiment',
    icon: BarChart3,
    title: 'Sentiment Analysis',
    subtitle: 'VADER (Valence Aware Dictionary & Sentiment Reasoner)',
    color: 'from-green-400 to-emerald-500',
    borderColor: 'border-green-500/20',
    description: 'Sentiment analysis determines the emotional tone of text. NOVA uses VADER, a lexicon and rule-based tool specifically designed for social media and conversational text.',
    howItWorks: [
      'VADER uses a dictionary of words rated for sentiment valence',
      'It considers punctuation, capitalization, and intensity modifiers',
      'Outputs a compound score from -1 (most negative) to +1 (most positive)',
      'Handles emoticons, slang, and conjunctions intelligently',
    ],
    example: '"This project is absolutely amazing!" → Compound: +0.75 (Positive)',
    techStack: 'vaderSentiment Python library',
  },
  {
    id: 'intent',
    icon: Brain,
    title: 'Intent Detection',
    subtitle: 'Zero-Shot Classification (BART-MNLI)',
    color: 'from-nova-primary to-purple-400',
    borderColor: 'border-purple-500/20',
    description: 'Intent detection classifies the purpose behind a user\'s message without needing training examples for each category. NOVA uses Facebook\'s BART-MNLI model for zero-shot classification.',
    howItWorks: [
      'Zero-shot means the model classifies text into categories it hasn\'t been explicitly trained on',
      'BART-MNLI was trained on Natural Language Inference (NLI) tasks',
      'It evaluates if a text "entails" each candidate label',
      'Returns confidence scores for: question, greeting, command, complaint, compliment, farewell',
    ],
    example: '"What is the capital of France?" → Intent: Question (95.2% confidence)',
    techStack: 'HuggingFace Transformers — facebook/bart-large-mnli',
  },
  {
    id: 'ner',
    icon: Tags,
    title: 'Named Entity Recognition (NER)',
    subtitle: 'spaCy NLP Pipeline (en_core_web_sm)',
    color: 'from-nova-accent to-cyan-300',
    borderColor: 'border-cyan-500/20',
    description: 'NER identifies and classifies named entities in text — such as people, organizations, locations, dates, and more. NOVA uses spaCy\'s statistical NLP model.',
    howItWorks: [
      'spaCy tokenizes the text and applies a trained statistical model',
      'The model uses a CNN-based transition parser for entity recognition',
      'Entities are classified into types: PERSON, ORG, GPE, DATE, TIME, MONEY, etc.',
      'Each entity gets start/end character positions for in-text highlighting',
    ],
    example: '"Elon Musk founded SpaceX in 2002" → PERSON: Elon Musk, ORG: SpaceX, DATE: 2002',
    techStack: 'spaCy en_core_web_sm model',
  },
  {
    id: 'memory',
    icon: Database,
    title: 'Context Memory',
    subtitle: 'Session-Based Conversation History',
    color: 'from-pink-500 to-rose-400',
    borderColor: 'border-pink-500/20',
    description: 'Context memory maintains conversation history so NOVA can provide contextual, coherent responses across multiple turns. Each session stores up to 10 conversation turns.',
    howItWorks: [
      'Each chat session gets a unique UUID-based session ID',
      'Messages are stored in a Python dict (in-memory, no database needed)',
      'The last 10 turns (user + assistant pairs) are maintained per session',
      'Full history is passed to the LLM on each request for contextual responses',
    ],
    example: 'Turn 1: "My name is Alex" → Turn 5: "What\'s my name?" → NOVA: "Your name is Alex"',
    techStack: 'Python dict with UUID session management',
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function AboutPage() {
  return (
    <div className="relative z-10 min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Chat
          </Link>
        </motion.div>

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-nova-primary to-nova-accent flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black">
                <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                  About{' '}
                </span>
                <span className="bg-gradient-to-r from-nova-primary-light to-nova-accent-light bg-clip-text text-transparent">
                  NOVA
                </span>
              </h1>
              <p className="text-sm text-white/40">Neural Optimized Virtual Assistant — NLP Techniques Explained</p>
            </div>
          </div>
          <p className="text-white/50 leading-relaxed max-w-2xl">
            NOVA combines four core NLP techniques into a unified pipeline, analyzing every message 
            in real-time. Below is a detailed explanation of each technique — perfect for understanding
            the concepts behind the demo.
          </p>
        </motion.div>

        {/* Architecture Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6 mb-8"
        >
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-nova-accent" />
            <span className="text-white/80">Pipeline Architecture</span>
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono">
            <div className="glass rounded-xl px-4 py-3 text-center neon-border-purple">
              <div className="text-white/60 mb-1">Input</div>
              <div className="text-nova-primary-light font-semibold">User Message</div>
            </div>
            <Zap className="w-4 h-4 text-white/20" />
            <div className="flex flex-col gap-2">
              <div className="glass rounded-xl px-4 py-2 text-center border border-green-500/20">
                <div className="text-green-400">VADER Sentiment</div>
              </div>
              <div className="glass rounded-xl px-4 py-2 text-center border border-purple-500/20">
                <div className="text-purple-400">BART Intent</div>
              </div>
              <div className="glass rounded-xl px-4 py-2 text-center border border-cyan-500/20">
                <div className="text-cyan-400">spaCy NER</div>
              </div>
            </div>
            <Zap className="w-4 h-4 text-white/20" />
            <div className="glass rounded-xl px-4 py-3 text-center border border-pink-500/20">
              <div className="text-white/60 mb-1">Context</div>
              <div className="text-pink-400 font-semibold">Memory (10 turns)</div>
            </div>
            <Zap className="w-4 h-4 text-white/20" />
            <div className="glass rounded-xl px-4 py-3 text-center neon-border-cyan">
              <div className="text-white/60 mb-1">Output</div>
              <div className="text-nova-accent font-semibold">LLM Response</div>
            </div>
          </div>
        </motion.div>

        {/* Technique Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {techniques.map((tech) => (
            <motion.div
              key={tech.id}
              variants={item}
              className={`glass-card rounded-2xl p-6 border ${tech.borderColor}`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tech.color} flex items-center justify-center flex-shrink-0`}>
                  <tech.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white/90">{tech.title}</h3>
                  <p className="text-xs font-mono text-white/40 mt-0.5">{tech.subtitle}</p>
                </div>
              </div>

              <p className="text-sm text-white/50 leading-relaxed mb-4">
                {tech.description}
              </p>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider">How It Works</h4>
                <ul className="space-y-2">
                  {tech.howItWorks.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/40">
                      <span className="text-nova-accent mt-0.5 font-mono text-xs">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-white/3 border border-white/5">
                <div className="text-xs font-semibold text-white/50 mb-1">Example</div>
                <div className="text-sm text-white/70 font-mono">{tech.example}</div>
              </div>

              <div className="mt-3 flex items-center gap-2 text-[10px] text-white/25 font-mono">
                <Cpu className="w-3 h-3" />
                <span>{tech.techStack}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 text-center text-white/20 text-xs"
        >
          <p className="font-mono">NOVA — Built with React, FastAPI, spaCy, VADER, HuggingFace Transformers</p>
          <p className="mt-1">Advanced AI Chatbot • College Project Demo</p>
        </motion.div>
      </div>
    </div>
  )
}
