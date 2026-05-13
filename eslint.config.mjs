// ESLint flat config. Wraps the auto-generated config produced by the
// @nuxt/eslint module and layers the project-specific rules from the sprint
// plan (S1.1) on top.
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    // Component names are short and single-word by design (e.g. Modal, Toast).
    'vue/multi-word-component-names': 'off',

    // The plan forbids explicit `any` anywhere in the codebase. ESLint blocks
    // the merge if this rule is violated.
    '@typescript-eslint/no-explicit-any': 'error',
  },
})
