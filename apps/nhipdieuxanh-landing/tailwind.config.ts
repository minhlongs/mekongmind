import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Flat names as requested in the color system specifications
        primaryEmerald: "#10B981",
        hoverDeepEmerald: "#059669",
        baseForestJade: "#064E3B",
        highlightRoyalAmber: "#F59E0B",
        
        // Brand taxonomy grouping
        brand: {
          primary: "#10B981",       // Primary Emerald
          hover: "#059669",         // Hover Deep Emerald
          base: "#064E3B",          // Base Forest Jade
          highlight: "#F59E0B",     // Highlight Royal Amber
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        outfit: ["var(--font-outfit)", "Outfit", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
