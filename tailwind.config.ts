import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#09090f",
        panel: "#12131d",
        panelSoft: "#1b1d2b",
        accent: "#ff3cac",
        accentBlue: "#645cff",
        accentAmber: "#f59e0b",
        line: "rgba(255,255,255,0.08)"
      },
      borderRadius: {
        "4xl": "2rem"
      },
      boxShadow: {
        glow: "0 24px 80px rgba(100, 92, 255, 0.28)"
      },
      backgroundImage: {
        "hero-radial":
          "radial-gradient(circle at top left, rgba(255,60,172,0.22), transparent 34%), radial-gradient(circle at top right, rgba(100,92,255,0.22), transparent 28%), radial-gradient(circle at bottom, rgba(245,158,11,0.14), transparent 30%)"
      }
    }
  },
  plugins: []
};

export default config;
