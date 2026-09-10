/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#e0e9fe',
          200: '#bae0fd',
          300: '#7cc2fd',
          400: '#36a3f9',
          500: '#0c87eb',
          600: '#006bc9',
          700: '#0055a4',
          800: '#054887',
          900: '#0a3d70',
          950: '#07274a',
        },
        slate: {
          850: '#151e2e',
          950: '#0a0f1d'
        }
      },
    },
  },
  plugins: [],
}
