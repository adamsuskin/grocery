import { useState } from 'react';
import {
  Achievement,
  getAchievementColor,
} from '../utils/categoryGamification';
import './GamificationBadges.css';

export interface GamificationBadgesProps {
  achievements: Achievement[];
  onClose: () => void;
}

export function GamificationBadges({ achievements, onClose }: GamificationBadgesProps) {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [sortBy, setSortBy] = useState<'rarity' | 'recent' | 'progress'>('rarity');

  const unlocked = achievements.filter(a => a.unlockedAt);
  const locked = achievements.filter(a => !a.unlockedAt);

  const filteredAchievements =
    filter === 'all' ? achievements :
    filter === 'unlocked' ? unlocked :
    locked;

  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    if (sortBy === 'recent') {
      if (!a.unlockedAt && !b.unlockedAt) return 0;
      if (!a.unlockedAt) return 1;
      if (!b.unlockedAt) return -1;
      return b.unlockedAt - a.unlockedAt;
    }
    if (sortBy === 'progress') {
      return (b.progress || 0) - (a.progress || 0);
    }
    // rarity
    const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
    return rarityOrder[b.rarity] - rarityOrder[a.rarity];
  });

  const unlockedCount = unlocked.length;
  const totalCount = achievements.length;
  const completionPercentage = Math.round((unlockedCount / totalCount) * 100);

  return (
    <div className="gamification-modal-overlay" onClick={onClose}>
      <div className="gamification-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gamification-modal-header">
          <h2>
            <span className="badge-icon">🏆</span>
            Achievements
          </h2>
          <button className="btn-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="achievement-summary">
          <div className="achievement-stats">
            <div className="stat-item">
              <span className="stat-value">{unlockedCount}/{totalCount}</span>
              <span className="stat-label">Unlocked</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{completionPercentage}%</span>
              <span className="stat-label">Complete</span>
            </div>
          </div>
          <div className="achievement-progress-bar">
            <div
              className="achievement-progress-fill"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        <div className="achievement-filters">
          <div className="filter-group">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({achievements.length})
            </button>
            <button
              className={`filter-btn ${filter === 'unlocked' ? 'active' : ''}`}
              onClick={() => setFilter('unlocked')}
            >
              Unlocked ({unlocked.length})
            </button>
            <button
              className={`filter-btn ${filter === 'locked' ? 'active' : ''}`}
              onClick={() => setFilter('locked')}
            >
              Locked ({locked.length})
            </button>
          </div>

          <div className="sort-group">
            <label htmlFor="sort-select">Sort by:</label>
            <select
              id="sort-select"
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="rarity">Rarity</option>
              <option value="recent">Recently Unlocked</option>
              <option value="progress">Progress</option>
            </select>
          </div>
        </div>

        <div className="achievements-grid">
          {sortedAchievements.map(achievement => {
            const isUnlocked = !!achievement.unlockedAt;
            const rarityColor = getAchievementColor(achievement.rarity);
            const progress = achievement.progress || 0;

            return (
              <div
                key={achievement.id}
                className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'} rarity-${achievement.rarity}`}
                style={{ borderColor: rarityColor }}
              >
                <div className="achievement-card-header">
                  <div
                    className="achievement-icon"
                    style={{
                      opacity: isUnlocked ? 1 : 0.3,
                      filter: isUnlocked ? 'none' : 'grayscale(100%)',
                    }}
                  >
                    {achievement.icon}
                  </div>
                  <span className="achievement-rarity" style={{ color: rarityColor }}>
                    {achievement.rarity.toUpperCase()}
                  </span>
                </div>

                <div className="achievement-card-body">
                  <h3 className="achievement-name">{achievement.name}</h3>
                  <p className="achievement-description">{achievement.description}</p>

                  {!isUnlocked && progress > 0 && (
                    <div className="achievement-progress">
                      <div className="progress-bar-small">
                        <div
                          className="progress-fill-small"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: rarityColor,
                          }}
                        />
                      </div>
                      <span className="progress-text">{progress}%</span>
                    </div>
                  )}

                  {isUnlocked && achievement.unlockedAt && (
                    <div className="achievement-unlocked-date">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {sortedAchievements.length === 0 && (
          <div className="empty-achievements">
            <p>No achievements to show with current filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
