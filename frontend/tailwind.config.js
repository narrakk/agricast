/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'agri-green': '#2D6A4F',
        'agri-light': '#52B788',
        'agri-sky': '#48CAE4',
        'agri-earth': '#8B4513',
        'agri-sun': '#F4A261'
      }
    }
  },
  plugins: []
}