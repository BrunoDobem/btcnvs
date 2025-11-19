/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'bounce-delay-1': 'bounce 1.4s infinite',
        'bounce-delay-2': 'bounce 1.4s infinite 0.2s',
        'bounce-delay-3': 'bounce 1.4s infinite 0.4s',
      },
    },
  },
  plugins: [],
}

