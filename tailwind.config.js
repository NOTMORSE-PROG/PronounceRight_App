/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#E3F2FD',
          100: '#BBDEFB',
          200: '#90CAF9',
          300: '#64B5F6',
          400: '#42A5F5',
          500: '#2196F3',
          600: '#1E88E5',
          700: '#1565C0',
          800: '#0D47A1',
        },
        cyan: {
          400: '#26C6DA',
          500: '#00BCD4',
        },
        accent: {
          50:  '#FFF3E0',
          100: '#FFE0B2',
          400: '#FFA726',
          500: '#FF9800',
          600: '#FB8C00',
        },
        success: {
          DEFAULT: '#10B981',
          light:   '#D1FAE5',
          dark:    '#065F46',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light:   '#FEF3C7',
        },
        error: {
          DEFAULT: '#EF4444',
          light:   '#FEE2E2',
        },
        surface: {
          DEFAULT:   '#FFFFFF',
          page:      '#F0F7FF',
          card:      '#FFFFFF',
        },
        'text-primary':   '#1A237E',
        'text-secondary': '#546E7A',
        'text-muted':     '#90A4AE',
        'text-inverse':   '#FFFFFF',
        border: {
          DEFAULT: '#BBDEFB',
          strong:  '#90CAF9',
        },
      },
      fontFamily: {
        sans: ['System'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        card: '0 1px 4px rgba(33, 150, 243, 0.10)',
        'card-md': '0 4px 12px rgba(33, 150, 243, 0.15)',
        'primary-glow': '0 4px 12px rgba(33, 150, 243, 0.30)',
        glass: '0 8px 32px rgba(13, 71, 161, 0.25)',
        'glass-lg': '0 12px 40px rgba(13, 71, 161, 0.30)',
        'button-glow': '0 4px 20px rgba(33, 150, 243, 0.40)',
      },
    },
  },
  plugins: [],
};
