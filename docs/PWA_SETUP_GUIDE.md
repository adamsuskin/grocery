# PWA Setup Guide for Grocery List App

## Overview
This guide walks through the Progressive Web App (PWA) setup for the Grocery List App, including manifest configuration, service worker setup, and icon generation.

## What Has Been Configured

### 1. PWA Manifest (`/public/manifest.json`)

The manifest file has been created with comprehensive configuration:

- **App Identity**
  - Name: "Grocery List App"
  - Short Name: "Grocery"
  - Description: Full app description with key features

- **Display Configuration**
  - Display mode: `standalone` (app-like experience)
  - Orientation: `portrait-primary` (mobile-optimized)
  - Start URL: `/` (opens at root)
  - Scope: `/` (entire app)

- **Theming**
  - Theme color: `#4caf50` (green - matches app design)
  - Background color: `#f5f5f5` (light gray - matches app background)

- **Categories**
  - shopping
  - lifestyle
  - productivity

- **Icons**: 10 icon configurations (standard + maskable)
- **Shortcuts**: Quick actions for "Add Item" and "View List"
- **Screenshots**: Desktop and mobile preview images

### 2. HTML Integration (`/index.html`)

Updated with PWA meta tags:

```html
<!-- PWA Manifest -->
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#4caf50">

<!-- iOS Support -->
<link rel="apple-touch-icon" href="/icons/icon-192x192.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Grocery">

<!-- Microsoft Tile -->
<meta name="msapplication-TileColor" content="#4caf50">
<meta name="msapplication-TileImage" content="/icons/icon-144x144.png">
```

### 3. Documentation

- **PWA_ICON_REQUIREMENTS.md**: Comprehensive guide for icon creation and requirements
- **PWA_SETUP_GUIDE.md**: This file - setup instructions

## Next Steps

### Step 1: Generate App Icons

You need to create the app icons before the PWA can be installed. Choose one method:

#### Method A: Use PWA Asset Generator (Recommended)

```bash
# Install PWA Asset Generator
npm install -g pwa-asset-generator

# Create source icon (1024x1024 or larger)
# Then generate all required sizes:
pwa-asset-generator ./path/to/source-icon.png ./public/icons \
  --icon-only \
  --padding "10%" \
  --background "#f5f5f5"

# Generate maskable icons separately
pwa-asset-generator ./path/to/maskable-source.png ./public/icons \
  --icon-only \
  --padding "0%" \
  --background "#4caf50" \
  --maskable
```

#### Method B: Use Online Tool

1. Visit [RealFaviconGenerator](https://realfavicongenerator.net/)
2. Upload your source icon (at least 512x512)
3. Configure settings:
   - iOS: Enable and set to icon-192x192.png
   - Android: Enable with theme color #4caf50
   - Windows: Enable with tile color #4caf50
4. Download the package
5. Extract to `/public/icons/`

#### Method C: Manual Creation

See `/docs/PWA_ICON_REQUIREMENTS.md` for detailed instructions on:
- Required icon sizes
- Design guidelines
- Maskable icon specifications
- ImageMagick commands for batch generation

### Step 2: Add Service Worker (For Offline Support)

To enable offline functionality, you'll need a service worker. Here's a basic setup:

#### Option 1: Use Vite PWA Plugin (Recommended)

```bash
# Install Vite PWA plugin
npm install vite-plugin-pwa -D
```

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'screenshots/*.png'],
      manifest: false, // We already have manifest.json
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
})
```

Update `src/main.tsx` to register the service worker:

```typescript
// Add after your existing imports
import { registerSW } from 'virtual:pwa-register'

// Register service worker
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
})

// Your existing ReactDOM.render code...
```

#### Option 2: Custom Service Worker

Create `public/service-worker.js`:

```javascript
const CACHE_NAME = 'grocery-list-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          return response;
        });
      })
  );
});
```

Register in `index.html` (add before closing `</body>` tag):

```html
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
          console.log('SW registered:', registration);
        })
        .catch((error) => {
          console.log('SW registration failed:', error);
        });
    });
  }
