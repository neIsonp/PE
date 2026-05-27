import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        caca: {
          50: "#f8f9fc",
          100: "#e0ebfe",
          500: "#1e56d0",
          600: "#1240b0",
          800: "#061d60",
          900: "#040e2e"
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"]
      }
    }
  },
  corePlugins: {
    preflight: false
  },
  plugins: []
};

export default config;
