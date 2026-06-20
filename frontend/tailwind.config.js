/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#f0f7fe",
          100: "#C8DDF1",
          200: "#a8cceb",
          300: "#7ab2e0",
          400: "#4d97d4",
          500: "#2d7dc8",
          600: "#2262a0",
          700: "#1a4d7e",
          800: "#133a5f",
          900: "#0d273f",
        },
        brand: "#C8DDF1",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      backgroundImage: {
        "glass": "linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.1))",
        "hero-gradient": "linear-gradient(135deg, #C8DDF1 0%, #e8f4fd 50%, #f0f7fe 100%)",
      },
      boxShadow: {
        "glass": "0 8px 32px rgba(31, 38, 135, 0.15)",
        "card": "0 2px 20px rgba(0,0,0,0.06)",
        "card-hover": "0 8px 40px rgba(0,0,0,0.12)",
      },
      backdropBlur: { xs: "2px" },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-slow": "pulse 3s infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(20px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};
