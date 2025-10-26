# Progressive Web App (PWA) User Guide

## What is a Progressive Web App?

A Progressive Web App (PWA) is a modern web application that can be installed on your device and works like a native app. The Grocery List PWA gives you:

- **Install on Any Device**: Add the app to your home screen on mobile, tablet, or desktop
- **Works Offline**: Continue using the app even without internet connection
- **Fast Loading**: Instant loading with intelligent caching
- **Background Sync**: Changes sync automatically in the background
- **Push Notifications**: Get notified when lists are updated (optional)
- **No App Store Required**: Install directly from your browser
- **Always Up-to-Date**: Automatically updates to the latest version
- **Less Storage**: Uses less space than native apps

### Benefits for Users

- **Convenience**: Access the app directly from your home screen
- **Speed**: Faster than opening a browser and navigating to the site
- **Offline Access**: View and edit lists without internet connection
- **Automatic Sync**: Changes sync when connection is restored
- **Native-Like Experience**: Full-screen mode without browser UI
- **Cross-Platform**: Same experience on Android, iOS, and desktop
- **No Updates Required**: App updates automatically in the background

---

## Installing the App

The Grocery List PWA can be installed on Android, iOS, and desktop browsers. Installation is quick and free!

### Android (Chrome/Edge/Samsung Internet)

#### Method 1: Install Banner (Easiest)

1. Open the Grocery List app in Chrome browser
2. Look for a banner at the bottom or top saying "Add Grocery List to Home screen"
3. Tap **"Install"** or **"Add to Home Screen"**
4. Confirm by tapping **"Install"** in the popup
5. The app icon will appear on your home screen
6. Tap the icon to launch the app

#### Method 2: Browser Menu

1. Open the Grocery List app in Chrome
2. Tap the **three-dot menu** (⋮) in the top-right corner
3. Select **"Add to Home screen"** or **"Install app"**
4. Enter a name for the app (default: "Grocery List")
5. Tap **"Add"** or **"Install"**
6. The app appears on your home screen

#### What to Expect

- App installs in 1-2 seconds
- Icon appears on home screen with other apps
- Opens in full-screen mode (no browser UI)
- Behaves like a native Android app
- Can be found in app drawer and app switcher
- Can be uninstalled like any other app

### iOS (Safari)

#### Installation Steps

1. Open the Grocery List app in **Safari browser** (must use Safari, not Chrome)
2. Tap the **Share button** (square with arrow pointing up) at the bottom
3. Scroll down and tap **"Add to Home Screen"**
4. Edit the name if desired (default: "Grocery List")
5. Tap **"Add"** in the top-right corner
6. The app icon appears on your home screen
7. Tap the icon to launch the app

#### iOS Limitations

Due to Apple's restrictions, the iOS version has some limitations:

- **No Background Sync**: App must be open to sync changes
- **No Push Notifications**: Cannot receive notifications when app is closed
- **Browser Context**: Still runs in Safari context (not a true standalone app)
- **Manual Updates**: Must refresh page to get latest version
- **No Install Banner**: Must manually add from Share menu

**Note**: Despite these limitations, the iOS version still works offline and provides a fast, app-like experience!

### Desktop (Chrome/Edge)

#### Method 1: Install Banner

1. Open the Grocery List app in Chrome or Edge browser
2. Look for the **install icon** (⊕ or computer icon) in the address bar
3. Click the icon
4. Click **"Install"** in the popup dialog
5. The app opens in a standalone window
6. App appears in your Start Menu (Windows) or Applications folder (Mac)

#### Method 2: Browser Menu

**Chrome:**
1. Open the Grocery List app
2. Click the **three-dot menu** (⋮) in the top-right
3. Hover over **"Save and share"** or **"Apps"**
4. Click **"Install Grocery List"**
5. Click **"Install"** in the confirmation dialog

**Edge:**
1. Open the Grocery List app
2. Click the **three-dot menu** (⋯) in the top-right
3. Select **"Apps"** → **"Install this site as an app"**
4. Enter a name and click **"Install"**

#### What to Expect

- App opens in its own window (no browser tabs or address bar)
- Pinned to taskbar (Windows) or dock (Mac) automatically
- Found in Start Menu (Windows) or Applications folder (Mac)
- Can be launched with keyboard shortcuts
- Runs alongside other desktop apps
- Window size and position are remembered

