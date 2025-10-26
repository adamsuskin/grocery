# Gamification System - Integration Guide

Quick guide to integrate the gamification system into your grocery list application.

## Step-by-Step Integration

### Step 1: Add Global Notification Component

Add the notification component to your root App component:

```tsx
// src/App.tsx
import { GamificationNotification } from './components/GamificationNotification';

function App() {
  return (
    <>
      {/* Add notification component at root level */}
      <GamificationNotification position="top-right" />

      {/* Rest of your app */}
      <YourAppContent />
    </>
  );
}
```

### Step 2: Update Custom Category Manager

Add achievement checking to your category manager:

```tsx
// src/components/CustomCategoryManager.tsx
import { checkAchievements, isFunModeEnabled } from '../utils/categoryGamification';

export function CustomCategoryManager({ listId, ...props }) {
  const categories = useCustomCategories(listId);
  const items = useGroceryItems(listId);

  // Check achievements when categories change
  useEffect(() => {
    if (isFunModeEnabled()) {
      checkAchievements(listId, categories, items);
    }
  }, [listId, categories, items]);

  // Rest of your component...
}
```

### Step 3: Add Widget to Sidebar or Dashboard

Display a compact widget in your sidebar:

```tsx
// src/components/Sidebar.tsx or Dashboard.tsx
import { useState } from 'react';
import { GamificationWidget } from './components/GamificationDashboard';
import { GamificationDashboard } from './components/GamificationDashboard';

export function Sidebar({ listId, categories, items }) {
  const [showDashboard, setShowDashboard] = useState(false);

  return (
    <div className="sidebar">
      {/* Existing sidebar content */}

      {/* Add gamification widget */}
      <GamificationWidget
        listId={listId}
        categories={categories}
        items={items}
        onOpenDashboard={() => setShowDashboard(true)}
      />

      {/* Dashboard modal */}
      {showDashboard && (
        <GamificationDashboard
          listId={listId}
          categories={categories}
          items={items}
          onClose={() => setShowDashboard(false)}
        />
      )}
    </div>
  );
}
```

### Step 4: Add Settings to User Profile

Integrate gamification settings into your settings page:

```tsx
// src/components/UserProfile.tsx
import { GamificationSettings, GamificationToggle } from './components/GamificationSettings';

export function UserProfile() {
  const [activeTab, setActiveTab] = useState('profile');
  const currentListId = useCurrentListId();

  return (
    <div className="profile-modal">
      <div className="profile-tabs">
        <button onClick={() => setActiveTab('profile')}>Profile</button>
        <button onClick={() => setActiveTab('sync')}>Sync</button>
        {/* Add gamification tab */}
        <button onClick={() => setActiveTab('gamification')}>
          Gamification
        </button>
      </div>

      <div className="profile-content">
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'sync' && <SyncTab />}
        {activeTab === 'gamification' && (
          <GamificationSettings currentListId={currentListId} />
        )}
      </div>
    </div>
  );
}
```

### Step 5: Add Leaderboard to Shared Lists

For shared lists, show the leaderboard:

```tsx
// src/components/ListStats.tsx or ListManagement.tsx
import { calculateLeaderboard } from '../utils/categoryGamification';
import { GamificationLeaderboardCompact } from '../components/GamificationLeaderboard';

export function ListStats({ listId }) {
  const categories = useCustomCategories(listId);
  const items = useGroceryItems(listId);
  const members = useListMembers(listId);
  const currentUserId = useCurrentUserId();

  const leaderboard = calculateLeaderboard(listId, categories, items, members);

  return (
    <div>
      {/* Existing stats */}

      {/* Add leaderboard if list has multiple members */}
      {members.length > 1 && (
        <GamificationLeaderboardCompact
          entries={leaderboard}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}
```

### Step 6: Add Challenges to Main View

Display challenges in your main grocery list view:

```tsx
// src/components/GroceryList.tsx
import { useState, useEffect } from 'react';
import { getGamificationData, isFunModeEnabled } from '../utils/categoryGamification';
import { GamificationChallengesCompact } from '../components/GamificationChallenges';

export function GroceryList({ listId }) {
  const [showChallenges, setShowChallenges] = useState(true);
  const gamificationData = getGamificationData(listId);

  if (!isFunModeEnabled() || !showChallenges) {
    return null;
  }

  return (
    <div>
      {/* Show top challenge */}
      {gamificationData.challenges.length > 0 && (
        <GamificationChallengesCompact
          listId={listId}
          challenges={gamificationData.challenges}
          onDismiss={() => setShowChallenges(false)}
        />
      )}

      {/* Your grocery list items */}
    </div>
  );
}
```

## Testing Your Integration

### 1. Test Achievement Unlocking

Create categories to unlock achievements:

```tsx
// Create first category → "Category Creator" unlocks
// Add colors to all → "Color Coordinator" unlocks
// Add icons to all → "Icon Master" unlocks
// Create 10+ → "Organization Expert" unlocks
```

