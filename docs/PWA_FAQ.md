# PWA Frequently Asked Questions (FAQ)

## Installation & Setup

### 1. What browsers support PWA installation?

**Full Support (Installation + All Features):**
- **Android**: Chrome 72+, Edge 79+, Samsung Internet 12+, Opera 57+
- **Desktop**: Chrome 73+, Edge 79+ (Windows 10/11, macOS, Linux)

**Partial Support (Installation Only):**
- **iOS**: Safari 11.3+ (Add to Home Screen, but no background sync or push notifications)
- **Desktop**: Safari 13+ on macOS (limited PWA features)

**No PWA Support:**
- Firefox (desktop and mobile) - Can bookmark but not install as PWA
- Internet Explorer - Not supported (end of life)

**Recommendation**: Use Chrome or Edge for the best experience on all platforms.

---

### 2. Does the app work completely offline?

**Yes!** The app works almost completely offline:

**What works offline:**
- View all lists and items
- Add, edit, and delete items
- Mark items as gotten/not gotten
- Search, filter, and sort items
- Create new lists
- Bulk operations (mark all, delete all)
- Export lists to JSON, CSV, or text
- View list members and permissions

**What requires internet:**
- Initial login (but session persists offline)
- Real-time sync with other users
- Sharing lists and managing members
- Push notifications
- Updating profile information
- App updates

**How it works:**
- All data is cached locally in IndexedDB
- Changes are queued when offline
- Automatic sync when connection returns
- No data loss even if you close the app

---

### 3. How do I install the app on my phone?

**Android (Chrome):**
1. Open the app in Chrome browser
2. Tap the "Install" banner at the bottom
3. Or: Menu (⋮) → "Add to Home screen"
4. Tap "Install" to confirm
5. Icon appears on home screen

**iOS (Safari):**
1. Open the app in Safari (must be Safari, not Chrome)
2. Tap the Share button (square with arrow up)
3. Scroll and tap "Add to Home Screen"
4. Tap "Add" in top-right corner
5. Icon appears on home screen

**Can't find install option?**
- Make sure you're using a supported browser
- Reload the page (Ctrl+R or Cmd+R)
- Check if already installed (look for icon)
- Try in incognito/private mode to test

---

### 4. Do I need to keep the browser open?

**It depends on your platform:**

**Android & Desktop (Chrome/Edge):**
- **No!** The app runs independently
- Service worker syncs in background
- Close browser completely, app still works
- Changes sync automatically when online

**iOS (Safari):**
- **Yes, for syncing.** iOS doesn't support background sync
- App works offline with browser closed
- Must open app to sync changes when back online
- Changes are queued safely until you open app

**Recommendation:**
- Android/Desktop: Feel free to close everything
- iOS: Open app periodically to sync changes

---

### 5. Can I install the app on multiple devices?

**Yes!** Install on as many devices as you want:

**Benefits of multi-device setup:**
- Same account works on all devices
- Lists sync across all devices
- Changes appear instantly (when online)
- Offline changes sync when each device comes online
- Install on phone, tablet, and desktop for convenience

**How to set up:**
1. Install the app on first device
2. Log in with your account
3. Install on second device
4. Log in with same account
5. All lists and items appear
6. Changes sync across all devices

**Tips:**
- Use the same login credentials on all devices
- Wait for sync before switching devices
- Each device caches data independently
- Offline changes from each device merge automatically

---

## Features & Functionality

### 6. How much storage does the app use?

**Typical Storage Usage:**
- **App Assets** (HTML, CSS, JS, images): 2-5 MB
- **Your Lists & Items** (1-10 lists with 50 items each): 500 KB - 2 MB
- **Offline Queue** (pending changes): 10-500 KB
- **Total**: Usually 3-10 MB for normal use

**Storage Breakdown:**
```
Cache:         ~3-5 MB   (app files)
IndexedDB:     ~1-5 MB   (your data)
Service Worker: ~500 KB   (sync logic)
Total:         ~5-10 MB
```

