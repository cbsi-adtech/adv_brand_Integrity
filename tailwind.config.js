/** @type {import('tailwindcss').Config} */
// Color values trace to the Paramount Skydance Brand Guidelines v2.0
// (paramount-brand-ui skill). Components must use these named tokens —
// never stock Tailwind palette colors.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy:        '#000A3C',  // Vista Navy — page base
          surface:     '#000D4A',  // navy + slight lift
          card:        '#001166',  // card layer
          grey:        '#D9DAE2',  // Mountain Grey — secondary text
          peak:        '#0064FF',  // Peak Blue — the single accent
          peakhover:   '#0052D4',
          horizon:     '#FF008A',  // error / critical
          horizontint: '#A8217D',
          sunrise:     '#FFD400',  // warning
          sunrisetint: '#FFB71E',
          sky:         '#03D1E5',  // info
          skytint:     '#00ABDB',
          success:     '#00C48C',
        },
      },
      fontFamily: {
        display: ['Vista Sans Condensed', 'Arial Narrow', 'Arial', 'sans-serif'],
        sans: ['Peak Sans', 'Inter', 'Segoe UI', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
