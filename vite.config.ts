import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages: https://<user>.github.io/reading-log/
export default defineConfig({
  base: '/reading-log/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: '読書記録',
        short_name: '読書記録',
        description: '読んだ本の記録・評価・書影を残すアプリ',
        theme_color: '#1f4d3a',
        background_color: '#e6efe8',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/reading-log/',
        scope: '/reading-log/',
        lang: 'ja',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
})
