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
    },
  },
  plugins: [],
};

export default config;
