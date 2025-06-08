/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,cjs,ts,jsx,tsx}",
  ],
  purge: {
    content: ['./src/**/*.{vue,cjs,ts,jsx,tsx}'],
    options: {
      safelist: ['pulse-red'],
    },
  },
  theme: {
    extend: {
      colors: {
        orange: {
          50: '#fff2e6',
          100: '#ffe6cc',
          200: '#ffd9b3',
          300: '#ffcc99',
          400: '#ffb366',
          500: '#ff9933',
          600: '#ff8c1a',
          700: '#e67300',
          800: '#b35900',
          900: '#804000',
        }
      }
    },
  },
  plugins: [],
}
