/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff4ff',
          100: '#dbe6fe',
          200: '#bfcdff',
          300: '#94aefe',
          400: '#6b8afd',
          500: '#3b5cfd',
          600: '#1e3fd4',
          700: '#1931ab',
          800: '#192a89',
          900: '#192672',
        },
      },
    },
  },
  plugins: [],
}
