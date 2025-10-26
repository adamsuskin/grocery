/**
 * ListActivity component
 * Displays recent activity log for a list
 */

import { useState, useEffect } from 'react';
import { Activity, ListActivityProps } from '../types';
import { useAuth } from '../context/AuthContext';
import './ListActivity.css';

/**
 * Format activity message for display
 */
function formatActivityMessage(activity: Activity): string {
  const userName = activity.user.name;

  switch (activity.action) {
    case 'list_created':
      return `${userName} created the list`;

    case 'list_renamed':
      return `${userName} renamed the list to "${activity.details?.newName}"`;

    case 'list_deleted':
      return `${userName} deleted the list`;

    case 'list_shared':
      return `${userName} shared the list`;

    case 'member_added':
      return `${userName} added ${activity.details?.memberName} to the list`;

    case 'member_removed':
      return `${userName} removed ${activity.details?.memberName} from the list`;

    case 'member_permission_changed':
      return `${userName} changed ${activity.details?.memberName}'s permission to ${activity.details?.newPermission}`;

    case 'item_added':
      return `${userName} added "${activity.details?.itemName}"`;

    case 'item_updated':
      return `${userName} updated "${activity.details?.itemName}"`;

    case 'item_deleted':
      return `${userName} deleted "${activity.details?.itemName}"`;

    case 'item_checked':
      return `${userName} marked "${activity.details?.itemName}" as gotten`;

    case 'item_unchecked':
      return `${userName} marked "${activity.details?.itemName}" as not gotten`;

    case 'items_cleared':
      return `${userName} cleared ${activity.details?.count} completed items`;

    case 'items_bulk_deleted':
      return `${userName} deleted ${activity.details?.count} items`;

    case 'category_created':
      return `${userName} created category "${activity.details?.category_name}"`;

    case 'category_updated':
      if (activity.details?.changes && Array.isArray(activity.details.changes)) {
        const changeFields = activity.details.changes.map((c: any) => c.field).join(', ');
        return `${userName} updated category "${activity.details?.category_name}" (${changeFields})`;
      }
      return `${userName} updated category "${activity.details?.category_name}"`;

    case 'category_archived':
      return `${userName} archived category "${activity.details?.category_name}"`;

    case 'category_restored':
      return `${userName} restored category "${activity.details?.category_name}"`;

    case 'category_deleted':
      return `${userName} deleted category "${activity.details?.category_name}"`;

    case 'category_merged':
      const sourceCount = activity.details?.source_categories?.length || 0;
      return `${userName} merged ${sourceCount} categories into "${activity.details?.category_name}"`;

    default:
      return `${userName} performed an action`;
  }
}

/**
 * Format timestamp as relative time
 */
function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const activityDate = new Date(timestamp);
  const diffMs = now.getTime() - activityDate.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return diffSeconds === 1 ? '1 second ago' : `${diffSeconds} seconds ago`;
  } else if (diffMinutes < 60) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffDays < 7) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return years === 1 ? '1 year ago' : `${years} years ago`;
  }
}

/**
 * Get icon for activity type
 */
function getActivityIcon(action: Activity['action']): string {
  switch (action) {
    case 'list_created':
      return '📋';
    case 'list_renamed':
      return '✏️';
    case 'list_deleted':
      return '🗑️';
    case 'list_shared':
    case 'member_added':
      return '👥';
    case 'member_removed':
      return '👤';
    case 'member_permission_changed':
      return '🔐';
    case 'item_added':
      return '➕';
    case 'item_updated':
      return '📝';
    case 'item_deleted':
      return '❌';
    case 'item_checked':
      return '✅';
    case 'item_unchecked':
      return '◻️';
    case 'items_cleared':
    case 'items_bulk_deleted':
      return '🧹';
    case 'category_created':
      return '🏷️';
    case 'category_updated':
      return '✏️';
    case 'category_archived':
      return '📦';
    case 'category_restored':
      return '♻️';
    case 'category_deleted':
      return '🗑️';
    case 'category_merged':
      return '🔀';
    default:
      return '📌';
  }
}

/**
 * ListActivity component
 */
export function ListActivity({ listId, limit = 20 }: ListActivityProps) {
  const { token } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'categories' | 'items' | 'members'>('all');

  useEffect(() => {
    if (!listId || !token) {
      setLoading(false);
      return;
    }

    async function fetchActivities() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `http://localhost:5001/api/lists/${listId}/activities?limit=${limit}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch activities');
        }

        const data = await response.json();
        setActivities(data.data.activities || []);
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError(err instanceof Error ? err.message : 'Failed to load activities');
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, [listId, limit, token]);

  if (loading) {
    return (
      <div className="list-activity">
        <div className="activity-header">
          <h3>Recent Activity</h3>
        </div>
        <div className="activity-loading">
          <div className="loading-spinner"></div>
          <span>Loading activities...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="list-activity">
        <div className="activity-header">
          <h3>Recent Activity</h3>
        </div>
        <div className="activity-error">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  // Filter activities based on selected filter type
  const filteredActivities = activities.filter((activity) => {
    if (filterType === 'all') return true;

    if (filterType === 'categories') {
      return activity.action.startsWith('category_');
    }

    if (filterType === 'items') {
      return activity.action.startsWith('item_') || activity.action === 'items_cleared' || activity.action === 'items_bulk_deleted';
    }

    if (filterType === 'members') {
      return activity.action.startsWith('member_') || activity.action === 'list_shared' || activity.action === 'ownership_transferred';
    }

    return true;
  });

  if (activities.length === 0) {
    return (
      <div className="list-activity">
        <div className="activity-header">
          <h3>Recent Activity</h3>
        </div>
        <div className="activity-empty">
          <p>No activity yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="list-activity">
      <div className="activity-header">
        <h3>Recent Activity</h3>
        <span className="activity-count">{filteredActivities.length} activities</span>
      </div>

      <div className="activity-filters">
        <button
          className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
          onClick={() => setFilterType('all')}
        >
          All
        </button>
        <button
          className={`filter-btn ${filterType === 'categories' ? 'active' : ''}`}
          onClick={() => setFilterType('categories')}
        >
          Categories
        </button>
        <button
          className={`filter-btn ${filterType === 'items' ? 'active' : ''}`}
          onClick={() => setFilterType('items')}
        >
          Items
        </button>
        <button
          className={`filter-btn ${filterType === 'members' ? 'active' : ''}`}
          onClick={() => setFilterType('members')}
        >
          Members
        </button>
      </div>

      <div className="activity-list">
        {filteredActivities.length === 0 ? (
          <div className="activity-empty">
            <p>No {filterType} activities</p>
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon">{getActivityIcon(activity.action)}</div>
              <div className="activity-content">
                <p className="activity-message">{formatActivityMessage(activity)}</p>
                <span className="activity-time">{formatRelativeTime(activity.created_at)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
