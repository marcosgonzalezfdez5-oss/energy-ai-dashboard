import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        foreground: '#000000',
        primary: '#FFA500',
        secondary: '#f5f5f5',
        accent: '#1a1a1a',
        muted: '#666666',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
