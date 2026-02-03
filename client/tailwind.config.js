/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        blue: {
          50: '#F4F7FB',
          100: '#E4EBF4',
          200: '#C6D6EA',
          300: '#99B9DD',
          400: '#6495CD',
          500: '#3D76BA',
          600: '#193C6C', // PSUIC Deep Blue (Primary)
          700: '#15325A',
          800: '#132948',
          900: '#12233C',
          950: '#0B1525',
        },
        gold: {
          500: '#D4AF37', // Standard Gold for accents
        },
      },
      fontFamily: {
        sans: ["Sarabun", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
};
