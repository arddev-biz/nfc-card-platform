import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#111827",
          offwhite: "#F9FAFB",
          lime: "#B8F500",
          slate: "#374151",
          light: "#E5E7EB",
        },
      },
      fontFamily: {
        // Scoped, opt-in families used only by the public profile / menu
        // (applied via `font-display` / `font-body`). The rest of the app
        // keeps its default system sans untouched.
        display: ["var(--font-fraunces)", "ui-serif", "Georgia", "serif"],
        body: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
