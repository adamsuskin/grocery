import {
  GamificationStats,
  UserLevel,
  getLevelInfo,
  getNextLevelInfo,
  calculateLevel,
} from '../utils/categoryGamification';
import './GamificationProgress.css';

export interface GamificationProgressProps {
  stats: GamificationStats;
  level: UserLevel;
  totalPoints: number;
  compact?: boolean;
}

export function GamificationProgress({
  stats,
  level,
  totalPoints,
  compact = false,
}: GamificationProgressProps) {
  const levelInfo = getLevelInfo(level);
  const nextLevel = getNextLevelInfo(level);

  const categoriesToNextLevel = nextLevel
    ? nextLevel.minCategories - stats.totalCategoriesCreated
    : 0;

  const levelProgress = nextLevel
    ? Math.min(
        100,
        ((stats.totalCategoriesCreated - levelInfo.minCategories) /
          (nextLevel.minCategories - levelInfo.minCategories)) *
          100
      )
    : 100;

  if (compact) {
    return (
      <div className="gamification-progress-compact">
        <div className="level-badge-compact" style={{ backgroundColor: levelInfo.color }}>
          <span className="level-icon-compact">{levelInfo.icon}</span>
          <span className="level-title-compact">{levelInfo.title}</span>
        </div>
        <div className="stats-compact">
          <span className="stat-compact">
            <span className="stat-icon">📚</span>
            {stats.totalCategoriesCreated}
          </span>
          <span className="stat-compact">
            <span className="stat-icon">⭐</span>
            {totalPoints}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="gamification-progress">
      <div className="level-section">
        <div className="level-badge" style={{ backgroundColor: levelInfo.color }}>
          <span className="level-icon">{levelInfo.icon}</span>
          <div className="level-info">
            <h3 className="level-title">{levelInfo.title}</h3>
            <p className="level-subtitle">Level {level}</p>
          </div>
        </div>

        {nextLevel && (
          <div className="level-progress-section">
            <div className="level-progress-header">
              <span>Progress to {nextLevel.title}</span>
              <span className="progress-categories">
                {stats.totalCategoriesCreated} / {nextLevel.minCategories}
              </span>
            </div>
            <div className="level-progress-bar">
              <div
                className="level-progress-fill"
                style={{
                  width: `${levelProgress}%`,
                  backgroundColor: levelInfo.color,
                }}
              />
            </div>
            <p className="level-progress-text">
              {categoriesToNextLevel > 0
                ? `Create ${categoriesToNextLevel} more ${
                    categoriesToNextLevel === 1 ? 'category' : 'categories'
                  } to level up!`
                : 'Level up achieved!'}
            </p>
          </div>
        )}

        {!nextLevel && (
          <div className="max-level-badge">
            <span className="max-level-icon">👑</span>
            <span>Maximum level reached!</span>
          </div>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon">📚</div>
          <div className="stat-card-content">
            <div className="stat-card-value">{stats.totalCategoriesCreated}</div>
            <div className="stat-card-label">Categories Created</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon">⭐</div>
          <div className="stat-card-content">
            <div className="stat-card-value">{totalPoints}</div>
            <div className="stat-card-label">Total Points</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon">🎨</div>
          <div className="stat-card-content">
            <div className="stat-card-value">
              {stats.totalCategoriesWithColors}/{stats.totalCategoriesCreated}
            </div>
            <div className="stat-card-label">With Colors</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon">✨</div>
          <div className="stat-card-content">
            <div className="stat-card-value">
              {stats.totalCategoriesWithIcons}/{stats.totalCategoriesCreated}
            </div>
            <div className="stat-card-label">With Icons</div>
          </div>
        </div>
      </div>

      <div className="scores-section">
        <div className="score-item">
          <div className="score-header">
            <span className="score-label">Organization Score</span>
            <span className="score-value">{stats.organizationScore}/100</span>
          </div>
          <div className="score-bar">
            <div
              className="score-fill"
              style={{
                width: `${stats.organizationScore}%`,
                backgroundColor: getScoreColor(stats.organizationScore),
              }}
            />
          </div>
          <p className="score-description">
            Based on color/icon usage and category adoption
          </p>
        </div>

        <div className="score-item">
          <div className="score-header">
            <span className="score-label">Categorization Score</span>
            <span className="score-value">{stats.categorizationScore}/100</span>
          </div>
          <div className="score-bar">
            <div
              className="score-fill"
              style={{
                width: `${stats.categorizationScore}%`,
                backgroundColor: getScoreColor(stats.categorizationScore),
              }}
            />
          </div>
          <p className="score-description">
            {stats.itemsInOther > 0
              ? `${stats.itemsInOther} items still in "Other"`
              : 'Perfect! All items categorized'}
          </p>
        </div>
      </div>

      {stats.mostUsedCategory && (
        <div className="most-used-section">
          <h4>Most Used Category</h4>
          <div className="most-used-card">
            <span className="most-used-icon">🏆</span>
            <div className="most-used-info">
              <span className="most-used-name">{stats.mostUsedCategory.name}</span>
              <span className="most-used-count">
                Used {stats.mostUsedCategory.count} times
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#4CAF50';
  if (score >= 70) return '#8BC34A';
  if (score >= 50) return '#FFC107';
  if (score >= 30) return '#FF9800';
  return '#F44336';
}