</script>
```

### Step 3: Create Screenshots (Optional but Recommended)

Create screenshots to improve the install experience:

1. **Desktop Screenshot** (1280x720):
   - Open app in desktop browser
   - Screenshot the main list view
   - Save as `/public/screenshots/desktop.png`

2. **Mobile Screenshot** (750x1334):
   - Open app in mobile browser or dev tools mobile view
   - Screenshot the main interface
   - Save as `/public/screenshots/mobile.png`

### Step 4: Test Your PWA

#### Using Chrome DevTools

1. Open your app in Chrome
2. Press F12 to open DevTools
3. Go to **Application** tab
4. Click **Manifest** in left sidebar
5. Check for any errors
6. Verify all icons load correctly

#### Run Lighthouse Audit

```bash
# In Chrome DevTools
1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Select "Progressive Web App"
4. Click "Generate report"
5. Address any issues found
```

#### Test Installation

**Android (Chrome):**
1. Open app in Chrome
2. Tap the menu (three dots)
3. Select "Install app" or "Add to Home Screen"
4. Verify icon appears on home screen
5. Open app and verify standalone mode

**iOS (Safari):**
1. Open app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. Verify icon and app name
5. Open app from home screen

**Desktop (Chrome/Edge):**
1. Open app in browser
2. Look for install icon in address bar
3. Click to install
4. Verify app opens in standalone window

### Step 5: Deploy and Verify

After deploying to production:

1. **Verify HTTPS**: PWAs require HTTPS (localhost is exempt)
2. **Check manifest loads**: Visit `https://yourdomain.com/manifest.json`
3. **Test offline**:
   - Open app
   - Disconnect internet
   - Verify app still works (if service worker installed)
4. **Test on real devices**: Android and iOS devices

## Troubleshooting

### Icons Not Showing

- **Check file paths**: Ensure icons exist at `/public/icons/`
- **Check manifest URL**: Verify manifest.json is accessible
- **Clear cache**: Hard refresh (Ctrl+Shift+R) or clear browser cache
- **Check console**: Look for 404 errors in browser console

### Install Prompt Not Appearing

- **HTTPS required**: Must be served over HTTPS (except localhost)
- **Manifest valid**: Check for errors in DevTools > Application > Manifest
- **Icons required**: At least 192x192 and 512x512 icons must exist
- **Service worker**: Must have registered service worker
- **Engagement**: User may need to engage with site first

### Service Worker Issues

- **Check registration**: Console should show "SW registered"
- **Check status**: DevTools > Application > Service Workers
- **Update not working**: Unregister old SW and hard refresh
- **Cache issues**: Clear site data in DevTools

### Maskable Icons Not Working

- **Safe zone**: Ensure content is within center 80%
- **No transparency**: Maskable icons need solid backgrounds
- **Purpose attribute**: Must have `"purpose": "maskable"`
- **Test at**: Visit [maskable.app](https://maskable.app/) to preview

## Resources and Tools

### Documentation
- [MDN: Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [web.dev: PWA Checklist](https://web.dev/pwa-checklist/)
- [Google: Install criteria](https://web.dev/install-criteria/)

### Tools
- [PWA Builder](https://www.pwabuilder.com/) - PWA analysis and package generation
- [Maskable.app](https://maskable.app/) - Maskable icon editor and preview
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - PWA audit
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator) - Icon generation

### Design Tools
- [Figma](https://www.figma.com/)
- [Canva](https://www.canva.com/)
- [Inkscape](https://inkscape.org/)

## Configuration Summary

### Files Created
1. `/public/manifest.json` - PWA manifest configuration
2. `/docs/PWA_ICON_REQUIREMENTS.md` - Icon generation guide
3. `/docs/PWA_SETUP_GUIDE.md` - This setup guide

### Files Modified
1. `/index.html` - Added PWA meta tags and manifest link

### Files Needed (Next Steps)
1. `/public/icons/` - All required icon sizes
2. `/public/screenshots/` - Optional app screenshots
3. `/public/service-worker.js` or Vite PWA plugin - For offline support

### Key Settings
- **Theme Color**: `#4caf50` (green)
- **Background Color**: `#f5f5f5` (light gray)
- **Display Mode**: standalone
- **Orientation**: portrait-primary
- **Start URL**: `/`
- **Scope**: `/`

## Current Status

- [x] Manifest.json created with comprehensive configuration
- [x] HTML updated with PWA meta tags
- [x] Documentation created for icon requirements
- [x] Setup guide created
- [ ] Icons generated (see Step 1 above)
- [ ] Service worker implemented (see Step 2 above)
- [ ] Screenshots created (optional, see Step 3)
- [ ] PWA tested and verified (see Step 4)

## Quick Start Checklist

To complete your PWA setup:

1. [ ] Generate app icons using one of the methods in Step 1
2. [ ] Create `/public/icons/` directory structure
3. [ ] Add all required icon sizes (minimum: 192x192, 512x512)
4. [ ] Install and configure Vite PWA plugin (Step 2, Option 1)
5. [ ] Test manifest in Chrome DevTools
6. [ ] Run Lighthouse PWA audit
7. [ ] Test installation on mobile device
8. [ ] Create screenshots (optional but recommended)
9. [ ] Deploy to production with HTTPS
10. [ ] Verify installation works on production

## Support

For questions or issues:
1. Check browser console for errors
2. Review Chrome DevTools > Application > Manifest
3. Run Lighthouse audit for specific issues
4. Verify all file paths are correct
5. Ensure HTTPS is enabled (production only)

---

**Note**: The app will function without icons or service worker, but won't be installable as a PWA until icons are added. Service worker is required for offline functionality and some install prompts.
