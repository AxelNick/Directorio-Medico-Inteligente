import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['scripts/**/*.mjs', 'playwright.config.mjs'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['scripts/**/*.spec.mjs'],
    languageOptions: { globals: globals.browser },
  },
)