### Desktop (Firefox)

**Note**: Firefox does not currently support PWA installation. You can:
- Bookmark the app for quick access
- Use Chrome or Edge for full PWA experience
- Still use all features in the browser

### Desktop (Safari on Mac)

**Note**: Safari on Mac has limited PWA support. Recommendations:
- Use Chrome or Edge for best experience
- Create a dock shortcut by dragging the URL
- Safari works but without installation features

---

## Using the App Offline

One of the best features of the Grocery List PWA is offline support. Here's how it works:

### What Works Offline

- **View All Lists**: Browse all your grocery lists
- **View Items**: See all items in each list
- **Add Items**: Add new items to lists
- **Edit Items**: Modify item names, quantities, categories, notes, prices
- **Mark Items**: Toggle gotten/not gotten status
- **Delete Items**: Remove items from lists
- **Search & Filter**: Use search and category filters
- **Sort Items**: Sort by name, quantity, date, or category
- **Bulk Operations**: Mark all gotten or delete all gotten items
- **View Members**: See list members and their permissions
- **Create Lists**: Start new grocery lists
- **Export Lists**: Export to JSON, CSV, or text

### What Requires Internet

- **Initial Login**: Must be online to log in (session persists offline)
- **Sharing Lists**: Adding members or generating invite links
- **Real-Time Sync**: Changes from other users appear when online
- **Push Notifications**: Notifications require connection
- **Profile Updates**: Changing email or password

### How Offline Mode Works

#### 1. Automatic Offline Detection

When you lose internet connection:
- App automatically enters offline mode
- Offline indicator appears (usually a cloud icon with an X)
- All changes are queued locally
- You can continue using the app normally

#### 2. Local Storage

The app stores data locally on your device:
- All lists and items are cached
- Changes are saved to IndexedDB (browser database)
- Data persists even if you close the app
- Storage quota: typically 50-100MB (browser dependent)

#### 3. Offline Queue

When offline, all changes are queued:
- Each change is timestamped
- Changes are stored in order
- Queue persists across app restarts
- Queue is visible in the status indicator

**Example:**
```
Offline - 5 changes pending
├── Added "Milk" to Weekly Shopping
├── Marked "Eggs" as gotten
├── Updated quantity of "Apples"
├── Deleted "Old item"
└── Created new list "Party Supplies"
```

#### 4. Automatic Sync When Online

When internet connection is restored:
- App automatically detects connection
- Syncing indicator appears
- Changes are sent to server in order
- Conflicts are resolved automatically
- Success notification appears
- Offline queue is cleared

#### 5. Conflict Resolution

If you edited an item offline and someone else edited it online:
- **Last Write Wins**: Most recent change is kept
- **Field-Level Merge**: Different field changes are merged
- **Gotten Status**: Prefers "gotten" over "not gotten"
- **Manual Resolution**: Complex conflicts show a resolution dialog

### Offline Tips

**Best Practices:**
- Keep the app installed for better offline performance
- Don't close the browser/app while syncing
- Wait for "Synced" indicator before going offline again
- Check pending changes count before closing app

**Troubleshooting:**
- If sync fails, check your internet connection
- Failed items remain in queue for automatic retry
- Use "Retry Failed" button if needed
- Restart app if sync gets stuck

---

## Background Sync

Background sync allows the app to sync changes even when it's closed or in the background.

### How Background Sync Works

#### On Android and Desktop

1. You make changes while offline
2. Close the app or put phone in pocket
3. Device regains internet connection
4. Service worker wakes up automatically
5. Changes sync in the background
6. Notification appears when sync completes (if enabled)

**Benefits:**
- No need to keep app open
- Syncs automatically when online
- Battery efficient (uses native APIs)
- Reliable sync even on unstable connections

#### On iOS

Unfortunately, iOS Safari does not support Background Sync API:
- App must be open to sync changes
- Changes sync when you open the app
- Keep app open until "Synced" appears
- Offline queue persists until next app launch

### Visual Examples

#### Sync Status Indicator

The status indicator shows sync state:

**Online and Synced:**
```
✓ All changes synced
```

**Offline with Pending Changes:**
```
⚠ Offline - 3 changes pending
```

