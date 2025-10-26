# PWA Manual Testing Guide

## Overview

This guide provides step-by-step instructions for manually testing Progressive Web App (PWA) features across different platforms and browsers. Use this guide in conjunction with the automated tests to ensure comprehensive coverage.

---

## Table of Contents

1. [Test Environment Setup](#test-environment-setup)
2. [Chrome/Chromium Testing](#chromechromium-testing)
3. [Firefox Testing](#firefox-testing)
4. [Safari Testing](#safari-testing)
5. [Edge Testing](#edge-testing)
6. [Android Testing](#android-testing)
7. [iOS Testing](#ios-testing)
8. [Background Sync Testing](#background-sync-testing)
9. [Push Notifications Testing](#push-notifications-testing)
10. [Cross-Platform Results Matrix](#cross-platform-results-matrix)

---

## Test Environment Setup

### Required Tools

- **Browsers:**
  - Chrome/Chromium (latest stable)
  - Firefox (latest stable)
  - Safari (latest stable)
  - Edge (latest stable)

- **Mobile Devices:**
  - Android device with Chrome (Android 5.0+)
  - iOS device with Safari (iOS 16.4+)

- **Network Tools:**
  - Chrome DevTools (Network throttling)
  - Physical network disconnect capability

- **Test Accounts:**
  - 2-3 test user accounts for sharing/collaboration features
  - Push notification test server access

### Environment Checklist

- [ ] HTTPS enabled (required for service workers)
- [ ] Valid SSL certificate installed
- [ ] Test data populated (grocery lists, items)
- [ ] Multiple browser profiles available
- [ ] Mobile devices accessible for testing
- [ ] Network controls available (airplane mode, etc.)

---

## Chrome/Chromium Testing

### Test 1: Service Worker Registration

**Platform:** Desktop Chrome (Windows/macOS/Linux)

**Steps:**
1. Open Chrome and navigate to the app URL (e.g., https://localhost:3000)
2. Open DevTools (F12 or Cmd+Option+I)
3. Go to Application tab > Service Workers
4. Verify service worker is registered and activated

**Expected Results:**
- Service worker shows status: "activated and is running"
- Green dot indicator next to service worker
- Service worker scope is `/`
- Update on reload checkbox available

**Screenshot Location:** `screenshots/chrome-sw-registration.png`

---

### Test 2: PWA Installation (Desktop Chrome)

**Platform:** Desktop Chrome

**Steps:**
1. Navigate to app URL
2. Interact with app for 30+ seconds (browse lists, add items)
3. Look for install icon in address bar (desktop icon or +)
4. Click install button
5. Confirm installation in dialog
6. Verify app appears in OS application list

**Expected Results:**
- Install prompt appears after engagement
- Installation completes without errors
- App icon appears in Start Menu/Applications folder
- Desktop shortcut created (optional)
- App opens in standalone window (no browser UI)

**Screenshot Location:** `screenshots/chrome-desktop-install.png`

---

### Test 3: Offline Mode (Desktop Chrome)

**Platform:** Desktop Chrome

**Steps:**
1. Load app with service worker active
2. Open DevTools > Network tab
3. Check "Offline" checkbox
4. Reload the page
5. Try to navigate between routes
6. Add/edit items (should queue for sync)
7. Go back online
8. Verify changes sync

**Expected Results:**
- Page loads successfully from cache
- Offline indicator appears in UI
- Cached assets serve instantly
- API calls fail gracefully or serve from cache
- Operations queue for background sync
- Syncing occurs when back online
- Sync indicator updates appropriately

**Screenshot Location:** `screenshots/chrome-offline-mode.png`

---

### Test 4: Cache Inspection

**Platform:** Desktop Chrome

**Steps:**
1. Open DevTools > Application tab > Cache Storage
2. Expand cache entries (e.g., `grocery-cache-v1`)
3. Click on individual cached items
4. Verify content of cached responses
5. Right-click and delete a cache entry
6. Reload page and verify cache rebuilds

**Expected Results:**
- All expected caches visible
- Static assets (JS, CSS, images) cached
- API responses cached (if applicable)
- Can inspect cached response headers and body
- Cache rebuilds correctly after deletion

**Screenshot Location:** `screenshots/chrome-cache-storage.png`

---

### Test 5: Service Worker Update

**Platform:** Desktop Chrome

**Steps:**
1. With app loaded, deploy new service worker version
2. In DevTools > Application > Service Workers, click "Update"
3. Observe new service worker in "waiting" state
4. Look for update notification in app UI
5. Click "Update Now" button
6. Verify page reloads with new service worker

**Expected Results:**
- New service worker detected and enters "waiting"
- User sees "Update Available" notification
- Clicking update sends SKIP_WAITING message
- Page reloads automatically
- New service worker is now "activated"
- Old caches cleaned up

**Screenshot Location:** `screenshots/chrome-sw-update.png`

---

## Firefox Testing

### Test 6: Firefox Desktop PWA Support

**Platform:** Desktop Firefox

**Steps:**
1. Open Firefox and navigate to app URL
2. Open Developer Tools (F12) > Storage tab > Service Workers
3. Verify service worker is registered
4. Test offline functionality (same as Chrome Test 3)
5. Check browser menu for install option

**Expected Results:**
- Service worker registers and activates
- Offline mode works correctly
- Background Sync API **NOT** available (check console warnings)
- Polling fallback mechanism engages
- Limited PWA install support (desktop only, not prominent)

**Notes:**
- Firefox on desktop has limited PWA install UX
- Background Sync API not supported - app should fallback to polling
- Service workers work well for caching

**Screenshot Location:** `screenshots/firefox-desktop-pwa.png`

---

### Test 7: Firefox Android

**Platform:** Android device with Firefox browser

**Steps:**
1. Open Firefox Android and navigate to app
2. Test offline functionality
3. Look for "Add to Home Screen" option in browser menu
4. Add to home screen if available
5. Test background sync behavior

**Expected Results:**
- Service worker works
- Offline caching functional
- No native PWA install prompt
- Can add to home screen via browser menu (creates bookmark, not PWA)
- Background sync fallback works
- Limited PWA features compared to Chrome Android

**Screenshot Location:** `screenshots/firefox-android.png`

---

## Safari Testing

### Test 8: Safari macOS PWA

**Platform:** macOS with Safari

**Steps:**
1. Open Safari and navigate to app URL
2. Open Web Inspector (Cmd+Option+I) > Storage tab
3. Check for Service Workers entry
4. Test offline functionality
5. Check File menu > "Add to Dock"
6. Install and test standalone app

**Expected Results:**
- Service worker registers (Safari 11.1+)
- Offline caching works
- Background Sync **NOT** supported (fallback to polling)
- Can add to Dock (macOS Big Sur+)
- Push notifications supported (macOS Ventura 13.0+)
- Some service worker quirks/limitations

**Notes:**
- Safari has most limitations of major browsers
- Regular storage eviction if app unused
- Push notifications require macOS Ventura or later

**Screenshot Location:** `screenshots/safari-macos-pwa.png`

---

### Test 9: Safari iOS PWA (Critical)

**Platform:** iPhone/iPad with Safari

**Steps:**
1. Open Safari on iOS and navigate to app
2. Tap Share button (square with up arrow)
3. Scroll down and tap "Add to Home Screen"
4. Edit name if needed, tap "Add"
5. Tap app icon on home screen to open
6. Test offline functionality
7. Test push notifications (iOS 16.4+)
8. Leave app unused for 7+ days, then check if still works

**Expected Results:**
- App adds to home screen successfully
- Custom icon and splash screen appear
- Opens in standalone mode (no Safari UI)
- Service worker and offline caching work
- Background Sync **NOT** supported (use polling)
- Push notifications work (iOS 16.4+)
- Storage may be evicted after 7 days of inactivity

**Known Limitations:**
- No install prompt (manual "Add to Home Screen" only)
- Storage eviction after inactivity period
- Background sync not available
- Some service worker limitations
- Limited to Safari browser only

**Screenshot Location:** `screenshots/safari-ios-install.png`

---

## Edge Testing

### Test 10: Edge Desktop PWA

**Platform:** Desktop Edge (Windows/macOS)

**Steps:**
1. Open Edge and navigate to app
2. Look for install icon in address bar
3. Click install icon or menu > Apps > Install this site as an app
4. Complete installation
5. Test all PWA features (same as Chrome tests)

**Expected Results:**
- Full PWA support (Chromium-based)
- Identical behavior to Chrome
- Windows integration features available
- Can pin to taskbar/Start menu
- All PWA APIs supported

**Screenshot Location:** `screenshots/edge-desktop-install.png`

---

## Android Testing

### Test 11: Chrome Android PWA Installation

**Platform:** Android device with Chrome

**Steps:**
1. Open Chrome on Android
2. Navigate to app URL
3. Interact with app for 30+ seconds
4. Look for install banner at bottom of screen
5. Alternatively, tap menu (three dots) > "Install app" or "Add to Home Screen"
6. Confirm installation
7. Find app icon on home screen
8. Open app from home screen
9. Verify standalone mode (no browser UI)

**Expected Results:**
- Install prompt appears after engagement heuristics met
- Installation completes successfully
- App icon appears on home screen with proper name and icon
- Splash screen displays on launch
- App opens in standalone mode
- Status bar themed to app colors
- Full screen (minus Android status bar)

**Screenshot Location:** `screenshots/android-chrome-install.png`

---

### Test 12: Android Background Sync (Critical)

**Platform:** Android device with Chrome

**Steps:**
1. Open installed app
2. Add/edit several grocery items
3. Enable airplane mode (or disconnect WiFi/data)
4. Make more changes (add, check off items)
5. Verify UI shows sync pending indicator
6. Close app completely (swipe away from recents)
7. Wait 1 minute
8. Reconnect to network
9. Wait 2-3 minutes (don't open app yet)
10. Open app and check if changes synced

**Expected Results:**
- Operations queue while offline
- Sync indicator shows pending operations count
- Background sync fires when app is closed and network restored
- Sync completes without opening app
- Opening app shows all changes synced
- No data loss

**Notes:**
- This tests true background sync (app closed)
- May not work in battery saver mode
- Requires Background Sync API support

**Screenshot Location:** `screenshots/android-background-sync.png`

---

### Test 13: Android Push Notifications

**Platform:** Android device with Chrome

**Steps:**
1. Open installed app
2. Navigate to settings/notifications
3. Enable notifications (grant permission)
4. Verify subscription created
5. Close or minimize app
6. Trigger test notification from server/admin panel
7. Observe notification appears in Android notification shade
8. Tap notification
9. Verify app opens to correct page

**Expected Results:**
- Permission prompt appears (if first time)
- Subscription created and saved to server
- Notification appears in shade with correct title, body, icon
- Notification persists until dismissed or tapped
- Tapping notification opens app to relevant page
- Notification actions work (if implemented)

**Screenshot Location:** `screenshots/android-push-notification.png`

---

## iOS Testing

### Test 14: iOS Safari PWA Installation

**Platform:** iPhone with Safari (iOS 16.4+)

**Steps:**
1. Open Safari on iPhone
2. Navigate to app URL
3. Tap Share button (bottom center)
4. Scroll down in share sheet
5. Tap "Add to Home Screen"
6. Optionally edit app name
7. Tap "Add" in top right
8. Locate app icon on home screen
9. Tap to open app

**Expected Results:**
- Add to Home Screen option available
- Can customize name before adding
- Icon uses manifest icon (or fallback to screenshot)
- App appears on home screen
- Launches with splash screen (manifest colors)
- Opens in standalone mode (no Safari UI)
- Status bar styled per manifest

**Screenshot Location:** `screenshots/ios-safari-add-to-home.png`

---

### Test 15: iOS Splash Screen

**Platform:** iPhone/iPad with Safari

**Steps:**
1. Install app using Test 14
2. Close app completely (swipe up from app switcher)
3. Wait a few seconds
4. Tap app icon to launch
5. Observe splash screen during load

**Expected Results:**
- Splash screen appears immediately
- Uses `background_color` from manifest
- Displays app icon from manifest
- Shows app name
- Transitions to app when loaded
- No white flash

**Screenshot Location:** `screenshots/ios-splash-screen.png`

---

### Test 16: iOS Push Notifications

**Platform:** iPhone with Safari (iOS 16.4+)

**Steps:**
1. Install app as PWA
2. Open app and navigate to notification settings
3. Enable notifications
4. Grant permission when prompted by iOS
5. Verify subscription in app
6. Close app
7. Send test push notification
8. Check notification appears on lock screen/notification center
9. Tap notification

**Expected Results:**
- iOS permission prompt appears
- Permission granted successfully
- Subscription created and registered
- Notification appears with correct content
- Tapping opens app to correct page
- Notification badge may appear on icon

**Notes:**
- Only works on iOS 16.4 and later
- Only works for PWAs added to home screen
- Will NOT work in Safari browser (not standalone)

**Screenshot Location:** `screenshots/ios-push-notification.png`

---

### Test 17: iOS Storage Eviction

**Platform:** iPhone with Safari

**Steps:**
1. Install app as PWA
2. Use app, add data
3. Close app
4. Don't open app for 7+ days
5. After 7 days, open app
6. Check if data still present

**Expected Results:**
- After 7 days of inactivity, iOS may evict storage
- Service worker may be unregistered
- App should detect and re-register service worker
- App should handle missing data gracefully
- User may need to log in again
- App should prompt to reload data

**Notes:**
- This is an iOS limitation
- Can request persistent storage (may not be granted)
- Important to handle gracefully

**Documentation:** Note results in test log

---

## Background Sync Testing

### Test 18: Queue Operations While Offline

**Platform:** Any supported browser/device

**Steps:**
1. Open app (online)
2. Disconnect network (airplane mode or DevTools offline)
3. Perform 5-10 operations:
   - Add new items
   - Check off items
   - Edit item names/quantities
   - Delete items
4. Observe UI feedback
5. Check sync queue indicator

**Expected Results:**
- All operations accepted despite offline
- UI updates optimistically
- Sync queue indicator shows pending count (e.g., "5 pending")
- No error messages for offline operations
- Operations stored in local queue

**Screenshot Location:** `screenshots/offline-queue-operations.png`

---

### Test 19: Sync When Reconnected (App Open)

**Platform:** Any supported browser/device

**Steps:**
1. Complete Test 18 (have pending operations)
2. Reconnect network
3. Watch sync indicator
4. Observe operations processing
5. Verify final state matches expectations

**Expected Results:**
- Sync indicator changes to "Syncing..."
- Operations process in order
- Sync indicator counts down as operations complete
- Final state: all operations synced
- UI shows "All changes saved" or similar
- No data loss or duplication

**Screenshot Location:** `screenshots/online-sync-processing.png`

---

### Test 20: Sync When Reconnected (App Closed) - Android Only

**Platform:** Android device with Chrome

**Steps:**
1. Have pending operations queued
2. Close app completely (swipe from recents)
3. Reconnect network
4. Wait 5 minutes (don't open app)
5. Open app
6. Check sync status and data

**Expected Results:**
- Background sync occurred while app closed
- All operations synced without user intervention
- Opening app shows current synced state
- No pending operations
- Data is consistent across devices

**Notes:**
- This only works on platforms with Background Sync API (Chrome/Edge on Android)
- iOS and Firefox will NOT sync when app is closed

**Screenshot Location:** `screenshots/android-background-sync-closed.png`

---

### Test 21: Sync Conflict Resolution

**Platform:** Any supported browser/device

**Steps:**
1. Open app on Device A
2. Open app on Device B (same account)
3. Go offline on Device A
4. Edit item "Milk" quantity to 2 on Device A (offline)
5. Edit same item "Milk" quantity to 3 on Device B (online)
6. Wait for Device B change to sync
7. Bring Device A back online
8. Observe conflict resolution

**Expected Results:**
- Conflict detected (version mismatch)
- App applies conflict resolution strategy:
  - Last-write-wins: Device A's change (timestamp) or Device B's change
  - Server-wins: Device B's change persists
  - Merge: Combine changes if possible
  - Prompt: Ask user to choose
- Final state consistent across devices
- User notified of conflict if appropriate

**Screenshot Location:** `screenshots/sync-conflict-resolution.png`

---

### Test 22: Sync Retry on Failure

**Platform:** Any supported browser/device

**Steps:**
1. Queue operations while offline
2. Go online but simulate server error (if test API available)
3. Observe sync retry behavior
4. Fix server or wait for retry interval
5. Verify eventually syncs

**Expected Results:**
- First sync attempt fails
- App doesn't give up immediately
- Retry scheduled with backoff (30s, 60s, 120s, etc.)
- User sees "Sync failed, will retry" message
- Eventually succeeds when server available
- Data integrity maintained

**Screenshot Location:** `screenshots/sync-retry-backoff.png`

---

## Push Notifications Testing

### Test 23: Request Notification Permission

**Platform:** Desktop Chrome or Android Chrome

**Steps:**
1. Open app (fresh profile or cleared permissions)
2. Navigate to Settings/Notifications page
3. Click "Enable Notifications" button
4. Observe permission prompt
5. Grant permission
6. Verify subscription created

**Expected Results:**
- Browser native permission prompt appears
- Prompt triggered by user action (not on page load)
- Granting permission succeeds
- Subscription created and sent to server
- UI updates to show notifications enabled
- Subscription ID visible in app (for debugging)

**Screenshot Location:** `screenshots/notification-permission-prompt.png`

---

### Test 24: Receive and Display Notification

**Platform:** Any device/browser with notification permission

**Steps:**
1. Ensure notifications enabled (Test 23)
2. Minimize or switch away from app
3. Trigger test notification from server/admin panel
4. Wait for notification to appear
5. Observe notification in system notification area

**Expected Results:**
- Notification appears within 5 seconds
- Title displays correctly
- Body text displays correctly
- App icon shows in notification
- Notification persists until interacted with
- Multiple notifications stack correctly

**Screenshot Location:** `screenshots/notification-received.png`

---

### Test 25: Notification Click Action

**Platform:** Any device/browser with notifications

**Steps:**
1. Receive notification (Test 24)
2. Click/tap on notification body
3. Observe app behavior

**Expected Results:**
- App opens (or focuses if already open)
- Navigates to correct page/context (e.g., shared list)
- Notification dismissed
- Deep link parameters work
- App in correct state for notification context

**Screenshot Location:** `screenshots/notification-click-action.png`

---

### Test 26: Notification Action Buttons

**Platform:** Desktop Chrome or Android Chrome

**Steps:**
1. Configure notification with action buttons (e.g., "View", "Dismiss")
2. Receive notification
3. Observe action buttons
4. Click "View" button
5. Verify behavior differs from body click

**Expected Results:**
- Action buttons visible in notification
- "View" opens app to specific view
- "Dismiss" closes notification without opening app
- Each action tracked separately (analytics)

**Screenshot Location:** `screenshots/notification-action-buttons.png`

---

### Test 27: Unsubscribe from Notifications

**Platform:** Any device/browser with notifications enabled

**Steps:**
1. With notifications enabled, go to Settings
2. Toggle "Enable Notifications" off
3. Verify unsubscribe process
4. Trigger test notification
5. Verify notification NOT received

**Expected Results:**
- Unsubscribe completes successfully
- Server removes subscription from database
- No more notifications sent to this device
- UI shows notifications disabled
- Can re-subscribe by toggling back on

**Screenshot Location:** `screenshots/notification-unsubscribe.png`

---

## Cross-Platform Results Matrix

| Feature | Chrome Desktop | Chrome Android | Firefox Desktop | Firefox Android | Safari macOS | Safari iOS | Edge Desktop |
|---------|----------------|----------------|-----------------|-----------------|--------------|------------|--------------|
| Service Worker | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ⚠️ Limited | ⚠️ Limited | ✅ Full |
| Offline Caching | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| Background Sync | ✅ Yes | ✅ Yes | ❌ No (polling) | ❌ No (polling) | ❌ No (polling) | ❌ No (polling) | ✅ Yes |
| Background Sync (App Closed) | ❌ No | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| Push Notifications | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ⚠️ macOS 13+ | ⚠️ iOS 16.4+ | ✅ Yes |
| Install Prompt | ✅ Yes | ✅ Yes | ⚠️ Limited | ❌ No | ⚠️ Add to Dock | ⚠️ Manual only | ✅ Yes |
| Standalone Mode | ✅ Yes | ✅ Yes | ⚠️ Limited | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| Splash Screen | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| Storage Eviction | ❌ No | ❌ No | ❌ No | ❌ No | ⚠️ Possible | ⚠️ After 7 days | ❌ No |

**Legend:**
- ✅ Full support
- ⚠️ Partial/conditional support
- ❌ Not supported

---

## Testing Tips

### General Tips

1. **Clear State Between Tests:** Use incognito/private mode or clear site data to test fresh user experience
2. **Test on Real Devices:** Emulators don't fully replicate PWA behavior (especially background sync)
3. **Document Everything:** Take screenshots and notes for each test
4. **Test Edge Cases:** Bad network, server errors, low storage, etc.
5. **Check Console:** Always have DevTools open to see warnings/errors

### Network Testing

- Use DevTools Network tab throttling (Slow 3G, Offline)
- Test with airplane mode for real offline behavior
- Test with unstable connections (rapidly toggle network)
- Test with VPN or firewalls that might block WebSockets

### Device Testing

- Test on low-end devices (performance)
- Test on devices with low storage (quota errors)
- Test with battery saver mode enabled
- Test with various screen sizes and orientations

### Browser Testing

- Test in regular and incognito/private mode
- Test with browser extensions enabled/disabled
- Test with different language settings
- Test with zoom levels (150%, 200%)

---

## Common Issues and Troubleshooting

### Service Worker Won't Register

**Symptoms:** SW never reaches "activated" state

**Possible Causes:**
- Not using HTTPS
- Service worker file has syntax errors
- CORS issues with service worker file
- Browser doesn't support service workers

**Solutions:**
- Ensure HTTPS (or localhost for dev)
- Check console for specific errors
- Verify SW file is accessible at correct path
- Test in supported browser

### Install Prompt Doesn't Appear

**Symptoms:** No install button/prompt shows

**Possible Causes:**
- Haven't met engagement heuristics
- Already installed
- Manifest issues
- Browser doesn't support PWA install

**Solutions:**
- Interact with app for 30+ seconds
- Check Application > Manifest tab for errors
- Verify manifest is valid JSON
- Try clearing site data and testing again

### Background Sync Not Working

**Symptoms:** Operations don't sync when app closed

**Possible Causes:**
- Browser doesn't support Background Sync API
- App not installed (web page mode)
- Battery saver mode enabled
- Background sync permission denied

**Solutions:**
- Verify browser/platform supports Background Sync (Chrome/Edge Android)
- Install app as PWA (not just web page)
- Disable battery saver mode
- Check for fallback polling mechanism

### Push Notifications Not Received

**Symptoms:** No notifications appear

**Possible Causes:**
- Permission denied
- Subscription not saved to server
- Server not sending notifications
- Notification settings disabled at OS level
- App not installed as PWA (iOS requirement)

**Solutions:**
- Verify permission granted in browser
- Check subscription saved to database
- Test server-side notification sending
- Check OS notification settings
- On iOS: ensure app installed to home screen

---

## Test Report Template

Use this template to document test results:

```markdown
# PWA Test Report - [Date]

## Test Environment
- **Tester:** [Name]
- **Date:** [Date]
- **App Version:** [Version]
- **Platform:** [Platform/Device]
- **Browser:** [Browser/Version]

## Tests Executed

### Test ID: [Test Number]
- **Test Name:** [Test Name]
- **Status:** ✅ Pass / ❌ Fail / ⚠️ Partial
- **Notes:** [Any observations or issues]
- **Screenshots:** [Links to screenshots]

### Summary
- **Total Tests:** X
- **Passed:** X
- **Failed:** X
- **Partial:** X

### Issues Found
1. [Issue description]
2. [Issue description]

### Recommendations
1. [Recommendation]
2. [Recommendation]
```

---

## Related Documentation

- [PWA Test Plan](./PWA_TEST_PLAN.md) - Automated and manual test scenarios
- [PWA Debugging Guide](./PWA_DEBUGGING.md) - Debugging tools and techniques
- [Offline Architecture](./OFFLINE_ARCHITECTURE.md) - Technical implementation details

---

**Document Version:** 1.0
**Last Updated:** 2025-10-26
**Maintained By:** Development Team
