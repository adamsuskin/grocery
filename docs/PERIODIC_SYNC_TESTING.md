# Periodic Background Sync Testing Guide

**Project:** Grocery List App
**Document Type:** Testing Procedures
**Version:** 1.0
**Last Updated:** October 2025
**Audience:** QA Engineers, Developers

---

## Table of Contents

1. [Overview](#overview)
2. [Manual Testing Checklist](#manual-testing-checklist)
3. [DevTools Testing Procedures](#devtools-testing-procedures)
4. [Cross-Browser Testing Guide](#cross-browser-testing-guide)
5. [Performance Testing](#performance-testing)
6. [Edge Case Scenarios](#edge-case-scenarios)
7. [Automated Testing](#automated-testing)
8. [Integration Testing](#integration-testing)
9. [Regression Testing](#regression-testing)
10. [Test Data and Fixtures](#test-data-and-fixtures)

---

## Overview

This document provides comprehensive testing procedures for the Periodic Background Sync feature in the Grocery List App. It covers manual testing, automated testing, and various edge cases to ensure reliable functionality across all supported browsers.

### Testing Strategy

**Testing Pyramid:**

```
         ┌─────────────┐
         │   E2E Tests │  (Few)
         │  Playwright │
         └──────┬──────┘
                │
        ┌───────▼───────┐
        │Integration Tests│  (Some)
        │  Jest + MSW     │
        └────────┬────────┘
                 │
         ┌───────▼────────┐
         │  Unit Tests    │  (Many)
         │  Jest + Vitest │
         └────────────────┘
```

**Test Levels:**

1. **Unit Tests:** Test individual functions and components
2. **Integration Tests:** Test component interactions
3. **E2E Tests:** Test complete user workflows
4. **Manual Tests:** Exploratory and real-device testing

---

## Manual Testing Checklist

### Prerequisites

**Environment Setup:**

- [ ] HTTPS enabled (or using localhost)
- [ ] Service worker registered successfully
- [ ] PWA installed to home screen
- [ ] Valid web app manifest
- [ ] Test data prepared

**Browser Requirements:**

- [ ] Chrome 80+ (Desktop)
- [ ] Chrome 80+ (Android)
- [ ] Edge 80+ (Desktop)
- [ ] Samsung Internet 13+ (Android device)
- [ ] Firefox (for fallback testing)
- [ ] Safari (for fallback testing)

### Feature Testing

#### Test 1: Periodic Sync Registration

**Objective:** Verify periodic sync can be registered successfully

**Steps:**

1. Open the app in Chrome
2. Install PWA (Add to Home Screen)
3. Open Settings → Sync Settings
4. Toggle "Enable Periodic Background Sync" to ON
5. Open Chrome DevTools (F12)
6. Navigate to Application → Service Workers
7. Run in console:
   ```javascript
   navigator.serviceWorker.ready.then(async reg => {
     const tags = await reg.periodicSync.getTags();
     console.log('Tags:', tags);
   });
   ```

**Expected Results:**

- [ ] Toggle switches to ON without error
- [ ] Success notification appears
- [ ] Console shows `['grocery-sync']` in tags array
- [ ] No errors in console

**Actual Results:**

_[Fill during testing]_

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

#### Test 2: Manual Sync Trigger

**Objective:** Verify sync can be triggered manually via DevTools

**Steps:**

1. Ensure periodic sync is registered (Test 1)
2. Open Chrome DevTools → Application → Service Workers
3. Click "periodicSync" button
4. Observe console logs
5. Check Network tab for sync requests
6. Verify data in Application → IndexedDB

**Expected Results:**

- [ ] Sync starts immediately
- [ ] Console shows "[PeriodicSync] Event received"
- [ ] Network shows successful API calls
- [ ] IndexedDB updated with new data
- [ ] Sync completes within 30 seconds

**Actual Results:**

_[Fill during testing]_

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

#### Test 3: Background Sync Monitoring

**Objective:** Monitor sync events in Background Services

**Steps:**

1. Open DevTools → Application → Background Services
2. Select "Periodic Background Sync"
3. Click "Start recording"
4. Trigger sync manually (Test 2)
5. Review recorded events
6. Check event details (timestamp, tag, result)

**Expected Results:**

- [ ] Events recorded successfully
- [ ] Shows correct tag ('grocery-sync')
- [ ] Shows success status
- [ ] Timestamp is accurate
- [ ] Can export event log

**Actual Results:**

_[Fill during testing]_

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

#### Test 4: Real-World Sync (12+ Hours)

**Objective:** Verify automatic sync occurs in real-world usage

**Prerequisites:**

- Install PWA
- Use app regularly (daily) for engagement
- Close app

**Steps:**

1. Register periodic sync
2. Use app for 5 minutes
3. Close app completely
4. Wait 12-24 hours
5. Check sync history in Settings → Sync History
6. Verify last sync timestamp

**Expected Results:**

- [ ] Sync occurs within 24 hours
- [ ] Sync history shows successful sync
- [ ] Timestamp is accurate
- [ ] Data is current when app reopens

**Actual Results:**

_[Fill during testing]_

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

#### Test 5: Offline Queue Processing

**Objective:** Verify offline mutations sync during periodic sync

**Steps:**

1. Go offline (Airplane mode or DevTools)
2. Add 3 grocery items
3. Verify items queued (check offline queue status)
4. Go online
5. Trigger periodic sync manually
6. Check that queued items synced
7. Verify items appear for other users

**Expected Results:**

- [ ] Items queued when offline
- [ ] Queue count shows 3 pending
- [ ] Sync processes all queued items
- [ ] Queue count becomes 0 after sync
- [ ] Items synced to server
- [ ] Other users see new items

**Actual Results:**

_[Fill during testing]_

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

#### Test 6: Sync State Indicators

**Objective:** Verify UI updates correctly during sync

**Steps:**

1. Observe sync status indicator in header
2. Trigger periodic sync manually
3. Watch status indicator during sync
4. Verify status after sync completes
5. Check sync history in Settings

**Expected Results:**

- [ ] Shows "Idle" before sync
- [ ] Shows "Syncing" with spinner during sync
- [ ] Shows "Synced" with green checkmark after
- [ ] Auto-hides after 3 seconds
- [ ] History shows completed sync

**Actual Results:**

_[Fill during testing]_

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

#### Test 7: Battery Constraints

**Objective:** Verify sync respects battery level

**Prerequisites:**

- Android device or battery emulation

**Steps:**

1. Set battery to 15% (low)
2. Trigger periodic sync
3. Observe behavior
4. Set battery to 50%
5. Trigger periodic sync again
6. Compare results

**Expected Results:**

- [ ] Sync skipped or delayed at 15% battery
- [ ] Console logs reason for skip
- [ ] Sync proceeds at 50% battery
- [ ] User notified if sync skipped

**Actual Results:**

_[Fill during testing]_

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

#### Test 8: Network Constraints

**Objective:** Verify sync prefers WiFi connections

**Prerequisites:**

- Mobile device with cellular data

**Steps:**

1. Connect to cellular data
2. Trigger periodic sync
3. Observe network usage
4. Connect to WiFi
5. Trigger periodic sync again
6. Compare behavior

**Expected Results:**

- [ ] Sync works on cellular (but may be delayed)
- [ ] Sync is immediate on WiFi
- [ ] Network type logged in console
- [ ] User preference respected (WiFi-only setting)

**Actual Results:**

_[Fill during testing]_

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

#### Test 9: Unregistration

**Objective:** Verify periodic sync can be disabled

**Steps:**

1. Verify sync is registered (Test 1)
2. Open Settings → Sync Settings
3. Toggle "Enable Periodic Background Sync" to OFF
4. Verify in DevTools:
   ```javascript
   navigator.serviceWorker.ready.then(async reg => {
     const tags = await reg.periodicSync.getTags();
     console.log('Tags:', tags);
   });
   ```

**Expected Results:**

- [ ] Toggle switches to OFF without error
- [ ] Console shows empty tags array `[]`
- [ ] No syncs occur after unregistration
- [ ] Can re-register successfully

**Actual Results:**

_[Fill during testing]_

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

#### Test 10: Fallback on Unsupported Browser

**Objective:** Verify fallback strategy works on Firefox/Safari

**Steps:**

1. Open app in Firefox or Safari
2. Verify periodic sync not supported:
   ```javascript
   'periodicSync' in ServiceWorkerRegistration.prototype
   ```
3. Toggle sync setting
4. Verify fallback strategy active
5. Change tab away from app
6. Return to app
7. Verify sync occurred

**Expected Results:**

- [ ] API not supported (returns false)
- [ ] Fallback strategy enabled automatically
- [ ] Visibility events trigger sync
- [ ] Sync occurs when returning to app
- [ ] User notified of fallback mode

**Actual Results:**

_[Fill during testing]_

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| 1. Registration | ☐ Pass ☐ Fail | |
| 2. Manual Trigger | ☐ Pass ☐ Fail | |
| 3. Monitoring | ☐ Pass ☐ Fail | |
| 4. Real-World Sync | ☐ Pass ☐ Fail | |
| 5. Offline Queue | ☐ Pass ☐ Fail | |
| 6. UI Indicators | ☐ Pass ☐ Fail | |
| 7. Battery | ☐ Pass ☐ Fail | |
| 8. Network | ☐ Pass ☐ Fail | |
| 9. Unregistration | ☐ Pass ☐ Fail | |
| 10. Fallback | ☐ Pass ☐ Fail | |

**Overall Test Pass Rate:** __%

**Critical Issues Found:** __

**Blockers:** __

---

## DevTools Testing Procedures

### Chrome DevTools

#### Setup

1. **Open DevTools:**
   - Press F12 or Ctrl+Shift+I (Cmd+Opt+I on Mac)
   - Or right-click → Inspect

2. **Enable Service Worker Updates:**
   - Navigate to Application tab
   - Select Service Workers
   - Check "Update on reload"

3. **Enable Background Services Recording:**
   - Navigate to Application → Background Services
   - Select "Periodic Background Sync"
   - Click "Start recording"

#### Testing Procedures

**Procedure 1: Verify Registration**

```javascript
// In DevTools Console
(async () => {
  // Check support
  const supported = 'periodicSync' in ServiceWorkerRegistration.prototype;
  console.log('Periodic sync supported:', supported);

  if (!supported) return;

  // Get registration
  const reg = await navigator.serviceWorker.ready;

  // Register
  await reg.periodicSync.register('test-sync', {
    minInterval: 12 * 60 * 60 * 1000
  });

  // Verify
  const tags = await reg.periodicSync.getTags();
  console.log('Registered tags:', tags);
})();
```

**Expected Output:**
```
Periodic sync supported: true
Registered tags: ['test-sync']
```

---

**Procedure 2: Trigger Sync Manually**

```javascript
// Method 1: DevTools UI
// 1. Application → Service Workers
// 2. Click "periodicSync" button

// Method 2: Console
(async () => {
  // Post message to service worker
  const reg = await navigator.serviceWorker.ready;
  const sw = reg.active;

  if (sw) {
    sw.postMessage({
      type: 'TRIGGER_PERIODIC_SYNC',
      tag: 'grocery-sync'
    });
  }
})();
```

**Expected Behavior:**
- Console shows sync start/complete messages
- Network tab shows API requests
- IndexedDB updated

---

**Procedure 3: Monitor Sync Performance**

```javascript
// Add performance monitoring
(async () => {
  const startTime = performance.now();

  // Listen for sync complete message
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.type === 'SYNC_COMPLETE') {
      const duration = performance.now() - startTime;
      console.log('Sync completed in:', duration, 'ms');
      console.log('Data synced:', event.data);
    }
  });

  // Trigger sync
  const reg = await navigator.serviceWorker.ready;
  // ... trigger sync
})();
```

---

**Procedure 4: Test Offline Behavior**

```javascript
// Simulate offline
(async () => {
  // Go offline
  console.log('Going offline...');
  // Use DevTools Network tab → Offline checkbox

  // Try sync
  const reg = await navigator.serviceWorker.ready;

  try {
    await reg.periodicSync.register('offline-test');
    console.log('✅ Registered while offline');
  } catch (error) {
    console.error('❌ Registration failed:', error);
  }

  // Go online
  console.log('Going online...');
  // Uncheck Offline in Network tab

  // Check if sync occurs
  const tags = await reg.periodicSync.getTags();
  console.log('Current tags:', tags);
})();
```

---

**Procedure 5: Debug Service Worker**

```javascript
// Get service worker info
(async () => {
  const reg = await navigator.serviceWorker.ready;

  console.log('Service Worker Info:');
  console.log('- State:', reg.active?.state);
  console.log('- Script URL:', reg.active?.scriptURL);
  console.log('- Scope:', reg.scope);

  // Get all registrations
  const regs = await navigator.serviceWorker.getRegistrations();
  console.log('Total registrations:', regs.length);

  regs.forEach((r, i) => {
    console.log(`Registration ${i}:`, {
      scope: r.scope,
      updateViaCache: r.updateViaCache,
    });
  });
})();
```

---

**Procedure 6: Clear and Reset**

```javascript
// Clear all data and reset
(async () => {
  // Unregister periodic sync
  const reg = await navigator.serviceWorker.ready;
  const tags = await reg.periodicSync.getTags();

  for (const tag of tags) {
    await reg.periodicSync.unregister(tag);
    console.log('Unregistered:', tag);
  }

  // Clear caches
  const cacheNames = await caches.keys();
  for (const name of cacheNames) {
    await caches.delete(name);
    console.log('Deleted cache:', name);
  }

  // Clear IndexedDB (be careful!)
  // indexedDB.deleteDatabase('zero-cache');

  // Unregister service worker
  await reg.unregister();
  console.log('Service worker unregistered');

  console.log('✅ Reset complete');
})();
```

### Chrome Internals Pages

#### chrome://serviceworker-internals

**Test Procedure:**

1. Navigate to `chrome://serviceworker-internals`
2. Find your app's service worker
3. Verify:
   - [ ] Status is "ACTIVATED"
   - [ ] Scope is correct
   - [ ] Version is current
4. Actions:
   - Click "Stop" to test restart
   - Click "Unregister" to remove
   - Click "Inspect" to debug

**Expected State:**
```
Service Worker:
- Status: ACTIVATED
- Running Status: RUNNING
- Script URL: https://your-app.com/sw.js
- Scope: https://your-app.com/
- Periodic Sync: Registered
```

#### chrome://site-engagement

**Test Procedure:**

1. Navigate to `chrome://site-engagement`
2. Find your app's domain
3. Check engagement score
4. Note:
   - Higher score = more frequent syncs
   - Minimum score needed: ~10
   - Maximum score: 100

**Interpreting Scores:**

| Score | Engagement Level | Sync Frequency |
|-------|------------------|----------------|
| 0-10 | Very Low | Rare/Never |
| 10-30 | Low | Every 24-48 hours |
| 30-60 | Medium | Every 12-24 hours |
| 60-100 | High | Every 12 hours (minimum) |

#### chrome://inspect

**Test Procedure (Mobile):**

1. Connect Android device via USB
2. Enable USB debugging on device
3. Navigate to `chrome://inspect`
4. Find your device
5. Click "inspect" on your app
6. Use DevTools remotely

**Checklist:**

- [ ] Device detected
- [ ] App listed
- [ ] DevTools connects
- [ ] Can view console
- [ ] Can inspect elements
- [ ] Can debug service worker

---

## Cross-Browser Testing Guide

### Chrome Desktop

**Version:** 80+

**Test Matrix:**

| Test Case | Pass | Fail | Skip | Notes |
|-----------|------|------|------|-------|
| Registration | ☐ | ☐ | ☐ | |
| Manual trigger | ☐ | ☐ | ☐ | |
| Auto sync (12h) | ☐ | ☐ | ☐ | |
| Offline queue | ☐ | ☐ | ☐ | |
| Battery respect | ☐ | ☐ | ☐ | |
| Network respect | ☐ | ☐ | ☐ | |
| Unregistration | ☐ | ☐ | ☐ | |

**Testing Notes:**

_[Record observations, performance metrics, issues]_

---

### Chrome Android

**Version:** 80+
**Device:** _[Specify device model]_

**Test Matrix:**

| Test Case | Pass | Fail | Skip | Notes |
|-----------|------|------|------|-------|
| Registration | ☐ | ☐ | ☐ | |
| Manual trigger | ☐ | ☐ | ☐ | |
| Auto sync (12h) | ☐ | ☐ | ☐ | |
| Offline queue | ☐ | ☐ | ☐ | |
| Battery respect | ☐ | ☐ | ☐ | |
| Network respect | ☐ | ☐ | ☐ | |
| App standby bucket | ☐ | ☐ | ☐ | |
| Doze mode | ☐ | ☐ | ☐ | |

**Android-Specific Tests:**

1. **App Standby Bucket Test:**
   ```bash
   # Check current bucket
   adb shell dumpsys usagestats | grep your.package.name

   # Set to different buckets and test
   adb shell am set-standby-bucket your.package.name ACTIVE
   # Test sync behavior

   adb shell am set-standby-bucket your.package.name RARE
   # Test sync behavior
   ```

2. **Doze Mode Test:**
   ```bash
   # Enter doze mode
   adb shell dumpsys battery unplug
   adb shell dumpsys deviceidle force-idle

   # Check if sync occurs
   adb logcat | grep -i periodic

   # Exit doze mode
   adb shell dumpsys deviceidle unforce
   adb shell dumpsys battery reset
   ```

**Testing Notes:**

_[Record observations, battery impact, issues]_

---

### Edge Desktop

**Version:** 80+

**Test Matrix:**

| Test Case | Pass | Fail | Skip | Notes |
|-----------|------|------|------|-------|
| Registration | ☐ | ☐ | ☐ | |
| Manual trigger | ☐ | ☐ | ☐ | |
| Auto sync (12h) | ☐ | ☐ | ☐ | |
| Offline queue | ☐ | ☐ | ☐ | |
| Windows integration | ☐ | ☐ | ☐ | Edge-specific |
| Sync when closed | ☐ | ☐ | ☐ | Edge-specific |

**Edge-Specific Tests:**

1. **Test Sync with Browser Closed:**
   - Register periodic sync
   - Close Edge completely
   - Wait 12+ hours
   - Check if sync occurred (Task Scheduler integration)

**Testing Notes:**

_[Record observations, Windows integration behavior]_

---

### Samsung Internet

**Version:** 13.0+
**Device:** _[Specify Samsung device model]_

**Test Matrix:**

| Test Case | Pass | Fail | Skip | Notes |
|-----------|------|------|------|-------|
| Registration | ☐ | ☐ | ☐ | |
| Manual trigger | ☐ | ☐ | ☐ | |
| Auto sync (12h) | ☐ | ☐ | ☐ | |
| Offline queue | ☐ | ☐ | ☐ | |
| Battery respect | ☐ | ☐ | ☐ | |
| Samsung DeX mode | ☐ | ☐ | ☐ | Samsung-specific |

**Samsung-Specific Tests:**

1. **DeX Mode Test:**
   - Connect to DeX
   - Test sync behavior
   - Compare to mobile mode

2. **Battery Optimization:**
   - Check Samsung battery settings
   - Test with power saving modes
   - Test with game launcher optimizations

**Testing Notes:**

_[Record observations, Samsung-specific behavior]_

---

### Firefox (Fallback Testing)

**Version:** Latest

**Test Matrix:**

| Test Case | Pass | Fail | Skip | Notes |
|-----------|------|------|------|-------|
| Periodic sync unsupported | ☐ | ☐ | ☐ | Should be false |
| Background sync supported | ☐ | ☐ | ☐ | Should be true |
| Fallback to background sync | ☐ | ☐ | ☐ | |
| Visibility events | ☐ | ☐ | ☐ | |
| Focus events | ☐ | ☐ | ☐ | |
| Online events | ☐ | ☐ | ☐ | |

**Fallback Tests:**

1. **Visibility Event Test:**
   ```javascript
   // Monitor visibility events
   let visibilityCount = 0;
   document.addEventListener('visibilitychange', () => {
     if (!document.hidden) {
       visibilityCount++;
       console.log('Visibility sync triggered:', visibilityCount);
     }
   });

   // Switch tabs and return
   // Verify sync occurred
   ```

2. **Background Sync Test:**
   ```javascript
   // Register background sync
   navigator.serviceWorker.ready.then(async reg => {
     await reg.sync.register('firefox-sync');
     console.log('Background sync registered');

     // Go offline
     // Make changes
     // Go online
     // Verify sync occurred
   });
   ```

**Testing Notes:**

_[Record fallback behavior, user experience]_

---

### Safari (Fallback Testing)

**Version:** Latest
**Platform:** macOS / iOS

**Test Matrix:**

| Test Case | Pass | Fail | Skip | Notes |
|-----------|------|------|------|-------|
| Periodic sync unsupported | ☐ | ☐ | ☐ | Should be false |
| Background sync unsupported | ☐ | ☐ | ☐ | Should be false |
| Visibility events | ☐ | ☐ | ☐ | |
| Focus events | ☐ | ☐ | ☐ | |
| Online events | ☐ | ☐ | ☐ | |
| pageshow events | ☐ | ☐ | ☐ | Safari-specific |

**Safari-Specific Tests:**

1. **Storage Limit Test:**
   ```javascript
   // Check storage quota
   navigator.storage.estimate().then(estimate => {
     console.log('Used:', estimate.usage);
     console.log('Quota:', estimate.quota);
     // iOS typically shows ~50MB
   });
   ```

2. **7-Day Purge Test:**
   - Add data to IndexedDB
   - Close app
   - Change device date forward 7 days
   - Reopen app
   - Check if data persists

3. **pageshow Event Test:**
   ```javascript
   // Monitor pageshow events (bfcache)
   window.addEventListener('pageshow', (event) => {
     if (event.persisted) {
       console.log('Loaded from bfcache, triggering sync');
       syncData();
     }
   });
   ```

**iOS-Specific Tests:**

1. **PWA Installation:**
   - Share → Add to Home Screen
   - Verify standalone mode
   - Test sync behavior

2. **Background Restrictions:**
   - Minimize app
   - Wait various durations
   - Check if SW still active

**Testing Notes:**

_[Record Safari/iOS-specific behavior, limitations]_

---

## Performance Testing

### Performance Metrics

**Key Metrics to Measure:**

1. **Sync Duration**
   - Target: < 10 seconds
   - Maximum: 30 seconds

2. **Data Transfer**
   - Target: < 1 MB per sync
   - Maximum: 5 MB per sync

3. **Memory Usage**
   - Target: < 50 MB increase during sync
   - Maximum: 100 MB increase

4. **CPU Usage**
   - Target: < 25% CPU during sync
   - Maximum: 50% CPU during sync

5. **Battery Impact**
   - Target: < 1% battery per sync
   - Maximum: 2% battery per sync

### Performance Test Procedures

#### Test 1: Sync Duration

**Procedure:**

```javascript
// Measure sync duration
async function measureSyncDuration() {
  const measurements = [];

  for (let i = 0; i < 10; i++) {
    const start = performance.now();

    await triggerSync();

    const duration = performance.now() - start;
    measurements.push(duration);

    console.log(`Sync ${i + 1}: ${duration.toFixed(2)}ms`);

    // Wait before next test
    await sleep(5000);
  }

  const average = measurements.reduce((a, b) => a + b) / measurements.length;
  const min = Math.min(...measurements);
  const max = Math.max(...measurements);

  console.log('Performance Results:');
  console.log(`Average: ${average.toFixed(2)}ms`);
  console.log(`Min: ${min.toFixed(2)}ms`);
  console.log(`Max: ${max.toFixed(2)}ms`);

  // Check against targets
  if (average > 10000) {
    console.warn('⚠️ Average duration exceeds target (10s)');
  }
  if (max > 30000) {
    console.error('❌ Maximum duration exceeds limit (30s)');
  }
}

measureSyncDuration();
```

**Results:**

| Run | Duration (ms) | Status |
|-----|---------------|--------|
| 1 | | ☐ Pass ☐ Fail |
| 2 | | ☐ Pass ☐ Fail |
| 3 | | ☐ Pass ☐ Fail |
| 4 | | ☐ Pass ☐ Fail |
| 5 | | ☐ Pass ☐ Fail |
| 6 | | ☐ Pass ☐ Fail |
| 7 | | ☐ Pass ☐ Fail |
| 8 | | ☐ Pass ☐ Fail |
| 9 | | ☐ Pass ☐ Fail |
| 10 | | ☐ Pass ☐ Fail |

**Average:** _____ ms
**Min:** _____ ms
**Max:** _____ ms

**Status:** ☐ Pass ☐ Fail

---

#### Test 2: Data Transfer Size

**Procedure:**

```javascript
// Measure data transfer
async function measureDataTransfer() {
  // Clear performance entries
  performance.clearResourceTimings();

  // Trigger sync
  await triggerSync();

  // Get network entries
  const entries = performance.getEntriesByType('resource');
  const syncEntries = entries.filter(e =>
    e.name.includes('/api/sync') || e.name.includes('/api/zero')
  );

  let totalSize = 0;

  syncEntries.forEach(entry => {
    const size = entry.transferSize || 0;
    totalSize += size;
    console.log(`${entry.name}: ${(size / 1024).toFixed(2)} KB`);
  });

  const totalMB = totalSize / (1024 * 1024);
  console.log(`Total data transferred: ${totalMB.toFixed(2)} MB`);

  // Check against targets
  if (totalMB > 1) {
    console.warn('⚠️ Data transfer exceeds target (1 MB)');
  }
  if (totalMB > 5) {
    console.error('❌ Data transfer exceeds limit (5 MB)');
  }

  return totalMB;
}

measureDataTransfer();
```

**Results:**

| Request | Size (KB) | Cached |
|---------|-----------|--------|
| /api/sync | | ☐ |
| /api/zero/... | | ☐ |
| ... | | ☐ |

**Total:** _____ MB

**Status:** ☐ Pass ☐ Fail

---

#### Test 3: Memory Usage

**Procedure:**

```javascript
// Measure memory usage
async function measureMemoryUsage() {
  if (!('memory' in performance)) {
    console.warn('Memory API not available');
    return;
  }

  const memory = (performance as any).memory;

  const before = {
    used: memory.usedJSHeapSize,
    total: memory.totalJSHeapSize,
    limit: memory.jsHeapSizeLimit,
  };

  console.log('Memory before sync:');
  console.log(`Used: ${(before.used / 1024 / 1024).toFixed(2)} MB`);

  // Trigger sync
  await triggerSync();

  const after = {
    used: memory.usedJSHeapSize,
    total: memory.totalJSHeapSize,
    limit: memory.jsHeapSizeLimit,
  };

  console.log('Memory after sync:');
  console.log(`Used: ${(after.used / 1024 / 1024).toFixed(2)} MB`);

  const increase = (after.used - before.used) / 1024 / 1024;
  console.log(`Memory increase: ${increase.toFixed(2)} MB`);

  // Check against targets
  if (increase > 50) {
    console.warn('⚠️ Memory increase exceeds target (50 MB)');
  }
  if (increase > 100) {
    console.error('❌ Memory increase exceeds limit (100 MB)');
  }

  return increase;
}

measureMemoryUsage();
```

**Results:**

| Metric | Before Sync | After Sync | Increase |
|--------|-------------|------------|----------|
| Used Heap | _____ MB | _____ MB | _____ MB |
| Total Heap | _____ MB | _____ MB | _____ MB |

**Status:** ☐ Pass ☐ Fail

---

#### Test 4: Battery Impact (Mobile)

**Procedure:**

**Android:**

```bash
# Monitor battery usage
adb shell dumpsys battery > battery_before.txt

# Wait for sync to occur (or trigger manually)
# ... wait ...

adb shell dumpsys battery > battery_after.txt

# Compare files
diff battery_before.txt battery_after.txt
```

**Manual Monitoring:**

1. Note battery percentage before test
2. Trigger sync
3. Wait 5 minutes
4. Note battery percentage after
5. Calculate drain

**Results:**

| Time | Battery % | Event |
|------|-----------|-------|
| 0:00 | _____ | Start |
| 0:00 | _____ | Sync triggered |
| 0:01 | _____ | Sync complete |
| 5:00 | _____ | End |

**Total Drain:** _____ %

**Status:** ☐ Pass ☐ Fail

---

### Performance Test Results Summary

| Test | Target | Actual | Status |
|------|--------|--------|--------|
| Sync Duration | < 10s | _____ s | ☐ Pass ☐ Fail |
| Data Transfer | < 1 MB | _____ MB | ☐ Pass ☐ Fail |
| Memory Usage | < 50 MB | _____ MB | ☐ Pass ☐ Fail |
| Battery Impact | < 1% | _____ % | ☐ Pass ☐ Fail |

**Overall Performance:** ☐ Pass ☐ Fail

**Notes:**

_[Record any performance issues, bottlenecks, optimization opportunities]_

---

## Edge Case Scenarios

### Scenario 1: Concurrent Syncs

**Description:** Multiple sync events triggered simultaneously

**Setup:**

```javascript
// Trigger multiple syncs at once
async function testConcurrentSyncs() {
  const promises = [];

  for (let i = 0; i < 5; i++) {
    promises.push(triggerSync());
  }

  try {
    await Promise.all(promises);
    console.log('✅ All syncs completed');
  } catch (error) {
    console.error('❌ Concurrent sync error:', error);
  }
}
```

**Expected Behavior:**

- [ ] Only one sync executes at a time (mutex)
- [ ] Other syncs queued or rejected gracefully
- [ ] No data corruption
- [ ] No race conditions

**Actual Behavior:**

_[Record observations]_

**Status:** ☐ Pass ☐ Fail

---

### Scenario 2: Large Data Sync

**Description:** Sync with 1000+ items

**Setup:**

```javascript
// Create large dataset
async function testLargeDataSync() {
  // Add 1000 items
  const items = [];
  for (let i = 0; i < 1000; i++) {
    items.push({
      id: `item-${i}`,
      name: `Item ${i}`,
      // ... other fields
    });
  }

  // Trigger sync
  const start = performance.now();
  await syncData(items);
  const duration = performance.now() - start;

  console.log(`Synced ${items.length} items in ${duration}ms`);
}
```

**Expected Behavior:**

- [ ] Sync completes within 30 seconds
- [ ] Memory usage stays under limit
- [ ] No UI freezing
- [ ] Batch processing works correctly

**Actual Behavior:**

_[Record performance, memory, time]_

**Status:** ☐ Pass ☐ Fail

---

### Scenario 3: Network Interruption During Sync

**Description:** Network drops mid-sync

**Setup:**

1. Start sync
2. After 2 seconds, go offline (DevTools Network tab)
3. Observe behavior
4. Go back online
5. Verify recovery

**Expected Behavior:**

- [ ] Sync fails gracefully
- [ ] Partial data not saved (atomicity)
- [ ] Retry scheduled automatically
- [ ] User notified of failure

**Actual Behavior:**

_[Record error handling, retry behavior]_

**Status:** ☐ Pass ☐ Fail

---

### Scenario 4: Expired Auth Token

**Description:** Auth token expires during sync

**Setup:**

```javascript
// Mock expired token
async function testExpiredToken() {
  // Set expired token
  await setAuthToken('expired-token');

  // Trigger sync
  try {
    await triggerSync();
    console.log('❌ Should have failed with 401');
  } catch (error) {
    if (error.status === 401) {
      console.log('✅ Correctly detected expired token');
    }
  }

  // Verify refresh attempt
  const newToken = await getAuthToken();
  console.log('New token:', newToken ? 'refreshed' : 'still expired');
}
```

**Expected Behavior:**

- [ ] Sync fails with 401 error
- [ ] Token refresh attempted automatically
- [ ] Sync retried with new token
- [ ] User prompted if refresh fails

**Actual Behavior:**

_[Record token refresh behavior]_

**Status:** ☐ Pass ☐ Fail

---

### Scenario 5: Rapid App Open/Close

**Description:** User rapidly opens and closes app

**Setup:**

1. Install PWA
2. Open app
3. Immediately close
4. Repeat 10 times quickly
5. Check for errors or memory leaks

**Expected Behavior:**

- [ ] No errors thrown
- [ ] Memory cleaned up properly
- [ ] Service worker remains stable
- [ ] Sync state correct

**Actual Behavior:**

_[Record stability, errors, memory]_

**Status:** ☐ Pass ☐ Fail

---

### Scenario 6: Device Storage Full

**Description:** Insufficient storage for sync data

**Setup:**

```javascript
// Fill storage to near capacity
async function testStorageFull() {
  // Check available storage
  const estimate = await navigator.storage.estimate();
  const available = estimate.quota! - estimate.usage!;

  console.log(`Available storage: ${(available / 1024 / 1024).toFixed(2)} MB`);

  if (available < 5 * 1024 * 1024) {
    console.log('Storage is low, triggering sync...');

    try {
      await triggerSync();
      console.log('✅ Sync completed despite low storage');
    } catch (error) {
      console.log('❌ Sync failed:', error.message);
      // Should show quota error
    }
  }
}
```

**Expected Behavior:**

- [ ] Sync fails gracefully with quota error
- [ ] User notified of storage issue
- [ ] Old cache data cleaned up automatically
- [ ] Sync retried after cleanup

**Actual Behavior:**

_[Record quota handling]_

**Status:** ☐ Pass ☐ Fail

---

### Scenario 7: Time Zone Change

**Description:** Device time zone changes

**Setup:**

1. Sync at time T
2. Change device time zone
3. Trigger sync again
4. Verify timestamps correct

**Expected Behavior:**

- [ ] Timestamps stored in UTC
- [ ] Time zone change doesn't affect sync
- [ ] Sync history displays correctly
- [ ] No duplicate syncs

**Actual Behavior:**

_[Record timestamp handling]_

**Status:** ☐ Pass ☐ Fail

---

### Scenario 8: Service Worker Update During Sync

**Description:** Service worker updates while sync in progress

**Setup:**

1. Start long-running sync
2. Deploy new service worker
3. Observe behavior
4. Verify sync completes

**Expected Behavior:**

- [ ] Sync completes on old SW
- [ ] New SW waits for sync to finish
- [ ] No data loss
- [ ] Clean transition to new SW

**Actual Behavior:**

_[Record SW update behavior]_

**Status:** ☐ Pass ☐ Fail

---

### Edge Case Results Summary

| Scenario | Pass | Fail | Notes |
|----------|------|------|-------|
| Concurrent Syncs | ☐ | ☐ | |
| Large Data | ☐ | ☐ | |
| Network Interruption | ☐ | ☐ | |
| Expired Token | ☐ | ☐ | |
| Rapid Open/Close | ☐ | ☐ | |
| Storage Full | ☐ | ☐ | |
| Time Zone Change | ☐ | ☐ | |
| SW Update | ☐ | ☐ | |

**Critical Issues:** ____

**Notes:**

_[Record any critical findings]_

---

## Automated Testing

### Unit Tests (Jest/Vitest)

**Test File:** `src/utils/__tests__/periodicSync.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  registerPeriodicSync,
  unregisterPeriodicSync,
  isPeriodicSyncSupported,
  getPeriodicSyncTags,
} from '../periodicSync';

describe('periodicSync utilities', () => {
  let mockRegistration: any;
  let mockPeriodicSync: any;

  beforeEach(() => {
    // Mock ServiceWorkerRegistration
    mockPeriodicSync = {
      register: vi.fn(),
      unregister: vi.fn(),
      getTags: vi.fn(),
    };

    mockRegistration = {
      periodicSync: mockPeriodicSync,
    };

    // Mock navigator.serviceWorker
    global.navigator = {
      serviceWorker: {
        ready: Promise.resolve(mockRegistration),
      },
    } as any;

    // Mock ServiceWorkerRegistration.prototype
    (global as any).ServiceWorkerRegistration = {
      prototype: {
        periodicSync: {},
      },
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('isPeriodicSyncSupported', () => {
    it('should return true when periodicSync is supported', () => {
      expect(isPeriodicSyncSupported()).toBe(true);
    });

    it('should return false when periodicSync is not supported', () => {
      delete (global as any).ServiceWorkerRegistration.prototype.periodicSync;

      expect(isPeriodicSyncSupported()).toBe(false);
    });

    it('should return false when serviceWorker is not available', () => {
      delete (global.navigator as any).serviceWorker;

      expect(isPeriodicSyncSupported()).toBe(false);
    });
  });

  describe('registerPeriodicSync', () => {
    it('should register periodic sync successfully', async () => {
      mockPeriodicSync.register.mockResolvedValue(undefined);

      const result = await registerPeriodicSync('test-sync');

      expect(result).toBe(true);
      expect(mockPeriodicSync.register).toHaveBeenCalledWith(
        'test-sync',
        { minInterval: 12 * 60 * 60 * 1000 }
      );
    });

    it('should use custom interval when provided', async () => {
      mockPeriodicSync.register.mockResolvedValue(undefined);

      const customInterval = 24 * 60 * 60 * 1000; // 24 hours
      await registerPeriodicSync('test-sync', customInterval);

      expect(mockPeriodicSync.register).toHaveBeenCalledWith(
        'test-sync',
        { minInterval: customInterval }
      );
    });

    it('should return false when registration fails', async () => {
      mockPeriodicSync.register.mockRejectedValue(new Error('Registration failed'));

      const result = await registerPeriodicSync('test-sync');

      expect(result).toBe(false);
    });

    it('should return false when periodicSync is not supported', async () => {
      delete (global as any).ServiceWorkerRegistration.prototype.periodicSync;

      const result = await registerPeriodicSync('test-sync');

      expect(result).toBe(false);
      expect(mockPeriodicSync.register).not.toHaveBeenCalled();
    });
  });

  describe('unregisterPeriodicSync', () => {
    it('should unregister periodic sync successfully', async () => {
      mockPeriodicSync.unregister.mockResolvedValue(undefined);

      const result = await unregisterPeriodicSync('test-sync');

      expect(result).toBe(true);
      expect(mockPeriodicSync.unregister).toHaveBeenCalledWith('test-sync');
    });

    it('should return false when unregistration fails', async () => {
      mockPeriodicSync.unregister.mockRejectedValue(new Error('Unregistration failed'));

      const result = await unregisterPeriodicSync('test-sync');

      expect(result).toBe(false);
    });

    it('should return false when periodicSync is not supported', async () => {
      delete (global as any).ServiceWorkerRegistration.prototype.periodicSync;

      const result = await unregisterPeriodicSync('test-sync');

      expect(result).toBe(false);
      expect(mockPeriodicSync.unregister).not.toHaveBeenCalled();
    });
  });

  describe('getPeriodicSyncTags', () => {
    it('should return list of registered tags', async () => {
      const mockTags = ['sync-1', 'sync-2', 'sync-3'];
      mockPeriodicSync.getTags.mockResolvedValue(mockTags);

      const tags = await getPeriodicSyncTags();

      expect(tags).toEqual(mockTags);
      expect(mockPeriodicSync.getTags).toHaveBeenCalled();
    });

    it('should return empty array when no tags registered', async () => {
      mockPeriodicSync.getTags.mockResolvedValue([]);

      const tags = await getPeriodicSyncTags();

      expect(tags).toEqual([]);
    });

    it('should return empty array when periodicSync is not supported', async () => {
      delete (global as any).ServiceWorkerRegistration.prototype.periodicSync;

      const tags = await getPeriodicSyncTags();

      expect(tags).toEqual([]);
      expect(mockPeriodicSync.getTags).not.toHaveBeenCalled();
    });

    it('should return empty array on error', async () => {
      mockPeriodicSync.getTags.mockRejectedValue(new Error('Failed to get tags'));

      const tags = await getPeriodicSyncTags();

      expect(tags).toEqual([]);
    });
  });
});
```

**Run Tests:**

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch

# Run specific file
npm test periodicSync.test.ts
```

**Expected Coverage:**

- [ ] Lines: > 90%
- [ ] Functions: > 90%
- [ ] Branches: > 80%
- [ ] Statements: > 90%

---

### Integration Tests

**Test File:** `src/__tests__/periodicSync.integration.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestEnvironment, teardownTestEnvironment } from './testUtils';

describe('Periodic Sync Integration', () => {
  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  it('should sync data end-to-end', async () => {
    // 1. Register periodic sync
    // 2. Trigger sync
    // 3. Verify data updated
    // 4. Check IndexedDB
    // 5. Verify UI updated
  });

  it('should handle offline queue correctly', async () => {
    // 1. Go offline
    // 2. Make changes
    // 3. Verify queued
    // 4. Go online
    // 5. Trigger sync
    // 6. Verify synced
  });

  it('should respect user preferences', async () => {
    // 1. Disable periodic sync
    // 2. Verify unregistered
    // 3. Enable periodic sync
    // 4. Verify registered
  });
});
```

---

### E2E Tests (Playwright)

**Test File:** `e2e/periodicSync.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Periodic Background Sync', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant permissions
    await context.grantPermissions(['notifications']);

    // Navigate to app
    await page.goto('https://localhost:3000');

    // Wait for service worker
    await page.waitForFunction(() => {
      return navigator.serviceWorker.controller !== null;
    });
  });

  test('should register periodic sync', async ({ page }) => {
    // Navigate to settings
    await page.click('[data-testid="settings-button"]');
    await page.click('[data-testid="sync-settings"]');

    // Enable periodic sync
    const toggle = page.locator('[data-testid="periodic-sync-toggle"]');
    await toggle.click();

    // Verify registration
    const isRegistered = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.ready;
      if (!('periodicSync' in reg)) return false;

      const tags = await reg.periodicSync.getTags();
      return tags.includes('grocery-sync');
    });

    expect(isRegistered).toBe(true);
  });

  test('should trigger manual sync', async ({ page }) => {
    // Click sync button
    await page.click('[data-testid="sync-button"]');

    // Wait for sync complete
    await page.waitForSelector('[data-testid="sync-status"][data-state="synced"]');

    // Verify sync occurred
    const syncHistory = await page.locator('[data-testid="sync-history-item"]').count();
    expect(syncHistory).toBeGreaterThan(0);
  });

  test('should handle fallback on unsupported browser', async ({ page }) => {
    // Mock unsupported browser
    await page.addInitScript(() => {
      delete (ServiceWorkerRegistration as any).prototype.periodicSync;
    });

    // Reload page
    await page.reload();

    // Check fallback warning
    const warning = page.locator('[data-testid="fallback-warning"]');
    await expect(warning).toBeVisible();
    await expect(warning).toContainText('Periodic sync not supported');
  });
});
```

**Run E2E Tests:**

```bash
# Run all E2E tests
npx playwright test

# Run specific test
npx playwright test periodicSync.spec.ts

# Run with UI
npx playwright test --ui

# Debug mode
npx playwright test --debug
```

---

## Integration Testing

### Test with Zero Client

```typescript
// Test periodic sync with Zero integration
describe('Zero + Periodic Sync Integration', () => {
  it('should sync Zero data periodically', async () => {
    // 1. Add item via Zero
    await zero.mutate.grocery_items.create({
      id: 'test-item-1',
      name: 'Test Item',
      list_id: 'test-list',
    });

    // 2. Trigger periodic sync
    await triggerPeriodicSync();

    // 3. Verify item synced to server
    const serverItem = await fetch('/api/items/test-item-1');
    expect(serverItem.ok).toBe(true);

    // 4. Verify IndexedDB updated
    const dbItem = await getFromIndexedDB('items', 'test-item-1');
    expect(dbItem).toBeDefined();
    expect(dbItem.name).toBe('Test Item');
  });
});
```

### Test with Service Worker

```typescript
// Test service worker sync handler
describe('Service Worker Sync Handler', () => {
  it('should handle periodicsync event', async () => {
    // 1. Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    // 2. Dispatch periodicsync event
    const sw = registration.active!;
    sw.postMessage({
      type: 'TEST_PERIODIC_SYNC',
      tag: 'test-sync',
    });

    // 3. Wait for sync complete message
    const message = await new Promise((resolve) => {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SYNC_COMPLETE') {
          resolve(event.data);
        }
      });
    });

    // 4. Verify sync completed
    expect(message).toBeDefined();
    expect(message.success).toBe(true);
  });
});
```

---

## Regression Testing

### Regression Test Suite

**Test Cases to Run After Changes:**

1. [ ] Periodic sync registration
2. [ ] Manual sync trigger
3. [ ] Automatic sync (12h)
4. [ ] Offline queue processing
5. [ ] Battery constraints
6. [ ] Network constraints
7. [ ] Fallback strategies
8. [ ] UI sync indicators
9. [ ] Cross-browser compatibility
10. [ ] Performance benchmarks

**Regression Test Checklist:**

After any code changes to sync-related modules:

- [ ] Run full unit test suite
- [ ] Run integration tests
- [ ] Run E2E tests
- [ ] Manual smoke test on Chrome
- [ ] Manual smoke test on Android Chrome
- [ ] Check performance metrics
- [ ] Verify no console errors
- [ ] Test fallback on Firefox
- [ ] Test fallback on Safari

---

## Test Data and Fixtures

### Sample Test Data

```typescript
// Test fixtures
export const testData = {
  users: [
    { id: 'user-1', name: 'Test User 1', email: 'user1@test.com' },
    { id: 'user-2', name: 'Test User 2', email: 'user2@test.com' },
  ],

  lists: [
    { id: 'list-1', name: 'Test List 1', owner_id: 'user-1' },
    { id: 'list-2', name: 'Test List 2', owner_id: 'user-2' },
  ],

  items: [
    {
      id: 'item-1',
      name: 'Test Item 1',
      list_id: 'list-1',
      checked: false,
      created_at: Date.now(),
    },
    {
      id: 'item-2',
      name: 'Test Item 2',
      list_id: 'list-1',
      checked: true,
      created_at: Date.now(),
    },
  ],
};