**Browser Storage Limits:**
- Chrome/Edge: ~6% of free disk space (often 50-100 MB for PWAs)
- Safari: ~50 MB for mobile, ~500 MB for desktop
- Firefox: ~50 MB (but doesn't support PWA install)

**When storage is full:**
- App will show "Storage full" warning
- May prompt to clear cache
- Or browser automatically evicts old cache

**Check your usage:**
1. Go to Settings → "Storage"
2. View storage breakdown
3. Clear cache if needed

---

### 7. How do I clear the app cache?

**Method 1: In-App (Recommended)**
1. Open the app
2. Go to **Settings** → **"Storage"**
3. Click **"Clear Cache"**
4. Confirm action
5. App reloads with fresh data from server

**Method 2: Browser Settings**

**Chrome/Edge (Desktop):**
1. Click lock icon in address bar
2. Click "Site settings"
3. Scroll to "Usage"
4. Click "Clear data"

**Chrome (Android):**
1. Chrome menu (⋮) → Settings
2. Site settings → Grocery List
3. Clear & reset → Clear data

**Safari (iOS):**
1. Settings → Safari
2. Advanced → Website Data
3. Find Grocery List → Delete

**Method 3: DevTools (Advanced)**
1. Open DevTools (F12)
2. Application tab → Storage
3. Click "Clear site data"
4. Reload page

**What happens when you clear cache:**
- Local data is deleted
- App fetches fresh data from server
- Must be online to refresh
- No data loss (server has your lists)
- Offline queue is preserved (if not explicitly cleared)

---

### 8. Can I use the app with multiple accounts?

**Yes, but not simultaneously:**

**Single Device, Multiple Accounts:**
1. Log out of current account
2. Log in with different account
3. Separate lists for each account
4. Must log out/in to switch

**Multiple Devices, Different Accounts:**
- Install app on each device
- Use different account on each device
- Accounts are completely separate
- No data is shared between accounts

**Shared Lists (Recommended Instead):**
Rather than multiple accounts, use list sharing:
- One account per person
- Share lists between accounts
- Everyone sees the same lists
- Better for families or groups
- Real-time collaboration

**Account Switching Tips:**
- Export lists before switching (as backup)
- Clear cache after logging out
- Wait for sync before switching
- Consider shared lists instead of multiple accounts

---

### 9. What happens to my data when offline?

**Your data is safe!** Here's what happens:

**1. Data is Cached Locally**
- All lists and items are stored on your device
- Stored in IndexedDB (browser database)
- Data persists even after closing app
- Survives browser restarts and device reboots

**2. Changes are Queued**
- Every change (add, edit, delete) is saved locally
- Changes are added to an offline queue
- Queue is stored persistently
- Queue survives app restarts

**3. Queue Example**
```
Offline Queue (5 pending changes):
1. Added "Milk" to Weekly Shopping
2. Updated quantity of "Apples" to 5
3. Marked "Eggs" as gotten
4. Deleted "Old item"
5. Created new list "Party Supplies"
```

**4. Automatic Sync When Online**
- Queue is processed automatically
- Changes sent to server in order
- Conflicts resolved automatically
- Queue cleared after successful sync

**5. Data Safety**
- No data loss even if app crashes
- Changes persist until synced
- Can close app/browser safely
- Queued changes sync next time you're online

**6. What if I clear browser data?**
- **Unsynced changes are lost!**
- Only clear data after sync completes
- Check for "Synced" status before clearing
- Export lists as backup before clearing

---

### 10. How do push notifications work?

**Push notifications keep you informed of list activity.**

**What triggers notifications:**
- Someone adds items to a shared list
- Someone marks items as gotten
- Someone shares a list with you
- You're added or removed from a list
- Your permission level changes
- Background sync completes (optional)
- App updates available

**How it works:**
1. **You enable notifications** (one-time setup)
2. **Browser registers** your device for notifications
3. **Server sends event** (e.g., item added)
4. **Push service delivers** notification to your device
5. **Notification appears** even if app is closed

**Requirements:**
- Must grant browser permission
- Must enable notifications in app settings
- Must be online to receive (notifications queue if offline)
- Device must support push notifications

**Platform Support:**
- **Android**: Full support (notifications even when app closed)
- **Desktop (Chrome/Edge)**: Full support
- **iOS**: NOT supported (Safari limitation)

**Notification Flow:**
```
[User A adds item]
    ↓
[Server detects change]
    ↓
[Server sends push notification]
    ↓
[Push service (browser's)]
    ↓
[Your device receives notification]
    ↓
[Notification appears on screen]
```

**Customizing notifications:**
- Go to Settings → Notifications
- Choose which types to receive
- Set quiet hours (mute at night)
- Adjust per-list preferences

---

### 11. Can I disable notifications?

**Yes!** You have full control over notifications.

**Disable All Notifications:**
1. Go to **Settings** → **"Notifications"**
2. Toggle **"Enable Notifications"** to OFF
3. All notifications stop immediately

**Disable Specific Types:**
1. Go to **Settings** → **"Notifications"**
2. Keep "Enable Notifications" ON
3. Toggle OFF specific categories:
   - List Activity (items added/edited)
   - List Changes (list renamed/deleted)
   - Member Updates (added/removed)
   - Sync Events (background sync)
   - System Alerts (updates/announcements)

**Disable via Browser:**

**Chrome/Edge:**
1. Click lock icon in address bar
2. Click "Permissions"
3. Set "Notifications" to "Block"

**Android:**
1. Long-press a notification
2. Turn off notifications
3. Or: Settings → Apps → Grocery List → Notifications → OFF

**Desktop:**
1. System notification settings
2. Find "Grocery List" or browser
3. Disable or customize

**Temporary Mute (Quiet Hours):**
1. Settings → Notifications → Quiet Hours
2. Set time range (e.g., 10 PM - 7 AM)
3. Notifications muted during these hours
4. Can still see them, just no sound/vibration

**Re-enabling:**
- Reverse any of the steps above
- Notifications resume immediately
- No data loss, just paused

---

### 12. How do I update to the latest version?

**The app updates automatically!** But here's how it works:

**Automatic Update Process:**
1. **App checks for updates** (on launch and periodically)
2. **Downloads update in background** (if available)
3. **Shows update prompt** when ready
4. **You click "Update Now"**
5. **App refreshes** with new version
6. **Done!** No reinstall needed

**Update Prompt Example:**
```
┌─────────────────────────────────┐
│ New version available!          │
│                                 │
│ Version 2.1.0 is ready          │
│                                 │
│ [Update Now]  [Later]           │
└─────────────────────────────────┘
```

**Manual Update Check:**
1. Go to **Settings** → **"About"**
2. Click **"Check for Updates"**
3. If available, update prompt appears
4. Click "Update Now"

**Force Update (if stuck on old version):**
1. Hard refresh: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
2. Or: Clear cache (Settings → Storage → Clear Cache)
3. Or: Uninstall and reinstall app

**Update Frequency:**
- App checks for updates on every launch
- Also checks every 24 hours if app stays open
- Critical updates may prompt immediately

**What's Updated:**
- Bug fixes
- New features
- Performance improvements
- Security patches
- UI enhancements

**After Updating:**
- "What's New" dialog shows changes
- All your data remains intact
- No need to log in again
- Lists and items are unchanged

---

## Troubleshooting

### 13. Why can't I install the app on iOS?

**You can install on iOS, but the process is different:**

**iOS Installation (Safari Only):**
1. Open app in **Safari** (not Chrome or Firefox)
2. Tap the **Share button** (box with arrow up)
3. Scroll down and tap **"Add to Home Screen"**
4. Edit name if desired
5. Tap **"Add"** in top-right corner

**Common Issues:**

**Problem: "Add to Home Screen" option missing**
- Make sure you're using Safari (Chrome doesn't support it)
- Ensure you're on a page, not the browser's start page
- Try reloading the page
- Update Safari/iOS to latest version

