/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // [Key Change] ตั้งค่า sans (ค่า default ของ Tailwind) ให้เป็น Poppins
        // ผลลัพธ์: ทั้งเว็บจะกลายเป็น Poppins โดยอัตโนมัติ ไม่ต้องไล่แก้ class
        sans: ["var(--font-primary)", "sans-serif"], 
      },
      colors: {
        // PSU Theme Colors (Design Tokens)
        primary: "#193C6C", // PSUIC Deep Blue
        secondary: "#D4AF37", // PSUIC Gold
        background: "#F4F7FB", // Soft gray background
        
        // [Safety Net] Override blue-600 to match primary theme
        blue: {
          50: '#F4F7FB',
          100: '#E4EBF4',
          200: '#C6D6EA',
          300: '#99B9DD',
          400: '#6495CD',
          500: '#3D76BA',
          600: '#193C6C', 
          700: '#15325A',
          800: '#132948',
          900: '#12233C',
          950: '#0B1525',
        },
        gold: {
          500: '#D4AF37',
          DEFAULT: '#D4AF37',
        },
        // Role-based Colors
        role: {
          user: '#193C6C',      // Matches Primary/PSU Deep Blue
          it: '#193C6C',        // Currently matches Primary, can be distinct if needed
          admin: '#273267',     // Distinct Admin Blue/Indigo
          'admin-text': '#1e2e4a', // Dark text for Admin Dashboard
        },
        // Status Colors (from variables.scss but ensured here for utility usage)
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
    },
  },
  plugins: [],
};
