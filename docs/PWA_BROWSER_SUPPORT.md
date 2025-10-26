# PWA Browser Support & Compatibility

Complete guide to browser compatibility and feature support for the Grocery List PWA.

---

## Quick Reference

### Recommended Browsers

| Platform | 1st Choice | 2nd Choice | Avoid |
|----------|-----------|-----------|-------|
| **Android** | Chrome 72+ | Edge 79+, Samsung Internet 12+ | Firefox |
| **iOS** | Safari 11.3+ | N/A (no alternatives) | Chrome*, Firefox* |
| **Windows** | Chrome 73+, Edge 79+ | Opera 57+ | Firefox, IE |
| **macOS** | Chrome 73+, Edge 79+ | Safari 13+ | Firefox |
| **Linux** | Chrome 73+, Edge 79+ | Opera 57+ | Firefox |

\* Chrome and Firefox on iOS use Safari's engine with no PWA support

---

## Full Compatibility Matrix

### Core PWA Features

| Feature | Chrome | Edge | Safari iOS | Safari macOS | Firefox | Samsung | Opera |
|---------|--------|------|-----------|--------------|---------|---------|-------|
| **PWA Installation** | ✅ 73+ | ✅ 79+ | ⚠️ 11.3+* | ⚠️ 13+** | ❌ | ✅ 12+ | ✅ 57+ |
| **Service Workers** | ✅ 40+ | ✅ 17+ | ✅ 11.1+ | ✅ 11.1+ | ✅ 44+ | ✅ 4+ | ✅ 27+ |
| **Offline Mode** | ✅ 40+ | ✅ 17+ | ✅ 11.1+ | ✅ 11.1+ | ✅ 44+ | ✅ 4+ | ✅ 27+ |
| **Background Sync** | ✅ 49+ | ✅ 79+ | ❌ | ❌ | ❌ | ✅ 12+ | ✅ 39+ |
| **Push Notifications** | ✅ 42+ | ✅ 79+ | ❌ | ⚠️ 16+*** | ⚠️ 44+**** | ✅ 12+ | ✅ 39+ |
| **Add to Home Screen** | ✅ 31+ | ✅ 79+ | ✅ 11.3+ | ⚠️ 13+ | ❌ | ✅ 4+ | ✅ 32+ |
| **Web App Manifest** | ✅ 39+ | ✅ 79+ | ⚠️ 11.3+ | ⚠️ 13+ | ❌ | ✅ 5+ | ✅ 32+ |
| **Cache API** | ✅ 40+ | ✅ 17+ | ✅ 11.1+ | ✅ 11.1+ | ✅ 39+ | ✅ 4+ | ✅ 27+ |
| **IndexedDB** | ✅ 24+ | ✅ 12+ | ✅ 10+ | ✅ 10+ | ✅ 16+ | ✅ 4+ | ✅ 15+ |
| **Full Screen Mode** | ✅ 38+ | ✅ 79+ | ⚠️ 12+***** | ❌ | ❌ | ✅ 5+ | ✅ 25+ |

**Legend:**
- ✅ Fully supported
- ⚠️ Partially supported (see notes)
- ❌ Not supported

**Notes:**
- \* Safari iOS: Add via Share menu only, no install prompt
- \*\* Safari macOS: Limited support, experimental
- \*\*\* Safari macOS: Push notifications added in Safari 16+
- \*\*\*\* Firefox: Desktop only, requires user permission
- \*\*\*\*\* Safari iOS: Partial full-screen, status bar remains

---

## Platform-Specific Details

### Android

#### Chrome 72+
**Support Level:** ✅ Full Support

**Features:**
- ✅ PWA installation with banner
- ✅ Service workers
- ✅ Background sync
- ✅ Push notifications
- ✅ Offline mode
- ✅ Full-screen mode
- ✅ Web App Manifest
- ✅ Add to Home Screen
- ✅ App icon in launcher
- ✅ Appears in app switcher
- ✅ WebAPK (native-like integration)

**Installation:**
- Automatic install banner
- Menu → "Add to Home screen"
- Menu → "Install app"

**Best For:** Primary browser for Android users

---

#### Edge 79+ (Chromium)
**Support Level:** ✅ Full Support

**Features:**
Same as Chrome (built on Chromium)

