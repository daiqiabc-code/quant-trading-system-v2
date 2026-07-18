/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        buy: '#22c55e',
        sell: '#ef4444',
        neutral: '#6b7280',
        signal: {
          a: '#10b981',
          b: '#f59e0b',
          c: '#6b7280',
        },
        market: {
          bg: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          text: '#f1f5f9',
          muted: '#94a3b8',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'signal-flash': 'signalFlash 1.5s ease-in-out infinite',
      },
      keyframes: {
        signalFlash: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
    },
  },
  plugins: [],
}
