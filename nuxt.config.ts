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
    '@sentry/nuxt/module',
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
      // Shop contact & location — defaults are Sky Tower Auckland placeholders.
      // Override at build time via NUXT_PUBLIC_SHOP_* env vars.
      shopAddress: '1 Sky City, Victoria St W, Auckland CBD 1010, New Zealand',
      shopPhone: '+64 9 000 0000',
      shopEmail: 'info@barbershop.com',
      shopLat: '-36.8682',
      shopLng: '174.7620',
      // Optional Google Maps Embed API key (NUXT_PUBLIC_GOOGLE_MAPS_API_KEY).
      // Without it, a no-key embed URL is used (suitable for development).
      googleMapsApiKey: '',
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

  // ── Sentry (S8.4) ──────────────────────────────────────────────────────────
  // Build-time Sentry module options. Runtime config (DSN, integrations) lives
  // in sentry.client.config.ts which is auto-loaded by @sentry/nuxt/module.
  sentry: {
    // Source map upload is disabled until a Sentry org/project is configured.
    // Set SENTRY_AUTH_TOKEN + sourceMapsUploadOptions to enable.
  },

  // ── PWA (S6.1) ─────────────────────────────────────────────────────────────
  // Registers a service worker with auto-update strategy and workbox runtime
  // caching rules aligned with the sprint spec.
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'BarberShop',
      short_name: 'BarberShop',
      description: 'Premium barbershop management & booking',
      start_url: '/',
      display: 'standalone',
      background_color: '#0a0a0a',
      theme_color: '#0a0a0a',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      // Strategy for Google Fonts: cache-first, 1-year TTL.
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts',
            expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 },
          },
        },
        // Strategy for static images: cache-first, 50 entries max.
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images',
            expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
          },
        },
        // Services and workers lists: stale-while-revalidate, 5-minute TTL.
        {
          urlPattern: /\/api\/(services|workers)\/all/i,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'api-static',
            expiration: { maxAgeSeconds: 60 * 5 },
          },
        },
        // Business schedule: always prefer fresh data from network.
        {
          urlPattern: /\/api\/working-hours\/.*/i,
          handler: 'NetworkFirst',
          options: { cacheName: 'api-schedule' },
        },
      ],
    },
    // Expose useRegisterSW() composable for the UiUpdatePrompt component.
    client: { installPrompt: true },
    devOptions: {
      // Disabled in dev: workbox files are not generated until `nuxt build`,
      // so enabling here causes ENOENT errors on the dev server.
      enabled: false,
    },
  },
})
