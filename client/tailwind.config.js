/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        blue: {
          50: '#f0f5fa',
          100: '#e1ebf5',
          200: '#c3d8eb',
          300: '#94badc',
          400: '#5c96ca',
          500: '#3575b6',
          600: '#193C6C', // PSUIC Deep Blue (Primary)
          700: '#1e3a64',
          800: '#1d3254',
          900: '#1b2b45',
          950: '#111b2d',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
