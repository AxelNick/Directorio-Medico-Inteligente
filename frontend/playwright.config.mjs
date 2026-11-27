import { defineConfig } from '@playwright/test'
import process from 'node:process'

export default defineConfig({
  testDir: './scripts',
  testMatch: 'api-real.spec.mjs',
  timeout: 90_000,
  workers: 1,
  reporter: 'list',
  outputDir: process.env.DMI_UI_OUTPUT || '../docs-local/integrante1-ui',
  use: {
    baseURL: process.env.DMI_SPA_URL || 'http://127.0.0.1:15173',
    channel: process.env.DMI_BROWSER_CHANNEL || undefined,
    viewport: { width: 1280, height: 900 },
  },
})
