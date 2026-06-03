import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'notice',
    'notice-header',
    'notice-body',
    'notice-note',
    'notice-warning',
    'notice-tip',
    'notice-danger',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      colors: {
        md: {
          high: 'var(--text-high)',
          med: 'var(--text-med)',
          low: 'var(--text-low)',
          divider: 'var(--text-divider)',
        },
      },
      typography: (theme: (path: string) => string) => ({
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'rgba(0,0,0,0.75)',
            lineHeight: '1.8',
            a: {
              color: 'rgba(0,0,0,0.87)',
              textDecoration: 'underline',
              textDecorationColor: theme('colors.gray.300'),
              fontWeight: '400',
              '&:hover': { textDecorationColor: theme('colors.gray.500') },
            },
            'h1,h2,h3,h4': {
              color: 'rgba(0,0,0,0.87)',
              fontWeight: '600',
              scrollMarginTop: '80px',
            },
            h2: { marginTop: '2em', marginBottom: '0.75em' },
            h3: { marginTop: '1.5em', marginBottom: '0.5em' },
            code: {
              color: theme('colors.gray.800'),
              backgroundColor: theme('colors.gray.100'),
              padding: '0.2em 0.4em',
              borderRadius: '0.25rem',
              fontWeight: '400',
              fontSize: '0.875em',
            },
            'code::before': { content: '""' },
            'code::after': { content: '""' },
            pre: {
              backgroundColor: theme('colors.gray.50'),
              border: `1px solid ${theme('colors.gray.200')}`,
              borderRadius: '0.5rem',
              code: {
                backgroundColor: 'transparent',
                padding: '0',
                color: 'inherit',
              },
            },
            blockquote: {
              borderLeftColor: theme('colors.gray.200'),
              color: 'rgba(0,0,0,0.60)',
            },
            hr: { borderColor: 'rgba(0,0,0,0.12)' },
            table: { fontSize: '0.875em' },
            'thead th': { color: 'rgba(0,0,0,0.87)' },
            li: { color: 'rgba(0,0,0,0.75)' },
            strong: { color: 'rgba(0,0,0,0.87)', fontWeight: '600' },
          },
        },
        invert: {
          css: {
            color: 'rgba(255,255,255,0.60)',
            a: {
              color: 'rgba(255,255,255,0.87)',
              textDecorationColor: 'rgba(255,255,255,0.20)',
              '&:hover': { textDecorationColor: 'rgba(255,255,255,0.50)' },
            },
            'h1,h2,h3,h4': { color: 'rgba(255,255,255,0.87)' },
            code: {
              color: 'rgba(255,255,255,0.87)',
              backgroundColor: 'rgba(255,255,255,0.08)',
            },
            pre: {
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.10)',
              code: { color: 'rgba(255,255,255,0.80)' },
            },
            blockquote: {
              borderLeftColor: 'rgba(255,255,255,0.20)',
              color: 'rgba(255,255,255,0.60)',
            },
            hr: { borderColor: 'rgba(255,255,255,0.12)' },
            'thead th': { color: 'rgba(255,255,255,0.87)' },
            li: { color: 'rgba(255,255,255,0.60)' },
            strong: { color: 'rgba(255,255,255,0.87)', fontWeight: '600' },
            td: { color: 'rgba(255,255,255,0.60)' },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
