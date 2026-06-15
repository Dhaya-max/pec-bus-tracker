/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#1E3A5F",
          accent: "#F59E0B",
          light: "#EFF6FF",
        }
      }
    },
  },
  plugins: [],
}