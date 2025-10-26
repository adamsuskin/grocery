# PWA Test Plan

## Overview

This document outlines comprehensive test scenarios for Progressive Web App (PWA) features in the Grocery List application. Tests cover service worker functionality, background sync, push notifications, PWA installation, cache management, and cross-browser compatibility.

## Test Environment Setup

### Prerequisites
- Node.js and pnpm installed
- Test browsers installed (Chrome, Firefox, Safari, Edge)
- Mobile devices or emulators for mobile testing
- HTTPS enabled (required for service workers)
- Valid SSL certificate (self-signed acceptable for development)

### Test Data Requirements
- Test user accounts
- Sample grocery lists with various item counts
- Offline/online network conditions
- Push notification test server credentials

---

## 1. Service Worker Tests (18 scenarios)

### 1.1 Service Worker Registration

#### Test 1.1.1: SW Registration Succeeds on First Load
**Priority:** Critical
**Prerequisites:** Fresh browser profile, no existing service worker
**Steps:**
1. Navigate to application URL
2. Open DevTools > Application > Service Workers
3. Verify service worker is registered

**Expected Result:**
- Service worker status shows "activated and running"
- No console errors related to SW registration
- SW registration promise resolves successfully

**Automated Test:** `tests/pwa/serviceWorker.test.ts` - `should register service worker successfully`

---

#### Test 1.1.2: SW Registration Fails Gracefully on HTTP
**Priority:** High
**Prerequisites:** Access app via HTTP (not HTTPS)
**Steps:**
1. Navigate to http://localhost:3000
2. Check console for SW registration errors
3. Verify app still functions without SW

**Expected Result:**
- Console shows informative message about HTTPS requirement
- Application continues to work without offline features
- No unhandled promise rejections

**Automated Test:** `tests/pwa/serviceWorker.test.ts` - `should handle registration failure gracefully`

---

#### Test 1.1.3: SW Registration Respects Browser Support
**Priority:** High
**Prerequisites:** Browser without SW support (IE11) or feature flag disabled
**Steps:**
1. Check if `navigator.serviceWorker` is available
2. Attempt registration only if supported
3. Verify graceful degradation

**Expected Result:**
- Feature detection works correctly
- No errors in unsupported browsers
- App provides feedback about missing offline features

**Automated Test:** `tests/pwa/serviceWorker.test.ts` - `should detect browser support`

---

### 1.2 Service Worker Activation

#### Test 1.2.1: SW Activates and Claims Clients
**Priority:** Critical
**Prerequisites:** Service worker registered
**Steps:**
1. Register new service worker
2. Monitor activation event
3. Verify `clients.claim()` is called
4. Check that current page is controlled by SW

**Expected Result:**
- Service worker moves from "installing" to "activated" state
- All open clients are immediately controlled
- `navigator.serviceWorker.controller` is not null

**Automated Test:** `tests/pwa/serviceWorker.test.ts` - `should activate and claim clients`

---

#### Test 1.2.2: SW Activation Cleans Old Caches
**Priority:** High
**Prerequisites:** Multiple cache versions exist
**Steps:**
1. Create caches with old version names
2. Deploy new service worker version
3. Wait for activation
4. Check remaining caches

**Expected Result:**
- Only current version cache(s) remain
- Old caches are deleted
- Cache cleanup completes before activation

**Automated Test:** `tests/pwa/serviceWorker.test.ts` - `should clean up old caches on activation`

---

### 1.3 Service Worker Updates

#### Test 1.3.1: SW Updates When New Version Available
**Priority:** Critical
**Prerequisites:** Service worker running v1
**Steps:**
1. Deploy new service worker code (v2)
2. Trigger update check (reload after 24h or manual)
3. Monitor for "waiting" service worker
4. Observe update notification

**Expected Result:**
- New SW enters "waiting" state
- User sees "Update Available" notification
- Old SW continues serving until update accepted

**Automated Test:** `tests/pwa/serviceWorker.test.ts` - `should detect new version`

---

#### Test 1.3.2: Skip Waiting Works on User Action
**Priority:** Critical
**Prerequisites:** New SW in "waiting" state
**Steps:**
1. User clicks "Update Now" button
2. Send `SKIP_WAITING` message to SW
3. Observe SW activation
4. Verify page reload

**Expected Result:**
- Waiting SW calls `skipWaiting()`
- SW activates immediately
- Page reloads automatically
- New version is active

**Automated Test:** `tests/pwa/serviceWorker.test.ts` - `should skip waiting on message`

---

#### Test 1.3.3: SW Update Check on App Focus
**Priority:** Medium
**Prerequisites:** App running, been inactive for some time
**Steps:**
1. Leave app open in background
2. Deploy new SW version
3. Focus app window/tab
4. Observe automatic update check

**Expected Result:**
- Update check triggered on window focus
- New SW detected if available
- Update prompt shown to user

**Automated Test:** `tests/pwa/serviceWorker.test.ts` - `should check for updates on focus`

---

### 1.4 Cache Strategies

#### Test 1.4.1: Cache-First Strategy for Static Assets
**Priority:** High
**Prerequisites:** Assets cached from previous visit
**Steps:**
1. Load app with network enabled
2. Open Network tab in DevTools
3. Reload page
4. Check source of static assets (JS, CSS, images)

**Expected Result:**
- Static assets served from Service Worker (size shows "from ServiceWorker")
- No network requests for cached assets
- Instant loading of assets

**Automated Test:** `tests/pwa/serviceWorker.test.ts` - `should serve static assets from cache`

