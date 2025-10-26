# Offline Conflict Resolution Guide

## Table of Contents

- [Introduction](#introduction)
- [What Are Conflicts?](#what-are-conflicts)
- [Why Conflicts Happen](#why-conflicts-happen)
- [How Automatic Resolution Works](#how-automatic-resolution-works)
- [How to Manually Resolve Conflicts](#how-to-manually-resolve-conflicts)
- [Understanding the Sync Status Indicator](#understanding-the-sync-status-indicator)
- [Tips for Avoiding Conflicts](#tips-for-avoiding-conflicts)
- [Troubleshooting Common Issues](#troubleshooting-common-issues)
- [Frequently Asked Questions](#frequently-asked-questions)

---

## Introduction

The Grocery List app works seamlessly whether you're online or offline. When you're offline, all your changes are saved locally and automatically synced when you reconnect. This guide explains how the app handles situations where different users make conflicting changes to the same items while offline.

**Key Features:**
- Your changes are never lost - all edits are queued and synced when online
- Most conflicts are resolved automatically without user intervention
- Clear indicators show when items are queued for sync
- Manual resolution available when automatic resolution isn't possible

---

## What Are Conflicts?

A **conflict** occurs when two or more users make different changes to the same grocery item while at least one user is offline. When everyone comes back online, the app needs to decide which changes to keep.

### Types of Conflicts

#### 1. Update-Update Conflicts
Two users edit the same field of an item differently.

**Example:**
- User A (offline): Changes quantity from 1 to 2
- User B (offline): Changes quantity from 1 to 3
- **Conflict:** Which quantity should win?

#### 2. Update-Delete Conflicts
One user edits an item while another deletes it.

**Example:**
- User A (offline): Marks "Milk" as gotten
- User B (offline): Deletes "Milk"
- **Conflict:** Should the item be kept or deleted?

#### 3. Field-Level Conflicts
Different fields of the same item are edited by different users.

**Example:**
- User A (offline): Changes quantity to 2
- User B (offline): Changes notes to "Organic"
- **No Conflict:** These changes don't conflict and are merged automatically

---

## Why Conflicts Happen

Conflicts are a natural part of collaborative offline-first apps. Here are common scenarios:

### Scenario 1: Poor Network Connection
```
User A is shopping with spotty WiFi
├─ Marks items as gotten while offline
├─ User B at home removes some items
└─ When User A reconnects → potential conflicts
```

### Scenario 2: Multiple Shoppers
```
Family members shop independently
├─ Mom buys milk (marks as gotten)
├─ Dad also buys milk (different quantity)
└─ Both sync later → conflict on the milk item
```

### Scenario 3: Rapid Simultaneous Edits
```
Two users editing the same item at the same time
├─ User A: Changes "Apples" to "Green Apples"
├─ User B: Changes "Apples" to "Red Apples"
└─ Sync happens → name conflict
```

### Scenario 4: Time Zone Differences
```
Users in different time zones
├─ User A edits at 9 AM local time
├─ User B edits at "same time" but different zone
└─ Timestamps might be close → conflict resolution needed
```

---

## How Automatic Resolution Works

The app uses intelligent strategies to resolve most conflicts automatically without bothering you. Here's how:

### Resolution Strategy #1: Last-Write-Wins

The most recent change wins based on timestamp.

**How it works:**
```
Change A: Made at 10:00 AM
Change B: Made at 10:05 AM
Result: Change B wins (more recent)
```

**Best for:**
- Simple updates that don't have semantic meaning
- When the latest information is usually correct

**Example:**
```
User A (10:00 AM): Updates quantity to 2
User B (10:05 AM): Updates quantity to 3
Resolution: Quantity = 3 (User B's newer change wins)
```

### Resolution Strategy #2: Prefer "Gotten" State

If one version marks an item as "gotten" and the other doesn't, the "gotten" version wins.

**Why this matters:**
Prevents the frustrating scenario where you mark an item as gotten, but a sync reverts it back to "not gotten."

**Example:**
```
User A: Marks "Milk" as gotten ✓
User B: Edits milk quantity to 2 (not gotten)
Resolution: Milk is gotten ✓ with quantity 2 (merged)
```

### Resolution Strategy #3: Field-Level Merge

When different fields are modified, combine all changes intelligently.

**How it works:**
```
Local:  { quantity: 2, notes: "Organic" }
Remote: { quantity: 2, gotten: true }
Merged: { quantity: 2, notes: "Organic", gotten: true }
```

**Special field handling:**
- **gotten**: Always prefer `true` (someone got the item)
- **quantity**: Use the higher value (someone needed more)
- **notes**: Concatenate with " | " separator
- **name**: Keep most recent (requires manual resolution if critical)
- **category**: Keep most recent

**Example:**
```
User A: Adds note "Low fat" + quantity 2
User B: Marks as gotten
Merged:
  - quantity: 2 (from A)
  - notes: "Low fat" (from A)
  - gotten: true (from B)
```

### Resolution Strategy #4: Quantity Merging

When both users increase quantity, use the higher value.

**Example:**
```
Original: quantity = 1
User A: Increases to 3
User B: Increases to 5
Resolution: quantity = 5 (higher value, more needed)
```

### When Automatic Resolution Fails

Automatic resolution is NOT used when:
1. **Critical fields conflict** (name, category)
2. **Timestamps are too close** (within 5 minutes)
3. **Both users deleted** the same item
4. **Semantic conflicts** that need human judgment

In these cases, the app will notify you and provide a manual resolution interface.

---

## How to Manually Resolve Conflicts

When automatic resolution isn't possible, you'll be prompted to manually resolve the conflict.

### Step-by-Step Manual Resolution

#### 1. Conflict Detection Notification

When a conflict requires manual resolution, you'll see:
```
┌─────────────────────────────────────┐
│ ⚠️  Conflict Detected                │
│                                     │
│ 1 item requires your attention      │
│                                     │
│ [View Conflict]                     │
└─────────────────────────────────────┘
```

#### 2. Conflict Details View

Click "View Conflict" to see the conflict details:
```
┌─────────────────────────────────────┐
│ Conflict: Milk                      │
│ Type: Field conflict                │
│                                     │
│ Your Version (Local):               │
│ ├─ Name: Whole Milk                 │
│ ├─ Quantity: 2                      │
│ └─ Notes: Organic                   │
│                                     │
│ Other Version (Remote):             │
│ ├─ Name: Skim Milk                  │
│ ├─ Quantity: 3                      │
│ └─ Notes: Store brand               │
│                                     │
│ Fields in conflict:                 │
│ ├─ ⚠️  Name (critical)               │
│ ├─ ⚠️  Quantity                      │
│ └─ ⚠️  Notes                         │
└─────────────────────────────────────┘
```

#### 3. Choose Resolution Method

You have four options:

**Option 1: Keep Your Version**
```
[Keep Mine] → Uses all local changes
Result: Whole Milk, quantity 2, notes "Organic"
```

**Option 2: Keep Other Version**
```
[Keep Theirs] → Uses all remote changes
Result: Skim Milk, quantity 3, notes "Store brand"
```

**Option 3: Merge Fields**
```
[Smart Merge] → Intelligently combines both
Result: Newer name + higher quantity + merged notes
        Whole Milk, quantity 3, notes "Organic | Store brand"
```

**Option 4: Custom Resolution**
```
[Edit Manually] → Create your own version
You type: Regular Milk, quantity 4, notes "Either brand"
```

#### 4. Confirm and Apply

After choosing, confirm your selection:
```
┌─────────────────────────────────────┐
│ Resolution Preview                  │
│                                     │
│ Final version:                      │
│ ├─ Name: Whole Milk                 │
│ ├─ Quantity: 3                      │
│ └─ Notes: Organic | Store brand     │
│                                     │
│ [Cancel]  [Apply Resolution]        │
└─────────────────────────────────────┘
```

#### 5. Sync Complete

After resolving, the item syncs with your chosen resolution:
```
✓ Conflict resolved successfully
  All changes have been synced
```

---

## Understanding the Sync Status Indicator

The app provides a sync status indicator to show the current state of your offline queue and conflicts.

### Status Indicator States

#### 🟢 Green Dot: "Online and Synced"
```
● Online
```
- Connected to the server
- All changes synced
- No queued mutations
- Everything up to date

#### 🟡 Yellow Dot: "Syncing"
```
◐ Syncing...
```
- Connected to the server
- Actively syncing changes
- Queue is being processed
- Wait for completion

#### 🔴 Red Dot: "Offline"
```
● Offline
```
- No internet connection
- Changes are queued locally
- Will sync when reconnected
- You can still edit items

#### ⚠️ Orange Dot: "Conflicts Detected"
```
⚠ Conflicts (2)
```
- Connected to server
- Some conflicts require resolution
- Click to view and resolve
- Other changes may be syncing

### Clicking the Status Indicator

Click the status indicator to expand details:
```
┌─────────────────────────────────────┐
│ Sync Status                         │
│                                     │
│ Connection:     [● Online]          │
│ Quality:        [● Good]            │
│ Status:         [◐ Syncing...]      │
│ Queued:         5 items             │
│ Last sync:      2m ago              │
│                                     │
│ [Retry Sync]                        │
│                                     │
│ ℹ️  Some changes are waiting to     │
│    sync. Click "Retry Sync" if      │
│    needed.                          │
└─────────────────────────────────────┘
```

### Connection Quality Indicators

**● Good**: Last synced within 5 minutes
- Normal operation
- Quick sync times
- Reliable connection

**◐ Poor**: Last synced over 5 minutes ago
- Slow or intermittent connection
- Sync delays
- Consider finding better signal

---

## Tips for Avoiding Conflicts

While the app handles conflicts automatically, here are best practices to minimize them:

### 1. Sync Before Making Major Changes

Before editing, make sure you're synced:
```
✓ Check status indicator is green
✓ Wait for "All changes synced" message
✓ Then start editing
```

### 2. Communicate with Other Users

If multiple people are shopping:
```
✓ Agree on who edits what items
✓ Use notes to indicate "in progress"
✓ Avoid editing the same items simultaneously
```

### 3. Work in Small Batches

Instead of:
```
❌ Making 20 changes offline
❌ Then syncing all at once
```

Do this:
```
✓ Make 2-3 changes
✓ Sync when possible
✓ Repeat
```

### 4. Use Item Notes for Coordination

Add notes to indicate status:
```
✓ "Checking store" - You're looking for it
✓ "In cart" - You have it
✓ "Not available" - Couldn't find it
```

### 5. Prefer "Gotten" Over Deleting

Instead of:
```
❌ Deleting items after getting them
```

Do this:
```
✓ Mark items as "gotten" ✓
✓ Let the app clean up later
```

### 6. Enable Auto-Sync

Keep auto-sync enabled:
```
Settings → Sync → Auto-sync: [ON]
```

### 7. Monitor Your Connection

Check connection quality:
```
Poor connection → Wait before editing
Good connection → Edit freely
```

### 8. Use Bulk Operations Carefully

When using "Delete All Gotten":
```
✓ Sync first
✓ Make sure others synced
✓ Then bulk delete
```

---

## Troubleshooting Common Issues

### Issue 1: Changes Not Syncing

**Symptoms:**
- Items show as queued
- Sync status stuck
- Changes don't appear on other devices

**Solutions:**

1. **Check Internet Connection**
   ```
   Settings → WiFi/Mobile Data → Verify connected
   ```

2. **Check Status Indicator**
   ```
   Red dot → You're offline (expected)
   Yellow dot → Syncing in progress (wait)
   Green dot → Should be synced (retry if not)
   ```

3. **Force Retry**
   ```
   Click status indicator → [Retry Sync]
   ```

4. **Clear Queue and Re-add**
   ```
   If stuck:
   - Export your list (backup)
   - Clear offline queue (Settings → Advanced)
   - Refresh page
   - Re-add items if needed
   ```

### Issue 2: Too Many Conflicts

**Symptoms:**
- Frequent conflict notifications
- Constant manual resolution required
- Frustrating user experience

**Solutions:**

1. **Coordinate with Team**
   ```
   Talk to other users about who edits what
   ```

2. **Establish Editing Rules**
   ```
   Example rules:
   - Person shopping has edit priority
   - Person at home views only
   - Wait for sync before bulk operations
   ```

3. **Use List Permissions**
   ```
   Share list with appropriate permissions:
   - Owner: Full control
   - Editor: Can edit items
   - Viewer: Read-only (no conflicts!)
   ```

4. **Check Timestamps**
   ```
   Settings → Advanced → "Fix Clock Skew"
   Ensures timestamps are accurate
   ```

### Issue 3: Lost Changes After Sync

**Symptoms:**
- Made changes while offline
- Changes disappeared after syncing
- Item reverted to old version

**Solutions:**

1. **Check Conflict Log**
   ```
   Settings → Sync → Conflict History
   See if your change was overridden
   ```

2. **Verify Timestamps**
   ```
   Your device clock must be accurate
   Settings → Date & Time → Auto-set time [ON]
   ```

3. **Look for Merged Items**
   ```
   Your changes might be merged into another item
   Check notes field for concatenated text
   ```

4. **Contact List Owner**
   ```
   If changes consistently disappear:
   - Verify you have Editor permission (not Viewer)
   - Ask owner to check server logs
   ```

### Issue 4: Sync Takes Too Long

**Symptoms:**
- Syncing... message persists
- Queue not clearing
- Long wait times

**Solutions:**

1. **Check Queue Size**
   ```
   Click status indicator → See "Queued: X items"
   Large queue = longer sync time
   ```

2. **Check Connection Quality**
   ```
   Poor connection → Slow sync
   Switch to WiFi if on mobile data
   ```

3. **Reduce Queue Size**
   ```
   Instead of queuing 50 items:
   - Sync in batches of 10
   - Wait for each batch to complete
   ```

4. **Clear Failed Items**
   ```
   Settings → Sync → Failed Items → Clear
   Retry failed items individually
   ```

### Issue 5: Conflict Won't Resolve

**Symptoms:**
- Conflict resolution applied
- Conflict reappears
- Can't dismiss conflict

**Solutions:**

1. **Check Other Devices**
   ```
   Another device might be offline with conflicting changes
   Wait for all devices to sync
   ```

2. **Force Full Sync**
   ```
   Settings → Sync → [Force Full Sync]
   Downloads all server data
   Resolves stubborn conflicts
   ```

3. **Recreate Item**
   ```
   Last resort:
   - Delete conflicting item on all devices
   - Wait for sync
   - Create item fresh
   ```

### Issue 6: "Max Retries Exceeded" Error

**Symptoms:**
```
❌ Error: Max retries exceeded for mutation
```

**Meaning:**
The app tried to sync a change 5 times and failed each time.

**Solutions:**

1. **Check Error Details**
   ```
   Click status indicator → Failed Items → View Error
   ```

2. **Common Errors and Fixes:**
   - **"Item not found"**: Item was deleted on server
     - Solution: Remove from queue, re-add if needed

   - **"Permission denied"**: Your permission changed
     - Solution: Ask owner to restore Editor permission

   - **"Invalid data"**: Corrupted queue entry
     - Solution: Clear queue entry, re-add item

   - **"Network timeout"**: Server unreachable
     - Solution: Check server status, retry later

3. **Clear Failed Mutation**
   ```
   Settings → Sync → Failed Items
   Find the item → [Remove from Queue]
   ```

4. **Re-add Manually**
   ```
   After clearing failed mutation:
   - Note the item details
   - Remove from queue
   - Add item again manually
   ```

---

## Frequently Asked Questions

### Q1: Will I lose my changes if I close the app while offline?

**A:** No! All offline changes are persisted to your browser's local storage. Even if you:
- Close the browser tab
- Restart your device
- Turn off your computer

Your changes will be there when you return and will sync when you reconnect.

### Q2: How long are offline changes stored?

**A:** Indefinitely. Changes stay in the queue until:
- Successfully synced to the server, OR
- You manually clear them, OR
- You clear browser data/cookies

**Best practice:** Sync within 7 days to avoid clock skew issues.

### Q3: Can I see which changes are queued?

**A:** Yes! Click the sync status indicator to see:
- Number of queued items
- Last sync time
- Current sync status
- Failed items (if any)

For detailed queue view:
```
Settings → Sync → Offline Queue → View Details
```

### Q4: What happens if two people delete the same item?

**A:** No conflict! Both deletions are idempotent:
- First deletion removes the item
- Second deletion finds it already deleted
- No error, no conflict

### Q5: Can I disable offline mode?

**A:** Not recommended, but if needed:
```
Settings → Sync → Offline Mode → [OFF]

Warning: With offline mode disabled:
- Cannot edit when offline
- Changes won't queue
- May see errors instead
```

### Q6: How does the app handle very slow connections?

**A:** The app uses intelligent retry with exponential backoff:
1. First retry: Wait 1 second
2. Second retry: Wait 2 seconds
3. Third retry: Wait 4 seconds
4. Fourth retry: Wait 8 seconds
5. Fifth retry: Wait 16 seconds
6. After 5 failures: Mark as failed, manual retry needed

This prevents overwhelming slow connections while ensuring eventual sync.

### Q7: What if my device clock is wrong?

**A:** Wrong timestamps can cause conflict resolution issues. The app:
- Uses your device's system time for timestamps
- Warns if clock skew detected (>5 minutes difference from server)
- Suggests enabling automatic time sync

**Fix:**
```
Device Settings → Date & Time → Set Automatically [ON]
```

### Q8: Can I undo a conflict resolution?

**A:** Not directly, but you can:
1. **View Conflict History**
   ```
   Settings → Sync → Conflict Log
   ```

2. **See What Changed**
   ```
   Find the resolved conflict
   View "Before" and "After" snapshots
   ```

3. **Manually Revert**
   ```
   Edit the item back to desired state
   Will sync as a new change
   ```

### Q9: Does the app work completely offline?

**A:** Yes! When offline, you can:
- ✓ Add items
- ✓ Edit items
- ✓ Delete items
- ✓ Mark items as gotten
- ✓ Search and filter items
- ✓ View all lists

You CANNOT:
- ✗ Share lists (requires server)
- ✗ Add new members (requires server)
- ✗ See changes from others until you sync

### Q10: How many conflicts can happen at once?

**A:** There's no limit, but in practice:
- **Typical:** 0-2 conflicts per sync
- **Common:** 3-5 conflicts (family shopping separately)
- **Rare:** 10+ conflicts (indicates coordination issue)

If you consistently have 10+ conflicts, review your team's editing practices.

### Q11: Are conflict resolutions logged?

**A:** Yes! Every conflict resolution is logged with:
- Timestamp of conflict
- Timestamp of resolution
- User who resolved
- Strategy used (auto vs manual)
- Before/after snapshots
- Resolution outcome

View logs:
```
Settings → Sync → Conflict Log
```

### Q12: Can I export conflict history?

**A:** Yes!
```
Settings → Sync → Conflict Log → [Export as JSON]
```

Useful for:
- Troubleshooting patterns
- Team coordination review
- Audit trail

---

## Summary

The Grocery List app's offline conflict resolution system ensures that:

✓ **Your changes are never lost** - all edits are queued and persisted
✓ **Most conflicts resolve automatically** - intelligent strategies handle common cases
✓ **Clear visibility** - sync status always visible
✓ **Manual control when needed** - you decide on complex conflicts
✓ **Reliable synchronization** - automatic retry with exponential backoff

By following the best practices in this guide, you can minimize conflicts and enjoy seamless collaboration whether you're online or offline.

**Quick Reference:**
- 🟢 Green = All synced
- 🟡 Yellow = Syncing in progress
- 🔴 Red = Offline (changes queued)
- ⚠️ Orange = Conflicts need resolution

For technical details, see:
- [Technical Architecture](/docs/OFFLINE_ARCHITECTURE.md)
- [API Reference](/docs/CONFLICT_API_REFERENCE.md)
- [Best Practices](/docs/OFFLINE_BEST_PRACTICES.md)

---

**Need Help?**

If you encounter issues not covered in this guide:
1. Check the [Troubleshooting](#troubleshooting-common-issues) section
2. View conflict logs: `Settings → Sync → Conflict Log`
3. Contact your list owner or system administrator
4. Report bugs to the development team

**Version:** 1.0.0
**Last Updated:** October 2025