**Installation:**
- Automatic install banner
- Menu → "Add to Home screen"

**Best For:** Microsoft ecosystem users

---

#### Samsung Internet 12+
**Support Level:** ✅ Full Support

**Features:**
- ✅ PWA installation
- ✅ Service workers
- ✅ Background sync
- ✅ Push notifications
- ✅ Offline mode
- ✅ Full-screen mode

**Installation:**
- Menu → "Add to Home screen"
- Menu → "Install web app"

**Best For:** Samsung device users

---

#### Firefox (Any Version)
**Support Level:** ⚠️ Browser Only (No PWA Install)

**Features:**
- ✅ Service workers (partial)
- ❌ PWA installation
- ❌ Background sync
- ❌ Push notifications (mobile)
- ✅ Offline mode (in browser)
- ❌ Full-screen mode
- ❌ Add to Home Screen (as PWA)

**Limitations:**
- Cannot install as standalone app
- Works in browser tab only
- No background sync
- No mobile push notifications

**Recommendation:** Use Chrome or Edge instead

---

### iOS

#### Safari 11.3+
**Support Level:** ⚠️ Partial Support

**Features:**
- ✅ Add to Home Screen (manual only)
- ✅ Service workers
- ✅ Offline mode
- ❌ Background sync
- ❌ Push notifications
- ⚠️ Full-screen mode (status bar remains)
- ⚠️ Web App Manifest (partial support)
- ❌ Automatic install prompt

**Installation:**
- Share → "Add to Home Screen" (manual)
- No automatic prompt
- No install banner

**Limitations:**

**Background Sync:**
- App must be open to sync
- No sync when app is closed
- Changes queue until next open

**Push Notifications:**
- Not supported (Apple restriction)
- No notifications when closed
- In-app notifications only

**Full-Screen:**
- Status bar always visible
- Not truly full-screen
- No landscape mode control

**Updates:**
- Must manually refresh
- No automatic update check
- No update prompt

**Why Limited?**
Apple intentionally restricts PWA features on iOS to encourage native App Store apps. These are platform limitations, not app bugs.

**Workarounds:**
- Keep app open while syncing
- Check app regularly for changes
- Use list sharing for real-time updates
- Enable email notifications (if available)

**Best For:** Only option for iOS (Chrome/Firefox use Safari engine)

---

#### Chrome on iOS
**Support Level:** ❌ No PWA Support

**Why?**
- Apple requires all iOS browsers to use Safari engine (WebKit)
- Chrome on iOS is Safari with Chrome UI
- No PWA features beyond Safari's support
- Cannot install as app

**Recommendation:** Use Safari instead for PWA features

---

#### Firefox on iOS
**Support Level:** ❌ No PWA Support

**Why?**
- Same reason as Chrome (forced to use Safari engine)
- No PWA installation
- No additional features

**Recommendation:** Use Safari instead

---

### Desktop - Windows

#### Chrome 73+
**Support Level:** ✅ Full Support

**Features:**
- ✅ PWA installation (automatic prompt)
- ✅ Service workers
- ✅ Background sync
- ✅ Push notifications
- ✅ Offline mode
- ✅ Standalone window
- ✅ Start Menu entry
- ✅ Taskbar integration
- ✅ Desktop shortcuts
- ✅ System tray notifications

**Installation:**
- Install icon in address bar
- Menu → "Apps" → "Install Grocery List"
- Automatic install prompt

**Installed App:**
- Separate window (no browser UI)
- Pinned to taskbar
- In Start Menu
- Own icon in Alt+Tab
- Uninstall from Apps & Features

**Best For:** Windows users (primary recommendation)

---

#### Edge 79+ (Chromium)
**Support Level:** ✅ Full Support

**Features:**
Same as Chrome (Chromium-based)

**Additional Integration:**
- Deep Windows 10/11 integration
- Collections support
- Microsoft account sync
- Better battery life (claimed)

**Installation:**
- Install icon in address bar
- Menu → "Apps" → "Install this site as an app"

**Best For:** Windows users, Microsoft ecosystem

---

#### Firefox (Any Version)
**Support Level:** ⚠️ Browser Only (No PWA Install)

**Features:**
- ✅ Service workers
- ❌ PWA installation
- ❌ Background sync
- ⚠️ Push notifications (requires permission)
- ✅ Offline mode (in browser)
- ❌ Standalone window

