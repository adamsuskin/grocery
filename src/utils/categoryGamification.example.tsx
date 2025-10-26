/**
 * Category Gamification - Usage Examples
 *
 * This file demonstrates how to integrate the gamification system into your application.
 */

import { useState, useEffect } from 'react';
import { useCustomCategories } from '../hooks/useCustomCategories';
import { useGroceryItems } from '../hooks/useGroceryItems';
import {
  checkAchievements,
  getGamificationData,
  isFunModeEnabled,
  calculateLeaderboard,
} from './categoryGamification';
import { GamificationNotification } from '../components/GamificationNotification';
import { GamificationDashboard, GamificationWidget } from '../components/GamificationDashboard';
import { GamificationChallengesCompact } from '../components/GamificationChallenges';

/**
 * Example 1: Basic Integration
 * Shows how to check achievements when categories or items change
 */
export function BasicGamificationExample() {
  const listId = 'list-123';
  const categories = useCustomCategories(listId);
  const items = useGroceryItems(listId);
  const [showDashboard, setShowDashboard] = useState(false);

  // Check achievements whenever data changes
  useEffect(() => {
    if (isFunModeEnabled()) {
      const { newUnlocked, data } = checkAchievements(listId, categories, items);

      if (newUnlocked.length > 0) {
        console.log('New achievements unlocked:', newUnlocked);
        // Notifications will automatically appear via GamificationNotification component
      }
    }
  }, [listId, categories, items]);

  return (
    <div>
      <h1>My Grocery List</h1>

      {/* Show gamification notification globally */}
      <GamificationNotification position="top-right" />

      {/* Widget to show progress and open dashboard */}
      <GamificationWidget
        listId={listId}
        categories={categories}
        items={items}
        onOpenDashboard={() => setShowDashboard(true)}
      />

      {/* Full dashboard modal */}
      {showDashboard && (
        <GamificationDashboard
          listId={listId}
          categories={categories}
          items={items}
          onClose={() => setShowDashboard(false)}
        />
      )}

      {/* Your grocery list UI here */}
    </div>
  );
}

/**
 * Example 2: Custom Category Manager with Gamification
 * Shows how to trigger achievement checks when creating categories
 */
export function CategoryManagerWithGamification() {
  const listId = 'list-123';
  const categories = useCustomCategories(listId);
  const items = useGroceryItems(listId);
  const [showChallenges, setShowChallenges] = useState(true);

  const handleCategoryCreated = () => {
    // After creating a category, check for new achievements
    const { newUnlocked } = checkAchievements(listId, categories, items);

    if (newUnlocked.length > 0) {
      console.log('Achievement unlocked:', newUnlocked[0].name);
    }
  };

  const gamificationData = getGamificationData(listId);

  return (
    <div>
      {/* Show challenges if Fun Mode is enabled */}
      {isFunModeEnabled() && showChallenges && gamificationData.challenges.length > 0 && (
        <GamificationChallengesCompact
          listId={listId}
          challenges={gamificationData.challenges}
          onDismiss={() => setShowChallenges(false)}
        />
      )}

      {/* Your category manager UI */}
      <button onClick={handleCategoryCreated}>Create Category</button>
    </div>
  );
}

/**
 * Example 3: Shared List with Leaderboard
 * Shows how to display leaderboard for collaborative lists
 */