**Problem: Already added but can't find icon**
- Swipe through all home screen pages
- Check App Library (swipe to last page)
- Search for "Grocery List" in Spotlight

**iOS Limitations:**
- No automatic install prompt (must use Share menu)
- No background sync (app must be open to sync)
- No push notifications (Safari PWA limitation)
- Updates require manual refresh

**Workaround for Background Sync:**
- Keep app open while syncing
- Check app regularly to sync changes
- Enable "Background App Refresh" in iOS settings (limited help)

**Why iOS is Limited:**
Apple restricts PWA features on iOS to encourage native App Store apps. These limitations are intentional by Apple, not bugs in the Grocery List app.

---

### 14. Why aren't my changes syncing?

**Multiple reasons can cause sync issues. Try these solutions:**

**1. Check Internet Connection**
- Open a website to verify connectivity
- Switch between Wi-Fi and mobile data
- Restart router if using Wi-Fi
- Check if other apps can access internet

**2. Check Sync Status**
- Look for sync indicator (usually at top or bottom)
- Statuses:
  - "Synced" ✓ = Everything synced
  - "Syncing..." ⟳ = In progress
  - "Offline" ⚠ = No connection
  - "Failed" ✗ = Sync error

**3. Retry Failed Syncs**
If you see "Sync failed":
1. Tap the sync indicator or status message
2. Click **"Retry"** button
3. Or: Settings → Sync → "Retry Failed Syncs"

**4. Check Offline Queue**
View pending changes:
1. Go to Settings → "Sync & Offline"
2. See list of pending changes
3. Count should decrease as items sync
4. If stuck, try restarting app

**5. Wait for Background Sync**
On Android/Desktop:
- Service worker syncs in background
- May take 1-5 minutes after coming online
- Check periodically, don't spam refresh

On iOS:
- Must open app to sync (no background sync)
- Keep app open until "Synced" appears

**6. Check Service Worker**
If sync is completely broken:
1. Open browser DevTools (F12)
2. Application tab → Service Workers
3. Check status is "Activated and running"
4. If not, click "Update" or reload page

**7. Clear Queue (Last Resort)**
If queue is corrupted:
1. Settings → Sync → "Clear Offline Queue"
2. **WARNING**: Loses all unsaved changes!
3. Only use if sync is permanently stuck
4. Your server-side data is safe

**8. Check Server Status**
Verify server is online:
- Settings → About → "Server Status"
- If offline, server is down
- Wait for server to come back
- Your changes are queued safely

**9. Restart the App**
Often fixes sync issues:
- Close app completely
- Wait 10 seconds
- Reopen app
- Check if sync resumes

**10. Update the App**
Sync bugs are often fixed in updates:
- Check for updates (Settings → About)
- Update if available
- Updates often fix sync issues

**Still Not Working?**
- Export lists as backup (Settings → Export)
- Contact support with error details
- Include browser console errors (F12 → Console)
- Send screenshots of sync status

---

### 15. How do I report a bug?

**We appreciate bug reports! Here's how to submit one:**

**Method 1: In-App Bug Reporter (Easiest)**
1. Go to **Settings** → **"Help & Support"**
2. Click **"Report a Bug"**
3. Fill out the form:
   - Description of the issue
   - Steps to reproduce
   - Expected vs actual behavior
4. App automatically includes:
   - Your device info
   - Browser version
   - App version
   - Recent error logs (no personal data)
5. Click **"Submit"**
6. You'll receive a confirmation email

**Method 2: Email**
Send to: **support@grocerylist.app**

Include:
- **Subject**: "Bug Report: [Brief Description]"
- **Description**: What happened
- **Expected**: What should have happened
- **Steps to Reproduce**:
  1. First I did...
  2. Then I clicked...
  3. Then I saw...
- **Device Info**:
  - Device: (e.g., iPhone 13, Samsung Galaxy S21, Windows PC)
  - OS: (e.g., iOS 15.2, Android 12, Windows 11)
  - Browser: (e.g., Chrome 120, Safari 15, Edge 120)
  - App Version: (found in Settings → About)
