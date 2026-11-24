/// <reference types="vitest/config" />
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  // Served from a subpath on GitHub Pages (https://<user>.github.io/<repo>/).
  // The deploy workflow sets VITE_BASENAME to the repo subpath; local dev keeps '/'.
  base: process.env.VITE_BASENAME || '/',
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
    alias: [
      // igniteui-dockmanager 2.2.1+ (pulled in by igniteui-react-dockmanager 19.9+)
      // moved its theme CSS from `styles/` to `src/themes/` but its package.json
      // exports map still points `./themes/*.css` at `./styles/*.css`, so the
      // documented import fails to resolve. Point it at the real file. Remove this
      // once a dockmanager release fixes the exports map.
      {
        find: /^igniteui-dockmanager\/themes\/(.+\.css)$/,
        replacement: fileURLToPath(
          new URL('./node_modules/igniteui-dockmanager/src/themes/$1', import.meta.url),
        ),
      },
    ],
  },
  server: {
    open: true,
    port: 3003
  }
})
