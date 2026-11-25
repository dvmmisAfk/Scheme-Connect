import type { Config } from 'tailwindcss';

const v = (name: string) => `var(--${name})`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      paper: v('paper'),
      surface: v('surface'),
      line: v('line'),
      ink: v('ink'),
      'ink-2': v('ink-2'),
      green: v('green'),
      'green-tint': v('green-tint'),
      amber: v('amber'),
      'amber-tint': v('amber-tint'),
      slate: v('slate'),
      'slate-tint': v('slate-tint'),
      muted: v('muted'),
      danger: v('danger'),
    },
    spacing: { 0: '0', px: '1px', 1: '4px', 2: '8px', 3: '12px', 4: '16px', 6: '24px', 8: '32px', 12: '48px' },
    fontSize: {
      xs: ['13px', '1.5'],
      sm: ['15px', '1.5'],
      base: ['17px', '1.5'],
      lg: ['20px', '1.4'],
      xl: ['24px', '1.3'],
      '2xl': ['30px', '1.25'],
    },
    fontFamily: {
      sans: ['"IBM Plex Sans"', '"IBM Plex Sans Devanagari"', 'system-ui', 'sans-serif'],
      mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
    },
    borderRadius: { none: '0', control: '10px', sheet: '14px', full: '9999px' },
    boxShadow: { none: 'none', sheet: '0 -8px 32px rgba(27,36,32,0.16)' },
    extend: {
      minHeight: { touch: '48px' },
      minWidth: { touch: '48px' },
      maxWidth: { column: '440px' },
    },
  },
  plugins: [],
} satisfies Config;
