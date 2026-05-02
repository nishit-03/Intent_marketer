/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        sidebar: '#0a0e17',
        'sidebar-hover': '#141926',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out both',
        'slide-left': 'slideInLeft 0.4s ease-out both',
        'pulse-glow': 'pulse-glow 2s infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        slideInLeft: {
          from: { opacity: 0, transform: 'translateX(-20px)' },
          to: { opacity: 1, transform: 'translateX(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.2)' },
          '50%': { boxShadow: '0 0 0 8px rgba(34, 197, 94, 0)' },
        },
      },
    },
  },
  plugins: [],
}
