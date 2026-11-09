/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f5fa',
          100: '#e1ebf5',
          200: '#c2d7eb',
          300: '#94bde0',
          400: '#5f9dd0',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1b3a60',
          800: '#10243e',
          900: '#0a192f',
          950: '#06101e',
        },
        slate: {
          850: '#15202e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