---

#### Test 1.4.2: Network-First Strategy for API Calls
**Priority:** Critical
**Prerequisites:** App running, API available
**Steps:**
1. Make API request (e.g., fetch grocery lists)
2. Observe network request in DevTools
3. Go offline
4. Make same API request
5. Verify cached response is used

**Expected Result:**
- When online: API call goes to network first
- Response cached for offline use
- When offline: Cached response returned
- Offline indicator shown to user

**Automated Test:** `tests/pwa/serviceWorker.test.ts` - `should use network-first for API calls`

---

#### Test 1.4.3: Cache-First with Network Fallback for Images
**Priority:** Medium
**Prerequisites:** Mixed cached and uncached images
**Steps:**
1. Load page with some cached images
2. Add new images not in cache
3. Monitor image loading sources

**Expected Result:**
- Cached images load instantly from cache
- New images fetch from network
- Newly fetched images added to cache
- Broken image fallback if offline and not cached

**Automated Test:** `tests/pwa/serviceWorker.test.ts` - `should handle image loading strategies`

---

#### Test 1.4.4: Stale-While-Revalidate for HTML Pages
**Priority:** Medium
**Prerequisites:** HTML page cached from previous visit
**Steps:**
1. Load page (cached version served)
2. Observe background fetch for fresh version
3. Next reload should have updated content

**Expected Result:**
- Cached HTML served immediately
- Background network request made
- Cache updated with fresh content
- No loading delay for user

**Automated Test:** `tests/pwa/serviceWorker.test.ts` - `should revalidate stale content`

---

### 1.5 Offline Mode

#### Test 1.5.1: Offline Mode Serves Cached Assets
**Priority:** Critical
**Prerequisites:** App cached, network available
**Steps:**
1. Load app normally
2. Open DevTools > Network
3. Select "Offline" mode
4. Reload page

**Expected Result:**
- Page loads successfully from cache
- All cached assets available
- Offline indicator visible to user
- No error pages or broken resources

**Automated Test:** `tests/pwa/serviceWorker.test.ts` - `should work offline with cached assets`

---

#### Test 1.5.2: Offline Fallback Page for Uncached Routes
**Priority:** High
**Prerequisites:** Navigating to non-cached route while offline
**Steps:**
1. Go offline
2. Navigate to uncached URL
3. Observe fallback behavior

**Expected Result:**
- Custom offline page shown
- Message explains user is offline
- Navigation to cached routes available
- No browser default offline page

**Automated Test:** `tests/pwa/serviceWorker.test.ts` - `should show offline fallback page`

---

#### Test 1.5.3: Offline Detection and User Feedback
**Priority:** High
**Prerequisites:** App running online
**Steps:**
1. Disconnect network
2. Observe UI changes
3. Attempt to perform actions
4. Reconnect network

**Expected Result:**
- Offline banner/toast appears immediately
- Actions are queued or disabled appropriately
- Online banner appears on reconnection
- Queued actions process automatically

**Automated Test:** `tests/pwa/serviceWorker.test.ts` - `should detect offline/online transitions`

---

### 1.6 Service Worker Errors

#### Test 1.6.1: SW Fetch Error Handling
**Priority:** High
**Prerequisites:** Network or server errors
**Steps:**
1. Trigger 404, 500, or network timeout error
2. Observe SW fetch event handling
3. Check fallback behavior

**Expected Result:**
- Errors handled gracefully
- Appropriate cached fallback served
- Error logged for debugging
- User sees helpful error message

**Automated Test:** `tests/pwa/serviceWorker.test.ts` - `should handle fetch errors`

---

#### Test 1.6.2: SW Installation Failure Recovery
**Priority:** Medium
**Prerequisites:** SW installation fails (network error during cache)
**Steps:**
1. Cause installation failure (disconnect during cache)
2. Observe error handling
3. Retry installation

**Expected Result:**
- Installation failure doesn't break app
- Previous SW continues working
- Retry logic attempts installation again
- User notified of issue if persistent

**Automated Test:** `tests/pwa/serviceWorker.test.ts` - `should retry failed installation`

---

#### Test 1.6.3: SW Unregistration
**Priority:** Low
**Prerequisites:** SW registered and active
**Steps:**
1. Call `navigator.serviceWorker.getRegistration()`
2. Call `registration.unregister()`
3. Verify SW is removed
4. Check app still functions

**Expected Result:**
- SW unregisters successfully
- Caches can be optionally cleared
- App falls back to online-only mode
- No lingering SW processes

**Automated Test:** `tests/pwa/serviceWorker.test.ts` - `should unregister service worker`

---

## 2. Background Sync Tests (12 scenarios)

### 2.1 Background Sync Detection

#### Test 2.1.1: Background Sync API Detection
**Priority:** High
**Prerequisites:** Modern browser
**Steps:**
1. Check for `navigator.serviceWorker.ready`
2. Check for `registration.sync` availability
3. Display sync capability to user

**Expected Result:**
- API detection works correctly
- Chrome/Edge: sync available
- Firefox/Safari: graceful fallback
- UI adapts based on capability

**Automated Test:** `tests/pwa/backgroundSync.test.ts` - `should detect Background Sync API`

---

#### Test 2.1.2: Fallback to Polling When Sync Unavailable
**Priority:** High
**Prerequisites:** Browser without Background Sync API
**Steps:**
1. Detect lack of sync API
2. Initialize polling mechanism
3. Verify periodic sync attempts

