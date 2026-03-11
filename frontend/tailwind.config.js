/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'accent-green':  '#2ECC8A',
        'accent-sky':    '#48B8E8',
        'accent-amber':  '#F5A623',
        'accent-coral':  '#FF6B6B',
        'accent-purple': '#8B6CF6',
        'text-primary':  '#1A2E28',
        'text-secondary':'#4A6B60',
        'text-muted':    '#9AB5AE',
        'card':          'rgba(255,255,255,0.72)',
      },
      fontFamily: {
        display: ['Nunito', 'sans-serif'],
        body:    ['Plus Jakarta Sans', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '28px',
        '4xl': '36px',
      },
      boxShadow: {
        'card': '0 8px 32px rgba(60,120,90,0.10), 0 2px 8px rgba(0,0,0,0.04)',
        'card-hover': '0 20px 48px rgba(60,120,90,0.16), 0 4px 12px rgba(0,0,0,0.06)',
      }
    },
  },
  plugins: [],
}
