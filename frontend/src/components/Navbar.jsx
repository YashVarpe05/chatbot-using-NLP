import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, MessageCircle, Info } from 'lucide-react'

export default function Navbar({ backendOnline }) {
  const location = useLocation()

  const navLinks = [
    { to: '/', label: 'Home', icon: Sparkles },
    { to: '/chat', label: 'Chat', icon: MessageCircle },
    { to: '/about', label: 'About', icon: Info },
  ]

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 px-4 py-3"
    >
      <div className="max-w-7xl mx-auto">
        <div className="glass-strong rounded-2xl px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-nova-primary to-nova-accent flex items-center justify-center neon-glow group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -inset-1 rounded-lg bg-gradient-to-br from-nova-primary to-nova-accent opacity-0 group-hover:opacity-20 blur transition-opacity duration-300" />
            </div>
            <span className="text-lg font-bold tracking-wider">
              <span className="bg-gradient-to-r from-nova-primary-light to-nova-accent-light bg-clip-text text-transparent">
                NOVA
              </span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'text-white'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-xl bg-white/10 border border-white/10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10 hidden sm:inline">{label}</span>
                </Link>
              )
            })}
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${
              backendOnline
                ? 'bg-green-400 status-pulse'
                : 'bg-red-400 animate-pulse'
            }`} />
            <span className="text-xs font-mono text-white/40 hidden sm:inline">
              {backendOnline ? 'API Online' : 'API Offline'}
            </span>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
