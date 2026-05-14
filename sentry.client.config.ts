// Sentry client-side configuration.
// Loaded automatically by @sentry/nuxt/module on the browser bundle.
// SENTRY_DSN must be set at build time (or via publicRuntimeConfig) to enable.
import * as Sentry from '@sentry/nuxt'

Sentry.init({
  // Reads from the environment variable injected at build time.
  // An empty or missing DSN disables Sentry without throwing.
  dsn: import.meta.env.SENTRY_DSN as string | undefined,

  // Capture 100% of transactions in development; reduce in production as needed.
  tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.2,

  // Replay 10% of sessions; 100% on error sessions.
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration(),
  ],
})
