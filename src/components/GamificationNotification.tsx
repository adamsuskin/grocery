import { useEffect, useState } from 'react';
import {
  Achievement,
  getPendingNotifications,
  markNotificationShown,
  getAchievementColor,
} from '../utils/categoryGamification';
import './GamificationNotification.css';

export interface GamificationNotificationProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  autoHideDuration?: number;
  animationDuration?: number;
}

export function GamificationNotification({
  position = 'top-right',
  autoHideDuration = 5000,
  animationDuration = 800,
}: GamificationNotificationProps) {
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [queue, setQueue] = useState<Achievement[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check for pending notifications on mount
    const pending = getPendingNotifications();
    if (pending.length > 0) {
      setQueue(pending);
    }

    // Poll for new notifications every 2 seconds
    const interval = setInterval(() => {
      const pending = getPendingNotifications();
      if (pending.length > 0) {
        setQueue(prev => {
          const newAchievements = pending.filter(
            p => !prev.some(existing => existing.id === p.id)
          );
          return [...prev, ...newAchievements];
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Show next achievement from queue
    if (queue.length > 0 && !currentAchievement && !isAnimating) {
      const next = queue[0];
      setCurrentAchievement(next);
      setQueue(prev => prev.slice(1));
      setIsAnimating(true);

      // Mark as shown
      markNotificationShown(next.id);

      // Auto-hide after duration
      const hideTimer = setTimeout(() => {
        handleClose();
      }, autoHideDuration);

      return () => clearTimeout(hideTimer);
    }
  }, [queue, currentAchievement, isAnimating, autoHideDuration]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setCurrentAchievement(null);
    }, animationDuration);
  };

  if (!currentAchievement) {
    return null;
  }

  const rarityColor = getAchievementColor(currentAchievement.rarity);

  return (
    <div className={`gamification-notification notification-${position} ${isAnimating ? 'show' : 'hide'}`}>
      <div className="notification-content" style={{ borderColor: rarityColor }}>
        <div className="notification-header">
          <span className="notification-badge">Achievement Unlocked!</span>
          <button
            className="notification-close"
            onClick={handleClose}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>

        <div className="notification-body">
          <div className="notification-icon-wrapper">
            <div className="notification-icon-bg" style={{ backgroundColor: rarityColor }} />
            <div className="notification-icon">{currentAchievement.icon}</div>
            <div className="notification-sparkles">
              <span className="sparkle">✨</span>
              <span className="sparkle">✨</span>
              <span className="sparkle">✨</span>
            </div>
          </div>

          <div className="notification-text">
            <h3 className="notification-title">{currentAchievement.name}</h3>
            <p className="notification-description">{currentAchievement.description}</p>
            <span className="notification-rarity" style={{ color: rarityColor }}>
              {currentAchievement.rarity.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="notification-footer">
          <div className="celebration-emoji">🎉</div>
        </div>
      </div>
    </div>
  );
}

export function useGamificationNotification() {
  const [hasNewAchievements, setHasNewAchievements] = useState(false);

  useEffect(() => {
    const checkForNew = () => {
      const pending = getPendingNotifications();
      setHasNewAchievements(pending.length > 0);
    };

    checkForNew();
    const interval = setInterval(checkForNew, 2000);

    return () => clearInterval(interval);
  }, []);

  return { hasNewAchievements };
}
