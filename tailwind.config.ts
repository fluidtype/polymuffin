import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // semantic tokens (dark)
        bg: {
          base: 'rgb(var(--bg-base) / <alpha-value>)',        // main page background (glass over shader)
          surface: 'rgb(var(--bg-surface) / <alpha-value>)',  // cards/panels
        },
        text: {
          primary: 'rgb(var(--text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
        },
        brand: {
          red: 'rgb(var(--brand-red) / <alpha-value>)',
          redSoft: 'rgb(var(--brand-red-soft) / <alpha-value>)',
        },
        line: {
          subtle: 'rgb(var(--line-subtle) / <alpha-value>)',
        },
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        glow: '0 0 22px rgba(255,45,45,.28)',
        glowSm: '0 0 12px rgba(255,45,45,.18)',
      },
    },
  },
  plugins: [],
};
export default config;
