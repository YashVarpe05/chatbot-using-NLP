/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nova: {
          bg: '#0f0f1a',
          'bg-light': '#161628',
          'bg-card': '#1a1a2e',
          primary: '#7c3aed',
          'primary-light': '#a78bfa',
          accent: '#06b6d4',
          'accent-light': '#22d3ee',
          neon: '#00f0ff',
          pink: '#ec4899',
          surface: 'rgba(255, 255, 255, 0.05)',
          'surface-hover': 'rgba(255, 255, 255, 0.1)',
          border: 'rgba(255, 255, 255, 0.1)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'neon-flicker': 'neon-flicker 1.5s ease-in-out infinite alternate',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'spin-slow': 'spin 8s linear infinite',
        'bounce-dot': 'bounce-dot 1.4s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(124, 58, 237, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(124, 58, 237, 0.6), 0 0 80px rgba(6, 182, 212, 0.3)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'neon-flicker': {
          '0%': { opacity: '1' },
          '50%': { opacity: '0.8' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'bounce-dot': {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%': { transform: 'scale(1)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