export function SharedListLeaderboardExample() {
  const listId = 'list-123';
  const categories = useCustomCategories(listId);
  const items = useGroceryItems(listId);

  // Mock members data - replace with actual members from your list
  const members = [
    { userId: 'user1', userName: 'Alice', userEmail: 'alice@example.com' },
    { userId: 'user2', userName: 'Bob', userEmail: 'bob@example.com' },
    { userId: 'user3', userName: 'Charlie', userEmail: 'charlie@example.com' },
  ];

  const currentUserId = 'user1';

  const leaderboard = calculateLeaderboard(listId, categories, items, members);

  return (
    <div>
      <h2>Top Contributors</h2>
      <div className="leaderboard">
        {leaderboard.slice(0, 3).map((entry, index) => (
          <div key={entry.userId} className={`leader-${index + 1}`}>
            <span>{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
            <span>{entry.userName}</span>
            <span>{entry.score} points</span>
            <span>{entry.categoriesCreated} categories</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Example 4: Achievement-triggered Actions
 * Shows how to respond to specific achievements
 */
export function AchievementTriggeredActionsExample() {
  const listId = 'list-123';
  const categories = useCustomCategories(listId);
  const items = useGroceryItems(listId);

  useEffect(() => {
    const { newUnlocked } = checkAchievements(listId, categories, items);

    newUnlocked.forEach(achievement => {
      switch (achievement.id) {
        case 'perfectionist':
          // Award bonus when achieving perfectionist
          console.log('Congratulations! All items categorized!');
          // Could trigger confetti animation, bonus points, etc.
          break;

        case 'organization_expert':
          // Special message for creating 10+ categories
          console.log('You are now a Category Expert!');
          break;

        case 'category_creator':
          // Welcome message for first category
          console.log('Welcome to custom categories!');
          break;
      }
    });
  }, [listId, categories, items]);

  return <div>Your app content</div>;
}

/**
 * Example 5: Settings Integration
 * Shows how to add gamification settings to your app settings
 */
export function SettingsPageExample() {
  const [showGamificationSettings, setShowGamificationSettings] = useState(false);
  const funModeEnabled = isFunModeEnabled();

  return (
    <div className="settings-page">
      <h2>Settings</h2>

      <section>
        <h3>Gamification</h3>
        <button onClick={() => setShowGamificationSettings(true)}>
          {funModeEnabled ? '🎮 Fun Mode: ON' : '🎮 Fun Mode: OFF'}
        </button>
        <p>
          {funModeEnabled
            ? 'Gamification features like achievements and challenges are enabled.'
            : 'Enable Fun Mode to unlock achievements, challenges, and more!'}
        </p>
      </section>

      {/* Other settings sections */}
    </div>
  );
}

/**
 * Example 6: Inline Progress Display
 * Shows how to display gamification stats inline
 */
export function InlineProgressExample() {
  const listId = 'list-123';
  const data = getGamificationData(listId);

  if (!isFunModeEnabled()) {
    return null;
  }

  return (
    <div className="category-stats-card">
      <h3>Your Organization Stats</h3>

      <div className="stat-row">
        <span>Categories Created:</span>
        <strong>{data.stats.totalCategoriesCreated}</strong>
      </div>

      <div className="stat-row">
        <span>Organization Score:</span>
        <strong>{data.stats.organizationScore}/100</strong>
      </div>

      <div className="stat-row">
        <span>Categorization:</span>
        <strong>{data.stats.categorizationScore}%</strong>
      </div>

      <div className="stat-row">
        <span>Level:</span>
        <strong>{data.level}</strong>
      </div>

      <div className="stat-row">
        <span>Achievements:</span>
        <strong>
          {data.achievements.filter(a => a.unlockedAt).length}/{data.achievements.length}
        </strong>
      </div>
    </div>
  );
}

/**
 * Example 7: Challenge-based Onboarding
 * Shows how to use challenges to guide new users
 */
export function OnboardingWithChallengesExample() {
  const listId = 'list-123';
  const categories = useCustomCategories(listId);
  const items = useGroceryItems(listId);
  const data = getGamificationData(listId);

  // Show first challenge as onboarding tip
  const onboardingChallenge = data.challenges.find(c => c.type === 'tip');

  if (!onboardingChallenge || !isFunModeEnabled()) {
    return null;
  }

  return (
    <div className="onboarding-tip">
      <div className="tip-icon">{onboardingChallenge.icon}</div>
      <div className="tip-content">
        <h4>{onboardingChallenge.title}</h4>
        <p>{onboardingChallenge.description}</p>
      </div>
    </div>
  );
}

/**
 * Example 8: Progressive Achievement Display
 * Shows progress bars for locked achievements
 */
export function ProgressiveAchievementDisplayExample() {
  const listId = 'list-123';
  const data = getGamificationData(listId);

  const lockedAchievements = data.achievements
    .filter(a => !a.unlockedAt && (a.progress || 0) > 0)
    .sort((a, b) => (b.progress || 0) - (a.progress || 0))
    .slice(0, 3);

  if (!isFunModeEnabled() || lockedAchievements.length === 0) {
    return null;
  }

  return (
    <div className="next-achievements">
      <h4>Almost There!</h4>
      {lockedAchievements.map(achievement => (
        <div key={achievement.id} className="achievement-progress-item">
          <div className="achievement-info">
            <span className="achievement-icon">{achievement.icon}</span>
            <span className="achievement-name">{achievement.name}</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${achievement.progress}%` }}
            />
          </div>
          <span className="progress-percent">{achievement.progress}%</span>
        </div>
      ))}
    </div>
  );
}
