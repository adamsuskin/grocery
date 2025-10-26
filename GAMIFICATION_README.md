# Category Gamification System

A comprehensive gamification system designed to encourage custom category usage in grocery lists through achievements, challenges, progress tracking, and social features.

## 🎮 Features

### 1. Achievements & Badges

**10 Unique Achievements:**

- **Category Creator** (Common) - Created your first custom category
- **Color Coordinator** (Rare) - Added colors to all your categories
- **Icon Master** (Rare) - Added icons to all your categories
- **Organization Expert** (Epic) - Created 10+ custom categories
- **Minimalist** (Rare) - Kept categories under 5 with high usage
- **Perfectionist** (Legendary) - All items properly categorized (none in "Other")
- **Speed Organizer** (Epic) - Created 5 categories in one day
- **Diverse Categorizer** (Rare) - Created categories spanning multiple types
- **Category Veteran** (Legendary) - Used custom categories for 30 days straight
- **Detail Oriented** (Epic) - All categories have both icons and colors

### 2. Statistics & Progress Tracking

- **Organization Score** (0-100): Based on color/icon usage and category adoption
- **Categorization Score** (0-100): Percentage of items properly categorized
- **Total categories created**
- **Most used custom category**
- **Items in custom categories vs "Other"**
- **Categories with colors/icons**

### 3. Level System

Progress through 5 levels as you create more categories:

1. **🌱 Category Beginner** (0+ categories)
2. **🌿 Category Organizer** (3+ categories)
3. **🌳 Category Specialist** (7+ categories)
4. **⭐ Category Expert** (12+ categories)
5. **👑 Category Master** (20+ categories)

### 4. Friendly Challenges

Contextual challenges appear based on your current state:

- **Tips**: Helpful suggestions for new users
- **Goals**: Specific targets to achieve
- **Milestones**: Level progression indicators

Examples:
- "Try creating a custom category for your favorite food type"
- "Color code your categories to make shopping easier"
- "Help reach 100% categorization (no items in 'Other')"

### 5. Celebration Animations

- Animated achievement unlock notifications
- Sparkle effects and emoji reactions
- Progress bar celebrations
- Level-up animations

### 6. Social Gamification (Shared Lists)

- **Leaderboard**: See who created the most useful categories
- **Score System**: Points based on categories created and usage
- **Collaborative Goals**: Team challenges for shared lists
- **Contributor Badges**: Recognition for category creators

### 7. Optional Fun Mode

- Toggle gamification on/off in settings
- Disable for serious/professional use
- Granular controls:
  - Achievement notifications
  - Challenges & tips
  - Leaderboard display

## 📁 Files Overview

### Core Utilities

- **`src/utils/categoryGamification.ts`**: Main gamification engine
  - Achievement tracking
  - Statistics calculation
  - Level progression
  - Challenge generation
  - Leaderboard calculation
  - Settings management

### React Components

- **`src/components/GamificationBadges.tsx`**: Achievement display modal
- **`src/components/GamificationProgress.tsx`**: Progress bars and level display
- **`src/components/GamificationChallenges.tsx`**: Challenge cards
- **`src/components/GamificationNotification.tsx`**: Achievement unlock animations
- **`src/components/GamificationLeaderboard.tsx`**: Collaborative leaderboard
- **`src/components/GamificationSettings.tsx`**: Settings panel with Fun Mode toggle
- **`src/components/GamificationDashboard.tsx`**: Unified dashboard and widget

### Styling

- **`src/components/GamificationBadges.css`**
- **`src/components/GamificationProgress.css`**
- **`src/components/GamificationChallenges.css`**
- **`src/components/GamificationNotification.css`**
- **`src/components/GamificationLeaderboard.css`**
- **`src/components/GamificationSettings.css`**
- **`src/components/GamificationDashboard.css`**

### Examples & Documentation

- **`src/utils/categoryGamification.example.tsx`**: Usage examples
- **`GAMIFICATION_README.md`**: This file

## 🚀 Quick Start

### 1. Basic Integration

Add the notification component to your root component:

```tsx
import { GamificationNotification } from './components/GamificationNotification';

function App() {
  return (
    <>
      <GamificationNotification position="top-right" />
      {/* Your app content */}
    </>
  );
}
```

### 2. Check Achievements

Trigger achievement checks when categories or items change:

