import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Use custom service worker with injectManifest strategy
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',

      // Auto-update service worker when new version is available
      registerType: 'autoUpdate',

      includeAssets: ['vite.svg', 'robots.txt', 'icons/*.png', 'screenshots/*.png'],

      manifest: {
        name: 'Grocery List App',
        short_name: 'Grocery',
        description: 'A collaborative grocery list app with real-time sync, offline support, and smart organization features',
        theme_color: '#4caf50',
        background_color: '#f5f5f5',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-192x192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/icons/icon-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        categories: ['shopping', 'lifestyle', 'productivity'],
        shortcuts: [
          {
            name: 'Add Item',
            short_name: 'Add',
            description: 'Quickly add a new item to your grocery list',
            url: '/?action=add',
            icons: [
              {
                src: '/icons/shortcut-add.png',
                sizes: '96x96',
                type: 'image/png'
              }
            ]
          },
          {
            name: 'View List',
            short_name: 'List',
            description: 'View your grocery list',
            url: '/',
            icons: [
              {
                src: '/icons/shortcut-list.png',
                sizes: '96x96',
                type: 'image/png'
              }
            ]
          }
        ]
      },

      // Inject manifest configuration
      injectManifest: {
        // Glob patterns for precaching
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],

        // Maximum file size to precache (3MB)
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,

        // Manifest injection point in sw.ts
        injectionPoint: undefined,
      },

      // Workbox options for generateSW (fallback and additional options)
      workbox: {
        // Clean up outdated caches automatically
        cleanupOutdatedCaches: true,

        // Take control of all clients immediately
        clientsClaim: true,

        // Skip waiting and activate immediately
        skipWaiting: true,

        // Additional runtime caching rules
        runtimeCaching: [
          // Google Fonts - Stale While Revalidate
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 365 days
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
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },

          // Zero Sync API - Network First with short cache
          {
            urlPattern: /^https?:\/\/.*\/api\/zero.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'zero-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 10
            }
          },

          // Local API - Network First
          {
            urlPattern: /^https?:\/\/localhost:3001\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 10
            }
          },

          // Images - Cache First with long expiration
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 60 // 60 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },

          // Background Sync for mutations
          {
            urlPattern: /^https?:\/\/.*\/api\/.*(mutate|create|update|delete)/i,
            handler: 'NetworkOnly',
            method: 'POST',
            options: {
              backgroundSync: {
                name: 'offline-sync-queue',
                options: {
                  maxRetentionTime: 24 * 60 // 24 hours in minutes
                }
              }
            }
          }
        ],

        // Navigate fallback for SPA
        navigateFallback: '/index.html',

        // Don't use navigate fallback for these paths
        navigateFallbackDenylist: [
          /^\/api/, // API routes
          /^\/auth/, // Auth routes
          /^\/admin/ // Admin routes
        ]
      },

      // Development options
      devOptions: {
        enabled: true, // Enable PWA in development
        type: 'module',
        navigateFallback: 'index.html',
      }
    })
  ],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext', // Support top-level await for Zero
    sourcemap: true, // Enable source maps for debugging
  },
})
