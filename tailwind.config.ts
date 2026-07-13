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
        bg: "#0B0B12",
        panel: "#12121B",
        raised: "#15151F",
        deep: "#101019",
        tile: "#1D1D2B",
        accent: "#F849A6",
        ink: "#17020D",
        cyan: "#5BD7E8",
        lime: "#B8F23C",
        warn: "#FF8A7A",
        line: "rgba(255,255,255,0.07)",
        hairline: "rgba(255,255,255,0.06)",
        control: "rgba(255,255,255,0.14)"
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"]
      },
      borderRadius: {
        "4xl": "2rem"
      },
      boxShadow: {
        glow: "0 10px 34px rgba(248, 73, 166, 0.35)",
        toast: "0 14px 40px rgba(0, 0, 0, 0.5)",
        screen: "0 30px 90px rgba(0, 0, 0, 0.6)",
        cover: "0 20px 50px rgba(0, 0, 0, 0.5)",
        drawer: "-24px 0 70px rgba(0, 0, 0, 0.55)",
        soft: "0 18px 60px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
        lift: "0 28px 90px rgba(0, 0, 0, 0.42), 0 0 42px rgba(248, 73, 166, 0.1)"
      },
      transitionTimingFunction: {
        silk: "cubic-bezier(0.2, 0.8, 0.2, 1)"
      },
      keyframes: {
        eq: {
          from: { transform: "scaleY(0.3)" },
          to: { transform: "scaleY(1)" }
        },
        "slide-up": {
          from: { transform: "translateY(60px)", opacity: "0.4" },
          to: { transform: "translateY(0)", opacity: "1" }
        },
        pop: {
          "0%": { transform: "scale(0.4)", opacity: "0" },
          "70%": { transform: "scale(1.12)" },
          "100%": { transform: "scale(1)", opacity: "1" }
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" }
        },
        "drawer-in": {
          from: { transform: "translateX(30px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" }
        },
        "toast-in": {
          from: { transform: "translateY(14px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" }
        },
        "inj-in": {
          from: { transform: "translateX(-16px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" }
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "0.9" }
        }
      },
      animation: {
        "slide-up": "slide-up 0.32s cubic-bezier(0.2, 0.8, 0.2, 1) both",
        pop: "pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "fade-in": "fade-in 0.25s ease both",
        "drawer-in": "drawer-in 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "toast-in": "toast-in 0.25s ease both",
        "inj-in": "inj-in 0.4s ease both",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite"
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(120% 40% at 50% -6%, rgba(248, 73, 166, 0.13), transparent 55%)",
        "accent-glow":
          "radial-gradient(120% 50% at 50% -8%, color-mix(in srgb, var(--acc, #F849A6) 15%, transparent), transparent 60%)"
      }
    }
  },
  plugins: []
};

export default config;
