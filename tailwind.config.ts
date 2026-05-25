import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-cairo)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 10px 30px -10px rgba(30, 111, 191, 0.15)',
        'premium-hover': '0 20px 40px -15px rgba(30, 111, 191, 0.25)',
        'glow': '0 0 20px 0px rgba(30, 111, 191, 0.15)',
      },
    },
  },
  plugins: [],
}

export default config

