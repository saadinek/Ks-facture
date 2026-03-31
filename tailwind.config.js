/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        bg:      '#F7F6F3',
        surface: '#FFFFFF',
        border:  '#E8E6E0',
        accent: {
          DEFAULT: '#2563EB',
          light:   '#EFF4FF',
          hover:   '#1D4ED8',
        },
      },
      borderRadius: {
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
    },
  },
  plugins: [],
}
