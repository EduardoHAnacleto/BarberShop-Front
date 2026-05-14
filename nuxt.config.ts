// Nuxt configuration for the BarberShop frontend.
// Locks the runtime to TypeScript strict mode, registers every module the
// sprints rely on, exposes typed runtime config, declares the dark-theme color
// mode defaults, and wires the global stylesheet plus Google Fonts/GSI script.
// See .claude/barbershop-frontend-sprints.md S1.1 for the full spec.
export default defineNuxtConfig({
  // Build/compat date pinned to keep Nitro/Nuxt feature flags deterministic.
  compatibilityDate: '2025-04-01',

  // Disabled until Sprint 5 adds the public landing page that benefits from SSR.
  // Axios 1.x imports form-data on the server which is not available in this project.
  ssr: false,

  // Port 3000 is occupied by Grafana in the local dev environment.
  devServer: { port: 3001 },

  // First-party modules required by Sprint 1 onward.
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/color-mode',
    '@vite-pwa/nuxt',
    '@nuxt/eslint',
  ],

  // Force dark theme: no class suffix, dark preference, dark fallback.
  // The plan requires the obsidian palette as the default look.
  colorMode: {
    classSuffix: '',
    preference: 'dark',
    fallback: 'dark',
  },

  // Public runtime config. With ssr:false the NUXT_PUBLIC_* env vars are not
  // applied per-request, so we default to empty and use $development below to
  // supply the local API URL. Production deploys override via env vars at build.
  runtimeConfig: {
    public: {
      apiBase: '',
      googleClientId: '',
    },
  },

  // Development-only overrides applied by Nuxt when NODE_ENV=development.
  // Frontend connects directly to the backend at localhost:8080. The backend
  // CORS policy whitelists localhost:3000/3001 with AllowCredentials so both
  // authenticated XHR (Axios) and SignalR WebSocket upgrades work without a
  // proxy. (The Vite WS proxy is too fragile for SignalR's reconnect cycle.)
  $development: {
    runtimeConfig: {
      public: {
        apiBase: 'http://localhost:8080',
      },
    },
  },

  // Global CSS that defines the design system (S1.2 will populate this).
  css: ['~/assets/css/global.css'],

  // Document head: charset, viewport, theme color, manifest link, the three
  // Google Fonts in the weights the design system uses, and the Google
  // Identity Services script loaded async/defer for the login page.
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: 'BarberShop',
      meta: [
        { name: 'description', content: 'Premium barbershop management and booking.' },
        { name: 'theme-color', content: '#0a0a0a' },
      ],
      link: [
        { rel: 'manifest', href: '/manifest.json' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href:
            'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap',
        },
      ],
      script: [
        // Google Identity Services SDK — async + defer so it does not block
        // first paint; the /login page initialises it on mount.
        { src: 'https://accounts.google.com/gsi/client', async: true, defer: true },
      ],
    },
    // Page-level fade transition (defined in global.css under @layer components).
    pageTransition: { name: 'page', mode: 'out-in' },
    // Layout-level fade transition used when switching between default/admin.
    layoutTransition: { name: 'layout', mode: 'out-in' },
  },

  // TypeScript strict mode is mandatory per the Sprint 1 DoD.
  typescript: {
    strict: true,
  },
})
