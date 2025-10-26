# Service Worker Quick Start Guide

## Installation

```bash
pnpm install
```

## Register Service Worker (Add to src/main.tsx)

```typescript
import { register } from './utils/serviceWorkerRegistration';

// Basic registration
register('/sw.js');

// With callbacks
register('/sw.js', {
  onSuccess: () => console.log('SW registered'),
  onUpdate: () => console.log('Update available'),
  autoUpdate: true
});
```

## Build and Test

```bash
# Build for production
pnpm build

# Preview with service worker
pnpm preview

# Open http://localhost:4173
```

## Test Offline

1. Open Chrome DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers** (left sidebar)
4. Verify service worker is registered
5. Go to **Network** tab
6. Check **Offline** checkbox
7. Test app functionality

## Cache Strategies

| Resource | Strategy | Cache Time | Purpose |
|----------|----------|------------|---------|
| HTML/CSS/JS | Cache-First | 30 days | Fast loading |
| Images | Cache-First | 60 days | Reduce bandwidth |
| Google Fonts | Stale-While-Revalidate | 1 year | Font caching |
| Zero API | Network-First | 5 min | Real-time data |
| Mutations | Network-Only + Background Sync | 24 hrs | Offline mutations |

## Common Commands

```typescript
import {
  register,      // Register service worker
  update,        // Check for updates
  skipWaiting,   // Activate new version
  isActive,      // Check if SW is active
  getVersion,    // Get cache version
  clearCaches,   // Clear all caches
  triggerSync    // Trigger background sync
} from './utils/serviceWorkerRegistration';
```

## React Hooks

```typescript
// Use service worker status
import { useServiceWorker } from './utils/serviceWorker.example';

function App() {
  const { isReady, updateAvailable, handleUpdate } = useServiceWorker();

  return (
    <div>
      {updateAvailable && <button onClick={handleUpdate}>Update</button>}
    </div>
  );
}

// Use online status
import { useOnlineStatus } from './utils/serviceWorker.example';

function App() {
  const isOnline = useOnlineStatus();

  return <div>{isOnline ? 'Online' : 'Offline'}</div>;
}
```

## Debugging

### View Service Worker Status
1. DevTools > Application > Service Workers
2. Check status: "activated and is running"

### View Caches
1. DevTools > Application > Cache Storage
2. Expand to see cached files

### View Background Sync Queue
1. DevTools > Application > Background Sync
2. See pending sync events

### Unregister Service Worker
```typescript
import { unregister } from './utils/serviceWorkerRegistration';
await unregister();
```

Or in DevTools:
1. Application > Service Workers
2. Click "Unregister"

## Files

| File | Purpose |
|------|---------|
| `src/sw.ts` | Custom service worker |
| `src/utils/serviceWorkerRegistration.ts` | Registration utilities |
| `src/utils/serviceWorker.example.tsx` | React examples |
| `vite.config.ts` | PWA configuration |
| `package.json` | Dependencies |

## Dependencies Added

```json
"devDependencies": {
  "vite-plugin-pwa": "^0.20.5",
  "workbox-background-sync": "^7.3.0",
  "workbox-cacheable-response": "^7.3.0",
  "workbox-core": "^7.3.0",
  "workbox-expiration": "^7.3.0",
  "workbox-precaching": "^7.3.0",
  "workbox-routing": "^7.3.0",
  "workbox-strategies": "^7.3.0",
  "workbox-window": "^7.3.0"
}
```

## Troubleshooting

### SW not registering?
- Check console for errors
- Verify HTTPS (or localhost)
- Check file path: `/sw.js`

### Caches not updating?
- Increment version in `src/sw.ts`
- Hard reload: Ctrl+Shift+R
- Unregister and re-register

### Offline mode not working?
- Check DevTools > Application > Service Workers
- Verify "activated and running"
- Check Network tab for requests

## Quick Tips

✅ **Development**: SW enabled by default
✅ **Auto-updates**: New versions activate automatically
✅ **Offline Queue**: Integrates with existing system
✅ **TypeScript**: Full type safety
✅ **Production Ready**: No additional config needed

## Resources

- **Full Documentation**: `SERVICE_WORKER_README.md`
- **Implementation Summary**: `SERVICE_WORKER_SUMMARY.md`
- **Code Examples**: `src/utils/serviceWorker.example.tsx`
- **Workbox Docs**: https://developers.google.com/web/tools/workbox
- **Vite PWA Docs**: https://vite-pwa-org.netlify.app/

## Next Steps

1. ✅ Install dependencies: `pnpm install`
2. ✅ Register SW in `src/main.tsx`
3. ✅ Build: `pnpm build`
4. ✅ Preview: `pnpm preview`
5. ✅ Test offline mode
6. Optional: Add UI components from examples
7. Optional: Configure push notifications
8. Deploy to production

---

**Questions?** Check `SERVICE_WORKER_README.md` for comprehensive documentation.