// Test utilities
export async function seedTestData() {
  // Seed database with test data
  await db.insertInto('users').values(testData.users).execute();
  await db.insertInto('lists').values(testData.lists).execute();
  await db.insertInto('items').values(testData.items).execute();
}

export async function clearTestData() {
  // Clear all test data
  await db.deleteFrom('items').execute();
  await db.deleteFrom('lists').execute();
  await db.deleteFrom('users').execute();
}
```

---

## Testing Checklist Summary

### Pre-Release Testing

Before releasing periodic sync feature:

**Functional Tests:**
- [ ] All manual tests pass
- [ ] All automated tests pass
- [ ] Cross-browser tests complete
- [ ] Edge cases handled
- [ ] Fallbacks working

**Performance Tests:**
- [ ] Sync duration < 10s average
- [ ] Data transfer < 1 MB
- [ ] Memory usage acceptable
- [ ] Battery impact minimal

**Compatibility Tests:**
- [ ] Chrome Desktop ✅
- [ ] Chrome Android ✅
- [ ] Edge Desktop ✅
- [ ] Samsung Internet ✅
- [ ] Firefox (fallback) ✅
- [ ] Safari (fallback) ✅

**User Experience:**
- [ ] Clear UI indicators
- [ ] Helpful error messages
- [ ] Settings easy to find
- [ ] Fallback seamless

**Documentation:**
- [ ] User guide complete
- [ ] Developer docs complete
- [ ] Testing docs complete
- [ ] FAQ updated

### Sign-Off

**QA Lead:** _________________ Date: _______

**Developer:** _________________ Date: _______

**Product Manager:** _________________ Date: _______

---

**Document Version:** 1.0
**Last Updated:** October 2025
**Maintainer:** QA Team

For implementation details, see [PERIODIC_SYNC.md](./PERIODIC_SYNC.md).
For architecture details, see [PERIODIC_SYNC_ARCHITECTURE.md](./PERIODIC_SYNC_ARCHITECTURE.md).
For browser compatibility, see [PERIODIC_SYNC_BROWSER_SUPPORT.md](./PERIODIC_SYNC_BROWSER_SUPPORT.md).