- **Screenshots**: If applicable
- **Error Messages**: Copy exact error text
- **Account Email**: For follow-up (kept private)

**Method 3: GitHub Issues (for developers)**
1. Go to: https://github.com/yourorg/grocery-list/issues
2. Click "New Issue"
3. Use the bug report template
4. Provide all details as above
5. Submit issue

**What Makes a Good Bug Report:**

**Good Example:**
```
Title: Items disappear after marking as gotten on iOS

Description:
When I mark an item as gotten on my iPhone, it disappears
from the list instead of showing with strikethrough.

Steps to Reproduce:
1. Open app on iPhone (iOS 15.2, Safari)
2. Add a new item "Milk"
3. Tap the checkbox to mark as gotten
4. Item disappears completely instead of crossing out

Expected: Item should show strikethrough when gotten
Actual: Item disappears from the list

Device: iPhone 13, iOS 15.2, Safari
App Version: 2.0.5
Frequency: Happens every time
```

**Bad Example:**
```
Title: App broken

Description: It doesn't work

(Missing: steps to reproduce, device info, what "doesn't work" means)
```

**Bug Priority:**
- **Critical**: App crashes, data loss, can't log in
- **High**: Major feature broken, affects many users
- **Medium**: Feature partially broken, has workaround
- **Low**: Minor UI issue, rare edge case

**Response Time:**
- Critical bugs: 24 hours
- High priority: 2-3 days
- Medium/Low: 1-2 weeks

**Bug Fix Process:**
1. You report bug
2. We acknowledge receipt (24 hours)
3. We investigate and reproduce
4. We fix the bug
5. Fix included in next update
6. We notify you when fixed

**Thank you for helping make the app better!**

---

## Privacy & Security

### 16. What data does the app collect?

**We collect minimal data to make the app work:**

**Account Data:**
- Email address (for login and notifications)
- Display name (shown to list members)
- Password (hashed, never stored in plain text)
- Account creation date
- Last login time

**List Data:**
- Your grocery lists and items
- List names, categories, quantities, notes
- List sharing and member information
- Activity history (who added/edited items)
- Prices and budget data (if you use these features)

**Usage Data:**
- App version you're using
- Browser type and version
- Device type (mobile, tablet, desktop)
- Operating system
- Error logs (when app crashes)
- Performance metrics (load times, sync times)

**What We DON'T Collect:**
- Browsing history outside the app
- Location data
- Contacts or photos
- Clipboard contents
- Other apps you have installed
- Personal information beyond email and name
- Credit card or payment info (app is free)

**How Data is Used:**
- **Account data**: To authenticate you and enable login
- **List data**: To sync across your devices and share with others
- **Usage data**: To fix bugs, improve performance, and plan features
- **Error logs**: To diagnose and fix crashes

**Data Sharing:**
- We **never sell** your data
- We **never share** with advertisers
- We only share what's necessary:
  - List data with people you explicitly share lists with
  - Email with list members (so they can see who shared)
  - Anonymous usage stats with hosting provider (e.g., Vercel)

**Data Storage:**
- Server: Encrypted database (PostgreSQL with SSL)
- Local: Encrypted IndexedDB on your device
- Backups: Encrypted daily backups (retained 30 days)

**Data Retention:**
- Active accounts: Data kept indefinitely
- Inactive accounts (1 year+): May send deletion warning
- Deleted accounts: Data removed within 30 days
- Exported data: You keep forever

**Your Rights:**
- **Access**: Request copy of all your data
- **Export**: Download lists anytime (Settings → Export)
- **Delete**: Delete account and all data (Settings → Account → Delete)
- **Correct**: Update email, name, or lists anytime
- **Opt-out**: Disable analytics (Settings → Privacy → Usage Data → Off)

**Learn More:**
- Full Privacy Policy: /privacy
- Terms of Service: /terms
- GDPR Compliance: /gdpr
- Contact: privacy@grocerylist.app

---

### 17. Is my data secure?

**Yes! We take security seriously:**

**1. Encryption**

**In Transit (Network):**
- All connections use HTTPS (TLS 1.3)
- Data encrypted during transmission
- Certificate pinning prevents man-in-the-middle attacks
- No data sent over plain HTTP

**At Rest (Storage):**
- Database encrypted at rest (AES-256)
- Backups encrypted before storage
- Local device storage uses browser encryption
- Service worker cache uses encrypted storage

**2. Authentication**

**Password Security:**
- Passwords hashed with bcrypt (12 rounds)
- Never stored in plain text
- Never logged or sent in URLs
- Minimum password requirements enforced

**Token Security:**
- JWT tokens with short expiration (15 minutes)
- Refresh tokens with longer expiration (7 days)
- Tokens signed with secret key (HMAC SHA-256)
- Tokens expire and require re-authentication

**Session Security:**
- Automatic logout after 7 days of inactivity
- Token refresh prevents session hijacking
- Logout invalidates all tokens
- Can log out of all devices (Settings → Security)

**3. Access Control**

**List Permissions:**
- Three-tier permission system (owner/editor/viewer)
- Permissions enforced at API and database level
- Can't access lists you're not a member of
- Can't perform actions above your permission level

**Data Isolation:**
- Your data is isolated from other users
- Database queries filtered by user ID
- Lists only accessible to members
- No cross-user data leakage

