/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0fdf6',
          100: '#dcfceb',
          200: '#b9f8d6',
          300: '#82f1ba',
          400: '#3de595',
          500: '#14c97f',
          600: '#11b67a',
          700: '#0d9462',
          800: '#0a724c',
          900: '#085a3d',
        },
        sidebar: '#0f172a',
        'sidebar-hover': '#1e293b',
        'sidebar-active': '#0d9462',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
