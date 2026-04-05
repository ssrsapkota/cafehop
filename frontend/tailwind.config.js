/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /* Brand Colors */
        primary: "var(--color-primary)",
        accent: "var(--color-accent)",
        "accent-soft": "var(--color-accent-soft)",

        /* Backgrounds */
        "page-bg": "var(--color-page-bg)",
        "surface-card": "var(--color-surface-card)",
        "surface-hover": "var(--color-surface-hover)",

        /* Text */
        "text-main": "var(--color-text-main)",
        "text-muted": "var(--color-text-muted)",
        "text-subtle": "var(--color-text-subtle)",

        /* Borders */
        border: "var(--color-border)",
      },
      fontFamily: {
        display: ["Playfair Display", "serif"],
        body: ["Inter", "sans-serif"],
      },
      boxShadow: {
        'soft': '0 10px 40px -10px rgba(0,0,0,0.06)',
        'float': '0 20px 40px -15px rgba(0,0,0,0.05)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0,0,0,0.02)'
      },
      backgroundImage: {
        'noise': 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
      },
      animation: {
        'fade-in': 'fadeIn 1s ease-out forwards',
        'fade-in-up': 'fadeInUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float': 'float 20s ease-in-out infinite',
        'float-slow': 'float 30s ease-in-out infinite',
        'pulse-slow': 'pulse 10s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0)' },
          '33%': { transform: 'translate(20px, -30px) rotate(1deg)' },
          '66%': { transform: 'translate(-10px, 20px) rotate(-1deg)' },
        }
      }
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
  ],
};