**4. Vulnerability Protection**

**SQL Injection:**
- Parameterized queries prevent SQL injection
- Input validation on all endpoints
- ORM (Kysely) provides additional safety

**XSS (Cross-Site Scripting):**
- React escapes all user input automatically
- Content Security Policy (CSP) headers
- Sanitization of HTML in notes/descriptions

**CSRF (Cross-Site Request Forgery):**
- Token-based auth prevents CSRF
- SameSite cookie attributes
- Origin header validation

**Rate Limiting:**
- Login attempts: 5 per 15 minutes per IP
- API requests: 100 per 15 minutes per user
- Prevents brute force attacks
- Prevents denial of service

**5. Security Headers**

We set security headers on all responses:
```
Strict-Transport-Security: max-age=31536000
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; ...
Referrer-Policy: strict-origin-when-cross-origin
```

**6. Third-Party Security**

**Hosting:**
- Hosted on secure infrastructure (Vercel/AWS)
- DDoS protection
- Automatic security patches
- 99.9% uptime SLA

**Database:**
- PostgreSQL with SSL required
- Encrypted backups
- Regular security audits
- Isolated from public internet

**Dependencies:**
- Regularly updated to latest versions
- Automated vulnerability scanning
- No known critical vulnerabilities

**7. Audits & Compliance**

**Security Practices:**
- Regular security audits
- Penetration testing (annually)
- Code reviews for security
- Dependency scanning (daily)

**Compliance:**
- GDPR compliant (EU data protection)
- CCPA compliant (California privacy)
- SOC 2 Type II (in progress)
- Privacy by design principles

**8. Incident Response**

If a security breach occurs:
1. Incident detected and contained (< 1 hour)
2. Affected users notified (< 24 hours)
3. Public disclosure (< 72 hours)
4. Full investigation and report
5. Preventive measures implemented

**9. Your Security Responsibilities**

**Use Strong Passwords:**
- Minimum 8 characters
- Mix of upper/lowercase, numbers, symbols
- Don't reuse passwords from other sites
- Use password manager

**Enable 2FA** (when available):
- Two-factor authentication adds extra security
- Even if password is compromised, account is safe

**Log Out on Shared Devices:**
- Don't leave logged in on public computers
- Use private browsing mode if needed

**Keep Software Updated:**
- Update browser to latest version
- Update operating system
- Keep PWA updated (app prompts automatically)

**Be Cautious:**
- Don't share account credentials
- Don't click suspicious links in emails
- Verify you're on the correct domain
- Report phishing attempts

**10. Report Security Issues**

Found a vulnerability?
- **DO NOT** post publicly
- Email: security@grocerylist.app
- Use PGP key if sensitive (available on website)
- We'll respond within 24 hours
- Responsible disclosure: we fix, then announce

**Bug Bounty:**
- We reward security researchers
- Rewards based on severity
- $50-$500 for valid vulnerabilities
- Credit in security hall of fame

**Questions?**
Contact: security@grocerylist.app

---

## Technical Questions

### 18. What happens if I clear browser data?

**Clearing browser data affects the app differently depending on what you clear:**

**1. Clearing Cookies Only**
- **Effect**: Logs you out of the app
- **Data Loss**: None (lists and items are on server)
- **Fix**: Log back in, all data returns

**2. Clearing Cache Only**
- **Effect**: App must re-download assets (HTML, CSS, JS, images)
- **Data Loss**: None (your lists are safe)
- **Fix**: Reload page, app re-caches assets
- **Note**: First load after clearing is slower

**3. Clearing Site Data / Local Storage**
- **Effect**: Loses local cached lists and offline queue
- **Data Loss**:
  - ✗ Local cached lists (will re-download from server)
  - ✗ Offline queue (UNSAVED changes are lost!)
  - ✗ App settings and preferences
- **Fix**: Log back in, data re-downloads (but offline queue is lost)
- **WARNING**: Only clear if you've synced all changes!

**4. Clearing Everything (All Time)**
- **Effect**: Complete reset, as if you never used the app
- **Data Loss**:
  - ✗ Login session (logged out)
  - ✗ Cached lists and items
  - ✗ Offline queue (unsaved changes)
  - ✗ App settings and preferences
  - ✓ Server data is safe (lists, account)
- **Fix**: Reinstall app, log in, data returns

**5. Unregistering Service Worker**
- **Effect**: Loses offline capability and background sync
- **Data Loss**: None (service worker re-registers on next visit)
- **Fix**: Reload page, service worker re-registers
- **Note**: May take 1-2 minutes to reactivate

**Before Clearing Data:**

**Safety Checklist:**
1. **Check sync status**: Ensure "Synced" indicator shows
2. **Check offline queue**: Settings → Sync → Should be empty (0 pending)
3. **Export lists**: Settings → Export → Download backup
4. **Wait for sync**: If syncing, wait for completion
5. **Online?**: Be online so data can re-download after clearing

**After Clearing Data:**

**Recovery Steps:**
1. Reload the page
2. Wait for service worker to register (10-30 seconds)
3. Log in with your credentials
4. Wait for lists to download from server (5-30 seconds)
5. Verify all lists and items are present
6. Check settings and adjust preferences again

