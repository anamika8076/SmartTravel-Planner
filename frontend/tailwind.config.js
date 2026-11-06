/** @type {import('tailwindcss').Config} */
// Note: the UI only uses Tailwind's built-in colour palette. Animations live
// in src/index.css. That way nothing breaks if the dev server is running with
// an older copy of this file.
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mauve: {
          900: '#2a0e43',
          950: '#1c082b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Playfair Display"', '"DM Serif Display"', '"Instrument Serif"', 'Lora', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
