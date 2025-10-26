# Vite PWA Configuration Guide

## Overview

This project uses `vite-plugin-pwa` to provide Progressive Web App (PWA) capabilities, including offline support, service worker management, and installability. This guide explains the configuration, customization options, testing procedures, and debugging techniques.

## Installation

The following dependencies have been added to the project:

```json
{
  "devDependencies": {
    "vite-plugin-pwa": "^0.20.5",
    "workbox-window": "^7.3.0"
  }
}
```

To install these dependencies:

```bash
pnpm install
```

## Configuration Overview

The PWA configuration is located in `/home/adam/grocery/vite.config.ts`. Here's a breakdown of each section:

### 1. Register Type

```typescript
registerType: 'prompt'
```

**Purpose**: Controls how the service worker update is handled.

**Options**:
- `'prompt'`: Shows a prompt to the user when a new service worker is available. The user can choose when to update.
- `'autoUpdate'`: Automatically updates the service worker when a new version is available.
- `'skipWaiting'`: Skips the waiting phase and activates the new service worker immediately.

**Why 'prompt'?**: Gives users control over when to reload the app, preventing disruption during active use.

### 2. Include Assets

```typescript
includeAssets: ['vite.svg', 'robots.txt']
```

**Purpose**: Specifies static assets from the root directory to be included in the service worker precache.

**Customization**:
```typescript
includeAssets: [
  'favicon.ico',
  'robots.txt',
  'icons/*.png',
  'apple-touch-icon.png',
  '*.svg'
]
```

### 3. Web App Manifest

```typescript
manifest: {
  name: 'Grocery List',
  short_name: 'Grocery',
  description: 'A collaborative grocery list app with offline support',
  theme_color: '#ffffff',
  background_color: '#ffffff',
  display: 'standalone',
  icons: [...]
}
```

**Purpose**: Defines how the app appears when installed on a device.

**Key Properties**:
- `name`: Full application name (displayed during install)
- `short_name`: Abbreviated name (displayed on home screen)
- `description`: App description for app stores and install prompts
- `theme_color`: Browser UI color when app is open
- `background_color`: Splash screen background color
- `display`: How the app should be displayed
  - `'standalone'`: Looks like a native app (no browser UI)
  - `'fullscreen'`: Full screen mode
  - `'minimal-ui'`: Minimal browser UI
  - `'browser'`: Standard browser tab

**Adding Custom Icons**:
```typescript
icons: [
  {
    src: '/icons/icon-72x72.png',
    sizes: '72x72',
    type: 'image/png'
  },
  {
    src: '/icons/icon-96x96.png',
    sizes: '96x96',
    type: 'image/png'
  },
  {
    src: '/icons/icon-128x128.png',
    sizes: '128x128',
    type: 'image/png'
  },
  {
    src: '/icons/icon-144x144.png',
    sizes: '144x144',
    type: 'image/png'
  },
  {
    src: '/icons/icon-152x152.png',
    sizes: '152x152',
    type: 'image/png'
  },
  {
    src: '/icons/icon-192x192.png',
    sizes: '192x192',
    type: 'image/png',
    purpose: 'any maskable'
  },
  {
    src: '/icons/icon-384x384.png',
    sizes: '384x384',
    type: 'image/png'
  },
  {
    src: '/icons/icon-512x512.png',
    sizes: '512x512',
    type: 'image/png',
    purpose: 'any maskable'
  }
]
```

### 4. Workbox Configuration

#### Globe Patterns

```typescript
globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}']
```

**Purpose**: Defines which build assets should be precached by the service worker.

**Customization**:
```typescript
globPatterns: [
  '**/*.{js,css,html}',        // Core app files
  '**/*.{png,jpg,jpeg,svg}',   // Images
  '**/*.{woff,woff2,ttf}',     // Fonts
  '**/*.{json,xml}'            // Data files
]
```

#### Runtime Caching Strategies

The configuration includes four runtime caching rules:

