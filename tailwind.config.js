/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
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
      },
    },
  },
  plugins: [],
}
