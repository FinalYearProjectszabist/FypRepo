/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'ui-sans-serif', 'sans-serif'],
      },
      colors: {
        // Emerald "charge" green
        brand: {
          50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399',
          500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b',
        },
        ink: {
          900: '#0b1220', 950: '#050a14',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(16,185,129,.25), 0 8px 30px -6px rgba(16,185,129,.45)',
        card: '0 1px 0 0 rgba(255,255,255,.06) inset, 0 20px 50px -20px rgba(0,0,0,.6)',
      },
      keyframes: {
        shimmer: { '0%': { backgroundPosition: '0% 50%' }, '100%': { backgroundPosition: '200% 50%' } },
      },
      animation: {
        shimmer: 'shimmer 6s linear infinite',
      },
    },
  },
  plugins: [],
};
