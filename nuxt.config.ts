// Nuxt configuration for the BarberShop frontend.
// Locks the runtime to TypeScript strict mode, registers every module the
// sprints rely on, exposes typed runtime config, declares the dark-theme color
// mode defaults, and wires the global stylesheet plus Google Fonts/GSI script.
// See .claude/barbershop-frontend-sprints.md S1.1 for the full spec.
export default defineNuxtConfig({
  // Build/compat date pinned to keep Nitro/Nuxt feature flags deterministic.
  compatibilityDate: '2025-04-01',

  // SSR enabled globally (sprint070726 §4.8) for the public marketing/booking
  // surface — faster first paint, real content for crawlers. The
  // authenticated, personalized areas (admin/worker/client portals) opt back
  // out below: no SEO value, heaviest Pinia/SignalR usage, and the least
  // benefit from paying SSR's extra complexity. routeRules only supports
  // disabling SSR under a true global default, not the reverse, so this is
  // the "opt out the few" shape rather than "opt in the few".
  ssr: true,
  // The i18n module registers a locale-prefixed variant of every route, and
  // Nitro route rules don't see through that prefix — without the prefixed
  // twins below, /pt-BR/admin etc. would silently SSR the very portals these
  // rules exclude. Both locale prefixes are listed because DEFAULT_LOCALE is
  // a per-instance build arg: whichever locale is NOT the default gets the
  // prefix (prefix_except_default).
  routeRules: {
    '/admin/**': { ssr: false },
    '/worker/**': { ssr: false },
    '/my/**': { ssr: false },
    '/pt-BR/admin/**': { ssr: false },
    '/pt-BR/worker/**': { ssr: false },
    '/pt-BR/my/**': { ssr: false },
    '/en/admin/**': { ssr: false },
    '/en/worker/**': { ssr: false },
    '/en/my/**': { ssr: false },
  },

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
    '@nuxtjs/i18n',
  ],

  // ── i18n (sprint070726 §4.6) ─────────────────────────────────────────────
  // English (default, unprefixed) + Portuguese (Brazil). Scoped to the
  // public-facing surface a bilingual customer actually sees — the
  // authenticated admin/worker/client portals are internal tooling with no
  // customer-facing audience (same boundary already used for the SSR
  // routeRules above) and stay English-only for now.
  // defaultLocale is a build-time decision (route generation depends on it),
  // so a per-client instance sets the DEFAULT_LOCALE build arg — the frontend
  // image is built per deployment (compose `build:`), unlike the shared API
  // image. The portfolio demo keeps 'en'.
  i18n: {
    strategy: 'prefix_except_default',
    defaultLocale: (process.env.DEFAULT_LOCALE as 'en' | 'pt-BR') || 'en',
    locales: [
      { code: 'en', language: 'en', name: 'English', file: 'en.json' },
      { code: 'pt-BR', language: 'pt-BR', name: 'Português (Brasil)', file: 'pt-BR.json' },
    ],
  },

  // Dark/light toggle (sprint070726 §4.5). No class suffix so the module
  // writes a bare `dark`/`light` class matching tailwind.config.ts's
  // `darkMode: 'class'`. Defaults to dark (the site's original look) on
  // first visit; `UiThemeToggle` lets the user switch, persisted via the
  // module's own cookie.
  colorMode: {
    classSuffix: '',
    preference: 'dark',
    fallback: 'dark',
  },

  // Private (server-only) runtime config. Not exposed to the client bundle.
  // Server-side axios calls (SSR data fetching) can't resolve a relative
  // apiBase the way a browser resolves it against the page origin — Node has
  // no implicit base URL — so SSR uses this internal Docker service DNS name
  // instead. Irrelevant for the SPA-only routes excluded via routeRules above.
  runtimeConfig: {
    apiBaseInternal: 'http://api:8080',

    // Public runtime config, resolved from NUXT_PUBLIC_* env vars once at
    // Nitro startup (same resolved value used for both SSR and the client
    // hydration payload, so there's no server/client mismatch). Defaults to
    // empty/relative — proxied through nginx in production — and
    // $development below supplies the local API URL for `nuxt dev`.
    public: {
      apiBase: '',
      googleClientId: '',
      // Fully-qualified site origin the i18n module needs to emit hreflang/
      // canonical alternate links from useLocaleHead() — without it every SSR
      // render logs "I18n baseUrl is required..." and skips those SEO tags.
      // Lives in runtimeConfig (not the i18n module block) so a deployment
      // can override it after build via NUXT_PUBLIC_I18N_BASE_URL.
      i18n: {
        baseUrl: 'http://localhost',
      },
      // Shop identity, contact & location — defaults are the portfolio demo
      // values. Each rented client instance overrides these at runtime via
      // NUXT_PUBLIC_SHOP_* env vars (white-label, sprint12072026license §4).
      shopName: 'BarberShop',
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
      // The Docker-internal DNS name doesn't resolve under `nuxt dev` — point
      // server-side SSR fetches at the same local API the browser uses.
      apiBaseInternal: 'http://localhost:8080',
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
      // Build-time default only — app.vue overrides the title at runtime from
      // NUXT_PUBLIC_SHOP_NAME (white-label, sprint12072026license §4).
      title: process.env.NUXT_PUBLIC_SHOP_NAME || 'BarberShop',
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

  // Strip the /dev design-system sandbox from production builds so it can never
  // be reached in a deployed environment (Sprint070726 §4.7).
  hooks: {
    'pages:extend'(pages) {
      if (!import.meta.dev) {
        const devIndex = pages.findIndex((p) => p.path === '/dev')
        if (devIndex !== -1) pages.splice(devIndex, 1)
      }
    },
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
    // Manifest identity is baked at build time — per-client instances pass
    // NUXT_PUBLIC_SHOP_NAME as a compose build arg (the frontend image is
    // built per deployment); the demo keeps the defaults.
    manifest: {
      name: process.env.NUXT_PUBLIC_SHOP_NAME || 'BarberShop',
      short_name: process.env.NUXT_PUBLIC_SHOP_NAME || 'BarberShop',
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