**Syncing in Progress:**
```
⟳ Syncing... (2 of 5 items)
```

**Sync Failed:**
```
✗ Sync failed - 2 items
[Retry] button
```

#### Sync Flow Diagram

```
[User makes change]
       ↓
[Online?] ─Yes→ [Sync immediately] → [✓ Synced]
       ↓
      No
       ↓
[Add to queue] → [Store locally]
       ↓
[User closes app]
       ↓
[Device goes online]
       ↓
[Service worker wakes up]
       ↓
[Process queue] → [Sync all changes]
       ↓
[Show notification: "5 changes synced"]
       ↓
[✓ All synced]
```

### Background Sync Settings

You can control background sync behavior:

1. Go to **Settings** or **Profile** menu
2. Find **"Sync & Offline"** section
3. Toggle **"Enable Background Sync"** (default: on)
4. Choose sync notification preference

**Options:**
- **Always notify**: Show notification after every sync
- **Only on errors**: Only notify if sync fails
- **Never notify**: Silent background sync

---

## Push Notifications

Stay informed about list updates with push notifications.

### What Notifications Do

Get notified when:
- Someone adds items to a shared list
- Someone marks items as gotten
- Someone shares a list with you
- You're added or removed from a list
- Your permission level changes
- Sync completes in the background (optional)

### Enabling Notifications

#### First-Time Setup

1. Open the Grocery List app
2. Look for the notification prompt at the top
3. Click **"Enable Notifications"**
4. Click **"Allow"** in the browser permission dialog
5. Notifications are now enabled!

#### Manual Setup

If you missed the prompt:

1. Go to **Profile** menu (your name/icon)
2. Select **"Settings"** or **"Notifications"**
3. Click **"Enable Notifications"**
4. Allow browser permissions
5. Choose notification preferences

### Notification Settings

Customize what notifications you receive:

**Notification Types:**
- **List Activity**: Someone adds/edits items
- **List Changes**: List renamed, shared, or deleted
- **Member Updates**: Added, removed, or permission changed
- **Sync Events**: Background sync completed or failed
- **System Alerts**: App updates or important announcements

**Settings for Each Type:**
- **Enabled**: Receive these notifications
- **Disabled**: Don't receive these notifications
- **Priority Only**: Only for important lists or urgent events

**Quiet Hours:**
- Set hours to mute notifications (e.g., 10 PM - 7 AM)
- Notifications still arrive but don't make sound
- Badge count still updates

### Managing Notifications

#### On Android

**Per-App Settings:**
1. Long-press a notification
2. Tap **"All categories"** or gear icon
3. Choose notification preferences
4. Options: Sound, vibration, popup, badge

**System Settings:**
1. Open **Settings** → **Apps** → **Grocery List**
2. Tap **"Notifications"**
3. Configure notification channels
4. Can disable specific types

#### On iOS

**Note**: iOS Safari does not support push notifications for PWAs. You will not receive notifications when the app is closed.

**Workaround:**
- Keep app open for sync notifications
- Check app regularly for updates
- Use email notifications (if available)

#### On Desktop

**Chrome/Edge:**
1. Click the notification
2. Click **"Settings"** or gear icon
3. Choose notification preferences
4. Can mute specific sites

**System Settings:**
1. Open OS notification settings
2. Find **"Grocery List"**
3. Configure notification style
4. Choose sound and banner preferences

### Disabling Notifications

**In the App:**
1. Go to **Settings** → **"Notifications"**
2. Toggle **"Enable Notifications"** to off
3. Or disable specific notification types

**In Browser:**
1. Click the lock icon in address bar
2. Find **"Notifications"**
3. Select **"Block"** or **"Ask"**

**Note**: You can re-enable notifications anytime from app settings.

---

## Updating the App

The Grocery List PWA automatically updates to the latest version.

### Automatic Updates

The app checks for updates:
- Every time you open it
- Periodically while it's running
- When you reconnect to the internet

**Update Process:**
1. New version is detected
2. Update is downloaded in the background
3. Update prompt appears when ready
4. Click **"Update Now"** to apply
5. App refreshes with new version

### Update Prompt

When an update is available:

```
┌─────────────────────────────────────┐
│  New version available!             │
│                                     │
│  Version 2.1.0 is ready to install  │
│                                     │
│  [Update Now]  [Later]              │
└─────────────────────────────────────┘
```

