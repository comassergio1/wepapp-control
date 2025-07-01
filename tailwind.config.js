/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#faf9ef',
          100: '#f5f2d6',
          200: '#e7df8f',
          300: '#d6c95a',
          400: '#c6b43a',
          500: '#A89C29',
          600: '#8c7f1e',
          700: '#6b5e15',
          800: '#4a3e0d',
          900: '#2a1f05',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 