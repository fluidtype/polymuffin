import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          body: '#05060a',
          panel: 'rgba(14,16,24,0.85)',
          sidebar: 'rgba(9,10,15,0.88)',
          red: '#ff4d57',
          ember: '#ff7660',
        },
        glass: 'rgba(255,255,255,0.08)',
      },
      boxShadow: {
        glowSm:
          '0 0 0 1px rgba(255,77,87,0.25), 0 12px 30px -18px rgba(255,77,87,0.55)',
        glowMd:
          '0 0 0 1px rgba(255,77,87,0.3), 0 28px 60px -24px rgba(255,77,87,0.5)',
      },
      borderRadius: {
        '3xl': '1.75rem',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
