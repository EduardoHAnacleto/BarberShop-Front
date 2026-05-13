// Tailwind CSS configuration. Defines the BarberShop design tokens:
// the gold and obsidian palettes, semantic surface aliases, typography
// stacks, custom animations + keyframes, and bespoke shadows. The values
// here are mirrored by CSS variables in assets/css/global.css so both the
// utility classes and the component layer can reach the same colours.
// See .claude/barbershop-frontend-sprints.md S1.2 for the exact spec.
import type { Config } from 'tailwindcss'

export default {
  // File globs Tailwind scans for class names. Anything not listed here
  // would be stripped out of the production bundle as unused.
  content: [
    './components/**/*.{vue,ts,js}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
    './error.vue',
    './composables/**/*.{ts,js}',
  ],

  // Dark mode is toggled by a `.dark` class on the html element; the
  // @nuxtjs/color-mode module manages that class.
  darkMode: 'class',

  theme: {
    extend: {
      // Brand colour scales. gold-500 is the canonical brand colour
      // (#c9a84c); the rest of the scale is a tonal ramp built around it.
      // obsidian provides the dark surfaces (800/900/950 are the deepest
      // values used by the layout backgrounds).
      colors: {
        gold: {
          50: '#fdfbf0',
          100: '#faf3d4',
          200: '#f3e4a4',
          300: '#e8c96a',
          400: '#d9b85a',
          500: '#c9a84c',
          600: '#a88936',
          700: '#8a6f2c',
          800: '#6e5824',
          900: '#51411b',
        },
        obsidian: {
          50: '#f5f5f5',
          100: '#e5e5e5',
          200: '#c4c4c4',
          300: '#a3a3a3',
          400: '#737373',
          500: '#525252',
          600: '#404040',
          700: '#2a2a2a',
          800: '#1a1a1a',
          900: '#0f0f0f',
          950: '#080808',
        },
        // Semantic aliases used by component-layer classes. DEFAULT lets
        // `bg-surface` resolve to surface.DEFAULT in utility shorthand.
        surface: {
          DEFAULT: '#111111',
          raised: '#181818',
          overlay: '#202020',
          border: '#2a2a2a',
        },
      },

      // Typography stacks. `display` is for headings (serif), `body` is
      // the default UI font, and `mono` is used for metric labels and
      // status badges.
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },

      // Named animations referenced by component-layer classes
      // (`.skeleton` uses `shimmer`, modals use `slide-up`, etc.).
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        shimmer: 'shimmer 2s linear infinite',
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
      },

      // Keyframes each animation above resolves to.
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(201, 168, 76, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(201, 168, 76, 0)' },
        },
      },

      // Bespoke shadows used by cards (`shadow-card`), focused/hovered
      // gold elements (`shadow-gold`, `shadow-gold-glow`) and modals
      // (`shadow-elevated`).
      boxShadow: {
        gold: '0 0 0 1px rgba(201, 168, 76, 0.3)',
        'gold-glow': '0 0 24px rgba(201, 168, 76, 0.15)',
        card: '0 1px 0 rgba(255, 255, 255, 0.02) inset, 0 4px 12px rgba(0, 0, 0, 0.4)',
        elevated: '0 12px 32px rgba(0, 0, 0, 0.55)',
      },
    },
  },

  plugins: [],
} satisfies Config
