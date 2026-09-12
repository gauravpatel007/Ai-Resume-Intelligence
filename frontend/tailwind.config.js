/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        customgray: {
          100: '#e5e5e4', // Lighter variant for the badge background
          500: '#7d7f7c', // Exact requested hex
        }
      }
    },
  },
  plugins: [],
}
