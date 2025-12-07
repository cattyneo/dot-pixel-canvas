import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "#222",
        "border-inactive": "#d4d4d4",
        bg: "#fffbf0",
        "container-bg": "#ffffff",
        accent: "#ffb7b2",
      },
      fontFamily: {
        pixel: ["var(--font-dot-gothic)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
