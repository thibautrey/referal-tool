/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        rainbow: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
      },
      animation: {
        rainbow: "rainbow 8s linear infinite",
      },
      cssVariables: {
        "--color-1": "271deg 91% 65%",
        "--color-2": "91deg 91% 65%",
        "--color-3": "31deg 91% 65%",
        "--color-4": "151deg 91% 65%",
        "--color-5": "211deg 91% 65%",
      },
    },
  },
  plugins: [],
};