**Expected Result:**
- Polling starts automatically
- Configurable interval (default 30s)
- Stops when app closed
- Battery efficient

**Automated Test:** `tests/pwa/backgroundSync.test.ts` - `should fallback to polling`

---

### 2.2 Sync Registration

#### Test 2.2.1: Sync Registration for Add Item
**Priority:** Critical
**Prerequisites:** Background Sync API available, offline
**Steps:**
1. Go offline
2. Add new grocery item
3. Check sync registration in DevTools
4. Verify item in pending queue

**Expected Result:**
- Sync tag registered (e.g., "sync-item-add-{id}")
- Item stored in IndexedDB queue
- Optimistic UI update shown
- Sync badge/indicator visible

**Automated Test:** `tests/pwa/backgroundSync.test.ts` - `should register sync for offline mutation`

---

#### Test 2.2.2: Sync Registration for Update Item
**Priority:** Critical
**Prerequisites:** Background Sync API available, offline
**Steps:**
1. Go offline
2. Edit existing item (check off, quantity change)
3. Verify sync registration
4. Check queue state

**Expected Result:**
- Update operation queued
- Local state updated immediately
- Sync tag includes operation type and ID
- Multiple updates to same item coalesce

**Automated Test:** `tests/pwa/backgroundSync.test.ts` - `should register sync for updates`

---

#### Test 2.2.3: Sync Registration for Delete Item
**Priority:** Critical
**Prerequisites:** Background Sync API available, offline
**Steps:**
1. Go offline
2. Delete grocery item
3. Verify sync registration
4. Item marked for deletion locally

**Expected Result:**
- Delete operation queued
- Item removed from UI immediately
- Sync tag registered with delete flag
- Can undo before sync completes

**Automated Test:** `tests/pwa/backgroundSync.test.ts` - `should register sync for deletions`

---

### 2.3 Sync Event Handling

#### Test 2.3.1: Sync Event Fires When Connectivity Restored
**Priority:** Critical
**Prerequisites:** Pending sync operations, currently offline
**Steps:**
1. Queue multiple operations while offline
2. Reconnect to network
3. Monitor Service Worker sync events
4. Verify operations process

**Expected Result:**
- Sync event fires within seconds of reconnection
- All pending operations processed in order
- Success/failure tracked per operation
- Failed operations retry with backoff

**Automated Test:** `tests/pwa/backgroundSync.test.ts` - `should fire sync event on reconnection`

---

#### Test 2.3.2: Mutations Queued and Synced in Order
**Priority:** High
**Prerequisites:** Multiple operations queued
**Steps:**
1. Go offline
2. Perform operations: Add item A, Add item B, Update A, Delete B
3. Go online
4. Verify sync order and final state

**Expected Result:**
- Operations execute in FIFO order
- Dependent operations handled correctly
- Final state matches expected result
- No race conditions

**Automated Test:** `tests/pwa/backgroundSync.test.ts` - `should sync operations in order`

---

#### Test 2.3.3: Sync Handles Conflicts on Server
**Priority:** High
**Prerequisites:** Item modified on server while offline changes queued
**Steps:**
1. Item exists: quantity = 1
2. Go offline, update to quantity = 2
3. On another device, update to quantity = 3
4. Reconnect first device
5. Observe conflict resolution

**Expected Result:**
- Conflict detected (version mismatch)
- Conflict resolution strategy applied (last-write-wins, merge, prompt)
- User notified of conflict if needed
- Final state is consistent

**Automated Test:** `tests/pwa/backgroundSync.test.ts` - `should handle sync conflicts`

---

### 2.4 App Closed Sync (Manual Tests)

