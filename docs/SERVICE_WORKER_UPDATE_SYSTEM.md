# Service Worker Update System

Comprehensive documentation for the service worker lifecycle management and update prompt system.

## Overview

The service worker update system provides a user-friendly way to handle Progressive Web App (PWA) updates. When a new version of the application is deployed, users are notified and given the option to update immediately or postpone the update.

## Architecture

### Components

1. **serviceWorkerHelpers.ts** - Utility functions for SW communication
2. **ServiceWorkerContext.tsx** - Global state management via React Context
3. **ServiceWorkerUpdate.tsx** - UI components for update prompts
4. **ServiceWorkerUpdate.css** - Styling and animations
5. **main.tsx** - Integration and registration

### File Structure

```
src/
├── utils/
│   └── serviceWorkerHelpers.ts       # Helper functions
├── contexts/
│   └── ServiceWorkerContext.tsx      # Context provider
├── components/
│   ├── ServiceWorkerUpdate.tsx       # UI components
│   └── ServiceWorkerUpdate.css       # Styles
└── main.tsx                          # App entry with SW registration
```

## Update Flow

### 1. Service Worker Registration (App Load)

```
App Loads
    ↓
ServiceWorkerProvider wraps app
    ↓
ServiceWorkerRegistrar component mounts
    ↓
Registers /service-worker.js (production only)
    ↓
Sets up event listeners for SW lifecycle
```

### 2. Update Detection

```
New SW version deployed
    ↓
Browser detects new service-worker.js
    ↓
'updatefound' event fires
    ↓
ServiceWorkerContext updates state:
  - installing: new ServiceWorker
  - lifecycleState: 'installing'
    ↓
New SW installs (downloads assets, caches)
    ↓
New SW state changes to 'installed'
    ↓
ServiceWorkerContext updates state:
  - waiting: installed ServiceWorker
  - updateAvailable: true
  - lifecycleState: 'waiting'
    ↓
ServiceWorkerUpdate component shows banner
```

### 3. User Update Actions

#### Option A: Update Now

```
User clicks "Update Now"
    ↓
ServiceWorkerUpdate calls update()
    ↓
ServiceWorkerContext.update() executes:
  - Sets isUpdating: true
  - Sets lifecycleState: 'activating'
  - Posts 'SKIP_WAITING' message to SW
    ↓
Service Worker receives message
    ↓
Service Worker calls self.skipWaiting()
    ↓
SW activates immediately (bypasses waiting)
    ↓
'controllerchange' event fires
    ↓
Page reloads automatically
    ↓
User sees updated app
```

#### Option B: Dismiss

```
User clicks "Dismiss"
    ↓
ServiceWorkerUpdate calls dismissUpdate()
    ↓
ServiceWorkerContext marks update as dismissed
    ↓
Banner hides
    ↓
SW remains in 'waiting' state
    ↓
Update will activate on next page load/refresh
```

### 4. Automatic Update Checks

The system automatically checks for updates in three scenarios:

1. **Periodic checks** - Every 15 minutes
2. **Visibility change** - When tab becomes visible
3. **Window focus** - When window gains focus

## skipWaiting Behavior

### What is skipWaiting?

`skipWaiting()` is a service worker API that tells a waiting service worker to activate immediately, instead of waiting for all tabs/windows using the old service worker to close.

### Default Behavior (Without skipWaiting)

```
1. User has app open in Tab A (SW v1)
2. New version deployed (SW v2)
3. SW v2 installs but waits
4. User keeps using app with SW v1
5. User closes Tab A
6. User reopens app
7. SW v2 activates
8. User sees new version
```

### With skipWaiting

```
1. User has app open in Tab A (SW v1)
2. New version deployed (SW v2)
3. SW v2 installs and waits
4. User clicks "Update Now"
5. SW v2 calls skipWaiting()
6. SW v2 activates immediately
7. Page reloads automatically
8. User sees new version
```

### skipWaiting Safety

**When it's safe:**
- Application can handle mid-session updates
- No complex state that could be lost
- Data is synced/persisted before reload
- Network requests are idempotent

**When to be careful:**
- User has unsaved form data
- Active network requests
- Media playback
- Complex state machines

**Our implementation:**
- Saves data via Zero sync before reload
- Graceful reload after activation
- Clear user consent (Update Now button)

## API Reference

### ServiceWorkerContext

