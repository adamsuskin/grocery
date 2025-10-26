# PWA Debugging Guide

## Overview

This guide provides comprehensive debugging techniques, tools, and solutions for troubleshooting Progressive Web App (PWA) features including service workers, caching, background sync, and push notifications.

---

## Table of Contents

1. [Chrome DevTools](#chrome-devtools)
2. [Firefox Developer Tools](#firefox-developer-tools)
3. [Safari Web Inspector](#safari-web-inspector)
4. [Service Worker Debugging](#service-worker-debugging)
5. [Cache Debugging](#cache-debugging)
6. [Background Sync Debugging](#background-sync-debugging)
7. [Push Notification Debugging](#push-notification-debugging)
8. [Network Debugging](#network-debugging)
9. [Common Error Messages](#common-error-messages)
10. [Debugging Checklist](#debugging-checklist)

---

## Chrome DevTools

Chrome DevTools provides the most comprehensive PWA debugging tools.

### Accessing DevTools

- **Windows/Linux:** F12 or Ctrl+Shift+I
- **macOS:** Cmd+Option+I
- **Right-click:** Right-click > Inspect

### Application Tab

The Application tab is your primary tool for PWA debugging.

#### Service Workers Panel

**Location:** Application > Service Workers

**Features:**
- View registration status
- See active, waiting, and installing service workers
- Update service worker manually
- Unregister service worker
- Bypass for network (disable SW)
- Force update on reload
- View service worker source

**Key Actions:**
```
Update: Force check for new service worker
Unregister: Remove service worker registration
Skip waiting: Activate waiting service worker
Stop: Stop service worker (for debugging)
Start: Restart service worker
```

**What to Check:**
- Status: Should show "activated and is running" with green dot
- Source: Verify correct SW file loaded
- Scope: Should match your app's scope (usually `/`)
- Updated: Timestamp of last update check

#### Cache Storage Panel

**Location:** Application > Cache Storage

**Features:**
- View all caches
- Inspect cached entries
- View cached response headers and body
- Delete individual entries
- Delete entire caches

**Inspecting Cache:**
1. Expand Cache Storage in left panel
2. Click on cache name (e.g., `grocery-cache-v1`)
3. See list of cached URLs
4. Click entry to see details (headers, preview, response)
5. Right-click to delete entry

**What to Check:**
- Are expected assets cached?
- Are cache names versioned correctly?
- Are old caches being cleaned up?
- Is cache size reasonable?

#### Storage Panel

**Location:** Application > Storage

**Features:**
- View and clear all storage (including SW)
- See storage quota usage
- Clear site data

**Clear Storage Options:**
- Unregister service workers
- Clear storage (localStorage, IndexedDB, etc.)
- Clear cache storage
- Clear site data

**When to Use:**
- Testing fresh user experience
- Debugging cache issues
- Clearing stuck states

### Console Tab

**Key Console Commands:**

```javascript
// Check if service worker supported
'serviceWorker' in navigator

// Get service worker registration
navigator.serviceWorker.getRegistration()
  .then(reg => console.log(reg))

// Check current controller
console.log(navigator.serviceWorker.controller)

// Listen for service worker updates
navigator.serviceWorker.addEventListener('controllerchange', () => {
  console.log('Service worker controller changed')
})

// Check online status
console.log('Online:', navigator.onLine)

// View caches
caches.keys().then(keys => console.log('Caches:', keys))

// Check specific cache
caches.open('grocery-cache-v1').then(cache =>
  cache.keys().then(keys => console.log('Cached URLs:', keys))
)

// Check if Background Sync supported
navigator.serviceWorker.ready.then(reg =>
  console.log('Background Sync:', 'sync' in reg)
)

// Check notification permission
console.log('Notification permission:', Notification.permission)

// Get push subscription
navigator.serviceWorker.ready.then(reg =>
  reg.pushManager.getSubscription().then(sub => console.log('Subscription:', sub))
)
```

### Network Tab

**Key Features:**
- View all network requests
- Filter by type (XHR, JS, CSS, etc.)
- Throttle network speed
- Go offline
- Disable cache
- See request/response details

**Important Columns:**
- **Name:** URL of request
- **Status:** HTTP status code
- **Type:** Resource type
- **Initiator:** What triggered the request
- **Size:** Transfer size (shows "from ServiceWorker" if served by SW)
- **Time:** Request duration

**Debugging Tips:**
1. Look for "from ServiceWorker" in Size column to verify SW is intercepting
2. Use Offline checkbox to test offline functionality
3. Use throttling to test on slow connections
4. Check if requests failing (red) and inspect error

### Sources Tab

**Debugging Service Worker Code:**

1. Go to Sources > Service Workers
2. Select your service worker file
3. Set breakpoints
4. Trigger events (fetch, sync, push)
5. Step through code

**Breakpoint Types:**
- Line breakpoints
- Conditional breakpoints
- Event listener breakpoints

**Debugging Tips:**
- Use `debugger;` statement in SW code
- Use console.log extensively in SW
- Remember: SW runs in different context than page

---

## Firefox Developer Tools

### Accessing Developer Tools

- **Windows/Linux:** F12 or Ctrl+Shift+I
- **macOS:** Cmd+Option+I

### Storage Inspector

**Location:** Developer Tools > Storage

**Service Workers:**
- Storage > Service Workers
- View registration details
- Debug and unregister

**Cache Storage:**
- Storage > Cache Storage
- Inspect cached resources
- Delete caches

**IndexedDB:**
- Storage > IndexedDB
- Inspect sync queue data

### Network Monitor

Similar to Chrome's Network tab.

**Key Features:**
- Request details
- Throttling
- Disable cache

### about:debugging

**Access:** Type `about:debugging` in address bar

**Features:**
- More detailed SW debugging
- Inspect service workers
- Start/stop workers
- View worker details

**Debugging Service Workers:**
1. Go to about:debugging#/runtime/this-firefox
2. Find your app under "Service Workers"
3. Click "Inspect" to open debugger
4. Can view console output, debug code

---

## Safari Web Inspector

### Accessing Web Inspector

- **macOS:** Cmd+Option+I
- **Enable:** Safari > Preferences > Advanced > Show Develop menu

### Develop Menu

**Useful Options:**
- Disable Caches
- Disable Service Workers
- Empty Caches

### Storage Tab

**Location:** Web Inspector > Storage

**Features:**
- Service Workers view
- Cache Storage
- IndexedDB

**Limitations:**
- Less detailed than Chrome
- Some PWA features not fully debuggable
- Service worker debugging more limited

### Console

Use console commands (same as Chrome) to inspect PWA state.

### iOS Safari Remote Debugging

**Setup:**
1. On iPhone: Settings > Safari > Advanced > Web Inspector (ON)
2. Connect iPhone to Mac via cable
3. On Mac: Safari > Develop > [Your iPhone] > [Website]

**Features:**
- Full Web Inspector for iOS Safari
- Debug service workers on iOS
- Inspect storage
- View console logs

---

## Service Worker Debugging

### Common Service Worker Issues

#### Issue 1: Service Worker Not Registering

**Symptoms:**
- Console error during registration
- No SW in Application panel
- Fetch events not intercepting

**Debug Steps:**

1. **Check HTTPS:**
   ```javascript
   console.log('Protocol:', window.location.protocol)
   // Should be 'https:' (or 'http:' for localhost)
   ```

2. **Check Browser Support:**
   ```javascript
   if ('serviceWorker' in navigator) {
     console.log('Service Workers supported')
   } else {
     console.log('Service Workers NOT supported')
   }
   ```

3. **Check Registration Code:**
   ```javascript
   navigator.serviceWorker.register('/sw.js')
     .then(reg => console.log('SW registered:', reg))
     .catch(err => console.error('SW registration failed:', err))
   ```

4. **Check SW File:**
   - Verify `/sw.js` is accessible (direct URL in browser)
   - Check for syntax errors
   - Look in Network tab for 404 errors

5. **Check Console for Errors:**
   - SyntaxError: Error in SW code
   - SecurityError: HTTPS or CORS issue
   - NotFoundError: SW file not found

**Solutions:**
- Ensure HTTPS (or localhost)
- Fix syntax errors in SW file
- Verify SW file path is correct
- Check server MIME type for SW file (should be `application/javascript`)

---

#### Issue 2: Service Worker Stuck in "Waiting"

**Symptoms:**
- SW shows as "waiting to activate"
- New version won't activate
- User doesn't see updates

**Debug Steps:**

1. **Check for Open Tabs:**
   - SW waits if old version still controls other tabs
   - Close all tabs for the site

2. **Manual Skip Waiting:**
   - In DevTools > Application > Service Workers
   - Click "skipWaiting" link

3. **Check Skip Waiting Code:**
   ```javascript
   // In service worker
   self.addEventListener('message', (event) => {
     if (event.data && event.data.type === 'SKIP_WAITING') {
       self.skipWaiting()
     }
   })
   ```

4. **Check Client Claim:**
   ```javascript
   // In service worker activate event
   self.addEventListener('activate', (event) => {
     event.waitUntil(
       clients.claim()
     )
   })
   ```

**Solutions:**
- Implement skip waiting flow with user prompt
- Close all tabs and reopen
- Use "Update on reload" checkbox in DevTools for development

---

#### Issue 3: Service Worker Not Updating

**Symptoms:**
- Changes to SW not taking effect
- Old SW version still running
- Cache not updating

**Debug Steps:**

1. **Force Update:**
   ```javascript
   navigator.serviceWorker.ready.then(reg => reg.update())
   ```

2. **Check Update Frequency:**
   - Browser checks for SW updates every 24 hours
   - Also checks on navigation

3. **Check Cache Headers:**
   - SW file should not be cached by HTTP cache
   - Check Cache-Control headers on SW file

4. **Verify Version Changed:**
   ```javascript
   // In service worker
   const CACHE_VERSION = 'v2' // Increment this
   ```

5. **Check Byte-Diff:**
   - Browser compares SW files byte-by-byte
   - Even comment changes trigger update

**Solutions:**
- Increment cache version in SW
- Set Cache-Control: no-cache for SW file
- Use "Update on reload" during development
- Call `registration.update()` on app focus

---

### Service Worker Logging

**Add Detailed Logging:**

```javascript
// Service Worker

const VERSION = 'v1.2.3'

console.log(`[SW ${VERSION}] Service Worker loading...`)

self.addEventListener('install', (event) => {
  console.log(`[SW ${VERSION}] Install event`)
  // ...
})

self.addEventListener('activate', (event) => {
  console.log(`[SW ${VERSION}] Activate event`)
  // ...
})

self.addEventListener('fetch', (event) => {
  console.log(`[SW ${VERSION}] Fetch:`, event.request.url)
  // ...
})

self.addEventListener('sync', (event) => {
  console.log(`[SW ${VERSION}] Sync event:`, event.tag)
  // ...
})

self.addEventListener('push', (event) => {
  console.log(`[SW ${VERSION}] Push event:`, event.data.text())
  // ...
})
```

**View Service Worker Logs:**

1. Chrome: DevTools > Console > Filter by service worker context
2. Firefox: about:debugging > Inspect > Console
3. Safari: Web Inspector > Console (limited)

---

## Cache Debugging

### Inspecting Cache Contents

**Chrome DevTools:**
1. Application > Cache Storage
2. Expand cache name
3. Click on cached URL
4. View Headers, Preview, Response tabs

**Console Commands:**

```javascript
// List all caches
caches.keys().then(keys => console.log('Caches:', keys))

// Open specific cache and list entries
caches.open('grocery-cache-v1').then(cache => {
  cache.keys().then(requests => {
    console.log('Cached URLs:')
    requests.forEach(request => console.log('-', request.url))
  })
})

// Get specific cached response
caches.match('/api/lists').then(response => {
  if (response) {
    response.text().then(text => console.log('Cached response:', text))
  } else {
    console.log('Not in cache')
  }
})

// Delete cache
caches.delete('old-cache-v1').then(success =>
  console.log('Cache deleted:', success)
)

// Clear all caches
caches.keys().then(keys =>
  Promise.all(keys.map(key => caches.delete(key)))
).then(() => console.log('All caches cleared'))
```

### Common Cache Issues

#### Issue 1: Assets Not Caching

**Debug Steps:**

1. **Check Install Event:**
   ```javascript
   self.addEventListener('install', (event) => {
     event.waitUntil(
       caches.open(CACHE_NAME).then(cache => {
         console.log('Caching assets...')
         return cache.addAll([
           '/',
           '/index.html',
           '/app.js',
           '/app.css'
         ]).catch(err => console.error('Cache addAll failed:', err))
       })
     )
   })
   ```

2. **Check for 404s:**
   - If any asset in `cache.addAll()` returns 404, entire operation fails
   - Check Network tab for failed requests

3. **Check Opaque Responses:**
   - CORS requests cached as opaque
   - Use `mode: 'cors'` in fetch

**Solutions:**
- Verify all asset paths are correct
- Handle cache failures gracefully
- Use `cache.add()` individually with error handling

---

#### Issue 2: Old Content Served

**Debug Steps:**

1. **Check Cache Version:**
   ```javascript
   const CACHE_VERSION = 'v1' // Increment this
   ```

2. **Check Activate Event:**
   ```javascript
   self.addEventListener('activate', (event) => {
     event.waitUntil(
       caches.keys().then(cacheNames => {
         console.log('Existing caches:', cacheNames)
         return Promise.all(
           cacheNames
             .filter(name => name !== CACHE_NAME)
             .map(name => {
               console.log('Deleting old cache:', name)
               return caches.delete(name)
             })
         )
       })
     )
   })
   ```

3. **Force Update:**
   - Clear cache storage manually
   - Update SW version
   - Wait for SW to activate

**Solutions:**
- Implement proper cache versioning
- Delete old caches in activate event
- Use network-first for HTML files

---

#### Issue 3: QuotaExceededError

**Symptoms:**
- Error when trying to cache
- Cache operations fail

**Debug Steps:**

1. **Check Storage Quota:**
   ```javascript
   if (navigator.storage && navigator.storage.estimate) {
     navigator.storage.estimate().then(estimate => {
       console.log('Storage used:', estimate.usage)
       console.log('Storage quota:', estimate.quota)
       console.log('Percentage used:', (estimate.usage / estimate.quota * 100).toFixed(2) + '%')
     })
   }
   ```

2. **Calculate Cache Size:**
   ```javascript
   caches.open('grocery-cache-v1').then(cache => {
     cache.keys().then(requests => {
       let totalSize = 0
       Promise.all(
         requests.map(request =>
           cache.match(request).then(response =>
             response.clone().blob().then(blob => {
               totalSize += blob.size
             })
           )
         )
       ).then(() => {
         console.log('Cache size:', (totalSize / 1024 / 1024).toFixed(2) + ' MB')
       })
     })
   })
   ```

**Solutions:**
- Implement cache size limits
- Delete least-recently-used entries
- Request persistent storage
- Cache only essential assets

---

## Background Sync Debugging

### Checking Background Sync Support

```javascript
navigator.serviceWorker.ready.then(reg => {
  if ('sync' in reg) {
    console.log('Background Sync supported')
  } else {
    console.log('Background Sync NOT supported - using fallback')
  }
})
```

### Viewing Registered Sync Tags

**Chrome DevTools:**
1. Application > Service Workers
2. Look for "Sync" section
3. View registered tags

**Console:**
```javascript
navigator.serviceWorker.ready.then(reg => {
  if ('sync' in reg) {
    reg.sync.getTags().then(tags => {
      console.log('Registered sync tags:', tags)
    })
  }
})
```

### Triggering Sync Manually

**Chrome DevTools:**
1. Application > Service Workers
2. Find registered sync tag
3. Click "Sync" button to trigger immediately

**Console:**
```javascript
// Register a sync
navigator.serviceWorker.ready.then(reg => {
  reg.sync.register('test-sync').then(() => {
    console.log('Sync registered')
  })
})
```

### Debugging Sync Events

**Service Worker:**
```javascript
self.addEventListener('sync', (event) => {
  console.log('Sync event fired:', event.tag)

  if (event.tag.startsWith('sync-')) {
    event.waitUntil(
      processSyncQueue()
        .then(() => console.log('Sync completed successfully'))
        .catch(err => {
          console.error('Sync failed:', err)
          throw err // This will cause sync to retry
        })
    )
  }
})
```

### Common Background Sync Issues

#### Issue 1: Sync Not Firing

**Debug Steps:**

1. **Check Registration:**
   - Verify sync tag registered
   - Check console for registration errors

2. **Check Network:**
   - Sync only fires when online
   - Try going offline then online

3. **Check Browser Support:**
   - Only Chrome/Edge support Background Sync
   - Check fallback mechanism

4. **Check Service Worker State:**
   - SW must be active

**Solutions:**
- Ensure proper error handling in sync event
- Implement fallback for unsupported browsers
- Verify network state changes trigger sync

---

#### Issue 2: Sync Failing Repeatedly

**Debug Steps:**

1. **Check Sync Event Handler:**
   ```javascript
   self.addEventListener('sync', (event) => {
     console.log('Sync starting:', event.tag)

     event.waitUntil(
       processSync(event.tag)
         .then(() => console.log('Sync success'))
         .catch(err => {
           console.error('Sync error:', err)
           // Throwing error triggers retry
           throw err
         })
     )
   })
   ```

2. **Check API Errors:**
   - Network tab: Look for failed requests
   - Console: Check for error messages

3. **Check Retry Logic:**
   - Browser automatically retries with exponential backoff
   - After max retries, sync is abandoned

**Solutions:**
- Fix server errors causing sync to fail
- Implement proper error handling
- Check retry count and remove stuck operations

---

## Push Notification Debugging

### Checking Notification Permission

```javascript
console.log('Permission:', Notification.permission)
// 'default', 'granted', or 'denied'
```

### Checking Push Subscription

```javascript
navigator.serviceWorker.ready.then(reg => {
  reg.pushManager.getSubscription().then(subscription => {
    if (subscription) {
      console.log('Subscribed:', subscription)
      console.log('Endpoint:', subscription.endpoint)

      // Get keys for server
      const key = subscription.getKey('p256dh')
      const auth = subscription.getKey('auth')
      console.log('Keys:', { key, auth })
    } else {
      console.log('Not subscribed')
    }
  })
})
```

### Testing Push Notifications Locally

**Using Chrome DevTools:**

1. Get your subscription object (code above)
2. Use online tool like https://web-push-codelab.glitch.me/
3. Or use command-line tool: `web-push`

**Using web-push Library:**

```bash
npm install -g web-push

# Generate VAPID keys
web-push generate-vapid-keys

# Send test notification
web-push send-notification \
  --endpoint="YOUR_SUBSCRIPTION_ENDPOINT" \
  --key="YOUR_P256DH_KEY" \
  --auth="YOUR_AUTH_SECRET" \
  --vapid-subject="mailto:your-email@example.com" \
  --vapid-pubkey="YOUR_VAPID_PUBLIC_KEY" \
  --vapid-pvtkey="YOUR_VAPID_PRIVATE_KEY" \
  --payload="Test notification"
```

### Debugging Push Events

**Service Worker:**
```javascript
self.addEventListener('push', (event) => {
  console.log('Push event received')

  let data = { title: 'Default', body: 'Default message' }

  if (event.data) {
    try {
      data = event.data.json()
      console.log('Push data:', data)
    } catch (err) {
      console.error('Failed to parse push data:', err)
    }
  }

  const options = {
    body: data.body,
    icon: '/icon.png',
    badge: '/badge.png',
    data: data
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
      .then(() => console.log('Notification shown'))
      .catch(err => console.error('Failed to show notification:', err))
  )
})

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification.tag)
  console.log('Action:', event.action)

  event.notification.close()

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
      .then(client => console.log('Opened client:', client))
  )
})
```

### Common Push Notification Issues

#### Issue 1: Permission Denied

**Solutions:**
- User must manually grant permission again in browser settings
- Provide clear UI showing how to enable
- Don't spam permission requests

#### Issue 2: Notifications Not Appearing

**Debug Steps:**

1. **Check Permission:**
   - Must be 'granted'

2. **Check Subscription:**
   - Must have valid subscription

3. **Check OS Settings:**
   - Notifications must be enabled at OS level

4. **Check Do Not Disturb:**
   - May suppress notifications

5. **Check Push Event:**
   - Log in SW to see if event fires

**Solutions:**
- Verify all the above
- Test with simple notification
- Check browser console for errors

---

## Network Debugging

### Simulating Offline

**Chrome DevTools:**
1. Network tab > Throttling dropdown
2. Select "Offline"
3. Or custom throttle profile

**Programmatically:**
```javascript
// Check online status
console.log('Online:', navigator.onLine)

// Listen for changes
window.addEventListener('online', () => {
  console.log('Back online')
})

window.addEventListener('offline', () => {
  console.log('Gone offline')
})
```

### Verifying Service Worker Intercepts

**Look in Network Tab:**
- Size column shows "from ServiceWorker" for intercepted requests
- Or size shows actual size for network requests

**Console:**
```javascript
// In service worker
self.addEventListener('fetch', (event) => {
  console.log('Intercepting:', event.request.url)
  // Your fetch handler
})
```

---

## Common Error Messages

### SecurityError: Failed to register a ServiceWorker

**Cause:** Not using HTTPS (except localhost)

**Solution:** Use HTTPS or test on localhost

---

### TypeError: Failed to fetch

**Cause:**
- Network error
- CORS issue
- Resource doesn't exist

**Solution:**
- Check network connectivity
- Verify CORS headers
- Check resource URL

---

### DOMException: QuotaExceededError

**Cause:** Storage quota exceeded

**Solution:**
- Implement cache size limits
- Delete old data
- Request persistent storage

---

### NotAllowedError: Registration failed - permission denied

**Cause:** User denied notification permission

**Solution:**
- User must re-enable in browser settings
- Provide instructions

---

### InvalidStateError: Already registered

**Cause:** Trying to register SW that's already registered

**Solution:**
- Check if registered before registering
- Use `getRegistration()` first

---

### NetworkError when attempting to fetch resource

**Cause:** Fetch failed in service worker

**Solution:**
- Provide fallback
- Handle errors in SW fetch handler

---

## Debugging Checklist

When debugging PWA issues, go through this checklist:

### General

- [ ] Using HTTPS (or localhost)
- [ ] Browser supports required features
- [ ] Console shows no errors
- [ ] Service worker registered and active
- [ ] Network requests intercepted by SW

### Service Worker

- [ ] SW file accessible (no 404)
- [ ] SW scope correct
- [ ] SW version up to date
- [ ] Install event completes
- [ ] Activate event completes
- [ ] Fetch events intercepting correctly

### Caching

- [ ] Assets cached during install
- [ ] Cache version updated
- [ ] Old caches deleted
- [ ] Cache strategy appropriate for resource
- [ ] Cache size within limits

### Background Sync

- [ ] Background Sync API supported (or fallback active)
- [ ] Sync tags registered
- [ ] Sync event handler present
- [ ] Operations queued properly
- [ ] Sync fires when online

### Push Notifications

- [ ] Permission granted
- [ ] Subscription created
- [ ] Subscription saved to server
- [ ] Push event handler present
- [ ] Notification shown correctly
- [ ] Click handler works

### Installation

- [ ] Manifest valid
- [ ] Icons present
- [ ] Install criteria met
- [ ] beforeinstallprompt captured
- [ ] Install prompt shown
- [ ] App installs correctly

---

## Useful Resources

### Online Tools

- **Lighthouse:** PWA audit tool (in Chrome DevTools)
- **PWA Builder:** https://www.pwabuilder.com/
- **Web Push Testing:** https://web-push-codelab.glitch.me/
- **Manifest Validator:** https://manifest-validator.appspot.com/

### Browser DevTools Documentation

- **Chrome:** https://developer.chrome.com/docs/devtools/
- **Firefox:** https://firefox-source-docs.mozilla.org/devtools-user/
- **Safari:** https://developer.apple.com/safari/tools/

### PWA Documentation

- **MDN PWA Guide:** https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
- **web.dev PWA:** https://web.dev/progressive-web-apps/
- **Service Worker Cookbook:** https://serviceworke.rs/

---

## Related Documentation

- [PWA Test Plan](./PWA_TEST_PLAN.md) - Comprehensive test scenarios
- [PWA Manual Testing](./PWA_MANUAL_TESTING.md) - Step-by-step testing procedures
- [Offline Architecture](./OFFLINE_ARCHITECTURE.md) - Technical implementation

---

**Document Version:** 1.0
**Last Updated:** 2025-10-26
**Maintained By:** Development Team