```tsx
import { checkAchievements } from './utils/categoryGamification';

function MyComponent({ listId, categories, items }) {
  useEffect(() => {
    const { newUnlocked, data } = checkAchievements(listId, categories, items);

    if (newUnlocked.length > 0) {
      console.log('New achievements:', newUnlocked);
    }
  }, [listId, categories, items]);
}
```

### 3. Display Dashboard

Show the gamification dashboard:

```tsx
import { GamificationDashboard } from './components/GamificationDashboard';

function MyComponent({ listId, categories, items }) {
  const [showDashboard, setShowDashboard] = useState(false);

  return (
    <>
      <button onClick={() => setShowDashboard(true)}>
        View Progress
      </button>

      {showDashboard && (
        <GamificationDashboard
          listId={listId}
          categories={categories}
          items={items}
          onClose={() => setShowDashboard(false)}
        />
      )}
    </>
  );
}
```

### 4. Widget Integration

Add a compact widget to your UI:

```tsx
import { GamificationWidget } from './components/GamificationDashboard';

function Sidebar({ listId, categories, items }) {
  const [showDashboard, setShowDashboard] = useState(false);

  return (
    <div className="sidebar">
      <GamificationWidget
        listId={listId}
        categories={categories}
        items={items}
        onOpenDashboard={() => setShowDashboard(true)}
      />
    </div>
  );
}
```

### 5. Add Settings

Integrate Fun Mode toggle in your settings:

```tsx
import { GamificationSettings } from './components/GamificationSettings';

function SettingsPage({ currentListId }) {
  return (
    <div>
      <h2>Settings</h2>
      <GamificationSettings currentListId={currentListId} />
    </div>
  );
}
```

## 🎯 Usage Patterns

### Pattern 1: After Category Creation

```tsx
const handleCreateCategory = async (categoryData) => {
  await createCustomCategory(categoryData);

  // Check for new achievements
  const { newUnlocked } = checkAchievements(listId, categories, items);

  if (newUnlocked.some(a => a.id === 'category_creator')) {
    // First category created! Show special message
  }
};
```

### Pattern 2: Leaderboard for Shared Lists

```tsx
import { calculateLeaderboard } from './utils/categoryGamification';

function SharedList({ listId, categories, items, members }) {
  const leaderboard = calculateLeaderboard(
    listId,
    categories,
    items,
    members
  );

  return (
    <GamificationLeaderboard
      entries={leaderboard}
      currentUserId={currentUserId}
      collaborative={true}
    />
  );
}
```

### Pattern 3: Progressive Onboarding

```tsx
function Onboarding({ listId }) {
  const data = getGamificationData(listId);
  const nextChallenge = data.challenges[0];

  if (!nextChallenge) return null;

  return (
    <div className="onboarding-tip">
      <h4>{nextChallenge.title}</h4>
      <p>{nextChallenge.description}</p>
    </div>
  );
}
```

## ⚙️ Configuration

### Fun Mode Settings

Users can customize their experience:

```tsx
import {
  getGamificationSettings,
  updateGamificationSettings
} from './utils/categoryGamification';

// Get current settings
const settings = getGamificationSettings();
console.log(settings.funModeEnabled); // true/false

// Update settings
updateGamificationSettings({
  funModeEnabled: true,
  showNotifications: true,
  showChallenges: true,
  showLeaderboard: true,
});
```

### Check if Fun Mode is Enabled

```tsx
import { isFunModeEnabled } from './utils/categoryGamification';

if (isFunModeEnabled()) {
  // Show gamification features
}
```

## 💾 Data Storage

The gamification system uses localStorage for persistence:

- **Gamification Data**: Per-list storage of achievements, stats, and progress
- **Settings**: Global settings for Fun Mode preferences
- **Notifications**: Queue of pending achievement notifications

### Export/Import Data

```tsx
import {
  exportGamificationData,
  resetGamificationData
} from './utils/categoryGamification';

// Export data (returns JSON string)
const data = exportGamificationData(listId);

// Reset all data for a list
resetGamificationData(listId);
```

## 🎨 Customization

### Achievement Colors

