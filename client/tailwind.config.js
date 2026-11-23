/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bizora: {
          background: "#10131C",
          sidebar: "#131824",
          surface: "#191E2B",
          elevated: "#22293A",
          border: "#2B3243",
          primary: "#8B7CFF",
          success: "#27C99A",
          warning: "#F4B860",
          danger: "#F16F79",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};