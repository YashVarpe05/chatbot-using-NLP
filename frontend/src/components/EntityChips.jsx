import { motion } from 'framer-motion'

const ENTITY_STYLES = {
  PERSON:   { bg: 'bg-purple-500/20', border: 'border-purple-400/30', text: 'text-purple-300', dot: 'bg-purple-400' },
  ORG:      { bg: 'bg-cyan-500/20',   border: 'border-cyan-400/30',   text: 'text-cyan-300',   dot: 'bg-cyan-400' },
  GPE:      { bg: 'bg-green-500/20',  border: 'border-green-400/30',  text: 'text-green-300',  dot: 'bg-green-400' },
  LOC:      { bg: 'bg-green-500/20',  border: 'border-green-400/30',  text: 'text-green-300',  dot: 'bg-green-400' },
  DATE:     { bg: 'bg-orange-500/20', border: 'border-orange-400/30', text: 'text-orange-300', dot: 'bg-orange-400' },
  TIME:     { bg: 'bg-orange-500/20', border: 'border-orange-400/30', text: 'text-orange-300', dot: 'bg-orange-400' },
  MONEY:    { bg: 'bg-yellow-500/20', border: 'border-yellow-400/30', text: 'text-yellow-300', dot: 'bg-yellow-400' },
  PRODUCT:  { bg: 'bg-pink-500/20',   border: 'border-pink-400/30',   text: 'text-pink-300',   dot: 'bg-pink-400' },
  EVENT:    { bg: 'bg-blue-500/20',   border: 'border-blue-400/30',   text: 'text-blue-300',   dot: 'bg-blue-400' },
  NORP:     { bg: 'bg-teal-500/20',   border: 'border-teal-400/30',   text: 'text-teal-300',   dot: 'bg-teal-400' },
}

const DEFAULT_STYLE = { bg: 'bg-gray-500/20', border: 'border-gray-400/30', text: 'text-gray-300', dot: 'bg-gray-400' }

export default function EntityChips({ entities = [], compact = false }) {
  if (entities.length === 0) {
    return (
      <div className="text-xs text-white/30 italic">
        No entities detected
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {entities.map((entity, i) => {
        const style = ENTITY_STYLES[entity.label] || DEFAULT_STYLE
        return (
          <motion.span
            key={`${entity.text}-${i}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05, duration: 0.2 }}
            className={`inline-flex items-center gap-1.5 ${
              compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
            } rounded-lg ${style.bg} border ${style.border} ${style.text} font-medium`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
            <span>{entity.text}</span>
            <span className="opacity-50 text-[9px] font-mono">{entity.label}</span>
          </motion.span>
        )
      })}
    </div>
  )
}
