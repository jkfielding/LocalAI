import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      mode: (process.env.PWA_SW_MODE as 'development' | 'production' | undefined) ?? 'development',
      registerType: 'autoUpdate',
      minify: false,
      devOptions: {
        enabled: false
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\/api\/.*\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5
              }
            }
          }
        ]
      },
      includeAssets: ['favicon-32x32.png', 'favicon-16x16.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'LocalAI Chat',
        short_name: 'LocalAI',
        description: 'A modern Progressive Web App for chatting with local AI services and language models',
        theme_color: '#2c7373',
        background_color: '#1a1a1a',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        categories: ['productivity', 'utilities', 'lifestyle'],
        icons: [
          {
            src: 'localai-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'localai-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'localai-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        shortcuts: [
          {
            name: 'New Chat',
            short_name: 'New Chat',
            description: 'Start a new conversation',
            url: '/?action=new',
            icons: [{ src: 'localai-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Chat History',
            short_name: 'History',
            description: 'View chat history',
            url: '/?action=history',
            icons: [{ src: 'localai-192x192.png', sizes: '192x192' }]
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist'
  }
})