**Limitations:**
- Cannot install as app
- Works in browser tab only
- No background sync
- Limited push notifications

**Recommendation:** Use Chrome or Edge instead

---

#### Opera 57+
**Support Level:** ✅ Full Support

**Features:**
Same as Chrome (Chromium-based)

**Installation:**
- Similar to Chrome
- Menu → "Install Grocery List"

**Best For:** Opera users

---

### Desktop - macOS

#### Chrome 73+
**Support Level:** ✅ Full Support

**Features:**
- ✅ PWA installation
- ✅ Service workers
- ✅ Background sync
- ✅ Push notifications
- ✅ Offline mode
- ✅ Standalone window
- ✅ Applications folder entry
- ✅ Dock integration
- ✅ System notifications

**Installation:**
- Install icon in address bar
- Menu → "Apps" → "Install Grocery List"

**Installed App:**
- Separate window
- In Applications folder
- In Dock
- Own icon in Cmd+Tab
- Uninstall like any Mac app

**Best For:** Mac users (primary recommendation)

---

#### Edge 79+ (Chromium)
**Support Level:** ✅ Full Support

**Features:**
Same as Chrome

**Installation:**
- Install icon in address bar
- Menu → "Apps" → "Install this site as an app"

**Best For:** Microsoft ecosystem users on Mac

---

#### Safari 13+
**Support Level:** ⚠️ Limited Support

**Features:**
- ⚠️ PWA installation (experimental, buggy)
- ✅ Service workers
- ❌ Background sync
- ⚠️ Push notifications (16+ only)
- ✅ Offline mode
- ❌ Standalone window (stays in Safari)

**Limitations:**
- Installation is experimental and unreliable
- No true standalone app
- Limited manifest support
- May break on updates

**Recommendation:** Use Chrome or Edge instead

---

#### Firefox (Any Version)
**Support Level:** ⚠️ Browser Only

**Same limitations as Firefox on Windows**

**Recommendation:** Use Chrome or Edge instead

---

### Desktop - Linux

#### Chrome 73+
**Support Level:** ✅ Full Support

**Features:**
Same as Windows/Mac Chrome

**Installation:**
- Install icon in address bar
- Menu → "Apps" → "Install Grocery List"

**Installed App:**
- Separate window
- Application menu entry
- Desktop file created
- Can pin to dock/panel

**Best For:** Linux users (primary recommendation)

---

#### Edge 79+
**Support Level:** ✅ Full Support (if available)

**Features:**
Same as Chrome (Chromium-based)

**Availability:**
- Available on Debian/Ubuntu
- Not all distros supported

**Best For:** Microsoft ecosystem users on Linux

---

#### Firefox (Any Version)
**Support Level:** ⚠️ Browser Only

**Same limitations as other platforms**

---

## Feature Support Details

### 1. Service Workers

Service workers enable offline functionality and background sync.

**Full Support:**
- ✅ Chrome 40+ (all platforms)
- ✅ Edge 17+ (all platforms)
- ✅ Safari 11.1+ (all platforms)
- ✅ Firefox 44+ (all platforms)
- ✅ Samsung Internet 4+
- ✅ Opera 27+

**How to Check:**
```javascript
if ('serviceWorker' in navigator) {
  console.log('Service workers supported!');
} else {
  console.log('Service workers NOT supported');
}
```

**Fallback:**
- App works in browser mode
- Offline queue uses localStorage instead
- Manual refresh required for updates

---

### 2. Background Sync

Background sync allows syncing when app is closed.

**Full Support:**
- ✅ Chrome 49+ (Android, Desktop)
- ✅ Edge 79+ (Desktop)
- ✅ Samsung Internet 12+
- ✅ Opera 39+

**Not Supported:**
- ❌ Safari (iOS and macOS)
- ❌ Firefox (all platforms)

**How It Works (When Supported):**
1. User makes changes offline
2. App closes
3. Device comes online
4. Service worker wakes automatically
5. Changes sync in background
6. Notification shown (optional)

**Fallback (When Not Supported):**
1. User makes changes offline
2. Changes queue locally
3. User reopens app
4. Changes sync on app open
5. "Syncing..." indicator shown

**Detection:**
```javascript
if ('sync' in registration) {
  console.log('Background sync supported!');
} else {
  console.log('Background sync NOT supported (will sync on app open)');
}
```

