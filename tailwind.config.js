/** @type {import('tailwindcss').Config} */
export default {
  content: ["./views/**/*.ejs"],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: "#2AA8A8",
          coral: "#FF6B6B",
          cream: "#F8F7F4",
          dark: "#0F172A"
        }
      },
      boxShadow: {
        soft: "0 20px 50px rgba(15, 23, 42, 0.12)"
      }
    }
  },
  plugins: [],
}

