const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './node_modules/flowbite-react/**/*.js',
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-satoshi)', ...fontFamily.sans],
      },
      colors: {
        baseGrayLow: '#4B4B4B',
        baseGray: '#242424',
        baseGrayMid: '#141414',
        baseGrayDark: '#0D0D0D',
        primaryGreen: '#96E7D7',
        bgBlack: '#030303',
        offWhite: '#E6E6E6',
      },
      backgroundImage: {
        'bg-pattern': 'url("/Pattern.png")',
        'card-gradient':
          'radial-gradient(177.22% 177.22% at 50% -86.67%, #96E7D7 0%, rgba(150, 231, 215, 0) 100%);',
      },
    },
  },
  plugins: [require('flowbite/plugin')],
};
