import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        olak: {
          navy: {
            950: "#030A14",
            900: "#061325",
            850: "#0A1B33",
            800: "#0F2647",
            700: "#163866",
            600: "#1E4C8A",
          },
          teal: {
            DEFAULT: "#00D084",
            light: "#10E094",
            dark: "#00B370",
            hover: "#00B871",
            glow: "rgba(0, 208, 132, 0.25)",
          },
          accent: "#00F5A0",
          yellow: "#FFB800",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        urdu: ["'Noto Sans Arabic'", "'Noto Nastaliq Urdu'", "'Jameel Noori Nastaleeq'", "'Segoe UI'", "Tahoma", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "radial-navy": "radial-gradient(circle at 50% 0%, #0F2647 0%, #061325 75%, #030A14 100%)",
      },
      boxShadow: {
        "teal-glow": "0 0 25px rgba(0, 208, 132, 0.35)",
        "card-dark": "0 10px 30px -5px rgba(0, 0, 0, 0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