```typescript
interface ServiceWorkerContextValue {
  // State
  registration: ServiceWorkerRegistration | null;
  installing: ServiceWorker | null;
  waiting: ServiceWorker | null;
  active: ServiceWorker | null;
  updateAvailable: boolean;
  lifecycleState: ServiceWorkerLifecycleState;
  isCheckingForUpdates: boolean;
  isUpdating: boolean;
  lastUpdateCheck: number | null;
  error: string | null;

  // Methods
  update: () => Promise<void>;              // skipWaiting + reload
  skipWaitingOnly: () => Promise<void>;     // skipWaiting without reload
  checkForUpdates: () => Promise<boolean>;  // Manual update check
  dismissUpdate: () => void;                // Hide update banner
  register: (url, options?) => Promise<void>;
  unregister: () => Promise<void>;
}
```

### useServiceWorker Hook

```typescript
import { useServiceWorker } from './contexts/ServiceWorkerContext';

function MyComponent() {
  const {
    updateAvailable,
    isUpdating,
    lifecycleState,
    update,
    dismissUpdate,
    checkForUpdates,
  } = useServiceWorker();

  return (
    <div>
      {updateAvailable && (
        <button onClick={update}>Update Now</button>
      )}
    </div>
  );
}
```

### ServiceWorkerUpdate Components

Three variants are provided:

#### 1. Default Banner (Full-width)

```tsx
<ServiceWorkerUpdate
  position="top"        // 'top' | 'bottom'
  autoHideDelay={3000}  // ms, 0 to disable
/>
```

#### 2. Compact Banner

```tsx
<ServiceWorkerUpdateCompact
  position="bottom"
/>
```

#### 3. Inline Prompt

```tsx
<ServiceWorkerUpdateInline />
```

### Helper Functions

```typescript
import {
  skipWaiting,
  waitForActivation,
  checkForUpdates,
  postMessageToServiceWorker,
  reloadAfterUpdate,
} from './utils/serviceWorkerHelpers';

// Skip waiting and wait for activation
await skipWaiting(registration);

// Wait for activation
await waitForActivation(registration);

// Check for updates
const hasUpdate = await checkForUpdates(registration);

// Send custom message to SW
await postMessageToServiceWorker(registration, {
  type: 'CACHE_URLS',
  payload: ['/api/data'],
});

// Reload page
reloadAfterUpdate();
```

## Best Practices

### 1. User Consent

**Do:**
- Always ask user before updating
- Provide clear "Update Now" and "Dismiss" options
- Explain what will happen (reload)

**Don't:**
- Auto-reload without permission
- Force updates during critical actions
- Hide update notifications

### 2. Update Timing

**Good times to update:**
- User clicks "Update Now"
- App is idle
- User explicitly refreshes
- New session starts

**Bad times to update:**
- During form filling
- During media playback
- During active network requests
- During checkout/payment

### 3. Progressive Enhancement

```typescript
// Check if SW is supported
if ('serviceWorker' in navigator) {
  // Register and use SW features
} else {
  // Fallback gracefully
}
```

### 4. Error Handling

```typescript
const { error, updateAvailable } = useServiceWorker();

if (error) {
  // Show user-friendly error
  console.error('SW Error:', error);
}
```

### 5. Update Notifications

**Recommended patterns:**

1. **Non-intrusive banner** - Top or bottom of page
2. **In-app notification** - Toast/snackbar
3. **Settings page indicator** - Badge or status
4. **Modal prompt** - For critical updates only

**Avoid:**
- Full-screen blocking modals
- Auto-reloading without warning
- Hiding update completely

### 6. Testing Updates

**Development:**
```typescript
// Force immediate activation for testing
if (import.meta.env.DEV) {
  // Skip waiting in dev mode
  self.skipWaiting();
}
```

**Production:**
```bash
# Build new version
npm run build

# Deploy to server
# Open app in browser
# Open DevTools > Application > Service Workers
# Check "Update on reload"
# Reload page to see update banner
```

### 7. Versioning

Add version info to your service worker:

```javascript
// service-worker.js
const VERSION = '1.2.3';
const CACHE_NAME = `grocery-app-v${VERSION}`;

self.addEventListener('message', (event) => {
  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: VERSION });
  }
});
```

## Troubleshooting

### Update not detected

**Check:**
1. Service worker file changed (`/service-worker.js`)
2. No aggressive browser caching (check Cache-Control headers)
3. HTTPS enabled (required for SW)
4. Scope is correct