##### 1. Google Fonts CSS (CacheFirst)

```typescript
{
  urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
  handler: 'CacheFirst',
  options: {
    cacheName: 'google-fonts-cache',
    expiration: {
      maxEntries: 10,
      maxAgeSeconds: 60 * 60 * 24 * 365 // 365 days
    }
  }
}
```

**Strategy**: `CacheFirst` - Checks cache first, falls back to network if not found.
**Use Case**: Font CSS files that rarely change.

##### 2. Google Fonts Files (CacheFirst)

```typescript
{
  urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
  handler: 'CacheFirst',
  options: {
    cacheName: 'gstatic-fonts-cache',
    expiration: {
      maxEntries: 10,
      maxAgeSeconds: 60 * 60 * 24 * 365 // 365 days
    }
  }
}
```

**Strategy**: `CacheFirst` - Font files are immutable and can be cached long-term.

##### 3. API Requests (NetworkFirst)

```typescript
{
  urlPattern: /^https?:\/\/localhost:3001\/api\/.*/i,
  handler: 'NetworkFirst',
  options: {
    cacheName: 'api-cache',
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 60 * 5 // 5 minutes
    },
    networkTimeoutSeconds: 10
  }
}
```

**Strategy**: `NetworkFirst` - Tries network first, falls back to cache if network fails.
**Use Case**: API requests where fresh data is preferred but offline support is needed.
**Note**: Update the URL pattern to match your production API endpoint.

##### 4. Images (CacheFirst)

```typescript
{
  urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
  handler: 'CacheFirst',
  options: {
    cacheName: 'images-cache',
    expiration: {
      maxEntries: 60,
      maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
    }
  }
}
```

**Strategy**: `CacheFirst` - Images are cached aggressively for performance.

#### Available Cache Strategies

Workbox provides several caching strategies:

1. **CacheFirst**: Cache, falling back to network
   - Best for: Static assets, fonts, images
   - Pros: Fastest, works offline
   - Cons: May serve stale content

2. **NetworkFirst**: Network, falling back to cache
   - Best for: API requests, dynamic content
   - Pros: Fresh content when online, offline fallback
   - Cons: Slower when network is slow

3. **StaleWhileRevalidate**: Serve from cache while updating in background
   - Best for: Semi-dynamic content
   - Pros: Fast, eventually consistent
   - Cons: May briefly serve stale content

4. **NetworkOnly**: Always use network
   - Best for: Real-time data, auth endpoints
   - Pros: Always fresh
   - Cons: No offline support

5. **CacheOnly**: Always use cache
   - Best for: Precached assets
   - Pros: Very fast, works offline
   - Cons: No updates without service worker update

#### Navigation Fallback

```typescript
navigateFallback: '/index.html',
navigateFallbackDenylist: [/^\/api/]
```

**Purpose**: Enables SPA routing to work offline by serving `index.html` for navigation requests.
**Denylist**: Prevents API routes from being handled by the navigation fallback.

#### Cleanup Outdated Caches

```typescript
cleanupOutdatedCaches: true
```

**Purpose**: Automatically removes old caches when the service worker updates.

### 5. Development Options

```typescript
devOptions: {
  enabled: true,
  type: 'module',
  navigateFallback: 'index.html'
}
```

**Purpose**: Enables PWA features during development for testing.

**Options**:
- `enabled`: Set to `true` to enable service worker in dev mode
- `type`: Module type for the service worker
- `navigateFallback`: Fallback route for dev mode navigation

## Customizing Cache Strategies

### Example: Adding a Custom Cache Strategy for External APIs

```typescript
{
  urlPattern: /^https:\/\/api\.example\.com\/.*/i,
  handler: 'NetworkFirst',
  options: {
    cacheName: 'external-api-cache',
    expiration: {
      maxEntries: 100,
      maxAgeSeconds: 60 * 60 // 1 hour
    },
    cacheableResponse: {
      statuses: [0, 200, 404] // Cache successful and 404 responses
    },
    networkTimeoutSeconds: 5
  }
}
```

