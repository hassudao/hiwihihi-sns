/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // ★ここを追加！
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};