**Fix:**
```bash
# Clear service worker in DevTools
# Application > Service Workers > Unregister

# Hard refresh
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

### Update banner not showing

**Check:**
1. `updateAvailable` state is true
2. Component is rendered
3. No CSS hiding banner
4. Update wasn't dismissed

**Debug:**
```typescript
const sw = useServiceWorker();
console.log('SW State:', sw);
```

### Page not reloading after update

**Check:**
1. `controllerchange` listener attached
2. `skipWaiting()` called in SW
3. No errors in console

**Fix:**
```typescript
// In ServiceWorkerContext
navigator.serviceWorker.addEventListener('controllerchange', () => {
  console.log('Controller changed, reloading...');
  window.location.reload();
});
```

### Multiple update prompts

**Issue:** Update banner shows multiple times

**Cause:** Multiple ServiceWorkerUpdate components rendered

**Fix:** Only render one ServiceWorkerUpdate per app:
```tsx
function App() {
  return (
    <>
      <ServiceWorkerUpdate /> {/* Only one instance */}
      {children}
    </>
  );
}
```

## Performance Considerations

1. **Bundle size** - ~5KB added (gzipped)
2. **Runtime overhead** - Minimal, event-driven
3. **Update check frequency** - 15 minutes (configurable)
4. **Network requests** - Only on update check (HEAD request)

## Security Considerations

1. **HTTPS required** - Service workers only work over HTTPS
2. **Same-origin policy** - SW must be same origin as app
3. **No sensitive data** - Don't cache sensitive information
4. **Message validation** - Validate messages from SW

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 11.3+)
- Opera: Full support
- IE: Not supported (no service workers)

## Migration Guide

### From No Service Worker

1. Add ServiceWorkerProvider to app root
2. Add ServiceWorkerUpdate component
3. Register service worker in main.tsx
4. Create/update service-worker.js

### From Manual SW Management

1. Replace custom SW logic with ServiceWorkerContext
2. Replace update prompts with ServiceWorkerUpdate
3. Update event listeners to use context
4. Test update flow

## Examples

### Custom Update Flow

```typescript
function CustomUpdatePrompt() {
  const { updateAvailable, update } = useServiceWorker();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (updateAvailable) {
      setShowModal(true);
    }
  }, [updateAvailable]);

  const handleUpdate = async () => {
    // Save current state
    await saveAppState();

    // Update and reload
    await update();
  };

  return (
    <Modal open={showModal}>
      <h2>Update Available</h2>
      <p>A new version is ready. Update now?</p>
      <button onClick={handleUpdate}>Update</button>
      <button onClick={() => setShowModal(false)}>Later</button>
    </Modal>
  );
}
```

### Update with Changelog

```typescript
function UpdateWithChangelog() {
  const { updateAvailable, update } = useServiceWorker();
  const [changelog, setChangelog] = useState<string[]>([]);

  useEffect(() => {
    if (updateAvailable) {
      fetch('/changelog.json')
        .then(r => r.json())
        .then(setChangelog);
    }
  }, [updateAvailable]);

  return updateAvailable ? (
    <div className="update-banner">
      <h3>New Version Available</h3>
      <ul>
        {changelog.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
      <button onClick={update}>Update Now</button>
    </div>
  ) : null;
}
```

### Scheduled Updates

```typescript
function ScheduledUpdate() {
  const { updateAvailable, update, dismissUpdate } = useServiceWorker();

  const scheduleUpdate = () => {
    // Update during off-peak hours (2 AM)
    const now = new Date();
    const updateTime = new Date();
    updateTime.setHours(2, 0, 0, 0);

    if (updateTime < now) {
      updateTime.setDate(updateTime.getDate() + 1);
    }

    const delay = updateTime.getTime() - now.getTime();

    setTimeout(() => {
      update();
    }, delay);

    dismissUpdate();
  };

  return updateAvailable ? (
    <div>
      <button onClick={update}>Update Now</button>
      <button onClick={scheduleUpdate}>Schedule for 2 AM</button>
    </div>
  ) : null;
}
```

## Conclusion

This service worker update system provides:
- User-friendly update prompts
- Safe skipWaiting handling
- Automatic update detection
- Flexible UI components
- Production-ready error handling

For questions or issues, refer to the troubleshooting section or check the browser console for detailed logs.
