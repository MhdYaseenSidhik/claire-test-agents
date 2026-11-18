/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        accent: { DEFAULT: '#2563EB', hover: '#1D4ED8', light: '#DBEAFE' },
        success: '#16A34A', warning: '#D97706', danger: '#DC2626', info: '#0891B2',
        surface: { light: '#F8FAFC', dark: '#0F172A' },
        card: { light: '#FFFFFF', dark: '#1E293B' },
        border: { light: '#E2E8F0', dark: '#334155' },
      },
      borderRadius: { sm: '6px', lg: '12px' },
    },
  },
  plugins: [],
}