**Options:**
- **Update Now**: Refreshes app immediately (recommended)
- **Later**: Continues with current version (updates on next restart)

**Note**: If you choose "Later", the update will apply automatically the next time you open the app.

### Manual Update Check

To force check for updates:

1. Go to **Settings** or **About**
2. Find **"App Version"** section
3. Click **"Check for Updates"**
4. If available, update prompt appears

**Current Version Display:**
```
App Version: 2.0.5
Last Updated: October 20, 2025
[Check for Updates]
```

### What's New in Updates

After updating, you'll see a "What's New" dialog:

```
┌─────────────────────────────────────┐
│  What's New in Version 2.1.0        │
│                                     │
│  ✓ New: Price tracking features     │
│  ✓ Improved: Faster sync times      │
│  ✓ Fixed: Offline sync bugs         │
│                                     │
│  [Got It]                           │
└─────────────────────────────────────┘
```

Dismiss by clicking **"Got It"** or close the dialog.

### Update Notifications

You can enable update notifications:

1. Go to **Settings** → **"Notifications"**
2. Enable **"App Updates"**
3. Get notified when updates are available

### Version History

View past versions:

1. Go to **Settings** → **"About"**
2. Scroll to **"Version History"**
3. See changelog for all previous versions

### Troubleshooting Updates

**Update Not Appearing:**
- Close and reopen the app
- Clear browser cache (Settings → Privacy → Clear Cache)
- Reinstall the app (uninstall, then reinstall)

**Update Fails:**
- Check internet connection
- Wait a few minutes and try again
- Reload the page manually (Ctrl+R or Cmd+R)
- Contact support if issue persists

---

## Uninstalling the App

If you need to remove the Grocery List PWA, here's how:

### Android

#### Method 1: Home Screen
1. Long-press the **Grocery List** icon on your home screen
2. Drag it to **"Remove"** or **"Uninstall"** at the top
3. Confirm **"Uninstall"** (not just "Remove from Home Screen")
4. App is uninstalled

#### Method 2: App Drawer
1. Open your app drawer
2. Long-press **"Grocery List"**
3. Select **"Uninstall"** or tap the info icon
4. Tap **"Uninstall"**
5. Confirm the action

#### Method 3: System Settings
1. Open **Settings** → **Apps** → **Grocery List**
2. Tap **"Uninstall"**
3. Confirm to remove the app

### iOS

1. Long-press the **Grocery List** icon on home screen
2. Tap **"Remove App"** or the (−) icon
3. Select **"Delete App"** (not "Remove from Home Screen")
4. Confirm **"Delete"**
5. App is removed

### Desktop (Chrome/Edge)

#### Method 1: App Window
1. Open the Grocery List app
2. Click the **three-dot menu** (⋮) in the top-right
3. Select **"Uninstall Grocery List"** or **"Remove from Chrome/Edge"**
4. Confirm **"Remove"**

#### Method 2: Browser Settings
**Chrome:**
1. Go to `chrome://apps`
2. Right-click **"Grocery List"**
3. Select **"Remove from Chrome"**
4. Confirm removal

**Edge:**
1. Go to `edge://apps`
2. Right-click **"Grocery List"**
3. Select **"Remove from Microsoft Edge"**
4. Confirm removal

#### Method 3: System Apps
**Windows:**
1. Open **Settings** → **Apps** → **Installed Apps**
2. Find **"Grocery List"**
3. Click the three-dot menu → **"Uninstall"**

**Mac:**
1. Open **Chrome** → **Settings** → **Apps**
2. Find **"Grocery List"**
3. Click **"Remove"**

### What Happens When You Uninstall

**Data:**
- Your account and lists are NOT deleted
- All data remains on the server
- You can access it by logging in at the website
- Local cached data is removed from your device

**Reinstalling:**
- Install the app again anytime
- Log in with your account
- All your lists and items will reappear
- No data loss from uninstalling

---

## Troubleshooting

### App Not Installing

**Symptoms:**
- No install prompt appears
- "Install" button is missing
- Installation fails with error

**Solutions:**

