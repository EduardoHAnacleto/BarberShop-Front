// Vitest configuration for unit tests. Uses the @nuxt/test-utils nuxt
// environment so auto-imported composables (useCookie, navigateTo, etc.)
// are available without explicit imports in composable and middleware files.
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    globals: true,
    // The nuxt environment applies Nuxt's transforms and provides all
    // auto-imported composables as globals, matching the runtime behaviour.
    environment: 'nuxt',
    include: ['tests/unit/**/*.spec.ts', 'tests/integration/**/*.spec.ts'],
    // Reset mocks automatically between each test to prevent cross-test
    // pollution from module-level singletons (e.g. useToast's ref array).
    clearMocks: true,
    restoreMocks: true,
  },
})
