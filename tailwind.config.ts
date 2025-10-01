import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#ff2d2d',
          redSoft: '#ff5a5a',
          bg: '#0b0c0f',
          panel: 'rgba(12,14,18,0.75)',
        },
      },
      boxShadow: {
        glow: '0 0 20px 0 rgba(255,45,45,0.35)',
        glowSm: '0 0 12px 0 rgba(255,45,45,0.25)',
      },
      borderColor: {
        glass: 'rgba(255,255,255,0.08)',
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))',
      },
    },
  },
  plugins: [],
};

export default config;
