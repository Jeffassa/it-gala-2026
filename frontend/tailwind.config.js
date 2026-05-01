/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0E0808",
          elev: "#1A1010",
          elev2: "#241818",
          elev3: "#2E2020",
        },
        line: {
          DEFAULT: "#3A2828",
          strong: "#4A3232",
        },
        ink: {
          DEFAULT: "#FFFFFF",
          muted: "#C9B8B8",
          faint: "#8A7575",
        },
        primary: {
          DEFAULT: "#7B0202",
          deep: "#330808",
          soft: "#5A0202",
          tint: "#9C0808",
        },
        accent: {
          DEFAULT: "#F0A50C",
          bright: "#FBC23A",
          soft: "#B57708",
          deep: "#7E5800",
        },
        terracotta: {
          DEFAULT: "#B45052",
          soft: "#8E3A3C",
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', "Georgia", "serif"],
        sans: ['Inter', "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 32px rgba(240, 165, 12, 0.25)",
        primary: "0 12px 32px rgba(123, 2, 2, 0.45)",
        elev: "0 24px 48px rgba(0,0,0,0.5)",
      },
      backgroundImage: {
        "primary-gradient": "linear-gradient(135deg, #7B0202 0%, #330808 100%)",
        "accent-gradient": "linear-gradient(135deg, #FBC23A 0%, #F0A50C 50%, #B57708 100%)",
        "regal": "linear-gradient(135deg, #7B0202 0%, #330808 50%, #0E0808 100%)",
      },
      animation: {
        "scan-line": "scan-line 2s ease-in-out infinite",
        "shimmer": "shimmer 8s ease-in-out infinite",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "fade-up": "fade-up 0.7s ease-out forwards",
        "pulse-soft": "pulse-soft 2.5s ease-in-out infinite",
        "spin-slow": "spin 16s linear infinite",
      },
      keyframes: {
        "scan-line": { "0%, 100%": { top: "5%" }, "50%": { top: "95%" } },
        "shimmer": { "0%, 100%": { transform: "translate(-50%, -50%) scale(1)", opacity: 0.7 }, "50%": { transform: "translate(-50%, -50%) scale(1.15)", opacity: 1 } },
        "fade-in": { from: { opacity: 0, transform: "translateY(8px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        "fade-up": { from: { opacity: 0, transform: "translateY(40px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        "pulse-soft": { "0%, 100%": { opacity: 1 }, "50%": { opacity: 0.5 } },
      },
    },
  },
  plugins: [],
};