#### Test 2.4.1: App Closed Sync Works on Mobile
**Priority:** Critical
**Type:** Manual
**Prerequisites:** Mobile device with Chrome, pending sync
**Steps:**
1. On mobile, go offline and add items
2. Close browser completely
3. Reconnect to WiFi/mobile data
4. Wait 5 minutes (don't open app)
5. Open app and check sync status

**Expected Result:**
- Background sync occurred while app closed
- Items synced to server
- No pending operations
- Sync notification may appear

**Documentation:** Manual test in `docs/PWA_MANUAL_TESTING.md`

---

#### Test 2.4.2: App Closed Sync Respects Battery
**Priority:** Medium
**Type:** Manual
**Prerequisites:** Low battery mode enabled
**Steps:**
1. Enable battery saver mode
2. Queue sync operations
3. Close app
4. Monitor sync behavior

**Expected Result:**
- Sync may be deferred in battery saver mode
- Eventually processes when conditions improve
- No excessive battery drain
- User experience remains acceptable

**Documentation:** Manual test in `docs/PWA_MANUAL_TESTING.md`

---

### 2.5 Sync Retry Logic

#### Test 2.5.1: Failed Sync Retries with Backoff
**Priority:** High
**Prerequisites:** Server returning 500 errors
**Steps:**
1. Queue sync operation
2. Go online but server returns error
3. Monitor retry attempts
4. Verify exponential backoff

**Expected Result:**
- First retry: immediate
- Second retry: 30s delay
- Third retry: 60s delay
- Max retries reached: persist for later

**Automated Test:** `tests/pwa/backgroundSync.test.ts` - `should retry failed sync with backoff`

---

#### Test 2.5.2: Sync Persists Across App Restarts
**Priority:** High
**Prerequisites:** Failed sync operations
**Steps:**
1. Queue operations that fail to sync
2. Close app completely
3. Wait, then reopen app
4. Verify operations still queued

**Expected Result:**
- Queue persisted in IndexedDB
- Operations reload on app start
- Retry logic resumes
- No data loss

**Automated Test:** `tests/pwa/backgroundSync.test.ts` - `should persist sync queue across restarts`

---

#### Test 2.5.3: Sync Queue Management and Limits
**Priority:** Medium
**Prerequisites:** Many operations queued
**Steps:**
1. Queue 100+ operations
2. Check queue size limits
3. Verify old operations pruned if needed
4. Test performance with large queue

**Expected Result:**
- Queue size limit enforced (e.g., 1000 items)
- Old completed operations cleaned up
- Failed operations kept until expired
- Performance remains acceptable

**Automated Test:** `tests/pwa/backgroundSync.test.ts` - `should manage queue size`

---

## 3. Push Notification Tests (11 scenarios)

### 3.1 Permission Management

#### Test 3.1.1: Permission Request Shown Appropriately
**Priority:** Critical
**Prerequisites:** Fresh browser profile, no permission state
**Steps:**
1. Navigate to notifications settings
2. Click "Enable Notifications"
3. Observe browser permission prompt
4. Grant permission

**Expected Result:**
- Permission prompt appears (not blocked)
- Request is contextual (triggered by user action)
- Prompt explains notification benefits
- Permission state saved

**Automated Test:** `tests/pwa/pushNotifications.test.ts` - `should request permission`

---

#### Test 3.1.2: Permission Denied Handled Gracefully
**Priority:** High
**Prerequisites:** No notification permission
**Steps:**
1. Request notification permission
2. Click "Block"
3. Observe UI feedback
4. Verify graceful degradation

**Expected Result:**
- UI shows notifications are disabled
- Guidance on how to enable in browser settings
- App functions normally otherwise
- No repeated permission requests

**Automated Test:** `tests/pwa/pushNotifications.test.ts` - `should handle denied permission`

---

#### Test 3.1.3: Permission Previously Granted Auto-Subscribes
**Priority:** Medium
**Prerequisites:** Notification permission granted in past
**Steps:**
1. Return to app with existing permission
2. Check subscription status
3. Verify subscription revalidation

**Expected Result:**
- Existing subscription checked
- Subscription renewed if expired
- User not prompted again
- Notifications work immediately

**Automated Test:** `tests/pwa/pushNotifications.test.ts` - `should reuse existing permission`

---

### 3.2 Subscription Management

#### Test 3.2.1: Subscription Created and Saved
**Priority:** Critical
**Prerequisites:** Permission granted, SW active
**Steps:**
1. Grant notification permission
2. Create push subscription
3. Send subscription to server
4. Verify storage

**Expected Result:**
- `pushManager.subscribe()` succeeds
- Subscription object contains endpoint and keys
- Subscription saved to server with user ID
- Local state updated

**Automated Test:** `tests/pwa/pushNotifications.test.ts` - `should create subscription`

---

#### Test 3.2.2: Subscription Renewal on Expiration
**Priority:** High
**Prerequisites:** Subscription with expiration time
**Steps:**
1. Check subscription expirationTime
2. If expired or soon to expire, renew
3. Update server with new subscription

**Expected Result:**
- Expiration detected automatically
- New subscription created
- Server updated transparently
- User unaware of renewal

**Automated Test:** `tests/pwa/pushNotifications.test.ts` - `should renew expired subscription`

---

#### Test 3.2.3: Unsubscribe Works Correctly
**Priority:** High
**Prerequisites:** Active subscription
**Steps:**
1. Navigate to notification settings
2. Toggle "Enable Notifications" off
3. Unsubscribe from push
4. Notify server

**Expected Result:**
- `subscription.unsubscribe()` called
- Server removes subscription from database
- Local state updated
- No more notifications sent

**Automated Test:** `tests/pwa/pushNotifications.test.ts` - `should unsubscribe`

---

### 3.3 Notification Display

#### Test 3.3.1: Notifications Received and Displayed
**Priority:** Critical
**Prerequisites:** Subscription active, server can send notifications
**Steps:**
1. Trigger test notification from server
2. Observe notification display
3. Verify content and appearance

**Expected Result:**
- Notification appears within seconds
- Title, body, and icon display correctly
- Notification follows OS style
- Multiple notifications stack properly

**Automated Test:** `tests/pwa/pushNotifications.test.ts` - `should display notification` (requires mock)

---

#### Test 3.3.2: Notification Actions Available
**Priority:** Medium
**Prerequisites:** Notification with action buttons
**Steps:**
1. Send notification with actions (View, Dismiss)
2. Display notification
3. Verify action buttons present

**Expected Result:**
- Action buttons visible in notification
- Correct labels and icons
- Actions functional (tested in next scenario)

**Automated Test:** `tests/pwa/pushNotifications.test.ts` - `should show notification actions`

---

#### Test 3.3.3: Click Action Opens Correct Page
**Priority:** Critical
**Prerequisites:** Notification displayed
**Steps:**
1. Display notification about shared list update
2. Click notification body
3. Observe navigation

**Expected Result:**
- App opens (or focuses if open)
- Navigates to correct page (e.g., shared list)
- Notification dismissed
- Correct context loaded

**Automated Test:** `tests/pwa/pushNotifications.test.ts` - `should handle notification click`

---

#### Test 3.3.4: Notification Action Button Click
**Priority:** Medium
**Prerequisites:** Notification with "View" and "Dismiss" actions
**Steps:**
1. Display notification
2. Click "View" action button
3. Verify behavior differs from body click

**Expected Result:**
- "View" action opens app to specific view
- "Dismiss" action closes notification
- Each action has correct handler
- Analytics tracked per action

**Automated Test:** `tests/pwa/pushNotifications.test.ts` - `should handle action click`

---

### 3.4 Notification Types

#### Test 3.4.1: List Shared Notification
**Priority:** High
**Prerequisites:** User B shares list with User A
**Steps:**
1. User B shares list
2. Server sends push to User A
3. User A sees notification

**Expected Result:**
- Notification title: "{User B} shared a list with you"
- Body: List name
- Click opens shared list
- Badge shows unread count

**Documentation:** Manual test in `docs/PWA_MANUAL_TESTING.md`

---

## 4. PWA Installation Tests (10 scenarios)

### 4.1 Install Prompt

#### Test 4.1.1: Install Prompt Appears on Supported Browsers
**Priority:** Critical
**Prerequisites:** Chrome/Edge, no prior install, meets PWA criteria
**Steps:**
1. Visit app multiple times
2. Spend 30+ seconds engaging
3. Observe beforeinstallprompt event
4. Check if install button appears

**Expected Result:**
- `beforeinstallprompt` event fires
- Install button visible in UI
- Browser may show own install prompt
- Prompt can be deferred and shown later

**Automated Test:** `tests/pwa/installation.test.ts` - `should capture install prompt`

---

#### Test 4.1.2: Install Prompt Dismissed Persists State
**Priority:** Medium
**Prerequisites:** Install prompt shown
**Steps:**
1. Show install prompt
2. User dismisses it
3. Check if prompt offered again
4. Verify dismissed state saved

**Expected Result:**
- Dismissed state saved to localStorage
- Prompt not shown again this session
- May be offered in future visit
- User can manually trigger from menu

**Automated Test:** `tests/pwa/installation.test.ts` - `should persist dismissed state`

---

### 4.2 Platform-Specific Installation

#### Test 4.2.1: App Installs Successfully on Android Chrome
**Priority:** Critical
**Type:** Manual
**Prerequisites:** Android device, Chrome browser
**Steps:**
1. Visit app in Chrome
2. Tap browser menu > "Install app" or "Add to Home Screen"
3. Confirm installation
4. Check home screen

**Expected Result:**
- App icon appears on home screen
- Icon uses high-res manifest icon
- App name appears below icon
- Tapping icon opens app

**Documentation:** Manual test in `docs/PWA_MANUAL_TESTING.md`

---

#### Test 4.2.2: App Installs Successfully on iOS Safari
**Priority:** Critical
**Type:** Manual
**Prerequisites:** iOS device, Safari browser
**Steps:**
1. Visit app in Safari
2. Tap Share button > "Add to Home Screen"
3. Confirm name and icon
4. Tap "Add"

**Expected Result:**
- App icon on home screen
- Limited PWA features on iOS (no background sync)
- Splash screen on launch
- Status bar styling applied

**Documentation:** Manual test in `docs/PWA_MANUAL_TESTING.md`

---

#### Test 4.2.3: App Installs Successfully on Desktop Chrome
**Priority:** High
**Type:** Manual
**Prerequisites:** Desktop Chrome/Edge
**Steps:**
1. Visit app
2. Click install button in omnibox or app UI
3. Confirm installation dialog
4. Check OS app list

**Expected Result:**
- App appears in Start Menu/Applications
- Desktop shortcut created (optional)
- App opens in standalone window
- Window has custom title bar

**Documentation:** Manual test in `docs/PWA_MANUAL_TESTING.md`

---

#### Test 4.2.4: App Installs Successfully on Desktop Edge
**Priority:** Medium
**Type:** Manual
**Prerequisites:** Desktop Edge browser
**Steps:**
1. Visit app in Edge
2. Click "Install" button in address bar
3. Confirm installation
4. Verify app in Windows/Mac apps

**Expected Result:**
- Similar to Chrome installation
- Edge-specific integrations available
- App listed in installed apps
- Uninstall option available

**Documentation:** Manual test in `docs/PWA_MANUAL_TESTING.md`

---

### 4.3 Installed App Behavior

#### Test 4.3.1: Installed App Opens in Standalone Mode
**Priority:** Critical
**Prerequisites:** App installed on any platform
**Steps:**
1. Launch installed app from home screen/start menu
2. Observe display mode
3. Check for browser UI

**Expected Result:**
- No browser address bar visible
- No browser tabs or navigation buttons
- Custom status bar color
- Full screen (minus OS status bar)

**Automated Test:** `tests/pwa/installation.test.ts` - `should detect standalone mode`

---

#### Test 4.3.2: Splash Screen Displays Correctly
**Priority:** Medium
**Prerequisites:** App installed, cold start
**Steps:**
1. Force stop app completely
2. Launch app
3. Observe splash screen during load
4. Verify branding

**Expected Result:**
- Splash screen shows immediately
- Uses manifest background_color
- Shows manifest icon
- Displays app name
- Transitions to app when loaded

**Documentation:** Manual test in `docs/PWA_MANUAL_TESTING.md`

---

#### Test 4.3.3: Manifest Properties Respected
**Priority:** High
**Prerequisites:** App installed
**Steps:**
1. Check manifest.json properties
2. Verify each property's effect
3. Test display, theme_color, orientation

**Expected Result:**
- display: "standalone" → no browser UI
- theme_color: status bar color correct
- background_color: splash screen matches
- orientation: app orientation locks if specified
- icons: correct sizes used per platform

**Automated Test:** `tests/pwa/installation.test.ts` - `should load manifest correctly`

---

#### Test 4.3.4: Installed App Uninstalls Cleanly
**Priority:** Medium
**Prerequisites:** App installed
**Steps:**
1. Uninstall app via OS method
2. Verify app removed from app list
3. Check if data cleared (or persisted)
4. Reinstall and verify state

**Expected Result:**
- App uninstalls without errors
- Icon removed from home screen
- Optional: data cleared on uninstall
- Can reinstall and restore data

**Documentation:** Manual test in `docs/PWA_MANUAL_TESTING.md`

---

## 5. Cache Management Tests (10 scenarios)

### 5.1 Cache Size Management

#### Test 5.1.1: Cache Size Limits Respected
**Priority:** High
**Prerequisites:** App with many assets
**Steps:**
1. Configure cache size limit (e.g., 50MB)
2. Load app with more assets than limit
3. Monitor cache size
4. Verify oldest/least-used items evicted

**Expected Result:**
- Cache stays under defined limit
- LRU (Least Recently Used) eviction policy
- Critical assets never evicted
- Performance maintained

**Automated Test:** `tests/pwa/cacheManagement.test.ts` - `should respect cache size limits`

---

#### Test 5.1.2: Cache Storage Quota Handling
**Priority:** Medium
**Prerequisites:** Browser storage quota limits
**Steps:**
1. Fill cache near quota
2. Attempt to cache more
3. Handle QuotaExceededError
4. Inform user if needed

**Expected Result:**
- Quota errors caught gracefully
- Older entries deleted to make space
- User notified if critical
- Persistent storage requested if available

**Automated Test:** `tests/pwa/cacheManagement.test.ts` - `should handle quota errors`

---

### 5.2 Cache Lifecycle

#### Test 5.2.1: Old Caches Cleaned Up on Activate
**Priority:** High
**Prerequisites:** Service worker update with new cache version
**Steps:**
1. Deploy SW v2 with CACHE_VERSION = 2
2. Wait for SW activation
3. Check cache storage
4. Verify only v2 caches remain

**Expected Result:**
- Old cache versions deleted
- New cache populated
- No orphaned caches
- Activation completes successfully

**Automated Test:** `tests/pwa/cacheManagement.test.ts` - `should delete old cache versions`

---

#### Test 5.2.2: Cache Invalidation on App Update
**Priority:** Critical
**Prerequisites:** New app version deployed
**Steps:**
1. User has v1.0 cached
2. Deploy v1.1 with updated assets
3. SW update triggers
4. Verify cache refreshed

**Expected Result:**
- All updated assets re-cached
- Old versions removed
- User gets latest assets after update
- Update process seamless

**Automated Test:** `tests/pwa/cacheManagement.test.ts` - `should invalidate cache on update`

---

#### Test 5.2.3: Partial Cache Update on SW Update
**Priority:** Medium
**Prerequisites:** SW update with some changed assets
**Steps:**
1. Only CSS and one JS file changed
2. Deploy SW update
3. Monitor cache updates
4. Verify only changed files re-fetched

**Expected Result:**
- Only modified assets downloaded
- Unchanged assets remain cached
- Faster update process
- Bandwidth conserved

**Automated Test:** `tests/pwa/cacheManagement.test.ts` - `should partially update cache`

---

### 5.3 Cache Strategies Implementation

#### Test 5.3.1: Network-First Strategy for API Calls
**Priority:** Critical
**Prerequisites:** Online, API available
**Steps:**
1. Make API request
2. Observe request flow
3. Go offline
4. Make same request
5. Verify cached fallback

**Expected Result:**
- Online: Network request attempted first
- Response cached for offline use
- Cache timeout: 5 minutes (configurable)
- Offline: Cache used as fallback

**Automated Test:** `tests/pwa/cacheManagement.test.ts` - `should use network-first for APIs`

---

#### Test 5.3.2: Cache-First Strategy for Static Assets
**Priority:** High
**Prerequisites:** Assets already cached
**Steps:**
1. Load page with cached assets
2. Check asset source (cache vs network)
3. Verify no network requests for cached items

**Expected Result:**
- Cache checked first
- Network fallback if not in cache
- Instant loading for cached assets
- Network only for cache misses

**Automated Test:** `tests/pwa/cacheManagement.test.ts` - `should use cache-first for assets`

---

#### Test 5.3.3: Stale-While-Revalidate for App Shell
**Priority:** Medium
**Prerequisites:** App shell cached
**Steps:**
1. Load app (cache served)
2. Background fetch initiated
3. Cache updated with fresh version
4. Next load uses updated version

**Expected Result:**
- Instant load from cache
- Background update seamless
- User never waits
- Always reasonably fresh content

**Automated Test:** `tests/pwa/cacheManagement.test.ts` - `should revalidate app shell`

---

### 5.4 Cache Debugging

#### Test 5.4.1: Cache Inspection in DevTools
**Priority:** Low
**Type:** Manual
**Prerequisites:** App running, caches populated
**Steps:**
1. Open DevTools > Application > Cache Storage
2. Expand cache entries
3. Inspect cached items
4. Delete individual items

**Expected Result:**
- All caches visible
- Cache entries inspectable
- Can view cached responses
- Can manually delete for testing

**Documentation:** In `docs/PWA_DEBUGGING.md`

---

#### Test 5.4.2: Cache Clear on Demand
**Priority:** Medium
**Prerequisites:** Caches populated
**Steps:**
1. Add "Clear Cache" option in app settings
2. User clicks clear cache
3. Verify all caches deleted
4. Verify app rebuilds cache

**Expected Result:**
- All app caches deleted (not browser cache)
- User sees confirmation
- Next page load rebuilds cache
- Useful for troubleshooting

**Automated Test:** `tests/pwa/cacheManagement.test.ts` - `should clear caches on demand`

---

#### Test 5.4.3: Cache Statistics and Monitoring
**Priority:** Low
**Prerequisites:** App with cache monitoring
**Steps:**
1. Open app settings/debug panel
2. View cache statistics
3. Check hit rate, size, entry count

**Expected Result:**
- Cache size displayed (MB)
- Number of cached items
- Cache hit/miss ratio
- Last updated timestamp

**Automated Test:** `tests/pwa/cacheManagement.test.ts` - `should provide cache stats`

---

## 6. Cross-Browser Tests (8 scenarios)

### 6.1 Chrome/Chromium

#### Test 6.1.1: Full PWA Support in Chrome
**Priority:** Critical
**Prerequisites:** Latest Chrome stable
**Steps:**
1. Test all PWA features in Chrome
2. Verify service worker, sync, notifications
3. Test installation
4. Verify offline functionality

**Expected Result:**
- All features fully supported
- No polyfills needed
- Excellent developer tools
- Reference implementation

**Documentation:** Results in `docs/PWA_MANUAL_TESTING.md`

---

#### Test 6.1.2: Chrome Android PWA Support
**Priority:** Critical
**Prerequisites:** Android device with Chrome
**Steps:**
1. Test PWA on Chrome Android
2. Verify installation flow
3. Test background sync
4. Test notifications

**Expected Result:**
- Full PWA support on mobile
- Background sync works when app closed
- Notifications display correctly
- Install prompt native

**Documentation:** Results in `docs/PWA_MANUAL_TESTING.md`

---

### 6.2 Firefox

#### Test 6.2.1: Firefox PWA Limitations
**Priority:** High
**Prerequisites:** Latest Firefox stable
**Steps:**
1. Test PWA in Firefox
2. Check service worker support
3. Verify background sync unavailable
4. Test fallback mechanisms

**Expected Result:**
- Service workers: Supported
- Background Sync: Not supported (use polling fallback)
- Notifications: Supported
- Installation: Limited (desktop only)

**Documentation:** Results in `docs/PWA_MANUAL_TESTING.md`

---

#### Test 6.2.2: Firefox Android PWA
**Priority:** Medium
**Prerequisites:** Android device with Firefox
**Steps:**
1. Load app in Firefox Android
2. Test service worker
3. Check for install prompt
4. Test offline functionality

**Expected Result:**
- Service workers work
- No native install on Android Firefox
- Can "Add to Home Screen" via browser
- Offline mode functional

**Documentation:** Results in `docs/PWA_MANUAL_TESTING.md`

---

### 6.3 Safari

#### Test 6.3.1: Safari PWA Limitations on macOS
**Priority:** High
**Prerequisites:** Latest Safari on macOS
**Steps:**
1. Test PWA in Safari macOS
2. Check service worker support
3. Test install capability
4. Document limitations

**Expected Result:**
- Service workers: Supported (with quirks)
- Push notifications: Supported (macOS Ventura+)
- Background sync: Not supported
- Installation: Supported via "Add to Dock"

**Documentation:** Results in `docs/PWA_MANUAL_TESTING.md`

---

#### Test 6.3.2: Safari iOS PWA Limitations
**Priority:** Critical
**Prerequisites:** iPhone/iPad with latest iOS
**Steps:**
1. Test PWA in Safari iOS
2. Add to Home Screen
3. Test offline functionality
4. Document iOS limitations

**Expected Result:**
- Service workers: Supported
- Push notifications: Supported (iOS 16.4+)
- Background sync: Not supported
- Installation: "Add to Home Screen" only
- Storage may be evicted if unused

**Documentation:** Results in `docs/PWA_MANUAL_TESTING.md`

---

### 6.4 Edge

#### Test 6.4.1: Edge Desktop PWA Support
**Priority:** Medium
**Prerequisites:** Latest Edge on Windows/macOS
**Steps:**
1. Test all PWA features in Edge
2. Compare with Chrome behavior
3. Test Windows-specific integrations

**Expected Result:**
- Full PWA support (Chromium-based)
- Windows integration (share target, etc.)
- Identical to Chrome behavior
- Good developer tools

**Documentation:** Results in `docs/PWA_MANUAL_TESTING.md`

---

#### Test 6.4.2: Cross-Browser Feature Parity Matrix
**Priority:** Medium
**Prerequisites:** Testing complete on all browsers
**Steps:**
1. Compile test results from all browsers
2. Create feature support matrix
3. Document workarounds needed
4. Update fallback code

**Expected Result:**
- Clear matrix of what works where
- Documented fallback strategies
- User experience consistent across browsers
- Graceful degradation everywhere

**Documentation:** Matrix in `docs/PWA_MANUAL_TESTING.md`

---

## 7. Performance Tests (5 scenarios)

### 7.1 Service Worker Performance

#### Test 7.1.1: SW Startup Time
**Priority:** Medium
**Prerequisites:** App with service worker
**Steps:**
1. Clear browser cache and SW
2. Load app
3. Measure time to SW active
4. Compare first visit vs repeat visit

**Expected Result:**
- First visit: SW registers and activates < 2s
- Repeat visit: SW active immediately
- Minimal impact on page load
- Assets start loading before SW ready

**Automated Test:** `tests/pwa/performance.test.ts` - `should measure SW startup time`

---

#### Test 7.1.2: Cache Hit Rate
**Priority:** Medium
**Prerequisites:** App used over time
**Steps:**
1. Track cache hits vs misses
2. Calculate hit rate percentage
3. Identify frequently missed assets
4. Optimize cache strategy

**Expected Result:**
- Cache hit rate > 80% for repeat visits
- Critical assets always cached
- API calls appropriately cached
- Metrics logged for monitoring

**Automated Test:** `tests/pwa/performance.test.ts` - `should track cache hit rate`

---

### 7.2 Background Sync Performance

#### Test 7.2.1: Sync Queue Processing Time
**Priority:** Medium
**Prerequisites:** Multiple items in sync queue
**Steps:**
1. Queue 50 operations offline
2. Go online
3. Measure time to process all
4. Verify no UI blocking

**Expected Result:**
- Processing time: < 5s for 50 items
- Operations batched efficiently
- UI remains responsive
- Progress indicator shown

**Automated Test:** `tests/pwa/performance.test.ts` - `should process sync queue efficiently`

---

### 7.3 Notification Performance

#### Test 7.3.1: Notification Display Latency
**Priority:** Low
**Prerequisites:** Push notification sent
**Steps:**
1. Send push notification from server
2. Measure time to display on device
3. Test with multiple concurrent notifications

**Expected Result:**
- Display latency < 5s typically
- Depends on device power state
- Multiple notifications don't block
- System handles queuing

**Automated Test:** Manual measurement documented

---

### 7.4 Installation Performance

#### Test 7.4.1: Time to Install Prompt Ready
**Priority:** Low
**Prerequisites:** Fresh browser, eligible for install
**Steps:**
1. Visit app
2. Measure time until install prompt capturable
3. Track engagement signals

**Expected Result:**
- Prompt ready after engagement heuristics met
- Chrome: typically 30s+ engagement
- Developer can control timing
- Prompt deferral works

**Automated Test:** `tests/pwa/performance.test.ts` - `should track install prompt timing`

---

## Test Execution

### Automated Test Execution

```bash
# Run all PWA tests
pnpm test tests/pwa

# Run specific test suites
pnpm test tests/pwa/serviceWorker.test.ts
pnpm test tests/pwa/backgroundSync.test.ts
pnpm test tests/pwa/cacheManagement.test.ts

# Run with coverage
pnpm test:coverage tests/pwa

# Watch mode for development
pnpm test:watch tests/pwa
```

### Manual Test Execution

1. Follow procedures in `docs/PWA_MANUAL_TESTING.md`
2. Test on each target platform
3. Document results in test tracker
4. File bugs for failures

### Test Environment Matrix

| Browser | Platform | Version | Priority | Notes |
|---------|----------|---------|----------|-------|
| Chrome | Desktop | Latest | High | Reference implementation |
| Chrome | Android | Latest | High | Full PWA support |
| Firefox | Desktop | Latest | Medium | Limited PWA features |
| Firefox | Android | Latest | Low | No native install |
| Safari | macOS | Latest | Medium | Push requires Ventura+ |
| Safari | iOS | Latest | High | Major limitations |
| Edge | Desktop | Latest | Medium | Chromium-based |

---

## Test Coverage Summary

| Category | Automated | Manual | Total |
|----------|-----------|--------|-------|
| Service Worker | 18 | 0 | 18 |
| Background Sync | 11 | 2 | 13 |
| Push Notifications | 10 | 1 | 11 |
| PWA Installation | 4 | 6 | 10 |
| Cache Management | 10 | 1 | 11 |
| Cross-Browser | 0 | 8 | 8 |
| Performance | 4 | 1 | 5 |
| **TOTAL** | **57** | **19** | **76** |

---

## Success Criteria

### Critical Features (Must Pass)
- [ ] Service worker registers and activates successfully
- [ ] Offline mode serves cached content
- [ ] Background sync queues operations when offline
- [ ] Sync processes when connectivity restored
- [ ] Notifications display when permission granted
- [ ] App installs on Chrome Android and iOS Safari
- [ ] Installed app opens in standalone mode

### Important Features (Should Pass)
- [ ] Service worker updates automatically
- [ ] Cache strategies optimize performance
- [ ] Failed syncs retry with backoff
- [ ] Notification clicks navigate correctly
- [ ] Cache size limits respected
- [ ] Cross-browser compatibility maintained

### Nice-to-Have Features (May Pass)
- [ ] Background sync works when app closed
- [ ] Splash screen displays on all platforms
- [ ] Cache statistics available
- [ ] Performance metrics meet targets

---

## Known Issues and Limitations

### Safari iOS
- Background sync not supported (use polling fallback)
- Storage may be evicted after 7 days of inactivity
- Push notifications require iOS 16.4+

### Firefox
- Background Sync API not supported
- PWA install limited to desktop
- Android: No native install experience

### General
- Push notifications require user permission
- Service workers require HTTPS
- Some features require recent browser versions
- Battery saver mode may delay background operations

---

## Related Documentation

- [PWA Manual Testing Guide](./PWA_MANUAL_TESTING.md)
- [PWA Debugging Guide](./PWA_DEBUGGING.md)
- [Offline Architecture](./OFFLINE_ARCHITECTURE.md)
- [Performance Testing](./PERFORMANCE.md)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-26
**Test Coverage:** 76 scenarios (57 automated, 19 manual)
