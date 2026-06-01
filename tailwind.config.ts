import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      keyframes: {
        ring: {
          "0%": { transform: "rotate(0deg)" },
          "10%": { transform: "rotate(16deg)" },
          "25%": { transform: "rotate(-13deg)" },
          "40%": { transform: "rotate(10deg)" },
          "55%": { transform: "rotate(-7deg)" },
          "70%": { transform: "rotate(4deg)" },
          "85%": { transform: "rotate(-2deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
      },
      animation: {
        ring: "ring 650ms ease-in-out",
      },
    },
  },
  plugins: [],
};
export default config;
