import type { Config } from 'tailwindcss'
const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:       'var(--bg)',
        surface:  'var(--surface)',
        's2':     'var(--surface-2)',
        's3':     'var(--surface-3)',
        border:   'var(--border)',
        accent:   'var(--accent)',
        't1':     'var(--text)',
        't2':     'var(--text-2)',
        't3':     'var(--text-3)',
      },
      fontFamily: { sans: ['Manrope', 'sans-serif'] },
    },
  },
  plugins: [],
}
export default config
