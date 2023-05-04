/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/story-gen/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require("@tailwindcss/forms"), 
    require("@tailwindcss/typography")    
  ],
}