### 2. Test Fun Mode Toggle

```tsx
// Go to Settings
// Toggle Fun Mode ON/OFF
// Verify widgets disappear when OFF
// Verify notifications stop when disabled
```

### 3. Test Leaderboard

```tsx
// Share a list with multiple users
// Have each user create categories
// Check leaderboard shows correct scores
// Verify current user is highlighted
```

### 4. Test Notifications

```tsx
// Create a category
// Achievement notification should appear
// Should auto-hide after 5 seconds
// Should show sparkle animations
```

## Common Integration Patterns

### Pattern 1: Check After Mutations

```tsx
const handleCreateCategory = async (data) => {
  await createCustomCategory(data);

  // Refresh and check achievements
  const updatedCategories = await fetchCategories(listId);
  checkAchievements(listId, updatedCategories, items);
};
```

### Pattern 2: Conditional Rendering

```tsx
if (!isFunModeEnabled()) {
  return null; // Don't render gamification UI
}

return <GamificationWidget {...props} />;
```

### Pattern 3: Progress Tracking

```tsx
const data = getGamificationData(listId);
const progress = data.achievements.filter(a => a.unlockedAt).length;
const total = data.achievements.length;

<Badge>{progress}/{total}</Badge>
```

## Styling Integration

The gamification components use their own CSS files. Make sure to import them:

```tsx
// Already included in component files
import './GamificationBadges.css';
import './GamificationProgress.css';
// etc.
```

If you need to override styles:

```css
/* Your custom styles */
.gamification-widget {
  /* Override default styles */
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

## Performance Considerations

### 1. Lazy Load Dashboard

```tsx
import { lazy, Suspense } from 'react';

const GamificationDashboard = lazy(() =>
  import('./components/GamificationDashboard').then(m => ({
    default: m.GamificationDashboard
  }))
);

// Use with Suspense
<Suspense fallback={<div>Loading...</div>}>
  {showDashboard && <GamificationDashboard {...props} />}
</Suspense>
```

### 2. Memoize Calculations

```tsx
import { useMemo } from 'react';

const leaderboard = useMemo(
  () => calculateLeaderboard(listId, categories, items, members),
  [listId, categories, items, members]
);
```

### 3. Throttle Achievement Checks

```tsx
import { useEffect, useRef } from 'react';

const lastCheck = useRef(0);

useEffect(() => {
  const now = Date.now();
  if (now - lastCheck.current < 1000) return; // Throttle to 1 second

  lastCheck.current = now;
  checkAchievements(listId, categories, items);
}, [listId, categories, items]);
```

## Troubleshooting

### Issue: Achievements not unlocking

**Solution:**
1. Verify `checkAchievements()` is called
2. Check Fun Mode is enabled
3. Ensure arrays are not empty
4. Check browser console for errors

### Issue: Notifications not appearing

**Solution:**
1. Verify `<GamificationNotification />` is rendered
2. Check settings: `getGamificationSettings().showNotifications`
3. Look for z-index conflicts with other modals
4. Check browser console for errors

### Issue: Stats not updating

**Solution:**
1. Call `checkAchievements()` to recalculate
2. Verify localStorage is available
3. Clear localStorage if corrupted: `resetGamificationData(listId)`

### Issue: Widget not showing

**Solution:**
1. Check `isFunModeEnabled()` returns true
2. Verify component has required props
3. Check CSS is imported correctly
4. Inspect element to see if it's rendered but hidden

## Migration Guide

If you already have category features implemented:

### 1. Add to existing mutation handlers

```tsx
// Before
const handleCreate = async (data) => {
  await createCategory(data);
};

// After
const handleCreate = async (data) => {
  await createCategory(data);

  // Add gamification check
  const categories = await fetchCategories(listId);
  checkAchievements(listId, categories, items);
};
```

### 2. Add to existing settings

```tsx
// Add to your existing settings modal
import { GamificationToggle } from './components/GamificationSettings';

<div className="settings-section">
  <h3>Preferences</h3>
  <GamificationToggle />
  {/* Your other settings */}
</div>
```

### 3. Add to existing stats display

```tsx
// Extend your existing stats
const data = getGamificationData(listId);

<StatsCard>
  {/* Existing stats */}
  <Stat label="Level" value={data.level} />
  <Stat label="Achievements" value={`${unlocked}/${total}`} />
</StatsCard>
```

## Next Steps

After basic integration:

1. **Customize Styling**: Match gamification UI to your app's theme
2. **Add Analytics**: Track which achievements users unlock most
3. **User Testing**: Get feedback on Fun Mode usability
4. **Performance**: Monitor localStorage usage and optimize
5. **Extend Features**: Consider adding custom achievements

## Support

For issues or questions:
- Check the main `GAMIFICATION_README.md`
- Review `categoryGamification.example.tsx` for usage patterns
- Inspect browser console for errors
- Test with mock data in isolation

---

**Happy Integrating! 🎮**