---

### 3. Push Notifications

Push notifications allow alerts when app is closed.

**Full Support:**
- ✅ Chrome 42+ (Android, Desktop)
- ✅ Edge 79+ (Desktop)
- ✅ Firefox 44+ (Desktop only)
- ✅ Samsung Internet 12+
- ✅ Opera 39+

**Partial Support:**
- ⚠️ Safari 16+ (macOS only, requires explicit permission)

**Not Supported:**
- ❌ Safari iOS (all versions)
- ❌ Safari macOS (< 16)
- ❌ Firefox (mobile)

**Platform Differences:**

**Android:**
- Native notifications
- Appear in notification shade
- Can customize sound, vibration
- Group notifications by app

**Desktop:**
- System notifications
- Appear in OS notification center
- Can customize in OS settings

**iOS:**
- NOT supported (Safari limitation)
- No workaround available
- Apple requires native app for notifications

**Detection:**
```javascript
if ('Notification' in window && 'serviceWorker' in navigator) {
  console.log('Push notifications supported!');
} else {
  console.log('Push notifications NOT supported');
}
```

---

### 4. Offline Mode

Offline mode allows using app without internet.

**Full Support:**
- ✅ All browsers with service worker support
- ✅ Chrome 40+ (all platforms)
- ✅ Edge 17+ (all platforms)
- ✅ Safari 11.1+ (all platforms)
- ✅ Firefox 44+ (all platforms)

**How It Works:**
1. Service worker caches app assets
2. Service worker caches API responses
3. When offline, serves from cache
4. Changes queue in IndexedDB
5. Syncs when back online

**Storage Limits:**

| Browser | Platform | Cache Limit | IndexedDB Limit |
|---------|----------|-------------|-----------------|
| Chrome | Android | ~6% free space | ~60% free space |
| Chrome | Desktop | ~60% free space | ~60% free space |
| Safari | iOS | ~50 MB | ~50 MB |
| Safari | macOS | ~500 MB | ~1 GB |
| Firefox | Android | ~50 MB | ~50 MB |
| Edge | Desktop | Same as Chrome | Same as Chrome |

**Eviction:**
- Browsers may evict cache if storage is low
- IndexedDB persists longer than cache
- "Persistent storage" API can prevent eviction (Chrome)

---

### 5. Installation & Add to Home Screen

PWA installation creates a standalone app experience.

**Full Support (Automatic Prompt):**
- ✅ Chrome 73+ (Android, Desktop)
- ✅ Edge 79+ (Desktop)
- ✅ Samsung Internet 12+
- ✅ Opera 57+

**Partial Support (Manual Only):**
- ⚠️ Safari 11.3+ (iOS) - Share → Add to Home Screen
- ⚠️ Safari 13+ (macOS) - Limited, experimental

**Not Supported:**
- ❌ Firefox (all platforms)
- ❌ Chrome/Firefox on iOS (use Safari)

**Installation Criteria (for automatic prompt):**

Must meet ALL of:
1. ✅ Served over HTTPS
2. ✅ Has Web App Manifest with:
   - `name` or `short_name`
   - `icons` (192x192 and 512x512)
   - `start_url`
   - `display: standalone` or `display: fullscreen`
3. ✅ Has registered service worker
4. ✅ User has engaged with site (visited at least 30 seconds, Chrome)
5. ✅ Not already installed

**iOS Manual Installation:**
1. Open in Safari
2. Tap Share button
3. "Add to Home Screen"
4. Tap "Add"

---

## Safari-Specific Limitations

### iOS Safari Restrictions

Apple intentionally limits PWA capabilities on iOS:

**Why?**
- Encourages native App Store apps
- App Store revenue protection
- "Security and privacy" (official reason)
- Competitive advantage for native apps

**What's Limited:**

**1. No Background Sync**
- App must be open to sync
- Workaround: Keep app open, check regularly

**2. No Push Notifications**
- Cannot receive notifications when closed
- Workaround: Check app manually, use email

**3. No Install Prompt**
- Must manually add via Share menu
- Workaround: Show instructions to users

**4. Limited Storage (50 MB)**
- Smaller than Android (6%+ of free space)
- Workaround: Cache strategically, clear old data