### Example: Adding StaleWhileRevalidate for User Avatars

```typescript
{
  urlPattern: /^https:\/\/cdn\.example\.com\/avatars\/.*/i,
  handler: 'StaleWhileRevalidate',
  options: {
    cacheName: 'avatars-cache',
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
    },
    cacheableResponse: {
      statuses: [0, 200]
    }
  }
}
```

## Testing PWA in Development

### 1. Start Development Server

```bash
pnpm dev
```

The service worker is enabled in development mode thanks to `devOptions.enabled: true`.

### 2. Check Service Worker Registration

Open the browser's DevTools:

**Chrome/Edge**:
1. Open DevTools (F12)
2. Go to Application tab > Service Workers
3. You should see the service worker registered and running

**Firefox**:
1. Open DevTools (F12)
2. Go to Application tab > Service Workers (or about:debugging#/runtime/this-firefox)
3. Check service worker status

### 3. Test Offline Mode

1. Open DevTools
2. Go to Application tab > Service Workers
3. Check "Offline" checkbox
4. Refresh the page
5. The app should still work (serving cached assets)

### 4. Test Cache Strategies

1. Open DevTools > Network tab
2. Reload the page
3. Check the "Size" column:
   - `(ServiceWorker)` = Served from cache
   - Actual size = Fetched from network

### 5. Test Update Prompt

1. Make a change to the app code
2. Build the app: `pnpm build`
3. Serve the production build: `pnpm preview`
4. Open the app in a browser
5. Make another change and rebuild
6. Reload the page
7. You should see an update prompt (if implemented in the UI)

## Implementing Update Prompt in React

To show a prompt when a new service worker is available, add this to your React app:

### 1. Create a PWA Update Component

```typescript
// src/components/PWAUpdatePrompt.tsx
import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function PWAUpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      console.log('SW Registered:', registration);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <>
      {(offlineReady || needRefresh) && (
        <div className="pwa-toast" role="alert">
          <div className="message">
            {offlineReady ? (
              <span>App ready to work offline</span>
            ) : (
              <span>New content available, click reload button to update.</span>
            )}
          </div>
          <div className="buttons">
            {needRefresh && (
              <button onClick={() => updateServiceWorker(true)}>
                Reload
              </button>
            )}
            <button onClick={close}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
```

### 2. Add Styles for the Prompt

```css
/* src/styles/pwa.css */
.pwa-toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  background: #323232;
  color: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  max-width: 400px;
}

.pwa-toast .message {
  margin-bottom: 12px;
}

.pwa-toast .buttons {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.pwa-toast button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.pwa-toast button:first-child {
  background: #4CAF50;
  color: white;
}

.pwa-toast button:last-child {
  background: transparent;
  color: white;
  border: 1px solid white;
}
```

### 3. Add to Your App

```typescript
// src/main.tsx or src/App.tsx
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt';
import './styles/pwa.css';

function App() {
  return (
    <>
      {/* Your app components */}
      <PWAUpdatePrompt />
    </>
  );
}
```

## Debugging Service Worker Issues

### Common Issues and Solutions

#### 1. Service Worker Not Registering

**Symptoms**: No service worker in DevTools

**Solutions**:
- Check that you're using HTTPS or localhost
- Verify `devOptions.enabled: true` in vite.config.ts
- Check browser console for errors
- Clear browser cache and hard reload

#### 2. Service Worker Not Updating

**Symptoms**: Old version persists after code changes

**Solutions**:
```bash
# In DevTools > Application > Service Workers
# Click "Unregister" next to the service worker
# Then click "Update" or hard reload (Ctrl+Shift+R)
```

Or programmatically:
```typescript
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});
```

#### 3. Caching Issues

**Symptoms**: Seeing old content despite updates

**Solutions**:
- Increase the version in your manifest
- Clear all caches in DevTools > Application > Storage > Clear site data
- Check `cleanupOutdatedCaches: true` is set

#### 4. API Requests Not Being Cached

**Symptoms**: API calls fail when offline

**Solutions**:
- Verify the `urlPattern` matches your API endpoints
- Check Network tab to see if requests are going through service worker
- Add logging to service worker:

```typescript
// In vite.config.ts workbox configuration
workbox: {
  // ... other options
  runtimeCaching: [
    {
      urlPattern: /^https?:\/\/localhost:3001\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        plugins: [
          {
            cacheWillUpdate: async ({ response }) => {
              console.log('Caching API response:', response);
              return response;
            },
          },
        ],
      },
    },
  ],
}
```

### Debugging Tools

#### 1. Chrome DevTools

**Application Tab**:
- Service Workers: View registration, status, and lifecycle
- Cache Storage: Inspect cached files
- Manifest: Validate web app manifest

**Network Tab**:
- Filter by "ServiceWorker" to see cached responses
- Check "Disable cache" to bypass service worker

#### 2. Lighthouse Audit

```bash
# Run Lighthouse PWA audit
# In Chrome DevTools > Lighthouse tab
# Select "Progressive Web App" category
# Click "Generate report"
```

#### 3. Service Worker Logs

Add logging to track service worker behavior:

```typescript
// In vite.config.ts
VitePWA({
  workbox: {
    // Enable debug mode
    mode: 'development',
  }
})
```

## Build Process Changes

### Development Build

```bash
pnpm dev
```

**Changes**:
- Service worker is generated and registered in dev mode
- Hot module replacement (HMR) still works
- Service worker updates on file changes

### Production Build

```bash
pnpm build
```

**Generated Files**:
- `dist/sw.js`: The generated service worker
- `dist/workbox-*.js`: Workbox runtime libraries
- `dist/manifest.webmanifest`: Web app manifest

**Build Output**:
```
dist/
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
├── sw.js
├── workbox-[hash].js
├── manifest.webmanifest
└── index.html
```

### Preview Production Build

```bash
pnpm preview
```

This serves the production build locally for testing.

## Production Considerations

### 1. Update API URL Patterns

Before deploying to production, update the API URL pattern:

```typescript
runtimeCaching: [
  {
    urlPattern: /^https:\/\/your-production-domain\.com\/api\/.*/i,
    // or use environment variables:
    urlPattern: new RegExp(`^${process.env.VITE_API_URL}/api/.*`),
    handler: 'NetworkFirst',
    // ...
  }
]
```

### 2. Add Production Icons

Create and add proper PWA icons in various sizes:
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

Tools for generating icons:
- [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

### 3. Configure robots.txt

Create `/public/robots.txt`:
```
User-agent: *
Allow: /
Sitemap: https://your-domain.com/sitemap.xml
```

### 4. Test on Real Devices

- Install the PWA on mobile devices (iOS, Android)
- Test offline functionality
- Test install prompts
- Verify icons and splash screens

### 5. Monitor Service Worker Updates

Implement analytics to track:
- Service worker installation success rate
- Update prompt interactions
- Offline usage patterns

## Additional Resources

- [vite-plugin-pwa Documentation](https://vite-pwa-org.netlify.app/)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## Troubleshooting Checklist

- [ ] Service worker registered in DevTools?
- [ ] Using HTTPS or localhost?
- [ ] `devOptions.enabled: true` for development?
- [ ] Correct URL patterns for API caching?
- [ ] Icons properly sized and formatted?
- [ ] Manifest has all required fields?
- [ ] Clear cache when debugging?
- [ ] Check browser console for errors?
- [ ] Test in incognito mode?
- [ ] Try different browsers?

## Summary

The PWA configuration provides:
- Automatic service worker generation
- Intelligent caching strategies for different resource types
- Offline support for the entire app
- Update prompts for new versions
- Development mode testing
- Production-ready PWA features

With this setup, your Grocery List app can be installed on devices and works reliably offline, providing a native-like experience for users.