**What's Permanently Lost:**
- Unsaved offline changes (if queue wasn't synced)
- App settings and preferences (must reconfigure)
- Notification preferences (must re-enable)
- Login session (must log in again)

**What's Preserved (on Server):**
- All grocery lists
- All items and their details
- List sharing and members
- Account information
- Activity history

**How to Avoid Data Loss:**

**Use In-App Clear Cache:**
1. Settings → Storage → "Clear Cache"
2. App clears cache safely
3. Preserves offline queue
4. Preserves login session
5. Only clears cached assets

**Selective Clearing:**
- Only clear what you need
- Avoid "All time" unless necessary
- Clear cache, not site data
- Check sync before clearing

**Browser-Specific Notes:**

**Chrome:**
- "Cookies and site data" = logs you out + clears local data
- "Cached images and files" = safe, just clears assets

**Safari:**
- "Clear History and Website Data" = clears everything, logs you out
- Better: Safari → Preferences → Privacy → Manage Website Data → Remove Grocery List

**Firefox:**
- "Cookies and Site Data" = clears local data, logs you out
- "Cached Web Content" = safe, just clears assets

---

### 19. Can I use the app without installing it?

**Yes!** The app works perfectly fine without installation.

**Using in Browser (Not Installed):**
- Works in any modern browser
- All features available (lists, items, sharing, etc.)
- Offline mode still works
- Data syncs normally
- Can bookmark for quick access

**Differences vs Installed:**

| Feature | Browser | Installed PWA |
|---------|---------|---------------|
| Works offline | ✓ Yes | ✓ Yes |
| Real-time sync | ✓ Yes | ✓ Yes |
| Push notifications | ✓ Yes* | ✓ Yes* |
| Background sync | ✗ No** | ✓ Yes** |
| Home screen icon | ✗ No | ✓ Yes |
| Full-screen mode | ✗ No | ✓ Yes |
| Native app feel | ✗ No | ✓ Yes |
| Faster loading | ✗ No | ✓ Yes |
| System integration | ✗ No | ✓ Yes |

\* Notifications require permission in both cases
\** Background sync only works when browser is open (or on installed PWA)

**Benefits of Installing:**
1. **Home screen access**: Quick launch from home screen/dock
2. **Full-screen**: No browser UI (address bar, tabs)
3. **Background sync**: Syncs even when app is closed
4. **Faster**: Better caching and performance
5. **Native feel**: Looks and behaves like native app
6. **Offline-first**: Better offline experience

**When to Use Without Installing:**
- **Public/shared computer**: Don't install personal apps
- **Testing**: Try the app before committing
- **Browser preference**: You prefer tabs to apps
- **Storage limited**: Device has limited storage
- **Quick access**: One-time use or infrequent use

**When to Install:**
- **Personal device**: Your own phone/computer
- **Frequent use**: Use the app regularly
- **Offline access**: Need reliable offline functionality
- **Best experience**: Want fastest, most native-like experience
- **Background sync**: Want automatic syncing (Android/Desktop)

**Can I Switch?**
- Yes, you can install anytime (from browser version)
- Or uninstall and use in browser
- Data remains the same (same account, same lists)
- No data loss when switching

**Recommendation:**
- **Use in browser first** to try the app
- **Install if you like it** for best experience
- **No wrong choice** - both work well!

---

### 20. Does the app work on all browsers?

**The app works on most modern browsers, but features vary:**

**Full Support (All Features):**

**✓ Chrome 73+ (Android, Desktop)**
- PWA installation ✓
- Offline mode ✓
- Background sync ✓
- Push notifications ✓
- Full-screen mode ✓

**✓ Edge 79+ (Desktop)**
- PWA installation ✓
- Offline mode ✓
- Background sync ✓
- Push notifications ✓
- Full-screen mode ✓

**Partial Support:**

**⚠ Safari 11.3+ (iOS, macOS)**
- PWA installation ✓ (via "Add to Home Screen")
- Offline mode ✓
- Background sync ✗ (iOS limitation)
- Push notifications ✗ (iOS limitation)
- Full-screen mode ⚠ (iOS: partial, macOS: no)

**⚠ Samsung Internet 12+ (Android)**
- PWA installation ✓
- Offline mode ✓
- Background sync ✓
- Push notifications ✓
- Full-screen mode ✓

**⚠ Opera 57+ (Desktop, Android)**
- PWA installation ✓
- Offline mode ✓
- Background sync ✓
- Push notifications ✓
- Full-screen mode ✓

**No PWA Support:**

**✗ Firefox (all platforms)**
- PWA installation ✗ (cannot install as app)
- Offline mode ✓ (works in browser tab)
- Background sync ✗
- Push notifications ⚠ (desktop only, not mobile)
- Full-screen mode ✗

**✗ Internet Explorer (end of life)**
- Not supported, use Edge or Chrome

**Feature Compatibility Table:**

See [PWA_BROWSER_SUPPORT.md](PWA_BROWSER_SUPPORT.md) for complete compatibility matrix.

**Recommendations:**

**For Android:**
1st choice: Chrome
2nd choice: Samsung Internet or Edge
Avoid: Firefox (no PWA install)

**For iOS:**
1st choice: Safari (only option for PWA)
Note: Chrome and Firefox use Safari engine on iOS, no PWA features

**For Desktop:**
1st choice: Chrome or Edge
2nd choice: Opera
Avoid: Firefox (no PWA install), Safari (limited support)

**Can I Use Multiple Browsers?**
Yes! Your account works in any browser:
- Log in with same credentials
- Lists sync across browsers
- Can install PWA in one browser, use web in another
- Separate local cache per browser

**Checking Compatibility:**
The app detects your browser on first visit:
- Shows install prompt if browser supports PWA
- Shows "Use in browser" fallback if not
- Alerts you to missing features (e.g., "Background sync not supported")

---

## Advanced Topics

### 21. How does background sync work technically?

**Background sync uses the Background Sync API (where supported):**

**High-Level Overview:**
1. You make changes while offline
2. Changes are queued in IndexedDB
3. Service worker registers for sync event
4. When online, browser fires sync event
5. Service worker wakes up and processes queue
6. Changes are sent to server
7. Notification appears (if enabled)

**Detailed Flow:**

```
[User Action (Offline)]
    ↓
[Queue mutation in IndexedDB]
    ↓
[Service worker: register 'sync' event]
    ↓
[User closes app / Browser stays running]
    ↓
[Device reconnects to internet]
    ↓
[Browser fires 'sync' event → Service worker wakes]
    ↓
[Service worker: retrieve queue from IndexedDB]
    ↓
[For each mutation in queue:]
    ↓
[Send POST/PUT/DELETE to API]
    ↓
[If success: remove from queue]
[If fail: keep in queue, retry later]
    ↓
[All synced? Show notification: "5 changes synced"]
    ↓
[Service worker: sleep until next event]
```

**Service Worker Code (Simplified):**
```javascript
// In service worker (sw.js)
self.addEventListener('sync', async (event) => {
  if (event.tag === 'sync-grocery-items') {
    event.waitUntil(syncQueuedItems());
  }
});

async function syncQueuedItems() {
  const queue = await getQueueFromIndexedDB();

  for (const mutation of queue) {
    try {
      await fetch(mutation.url, {
        method: mutation.method,
        body: JSON.stringify(mutation.data),
        headers: { 'Authorization': `Bearer ${token}` }
      });

      await removeFromQueue(mutation.id);
    } catch (error) {
      console.error('Sync failed:', error);
      // Keep in queue for next sync attempt
    }
  }

  await showNotification('Sync complete', {
    body: `${queue.length} changes synced successfully`
  });
}
```

**Platform Differences:**

**Android & Desktop (Chrome/Edge):**
- Full Background Sync API support
- Syncs even when browser is closed
- Browser manages sync scheduling
- Intelligent retry with exponential backoff

**iOS (Safari):**
- No Background Sync API support
- Must use foreground sync
- App must be open to sync
- Manual retry if app was closed

**Retry Logic:**

**Automatic Retry:**
- Failed syncs stay in queue
- Browser retries periodically
- Exponential backoff: 30s, 60s, 120s, 300s, 600s...
- Max retry: ~24 hours

**Manual Retry:**
- User can force retry: Settings → Sync → "Retry Failed"
- Immediately attempts all failed items
- Useful if server was down temporarily

**Battery & Network Efficiency:**

**Battery:**
- Background sync is battery efficient
- Browser waits for stable connection
- Doesn't wake device repeatedly
- Consolidates syncs to minimize wake-ups

**Network:**
- Waits for Wi-Fi if large data
- Uses mobile data conservatively
- Respects device data saver mode
- Batches requests when possible

**Limitations:**

**Queue Size:**
- Max ~100 pending mutations (browser-dependent)
- Oldest items may be dropped if queue is full
- App warns if approaching limit

**Time Limits:**
- Sync must complete in ~5 minutes
- Long syncs may be interrupted
- Large queues split across multiple syncs

**Network:**
- Requires stable connection
- May fail on slow/unstable networks
- Automatically retries on next sync event

**Debugging:**

**Check Sync Status:**
1. Open DevTools (F12)
2. Application tab → Background Services → Background Sync
3. See registered sync events
4. See sync history (last 3 days)

**Check Service Worker:**
1. DevTools → Application → Service Workers
2. Verify status: "Activated and running"
3. Click "Update" to force check for updates
4. Click "Unregister" to reset (last resort)

**Check Queue:**
1. DevTools → Application → IndexedDB → GroceryListDB → offlineQueue
2. See all pending mutations
3. Can manually delete items (advanced)

**See Also:**
- [MDN: Background Sync API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Sync_API)
- [Web.dev: Background Sync](https://web.dev/background-sync/)

---

### 22. What is a service worker?

**A service worker is a script that runs in the background, separate from your web page.**

**Think of it as a "middleman" between the app and the network:**

```
[Web App] ↔ [Service Worker] ↔ [Network/Server]
              ↑
         [Cache Storage]
```

**What Service Workers Do:**

**1. Offline Caching**
- Intercepts network requests
- Returns cached responses when offline
- Makes app work without internet

**2. Background Sync**
- Syncs data in background (even when app closed)
- Queues changes when offline
- Processes queue when online

**3. Push Notifications**
- Receives push notifications from server
- Shows notifications even when app is closed
- Handles notification clicks

**4. Asset Caching**
- Caches app files (HTML, CSS, JS, images)
- Makes app load instantly on repeat visits
- Updates cache when new version available

**How It Works:**

**1. Registration (First Visit)**
```
User visits app
    ↓
App registers service worker
    ↓
Browser downloads sw.js
    ↓
Service worker installs
    ↓
Service worker activates
    ↓
Service worker takes control of page
```

**2. Caching (Install)**
```
Service worker 'install' event fires
    ↓
Pre-cache critical assets:
- index.html
- app.css
- app.js
- logo.png
    ↓
Cache stored in browser's Cache Storage
```

**3. Request Interception (Active)**
```
App makes request (e.g., fetch('/api/lists'))
    ↓
Service worker intercepts request
    ↓
Check cache: Is response cached?
    ↓ Yes              ↓ No
Return cached    Fetch from network
response               ↓
                  Cache response
                       ↓
                  Return response
```

**4. Background Sync (Offline)**
```
User adds item while offline
    ↓
App queues mutation in IndexedDB
    ↓
Service worker registers 'sync' event
    ↓
[User closes app]
    ↓
[Device comes online]
    ↓
Browser fires 'sync' event
    ↓
Service worker wakes up
    ↓
Process queue, send to server
    ↓
Show notification: "3 items synced"
```

**5. Push Notifications**
```
Server sends push notification
    ↓
Browser receives push
    ↓
Browser wakes service worker
    ↓
Service worker 'push' event fires
    ↓
Service worker shows notification
    ↓
User clicks notification
    ↓
Service worker 'notificationclick' event fires
    ↓
Service worker opens app
```

**Service Worker Lifecycle:**

**States:**
1. **Parsed**: Code downloaded and parsed
2. **Installing**: 'install' event running
3. **Installed**: Waiting to activate
4. **Activating**: 'activate' event running
5. **Activated**: Controlling pages
6. **Redundant**: Replaced by newer version

**Lifecycle Diagram:**
```
[Download sw.js]
    ↓
[Parse]
    ↓
[Install] → Cache assets
    ↓
[Wait] → Old SW still active
    ↓
[Activate] → Take control
    ↓
[Idle] ↔ [Active]
    ↑       ↓
    ←─[Events: fetch, sync, push]
```

**Updating Service Worker:**
```
New version deployed
    ↓
Browser checks for sw.js updates (on page load)
    ↓
New sw.js downloaded
    ↓
New SW installs (caches new assets)
    ↓
New SW waits (old SW still active)
    ↓
User closes all tabs
    ↓
New SW activates
    ↓
Next visit uses new SW
```

**Caching Strategies:**

**1. Cache First (For Static Assets)**
```
Request → Check cache
    ↓ Hit        ↓ Miss
Return cache   Fetch network
               ↓
               Cache response
               ↓
               Return response
```
Used for: CSS, JS, images (don't change often)

**2. Network First (For API)**
```
Request → Fetch network
    ↓ Success      ↓ Fail
Return response   Check cache
↓                     ↓ Hit    ↓ Miss
Cache response   Return    Throw error
```
Used for: API calls, user data (need fresh data)

**3. Stale While Revalidate (For Images)**
```
Request → Return cached response immediately
              ↓
         Fetch network in background
              ↓
         Update cache for next time
```
Used for: Profile pictures, list icons (ok if slightly stale)

**Browser Support:**

**Full Support:**
- Chrome 40+ (all platforms)
- Edge 79+ (Windows, macOS)
- Safari 11.1+ (iOS, macOS)
- Firefox 44+ (all platforms)
- Samsung Internet 4+
- Opera 27+

**Limitations:**
- Must be served over HTTPS (or localhost)
- Cannot access DOM directly
- Cannot access `localStorage` (must use Cache API or IndexedDB)
- Limited to same-origin requests (CORS for cross-origin)

**Debugging Service Worker:**

**Chrome DevTools:**
1. Open DevTools (F12)
2. **Application** tab
3. **Service Workers** section
4. See status, update, unregister

**Viewing Cached Assets:**
1. DevTools → **Application**
2. **Cache Storage** → Expand cache
3. See all cached files

**Viewing IndexedDB:**
1. DevTools → **Application**
2. **IndexedDB** → Expand database
3. See offline queue and cached data

**Console Logs:**
- Service worker logs appear in DevTools console
- May need to check "Show service worker logs"

**Common Issues:**

**Service Worker Not Registering:**
- Check console for errors
- Verify HTTPS (or localhost)
- Check sw.js path is correct
- Clear cache and try again

**Old Service Worker Stuck:**
- Click "Update" in DevTools
- Click "Skip waiting" to activate immediately
- Or: Unregister and reload page

**Cache Not Updating:**
- Service worker caches aggressively
- May need to update version number in sw.js
- Or: Manually clear cache (DevTools → Application → Clear storage)

**See Also:**
- [MDN: Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web.dev: Service Workers](https://web.dev/service-workers/)
- [PWA User Guide: How Background Sync Works](#11-how-does-background-sync-work-technically)

---

## Questions?

**Didn't find your question here?**

- Check the [PWA User Guide](PWA_USER_GUIDE.md) for detailed instructions
- See [PWA Quick Start Guide](PWA_QUICK_START.md) for installation help
- Review [Browser Support Matrix](PWA_BROWSER_SUPPORT.md) for compatibility
- Contact support: support@grocerylist.app
- Join the community: discord.gg/grocerylist

---

*Last Updated: October 2025 | Version 2.0.0*