**5. Cache Eviction**
- iOS may evict cache after 7 days of no use
- Workaround: Prompt users to open app weekly

**6. No Web Share Target**
- Can't share to PWA from other apps
- No workaround available

**7. Partial Full-Screen**
- Status bar always visible
- No landscape mode control
- Workaround: Design around status bar

**8. No Web Bluetooth, NFC, USB**
- Hardware API access restricted
- No workaround (not needed for grocery list)

**Will This Change?**
- Unlikely in near future
- Apple has not indicated plans to improve PWA support
- EU's Digital Markets Act may force changes (2024+)
- US antitrust investigations may have impact

---

### macOS Safari Limitations

**Better than iOS, but still limited:**

**What Works:**
- ✅ Service workers
- ✅ Offline mode
- ✅ Cache API
- ⚠️ Push notifications (Safari 16+ only)

**What Doesn't:**
- ❌ Reliable PWA installation
- ❌ Background sync
- ❌ True standalone mode

**Recommendation:**
Use Chrome or Edge on macOS for full PWA experience.

---

## Firefox Limitations

### Why No PWA Support?

**Technical Reasons:**
- Different implementation priorities
- Focus on privacy over app-like features
- Resistance to "web app" model

**What Works:**
- ✅ Service workers
- ✅ Offline mode (in browser)
- ⚠️ Push notifications (desktop only)

**What Doesn't:**
- ❌ PWA installation
- ❌ Add to Home Screen (as app)
- ❌ Background sync
- ❌ Standalone window
- ❌ App icon in launcher

**Workarounds:**

**Desktop:**
1. Bookmark the app
2. Pin tab (right-click tab → "Pin Tab")
3. Use "Profile" feature for isolation
4. Create desktop shortcut to URL

**Mobile:**
1. Bookmark the app
2. Add bookmark to home screen (just a link, not an app)
3. Consider using Chrome instead

**Will This Change?**
- Unlikely in near future
- Firefox team has shown no interest in PWA installation
- Focus is on privacy features instead

---

## Fallback Behaviors

When features aren't supported, the app gracefully falls back:

### No PWA Installation
**Fallback:** Use in browser
- All features work in browser tab
- Bookmark for quick access
- Pin tab (Firefox)
- Add browser shortcut to desktop

### No Background Sync
**Fallback:** Foreground sync
- Changes queue locally
- Sync when app is opened
- "Syncing..." indicator shows progress
- No data loss, just delayed sync

### No Push Notifications
**Fallback:** In-app notifications
- Notifications shown when app is open
- Badge count on app icon (where supported)
- Email notifications (if enabled)
- Check app manually for updates

### No Service Workers
**Fallback:** Traditional web app
- No offline mode
- No caching
- Requires internet connection
- All features work when online
- Browser compatibility mode

### Limited Storage
**Fallback:** Reduced cache
- Cache fewer assets
- Limit offline queue size
- Clear old data automatically
- Prompt user when approaching limit

---

## Testing Compatibility

### Check Browser Support

**In-App Check:**
1. Go to Settings → About
2. "Browser Compatibility" section shows:
   - ✅ Service Worker: Supported
   - ✅ Offline Mode: Supported
   - ✅ Background Sync: Supported
   - ❌ Push Notifications: Not supported
   - ✅ PWA Installation: Supported

**Manual Check:**

**Open Browser Console (F12), paste:**
```javascript
console.log('Service Worker:', 'serviceWorker' in navigator);
console.log('Background Sync:', 'sync' in ServiceWorkerRegistration.prototype);
console.log('Push Notifications:', 'Notification' in window);
console.log('Cache API:', 'caches' in window);
console.log('IndexedDB:', 'indexedDB' in window);
```

**Or use our compatibility checker:**
Go to: `https://grocerylist.app/compatibility`

---

### Browser Version Check

**Find Your Browser Version:**

**Chrome:**
1. Menu (⋮) → Help → About Google Chrome
2. Version shown (e.g., "120.0.6099.109")

**Edge:**
1. Menu (⋯) → Help and feedback → About Microsoft Edge
2. Version shown (e.g., "120.0.2210.91")

**Safari:**
1. Safari → About Safari (Mac)
2. Settings → Safari → Advanced (iOS)
3. Version shown (e.g., "16.5")

