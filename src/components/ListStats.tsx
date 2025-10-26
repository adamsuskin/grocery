import { useState, useEffect } from 'react';
import type { ListStats as ListStatsType } from '../types';
import './ListStats.css';

interface ListStatsProps {
  listId: string;
  onClose: () => void;
}

export function ListStats({ listId, onClose }: ListStatsProps) {
  const [stats, setStats] = useState<ListStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, [listId]);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`http://localhost:3001/api/lists/${listId}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch statistics');
      }

      const data = await response.json();
      setStats(data.data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatActivityAction = (action: string): string => {
    const actionMap: Record<string, string> = {
      'list_created': 'Created list',
      'list_renamed': 'Renamed list',
      'list_deleted': 'Deleted list',
      'list_shared': 'Shared list',
      'member_added': 'Added member',
      'member_removed': 'Removed member',
      'member_permission_changed': 'Changed permissions',
      'item_added': 'Added item',
      'item_updated': 'Updated item',
      'item_deleted': 'Deleted item',
      'item_checked': 'Checked item',
      'item_unchecked': 'Unchecked item',
      'items_cleared': 'Cleared items',
      'items_bulk_deleted': 'Bulk deleted items',
    };
    return actionMap[action] || action;
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="list-stats-overlay" onClick={onClose}>
        <div className="list-stats-modal" onClick={(e) => e.stopPropagation()}>
          <div className="list-stats-header">
            <h2>List Statistics</h2>
            <button className="btn-close" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
          <div className="list-stats-loading">
            <div className="loading-spinner-large"></div>
            <p>Loading statistics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="list-stats-overlay" onClick={onClose}>
        <div className="list-stats-modal" onClick={(e) => e.stopPropagation()}>
          <div className="list-stats-header">
            <h2>List Statistics</h2>
            <button className="btn-close" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
          <div className="list-stats-error">
            <p>Failed to load statistics</p>
            {error && <p className="error-message">{error}</p>}
            <button className="btn btn-primary" onClick={fetchStats}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="list-stats-overlay" onClick={onClose}>
      <div className="list-stats-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="list-stats-header">
          <h2>List Statistics</h2>
          <button className="btn-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {/* Statistics Content */}
        <div className="list-stats-body">
          {/* Overview Cards */}
          <section className="stats-section">
            <h3>Overview</h3>
            <div className="stats-cards">
              <div className="stat-card">
                <div className="stat-icon">📦</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.totalItems}</div>
                  <div className="stat-label">Total Items</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">✓</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.itemsGotten}</div>
                  <div className="stat-label">Items Gotten</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.itemsRemaining}</div>
                  <div className="stat-label">Remaining</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📈</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.percentageComplete}%</div>
                  <div className="stat-label">Complete</div>
                </div>
              </div>
            </div>
          </section>

          {/* Progress Bar */}
          {stats.totalItems > 0 && (
            <section className="stats-section">
              <div className="progress-bar-container">
                <div className="progress-bar-label">
                  <span>Progress</span>
                  <span className="progress-bar-percentage">{stats.percentageComplete}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${stats.percentageComplete}%` }}
                  />
                </div>
                <div className="progress-bar-info">
                  {stats.itemsGotten} of {stats.totalItems} items completed
                </div>
              </div>
            </section>
          )}

          {/* This Week Activity */}
          <section className="stats-section">
            <h3>This Week</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-item-icon">➕</div>
                <div className="stat-item-content">
                  <div className="stat-item-value">{stats.itemsAddedThisWeek}</div>
                  <div className="stat-item-label">Items Added</div>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-item-icon">✔️</div>
                <div className="stat-item-content">
                  <div className="stat-item-value">{stats.itemsGottenThisWeek}</div>
                  <div className="stat-item-label">Items Gotten</div>
                </div>
              </div>
            </div>
          </section>

          {/* Category Breakdown */}
          {stats.categoryBreakdown.length > 0 && (
            <section className="stats-section">
              <h3>Category Breakdown</h3>
              <div className="category-breakdown">
                {stats.categoryBreakdown.map((cat) => (
                  <div key={cat.category} className="category-item">
                    <div className="category-info">
                      <span className={`category-badge category-${cat.category.toLowerCase()}`}>
                        {cat.category}
                      </span>
                      <span className="category-count">{cat.count} items</span>
                    </div>
                    <div className="category-bar-container">
                      <div
                        className="category-bar"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                    <div className="category-percentage">{cat.percentage}%</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Most Active Members */}
          {stats.mostActiveMembers.length > 0 && (
            <section className="stats-section">
              <h3>Most Active Members</h3>
              <div className="active-members">
                {stats.mostActiveMembers.map((member, index) => (
                  <div key={member.userId} className="active-member-item">
                    <div className="member-rank">{index + 1}</div>
                    <div className="member-avatar">
                      {member.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="member-info">
                      <div className="member-name">{member.userName}</div>
                      <div className="member-email">{member.userEmail}</div>
                    </div>
                    <div className="member-activity">
                      <span className="activity-count">{member.activityCount}</span>
                      <span className="activity-label">activities</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recent Activities */}
          {stats.recentActivities.length > 0 && (
            <section className="stats-section">
              <h3>Recent Activity</h3>
              <div className="recent-activities">
                {stats.recentActivities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-content">
                      <div className="activity-user">{activity.userName}</div>
                      <div className="activity-action">{formatActivityAction(activity.action)}</div>
                      {activity.details && activity.details.itemName && (
                        <div className="activity-details">"{activity.details.itemName}"</div>
                      )}
                    </div>
                    <div className="activity-time">{formatDate(activity.timestamp)}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Empty State */}
          {stats.totalItems === 0 && (
            <section className="stats-section">
              <div className="stats-empty">
                <p>No items yet! Start adding items to see statistics.</p>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
