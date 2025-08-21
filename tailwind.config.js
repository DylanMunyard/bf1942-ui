/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors for the BF1942 theme
        'bf-primary': 'var(--color-primary)',
        'bf-primary-hover': 'var(--color-primary-hover)',
        'bf-background': 'var(--color-background)',
        'bf-background-soft': 'var(--color-background-soft)',
        'bf-background-mute': 'var(--color-background-mute)',
        'bf-text': 'var(--color-text)',
        'bf-text-muted': 'var(--color-text-muted)',
        'bf-heading': 'var(--color-heading)',
        'bf-border': 'var(--color-border)',
      }
    },
  },
  plugins: [],
}