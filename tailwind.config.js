/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3498db',
          dark: '#2980b9',
        },
        danger: {
          DEFAULT: '#e74c3c',
          dark: '#c0392b',
        },
        secondary: {
          DEFAULT: '#95a5a6',
          dark: '#7f8c8d',
        },
        text: {
          primary: '#2c3e50',
          secondary: '#7f8c8d',
          muted: '#95a5a6',
          dark: '#555',
        },
        // Dark theme colors
        darkbg: {
          primary: '#1a1a1a',
          secondary: '#2d2d2d',
          tertiary: '#3a3a3a',
        },
        darktext: {
          primary: '#e4e4e4',
          secondary: '#b0b0b0',
          muted: '#888',
        },
        darkborder: {
          DEFAULT: '#404040',
          light: '#4a4a4a',
        },
      },
    },
  },
  plugins: [],
}
