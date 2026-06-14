/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#0ea5e9',
        background: {
          DEFAULT: '#0f172a',
          light: '#ffffff',
        },
        surface: {
          DEFAULT: '#1e293b',
          light: '#f8fafc',
        },
        border: {
          DEFAULT: '#334155',
          light: '#e2e8f0',
        },
        text: {
          DEFAULT: '#e2e8f0',
          light: '#0f172a',
          muted: '#64748b',
        },
        success: '#10b981',
        warning: '#f97316',
        danger: '#ef4444',
      },
    },
  },
  plugins: [],
};