Achievement rarity determines color:
- Common: Gray (#808080)
- Rare: Blue (#4A90E2)
- Epic: Purple (#9B59B6)
- Legendary: Gold (#F39C12)

### Level Colors

Each level has a unique color:
- Beginner: Green (#4CAF50)
- Intermediate: Light Green (#8BC34A)
- Advanced: Yellow (#FFC107)
- Expert: Orange (#FF9800)
- Master: Purple (#9C27B0)

## 🧪 Testing

Test achievement unlocks manually:

```tsx
import { checkAchievements } from './utils/categoryGamification';

// Mock data
const mockCategories = [
  { id: '1', name: 'Snacks', color: '#FF5733', icon: '🍿', ... },
  { id: '2', name: 'Drinks', color: '#3498DB', icon: '🥤', ... },
];

const mockItems = [
  { id: '1', category: 'Snacks', ... },
  { id: '2', category: 'Drinks', ... },
];

const { newUnlocked, data } = checkAchievements(
  'test-list',
  mockCategories,
  mockItems
);

console.log('Unlocked:', newUnlocked);
console.log('Stats:', data.stats);
console.log('Level:', data.level);
```

## 🔧 API Reference

### Core Functions

#### `checkAchievements(listId, categories, items)`
Checks for newly unlocked achievements based on current data.

**Returns:**
```tsx
{
  newUnlocked: Achievement[],  // Newly unlocked achievements
  data: GamificationData        // Updated gamification data
}
```

#### `getGamificationData(listId)`
Gets all gamification data for a list.

**Returns:** `GamificationData`

#### `calculateStats(categories, items)`
Calculates statistics from categories and items.

**Returns:** `GamificationStats`

#### `calculateLeaderboard(listId, categories, items, members)`
Generates leaderboard for shared lists.

**Returns:** `LeaderboardEntry[]`

#### `generateChallenges(categories, items, level)`
Generates contextual challenges based on current state.

**Returns:** `Challenge[]`

### Settings Functions

#### `getGamificationSettings()`
Gets current gamification settings.

#### `updateGamificationSettings(settings)`
Updates gamification settings.

#### `isFunModeEnabled()`
Checks if Fun Mode is enabled.

### Data Management

#### `exportGamificationData(listId)`
Exports gamification data as JSON string.

#### `resetGamificationData(listId)`
Resets all gamification data for a list.

## 📊 Score Calculation

### Organization Score (0-100)
- 30% from color usage (colors added / total categories)
- 30% from icon usage (icons added / total categories)
- 40% from category adoption (items in custom categories / total items)

### Categorization Score (0-100)
- Percentage of items NOT in "Other" category
- Perfect score (100) when all items are categorized

### Leaderboard Score
- Points = (categories created × 10) + (items using those categories × 1)
- Rewards both creation and utility

## 🎯 Best Practices

1. **Check achievements after mutations**: Always call `checkAchievements()` after creating/editing categories or items

2. **Respect Fun Mode**: Always check `isFunModeEnabled()` before showing gamification UI

3. **Non-intrusive notifications**: Achievement notifications auto-hide after 5 seconds

4. **Progressive disclosure**: Show widget → dashboard → full features

5. **Responsive design**: All components are mobile-friendly

6. **Accessibility**: All components include ARIA labels and keyboard navigation

7. **Performance**: Use `compact` mode for widgets to minimize rendering

## 🚨 Troubleshooting

### Achievements not unlocking
- Verify `checkAchievements()` is called when data changes
- Check that Fun Mode is enabled
- Ensure categories and items arrays are not empty

### Notifications not showing
- Verify `<GamificationNotification />` is rendered
- Check that `showNotifications` is enabled in settings
- Ensure notifications are not blocked by other modals

### Stats not updating
- Call `checkAchievements()` to recalculate stats
- Verify localStorage is available and not full
- Check browser console for errors

## 🔮 Future Enhancements

Potential additions to consider:

1. **Streak Tracking**: Track consecutive days of category usage
2. **Team Challenges**: Collaborative goals for shared lists
3. **Custom Achievements**: Let users create personal goals
4. **Export/Share**: Share achievements on social media
5. **Seasonal Events**: Time-limited special achievements
6. **Category Templates**: Unlock templates by achieving milestones
7. **Point Shop**: Spend points on themes or features
8. **Analytics Dashboard**: Detailed insights and graphs

## 📄 License

Part of the Grocery List application.

## 🤝 Contributing

When adding new achievements:

1. Add to `ACHIEVEMENT_DEFINITIONS` in `categoryGamification.ts`
2. Update the `AchievementId` type in `types.ts`
3. Implement unlock logic in `checkAchievements()`
4. Test thoroughly with mock data
5. Update this README

---

**Happy Organizing! 🎉**
