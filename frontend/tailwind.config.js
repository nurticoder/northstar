/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#102b46",
        signal: "#356a9d",
        paper: "#f7f8fb",
        line: "#dce6f0",
        moss: "#789777",
      },
      fontFamily: {
        sans: ["DM Sans", "Arial", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