**Firefox:**
1. Menu (☰) → Help → About Firefox
2. Version shown (e.g., "120.0.1")

**Compare with minimum versions in compatibility matrix above.**

---

## Recommendations by Use Case

### Best Overall Experience
**Recommendation:** Chrome or Edge

**Why:**
- Full PWA support
- Background sync
- Push notifications
- Available on all platforms (except iOS PWA)
- Regular updates

**Setup:**
- Android: Chrome 72+
- Desktop: Chrome 73+ or Edge 79+

---

### iOS Users (No Choice)
**Recommendation:** Safari (only option)

**Why:**
- Only browser with Add to Home Screen on iOS
- Chrome/Firefox on iOS use Safari engine anyway

**Setup:**
- Safari 11.3+ on iOS
- Manual Add to Home Screen

**Accept Limitations:**
- No background sync
- No push notifications
- Keep app open while syncing

---

### Privacy-Focused Users
**Recommendation:** Firefox (with trade-offs)

**Why:**
- Strong privacy focus
- Tracker blocking
- Open source

**Trade-offs:**
- No PWA installation
- No background sync
- Use in browser tab only

**Alternative:**
- Chrome with privacy extensions
- Brave browser (Chromium-based, privacy-focused, PWA support)

---

### Enterprise / Corporate
**Recommendation:** Edge (Windows), Chrome (macOS/Linux)

**Why:**
- Enterprise management tools
- Group policies
- IT admin control
- Deployment options

**Setup:**
- Edge 79+ on Windows
- Chrome 73+ on Mac/Linux
- Centralized configuration

---

## Future Compatibility

### Upcoming Browser Support

**Expected Improvements:**

**Safari (Possible):**
- EU Digital Markets Act may force improvements
- Background sync (unlikely)
- Better PWA installation (possible)
- Push notifications on iOS (under pressure)
- Target: 2024-2025 (speculation)

**Firefox (Unlikely):**
- No indications of PWA installation support
- Focus remains on privacy features
- May never support full PWA spec

**Chrome/Edge:**
- Continued improvements
- New Web APIs
- Better integration
- Performance enhancements

---

### Monitoring Compatibility

**Check for Updates:**
- [Can I Use](https://caniuse.com) - Browser feature support
- [MDN Web Docs](https://developer.mozilla.org) - Browser compatibility
- [Web.dev](https://web.dev) - Progressive Web Apps guide

**Browser Changelogs:**
- Chrome: `https://chromestatus.com`
- Edge: `https://docs.microsoft.com/en-us/deployedge/microsoft-edge-relnote-stable-channel`
- Safari: `https://developer.apple.com/safari/technology-preview/release-notes/`
- Firefox: `https://www.mozilla.org/en-US/firefox/releases/`

---

## Summary

### Fully Supported (All Features)
- ✅ Chrome 73+ (Android, Desktop)
- ✅ Edge 79+ (Desktop)
- ✅ Samsung Internet 12+
- ✅ Opera 57+

### Partially Supported (Limited Features)
- ⚠️ Safari 11.3+ (iOS) - No background sync, no push notifications
- ⚠️ Safari 13+ (macOS) - Limited PWA installation, no background sync
- ⚠️ Firefox (all) - No PWA install, works in browser

### Not Recommended
- ❌ Internet Explorer (end of life, not supported)
- ❌ Chrome/Firefox on iOS (use Safari instead)

### Best Choice
- **Android:** Chrome or Edge
- **iOS:** Safari (only option)
- **Windows:** Chrome or Edge
- **macOS:** Chrome or Edge
- **Linux:** Chrome or Edge

---

## Getting Help

**Browser Not Listed?**
- Try the app - it may work!
- Check console for compatibility warnings
- Contact support with browser details

**Feature Not Working?**
- Check browser version (must meet minimum)
- Update browser to latest version
- Check browser settings/permissions
- See [Troubleshooting Guide](PWA_USER_GUIDE.md#troubleshooting)

**Questions?**
- Email: support@grocerylist.app
- In-app: Settings → Help & Support

---

*Last Updated: October 2025 | Version 2.0.0*

*Compatibility information based on:*
- *[MDN Web Docs](https://developer.mozilla.org)*
- *[Can I Use](https://caniuse.com)*
- *[Web.dev](https://web.dev)*
- *Browser vendor documentation*
