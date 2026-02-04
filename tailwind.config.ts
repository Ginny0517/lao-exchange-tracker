import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2196F3",
          light: "#64B5F6",
          dark: "#1976D2",
        },
        accent: {
          DEFAULT: "#00BCD4",
          light: "#4DD0E1",
          dark: "#0097A7",
        },
        success: {
          DEFAULT: "#4CAF50",
          light: "#81C784",
          dark: "#388E3C",
        },
      },
    },
  },
  plugins: [],
};
export default config;