**Check Browser Support:**
- Android: Use Chrome, Edge, or Samsung Internet (not Firefox)
- iOS: Use Safari (Chrome and Firefox don't support PWA install on iOS)
- Desktop: Use Chrome or Edge (Firefox and Safari have limited support)

**Check Installation Criteria:**
1. Must be served over HTTPS (or localhost for development)
2. Must have a valid Web App Manifest
3. Must have a registered service worker
4. Must meet browser-specific requirements

**Troubleshooting Steps:**
1. **Reload the page**: Press Ctrl+R (Windows) or Cmd+R (Mac)
2. **Clear cache**: Browser Settings → Privacy → Clear Browsing Data
3. **Update browser**: Ensure you're using the latest version
4. **Check storage**: Ensure device has enough storage space
5. **Disable extensions**: Some ad blockers interfere with PWA install
6. **Try incognito mode**: Test if extensions are the issue

**iOS-Specific:**
- Must use Safari browser (not Chrome or Firefox)
- Must manually add via Share → Add to Home Screen
- No automatic install prompt on iOS

**Still Not Working:**
- Access via regular browser as a fallback
- Contact support with browser version and device info

### Notifications Not Working

**Symptoms:**
- No notifications appear
- Notification permission denied
- Notifications work sometimes, not always

**Solutions:**

**1. Check Permissions**

**Browser Permissions:**
1. Click the **lock icon** in the address bar
2. Find **"Notifications"**
3. Ensure it's set to **"Allow"**
4. If blocked, change to "Allow" and reload page

**App Permissions:**
1. Go to **Settings** in the app
2. Check **"Notifications"** are enabled
3. Enable desired notification types

**2. System-Level Permissions**

**Android:**
1. **Settings** → **Apps** → **Grocery List**
2. **Notifications** → Ensure enabled
3. Check each notification category is enabled

**Desktop (Windows):**
1. **Settings** → **System** → **Notifications**
2. Find **Chrome** or **Grocery List**
3. Enable notifications

**Desktop (Mac):**
1. **System Preferences** → **Notifications**
2. Find **Chrome** or **Edge**
3. Enable alerts

**3. iOS Limitations**

**Important**: iOS Safari does not support push notifications for PWAs.

**Alternatives:**
- Check the app manually for updates
- Keep app open for in-app notifications
- Use email notifications (if available)

**4. Do Not Disturb**

Check if Do Not Disturb or Focus mode is enabled:
- Android: Swipe down → Check DND icon
- iOS: Control Center → Check Focus status
- Desktop: Check system notification settings

**5. Notification Blocked by Browser**

If you accidentally blocked notifications:
1. Go to browser **Settings**
2. Find **"Privacy and security"** → **"Site settings"**
3. Find **"Notifications"**
4. Remove Grocery List from blocked list
5. Reload the app and allow permissions again

**Still Not Working:**
- Try uninstalling and reinstalling the app
- Check browser console for errors (F12 → Console)
- Verify internet connection is stable
- Contact support with details

### Offline Sync Not Working

**Symptoms:**
- Changes don't sync when back online
- "Syncing..." indicator stuck
- Changes lost after closing app
- Sync errors appear repeatedly

**Solutions:**

**1. Check Connection**

Ensure you have a stable internet connection:
- Open a website to verify connectivity
- Check Wi-Fi or mobile data is active
- Try switching between Wi-Fi and mobile data
- Restart router if using Wi-Fi

**2. Check Service Worker**

Verify service worker is active:
1. Open browser DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** (Firefox)
3. Click **"Service Workers"** in the sidebar
4. Verify status is **"Activated and running"**
5. If not, click **"Update"** or **"Unregister"** and reload page

**3. Check Storage**

Ensure sufficient storage:
1. Go to **Settings** in the app
2. Find **"Storage"** section
3. Check usage and available space
4. Clear old data if needed

**Browser Storage:**
- Check browser storage quota (usually 50-100MB)
- Clear browser cache if full
- Some browsers limit storage in incognito mode

**4. Retry Failed Syncs**

If syncs failed:
1. Look for **"Sync failed"** indicator
2. Click **"Retry"** button
3. Or go to **Settings** → **"Sync"** → **"Retry Failed"**
4. Wait for "Synced" confirmation

**5. Clear Offline Queue**

If queue is corrupted:
1. Go to **Settings** → **"Sync & Offline"**
2. Find **"Offline Queue"** section
3. View pending changes
4. Option to **"Clear Queue"** (WARNING: loses unsaved changes)
5. Only use as last resort!

**6. Check for Conflicts**

If conflicts exist:
1. Look for **"Conflicts detected"** message
2. Open **"Resolve Conflicts"** dialog
3. Choose which version to keep
4. Apply resolution
5. Sync will continue after resolving

**7. Restart the App**

Often fixes sync issues:
1. Close the app completely
2. Clear recent apps (mobile) or close window (desktop)
3. Wait 10 seconds
4. Reopen the app
5. Check if sync resumes

**8. Check Server Status**

Verify server is online:
1. Go to **Settings** → **"About"**
2. Check **"Server Status"** indicator
3. If offline, wait for server to come back
4. Your changes are queued safely

**9. Update the App**

Ensure you're using the latest version:
1. Check for app updates (Settings → About)
2. Update if available
3. Updates often fix sync bugs

**10. Reset Service Worker**

Last resort if sync is broken:
1. Open DevTools (F12) → **Application** tab
2. **Service Workers** → **"Unregister"**
3. Clear browser cache
4. Reload the page
5. Service worker will re-register
6. Sync should work again

**Data Safety:**
- Offline changes are stored locally until synced
- Don't clear browser data before syncing
- Changes persist across app restarts
- If sync fails, data remains in queue

**Still Not Working:**
- Export your lists as backup (Settings → Export)
- Contact support with error details
- Check browser console for error messages (F12 → Console)

### App Not Updating

**Symptoms:**
- No update prompt appears
- App stays on old version
- Features from new version missing
- "Check for Updates" says "Up to date" but you know there's a new version

**Solutions:**

**1. Hard Refresh**

Force reload without cache:
- **Windows/Linux**: Ctrl + Shift + R
- **Mac**: Cmd + Shift + R
- Or: Ctrl+F5 (Windows) / Cmd+Option+R (Mac)

**2. Clear Cache**

Clear browser cache manually:
1. Open browser **Settings**
2. Go to **Privacy and security** → **Clear browsing data**
3. Select **"Cached images and files"**
4. Choose **"All time"** for time range
5. Click **"Clear data"**
6. Reload the app

**3. Unregister Service Worker**

Service worker might be serving old cached version:
1. Open DevTools (F12)
2. Go to **Application** tab → **Service Workers**
3. Find Grocery List service worker
4. Click **"Unregister"**
5. Close DevTools
6. Hard refresh the page (Ctrl+Shift+R)
7. New service worker will register with latest version

**4. Check Service Worker Update**

Force service worker update:
1. Open DevTools (F12) → **Application** tab
2. **Service Workers** → Check **"Update on reload"**
3. Click **"Update"** button
4. Reload the page
5. Uncheck "Update on reload" after updating

**5. Reinstall the App**

Complete reinstall (nuclear option):
1. **Uninstall** the app (see Uninstalling section)
2. Clear browser cache and site data
3. Go to the website URL
4. **Reinstall** the app
5. Log in with your account
6. All data returns, app is on latest version

**6. Check for Update Blocker**

Some things can block updates:
- **Browser extensions**: Disable ad blockers temporarily
- **Network restrictions**: Check firewall or proxy settings
- **Offline mode**: Must be online to check for updates
- **Old browser**: Update browser to latest version

**7. Verify Version Number**

Check what version you have:
1. Go to **Settings** → **"About"**
2. Look for **"App Version"** (e.g., "2.0.5")
3. Compare with latest version on website or documentation
4. If same, you're up to date
5. If different, follow steps above to update

**8. Check Server Status**

Ensure update server is reachable:
1. Go to **Settings** → **"About"**
2. Look for **"Server Status"** or connection indicator
3. If server is down, updates won't be available
4. Wait for server to come back online
5. Try update check again later

**9. Wait for Automatic Update**

If nothing else works:
- Updates are checked periodically (every 24 hours)
- Close and reopen the app daily
- Update may apply automatically next launch
- Check version number after each launch

**Still Not Working:**
- Contact support with current version number
- Provide browser type and version
- Send screenshot of "About" page
- Support can help troubleshoot further

---

## Getting Help

### In-App Support

1. Go to **Settings** → **"Help & Support"**
2. Choose from:
   - **FAQs**: Frequently asked questions
   - **User Guide**: This guide
   - **Report Bug**: Submit bug reports
   - **Contact Support**: Email support team

### Report a Bug

When reporting bugs, include:
- **What happened**: Description of the issue
- **Expected behavior**: What should have happened
- **Steps to reproduce**: How to trigger the bug
- **Device info**: Phone/OS/browser version
- **App version**: Found in Settings → About
- **Screenshots**: If applicable
- **Error messages**: Any error text you saw

### Contact Support

**Email**: support@grocerylist.app
**Response time**: Within 24-48 hours
**Include**: Account email, description, device info

### Community

- **Forum**: community.grocerylist.app
- **Discord**: discord.gg/grocerylist
- **Twitter**: @GroceryListApp
- **GitHub Issues**: github.com/yourorg/grocery-list/issues

### Resources

- **User Guide**: /docs/PWA_USER_GUIDE.md (this file)
- **FAQ**: /docs/PWA_FAQ.md
- **Quick Start**: /docs/PWA_QUICK_START.md
- **Browser Support**: /docs/PWA_BROWSER_SUPPORT.md
- **Changelog**: /docs/CHANGELOG.md

---

## Privacy & Data

### What Data is Stored Locally

The PWA stores data on your device:
- **Lists and Items**: All your grocery lists
- **User Profile**: Name, email, preferences
- **Offline Queue**: Pending changes while offline
- **Cache**: App assets (HTML, CSS, JS, images)
- **Service Worker**: For offline functionality

### How to Clear Data

**In the App:**
1. Go to **Settings** → **"Storage"**
2. Click **"Clear Local Data"**
3. Confirm action
4. App will fetch fresh data from server

**In Browser:**
1. Browser **Settings** → **"Privacy and security"**
2. **"Clear browsing data"**
3. Select **"Cookies and site data"** + **"Cached images"**
4. Choose **Grocery List** or clear all
5. Click **"Clear data"**

**Note**: Clearing data does not delete your account or server-side lists. It only removes local cached data.

### Storage Usage

Check how much storage the app uses:
1. Go to **Settings** → **"Storage"**
2. View breakdown:
   - **Lists & Items**: ~500KB-5MB (depending on list count)
   - **Cached Assets**: ~2-5MB
   - **Offline Queue**: ~10-500KB
   - **Total**: Usually 3-10MB

**Browser Limits:**
- Most browsers allow 50-100MB for PWAs
- If you hit the limit, app will warn you
- Clear old lists or cache to free space

---

## Tips and Best Practices

### For Best Performance

- **Install the App**: Installed PWAs load faster and work better offline
- **Keep Updated**: Always update to the latest version
- **Clear Cache Periodically**: Prevents bloated storage
- **Use Wi-Fi for Sync**: Faster and more reliable than mobile data
- **Close Unused Apps**: Frees memory for better performance

### For Reliable Offline Use

- **Wait for Sync**: Ensure "Synced" appears before going offline
- **Don't Clear Data While Offline**: You'll lose pending changes
- **Check Queue Count**: Monitor pending changes in status indicator
- **Keep App Open While Syncing**: Especially on iOS
- **Export Backups**: Periodically export lists as backup

### For Battery Efficiency

- **Disable Unnecessary Notifications**: Reduces wake-ups
- **Use Background Sync**: More efficient than keeping app open
- **Close App When Done**: Don't leave it running in background
- **Update on Wi-Fi**: Don't update over mobile data

### For Security

- **Log Out on Shared Devices**: Protect your lists
- **Enable Push Notifications**: Stay informed of list changes
- **Review List Members**: Regularly check who has access
- **Use Strong Password**: Protect your account
- **Enable 2FA**: If available

---

## Conclusion

The Grocery List PWA offers a powerful, modern app experience with offline support, background sync, and push notifications. Install it on all your devices for the best experience!

**Quick Links:**
- [Installation Guide](#installing-the-app)
- [Offline Usage](#using-the-app-offline)
- [Troubleshooting](#troubleshooting)
- [FAQ](PWA_FAQ.md)
- [Quick Start](PWA_QUICK_START.md)

**Happy Shopping!**

---

*Last Updated: October 2025 | Version 2.0.0*
