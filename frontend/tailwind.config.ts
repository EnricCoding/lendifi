import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        primary: {
          DEFAULT: '#1E3A8A',
          light: '#93C5FD',
        },
        secondary: {
          DEFAULT: '#047857',
          light: '#6EE7B7',
        },
        warning: {
          DEFAULT: '#D97706',
          light: '#FCD34D',
        },
        danger: {
          DEFAULT: '#B91C1C',
          light: '#FCA5A5',
        },
        accent: {
          DEFAULT: '#8B5CF6',
          light: '#C4B5FD',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#1F2937',
        },
        bg: {
          light: '#F9FAFB',
          dark: '#111827',
        },
        text: {
          primary: '#1F2937',
          secondary: '#4B5563',
          'primary-dark': '#F3F4F6',
          'secondary-dark': '#9CA3AF',
        },
      },
    },
  },
  darkMode: 'class', // Enable dark mode support
  plugins: [],
};
export default config;
