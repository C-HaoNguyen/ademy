/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          light: '#3B82F6',
          dark: '#1E3A8A',
        },
        cta: {
          DEFAULT: '#F97316',
          dark: '#EA580C',
        },
        success: {
          DEFAULT: '#16A34A',
          light: '#DCFCE7',
        },
        danger: {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
        },
        warning: {
          DEFAULT: '#D97706',
          light: '#FEF3C7',
        },
        surface: '#F8FAFC',
        ink: '#1E293B',
      },
      fontWeight: {
        'light': 300,
        'normal': 400,
        'medium': 500,
        'semibold': 600,
        'bold': 700,
      },
      borderRadius: {
        card: '20px',
      },
    },
  },
  plugins: [],
}

