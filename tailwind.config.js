/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'lol-gold': '#C89B3C',
        'lol-blue': '#0AC8B9',
        'lol-dark': '#010A13',
        'lol-gray': '#1E2328',
        'lol-light': '#A09B8C',
        'lol-red': '#E84057',
      },
      fontFamily: {
        'beaufort': ['"Beaufort for LOL"', 'serif'],
        'spiegel': ['Spiegel', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
