/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'gray-dark': '#1A1A1A',
        'gray-mid': '#808080',
        'gray-light': '#E5E5E5',
        'red-brand': '#DC0000',
        'red-dark': '#A50000',
        'red-light': '#FF4444',
        success: '#00C853',
        warning: '#FFB300',
      },
      fontFamily: {
        display: ['Georgia', 'serif'],
        body: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      fontSize: {
        '2xl': '1.953rem',
        '3xl': '2.441rem',
        '4xl': '3.052rem',
        '5xl': '3.815rem',
        '6xl': '4.768rem',
        '7xl': '5.96rem',
      },
      letterSpacing: {
        wide: '0.05em',
        wider: '0.1em',
      },
    },
  },
  plugins: [],
};
