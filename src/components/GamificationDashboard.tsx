import { useState, useEffect } from 'react';
import { CustomCategory, GroceryItem, ListMember } from '../types';
import {
  checkAchievements,
  getGamificationData,
  calculateLeaderboard,
  isFunModeEnabled,
  GamificationData,
} from '../utils/categoryGamification';
import { GamificationBadges } from './GamificationBadges';
import { GamificationProgress } from './GamificationProgress';
import { GamificationChallenges } from './GamificationChallenges';
import { GamificationLeaderboard } from './GamificationLeaderboard';
import { GamificationSettings } from './GamificationSettings';
import './GamificationDashboard.css';

export interface GamificationDashboardProps {
  listId: string;
  categories: CustomCategory[];
  items: GroceryItem[];
  members?: ListMember[];
  currentUserId?: string;
  onClose: () => void;
}

export function GamificationDashboard({
  listId,
  categories,
  items,
  members = [],
  currentUserId,
  onClose,
}: GamificationDashboardProps) {
  const [gamificationData, setGamificationData] = useState<GamificationData>(() =>
    getGamificationData(listId)
  );
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'leaderboard' | 'settings'>(
    'overview'
  );
  const [showAchievements, setShowAchievements] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Update gamification data when categories or items change
  useEffect(() => {
    const { data } = checkAchievements(listId, categories, items);
    setGamificationData(data);
  }, [listId, categories, items]);

  const handleChallengesDismiss = () => {
    // Refresh data after dismissing a challenge
    const { data } = checkAchievements(listId, categories, items);
    setGamificationData(data);
  };

  const leaderboardEntries = members.length > 0
    ? calculateLeaderboard(listId, categories, items, members)
    : [];

  const unlockedAchievements = gamificationData.achievements.filter(a => a.unlockedAt);
  const totalAchievements = gamificationData.achievements.length;

  return (
    <div className="gamification-dashboard-overlay" onClick={onClose}>
      <div className="gamification-dashboard" onClick={(e) => e.stopPropagation()}>
        <div className="dashboard-header">
          <h2>
            <span className="dashboard-icon">🎮</span>
            Gamification Dashboard
          </h2>
          <button className="btn-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="dashboard-tabs">
          <button
            className={`dashboard-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="tab-icon">📊</span>
            Overview
          </button>
          <button
            className={`dashboard-tab ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            <span className="tab-icon">🏆</span>
            Achievements
            <span className="tab-badge">{unlockedAchievements.length}/{totalAchievements}</span>
          </button>
          {members.length > 0 && (
            <button
              className={`dashboard-tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('leaderboard')}
            >
              <span className="tab-icon">👥</span>
              Leaderboard
            </button>
          )}
          <button
            className={`dashboard-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <span className="tab-icon">⚙️</span>
            Settings
          </button>
        </div>

        <div className="dashboard-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <GamificationProgress
                stats={gamificationData.stats}
                level={gamificationData.level}
                totalPoints={gamificationData.totalPoints}
              />

              {gamificationData.challenges.length > 0 && (
                <GamificationChallenges
                  listId={listId}
                  challenges={gamificationData.challenges}
                  onDismiss={handleChallengesDismiss}
                  maxVisible={3}
                />
              )}

              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="quick-actions-grid">
                  <button
                    className="quick-action-card"
                    onClick={() => setShowAchievements(true)}
                  >
                    <span className="quick-action-icon">🏆</span>
                    <span className="quick-action-label">View All Achievements</span>
                    <span className="quick-action-count">
                      {unlockedAchievements.length}/{totalAchievements}
                    </span>
                  </button>

                  {members.length > 0 && (
                    <button
                      className="quick-action-card"
                      onClick={() => setShowLeaderboard(true)}
                    >
                      <span className="quick-action-icon">👥</span>
                      <span className="quick-action-label">Leaderboard</span>
                      <span className="quick-action-count">{members.length} members</span>
                    </button>
                  )}

                  <button
                    className="quick-action-card"
                    onClick={() => setShowSettings(true)}
                  >
                    <span className="quick-action-icon">⚙️</span>
                    <span className="quick-action-label">Settings</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="achievements-tab">
              <GamificationBadges
                achievements={gamificationData.achievements}
                onClose={() => setActiveTab('overview')}
              />
            </div>
          )}

          {activeTab === 'leaderboard' && members.length > 0 && (
            <div className="leaderboard-tab">
              <GamificationLeaderboard
                entries={leaderboardEntries}
                currentUserId={currentUserId}
                collaborative={true}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-tab">
              <GamificationSettings currentListId={listId} />
            </div>
          )}
        </div>

        {showAchievements && (
          <GamificationBadges
            achievements={gamificationData.achievements}
            onClose={() => setShowAchievements(false)}
          />
        )}

        {showLeaderboard && members.length > 0 && (
          <div className="modal-overlay" onClick={() => setShowLeaderboard(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <GamificationLeaderboard
                entries={leaderboardEntries}
                currentUserId={currentUserId}
                onClose={() => setShowLeaderboard(false)}
                collaborative={true}
              />
            </div>
          </div>
        )}

        {showSettings && (
          <div className="modal-overlay" onClick={() => setShowSettings(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <GamificationSettings
                currentListId={listId}
                onClose={() => setShowSettings(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Compact widget for displaying in the main UI
export interface GamificationWidgetProps {
  listId: string;
  categories: CustomCategory[];
  items: GroceryItem[];
  onOpenDashboard: () => void;
}

export function GamificationWidget({
  listId,
  categories,
  items,
  onOpenDashboard,
}: GamificationWidgetProps) {
  const [gamificationData, setGamificationData] = useState<GamificationData>(() =>
    getGamificationData(listId)
  );

  useEffect(() => {
    if (isFunModeEnabled()) {
      const { data } = checkAchievements(listId, categories, items);
      setGamificationData(data);
    }
  }, [listId, categories, items]);

  if (!isFunModeEnabled()) {
    return null;
  }

  const unlockedAchievements = gamificationData.achievements.filter(a => a.unlockedAt).length;
  const totalAchievements = gamificationData.achievements.length;

  return (
    <div className="gamification-widget" onClick={onOpenDashboard}>
      <div className="widget-header">
        <span className="widget-icon">🎮</span>
        <span className="widget-title">Your Progress</span>
      </div>
      <div className="widget-content">
        <GamificationProgress
          stats={gamificationData.stats}
          level={gamificationData.level}
          totalPoints={gamificationData.totalPoints}
          compact={true}
        />
        <div className="widget-stats">
          <div className="widget-stat">
            <span className="widget-stat-icon">🏆</span>
            <span className="widget-stat-text">
              {unlockedAchievements}/{totalAchievements} Achievements
            </span>
          </div>
        </div>
      </div>
      <div className="widget-footer">
        <span className="widget-link">View Dashboard →</span>
      </div>
    </div>
  );
}
