/// <reference types="vitest/config" />
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 10 * 1024 * 1024, // 10 MB
    // The shipped Ignite UI grid theme CSS contains a malformed custom-property
    // token (`var(--ig-gray 50-0.8-contrast)`) that the lightningcss minifier
    // rejects. Disable CSS minification so the vendor stylesheets pass through.
    cssMinify: false,
  },
  plugins: [react()],
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }]
    }
  },
  resolve: {
    mainFields: ['module'],
  },
  server: {
    open: true,
    port: 3003
  }
})
