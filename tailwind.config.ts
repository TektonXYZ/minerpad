import type { Config } from "tailwindcss";

/* One rule governs this palette: cold greys are furniture, heat is data.
   Nothing on the site is warm unless it is reporting a number. The ramp
   below is a thermal-camera ironbow, sampled at eight stops so both CSS and
   the canvas can read heat off the same scale. */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* cold: machined rack metal, lit by nothing */
        void: "#05060A",
        deck: "#0A0C11",
        rack: "#10131A",
        rail: "#191D26",
        seam: "#262B36",
        screw: "#39404F",
        dim: "#5D6574",
        label: "#9AA3B2",
        bone: "#E6E9EF",
        /* hot: the ironbow, only ever used for measurements */
        t10: "#120A2A",
        t25: "#3A1070",
        t40: "#7A1478",
        t55: "#B92060",
        t70: "#E85A1C",
        t82: "#F9960A",
        t92: "#FFD447",
        t100: "#FFF6E0",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        led: ["var(--font-led)", "ui-monospace", "monospace"],
      },
      letterSpacing: { rack: "0.28em", tag: "0.18em" },
      keyframes: {
        spin360: { to: { transform: "rotate(360deg)" } },
        scan: { from: { transform: "translateY(-100%)" }, to: { transform: "translateY(400%)" } },
        flicker: {
          "0%,100%": { opacity: "1" },
          "48%": { opacity: "1" },
          "50%": { opacity: "0.45" },
          "52%": { opacity: "1" },
        },
        breathe: {
          "0%,100%": { opacity: "0.35" },
          "50%": { opacity: "0.9" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
      },
      animation: {
        scan: "scan 7s linear infinite",
        flicker: "flicker 6s linear infinite",
        breathe: "breathe 2.6s ease-in-out infinite",
        slideUp: "slideUp 420ms cubic-bezier(0.16,1,0.3,1) both",
        marquee: "marquee 44s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
