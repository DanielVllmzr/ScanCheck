import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui"],
      },
      colors: {
        // 🎨 Paleta “mostaza” + verdes suaves
        brand: {
          50:  "#fff8e6",
          100: "#ffefbf",
          200: "#ffe38f",
          300: "#ffd55c",
          400: "#ffc532",
          500: "#f4b400", // mostaza principal
          600: "#d79f00",
          700: "#b38200",
        },
        success: {
          50:  "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981", // verde pastel
        },
        danger: {
          50:  "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e",
        },
        background: "#faf7f2",   // gris cálido muy claro
        foreground: "#1f2937",   // stone-800
        card: "#f6f3ee",         // gris claro para cards
        border: "#e7e1d9",       // borde suave
        muted: "#968f85",        // gris texto secundario
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        soft: "0 4px 20px rgba(0,0,0,.06)",
      },
      lineHeight: {
        comfy: "1.7", // 🔤 interlineado cómodo
      },
    },
  },
  plugins: [],
};
export default config;
