/** @type {import('tailwindcss').Config} */
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
      }
    },
  },
  plugins: [],
}
