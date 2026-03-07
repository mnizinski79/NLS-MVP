/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1F4456',
        'primary-light': '#2A5A6F',
        accent: '#F8B90D',
        kimpton: '#000000',
        voco: '#F8B90D',
        intercontinental: '#956652',
        'holiday-inn': '#216245',
        independent: '#1F4456'
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif']
      }
    },
  },
  plugins: [],
}
