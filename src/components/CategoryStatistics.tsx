import { useState, useEffect, useMemo } from 'react';
import { useGroceryItems } from '../zero-store';
import { useCustomCategories } from '../hooks/useCustomCategories';
import { CATEGORIES, Activity } from '../types';
import { useAuth } from '../context/AuthContext';
import './CategoryStatistics.css';

export interface CategoryStatisticsProps {
  listId: string;
  timeRange?: 'week' | 'month' | 'all';
  onClose: () => void;
}

interface CategoryStat {
  name: string;
  count: number;
  percentage: number;
  isCustom: boolean;
  color?: string;
  icon?: string;
}

interface TopItem {
  name: string;
  category: string;
  frequency: number; // How many times it appears in the list
}

export function CategoryStatistics({ listId, timeRange = 'all', onClose }: CategoryStatisticsProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'all'>(timeRange);
  const { token } = useAuth();
  const [categoryActivities, setCategoryActivities] = useState<Activity[]>([]);

  // Fetch all items for the list
  const allItems = useGroceryItems(listId);

  // Fetch custom categories for the list
  const customCategories = useCustomCategories(listId);

  // Fetch recent category activities
  useEffect(() => {
    if (!listId || !token) return;

    async function fetchCategoryActivities() {
      try {
        const response = await fetch(
          `http://localhost:5001/api/lists/${listId}/activities?limit=10`,
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
        // Filter for category activities only
        const catActivities = (data.data.activities || []).filter((activity: Activity) =>
          activity.action.startsWith('category_')
        );
        setCategoryActivities(catActivities.slice(0, 5)); // Show only last 5 category activities
      } catch (err) {
        console.error('Error fetching category activities:', err);
      }
    }

    fetchCategoryActivities();
  }, [listId, token]);

  // Filter items by time range
  const filteredItems = useMemo(() => {
    if (selectedTimeRange === 'all') {
      return allItems;
    }

    const now = Date.now();
    const msInDay = 24 * 60 * 60 * 1000;
    const daysToFilter = selectedTimeRange === 'week' ? 7 : 30;
    const cutoffTime = now - (daysToFilter * msInDay);

    return allItems.filter(item => item.createdAt >= cutoffTime);
  }, [allItems, selectedTimeRange]);

  // Calculate category statistics
  const categoryStats = useMemo(() => {
    const stats = new Map<string, CategoryStat>();
    const totalItems = filteredItems.length;

    // Initialize predefined categories
    CATEGORIES.forEach(category => {
      stats.set(category, {
        name: category,
        count: 0,
        percentage: 0,
        isCustom: false,
      });
    });

    // Initialize custom categories
    customCategories.forEach(customCat => {
      stats.set(customCat.name, {
        name: customCat.name,
        count: 0,
        percentage: 0,
        isCustom: true,
        color: customCat.color,
        icon: customCat.icon,
      });
    });

    // Count items per category
    filteredItems.forEach(item => {
      const stat = stats.get(item.category);
      if (stat) {
        stat.count++;
      } else {
        // Handle category not found (orphaned custom category)
        stats.set(item.category, {
          name: item.category,
          count: 1,
          percentage: 0,
          isCustom: true,
        });
      }
    });

    // Calculate percentages
    stats.forEach(stat => {
      stat.percentage = totalItems > 0 ? Math.round((stat.count / totalItems) * 100) : 0;
    });

    // Convert to array and sort by count descending
    return Array.from(stats.values())
      .filter(stat => stat.count > 0) // Only show categories with items
      .sort((a, b) => b.count - a.count);
  }, [filteredItems, customCategories]);

  // Calculate top items by category (most frequently added)
  const topItemsByCategory = useMemo(() => {
    const itemCounts = new Map<string, Map<string, number>>();

    // Count frequency of each item name per category
    filteredItems.forEach(item => {
      if (!itemCounts.has(item.category)) {
        itemCounts.set(item.category, new Map());
      }
      const categoryItems = itemCounts.get(item.category)!;
      categoryItems.set(item.name, (categoryItems.get(item.name) || 0) + 1);
    });

    // Get top 3 items per category
    const topItems: { [category: string]: TopItem[] } = {};
    itemCounts.forEach((items, category) => {
      const sorted = Array.from(items.entries())
        .map(([name, frequency]) => ({ name, category, frequency }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 3); // Top 3 items

      if (sorted.length > 0) {
        topItems[category] = sorted;
      }
    });

    return topItems;
  }, [filteredItems]);

  // Calculate custom vs predefined ratio
  const categoryRatio = useMemo(() => {
    const customCount = categoryStats.filter(s => s.isCustom).reduce((sum, s) => sum + s.count, 0);
    const predefinedCount = categoryStats.filter(s => !s.isCustom).reduce((sum, s) => sum + s.count, 0);
    const total = customCount + predefinedCount;

    return {
      customCount,
      predefinedCount,
      customPercentage: total > 0 ? Math.round((customCount / total) * 100) : 0,
      predefinedPercentage: total > 0 ? Math.round((predefinedCount / total) * 100) : 0,
    };
  }, [categoryStats]);

  // Get most used custom categories
  const topCustomCategories = useMemo(() => {
    return categoryStats
      .filter(s => s.isCustom)
      .slice(0, 5); // Top 5 custom categories
  }, [categoryStats]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Get color for category bar
  const getCategoryColor = (stat: CategoryStat): string => {
    if (stat.color) {
      return stat.color;
    }

    // Default colors for predefined categories
    const categoryColors: { [key: string]: string } = {
      'Produce': '#4CAF50',
      'Dairy': '#2196F3',
      'Meat': '#F44336',
      'Bakery': '#FF9800',
      'Pantry': '#9C27B0',
      'Frozen': '#00BCD4',
      'Beverages': '#FF5722',
      'Other': '#757575',
    };

    return categoryColors[stat.name] || '#757575';
  };

  const timeRangeLabel = selectedTimeRange === 'week' ? 'This Week' :
                         selectedTimeRange === 'month' ? 'This Month' :
                         'All Time';

  // Format category activity messages
  const formatCategoryActivity = (activity: Activity): string => {
    const userName = activity.user.name;
    switch (activity.action) {
      case 'category_created':
        return `${userName} created "${activity.details?.category_name}"`;
      case 'category_updated':
        if (activity.details?.changes && Array.isArray(activity.details.changes)) {
          const changeFields = activity.details.changes.map((c: any) => c.field).join(', ');
          return `${userName} updated "${activity.details?.category_name}" (${changeFields})`;
        }
        return `${userName} updated "${activity.details?.category_name}"`;
      case 'category_archived':
        return `${userName} archived "${activity.details?.category_name}"`;
      case 'category_restored':
        return `${userName} restored "${activity.details?.category_name}"`;
      case 'category_deleted':
        return `${userName} deleted "${activity.details?.category_name}"`;
      case 'category_merged':
        const count = activity.details?.source_categories?.length || 0;
        return `${userName} merged ${count} categories into "${activity.details?.category_name}"`;
      default:
        return `${userName} modified a category`;
    }
  };

  // Format relative time
  const formatRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const activityDate = new Date(timestamp);
    const diffMs = now.getTime() - activityDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return activityDate.toLocaleDateString();
  };

  return (
    <div className="category-stats-overlay" onClick={onClose}>
      <div className="category-stats-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="category-stats-header">
          <h2>Category Statistics</h2>
          <button className="btn-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {/* Time Range Selector */}
        <div className="time-range-selector">
          <button
            className={`time-range-btn ${selectedTimeRange === 'week' ? 'active' : ''}`}
            onClick={() => setSelectedTimeRange('week')}
          >
            This Week
          </button>
          <button
            className={`time-range-btn ${selectedTimeRange === 'month' ? 'active' : ''}`}
            onClick={() => setSelectedTimeRange('month')}
          >
            This Month
          </button>
          <button
            className={`time-range-btn ${selectedTimeRange === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedTimeRange('all')}
          >
            All Time
          </button>
        </div>

        {/* Body */}
        <div className="category-stats-body">
          {filteredItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <p>No items found for {timeRangeLabel.toLowerCase()}</p>
              <p className="empty-hint">Add items to your list to see category statistics!</p>
            </div>
          ) : (
            <>
              {/* Overview Cards */}
              <section className="stats-section">
                <h3>Overview - {timeRangeLabel}</h3>
                <div className="overview-cards">
                  <div className="overview-card">
                    <div className="overview-icon">📦</div>
                    <div className="overview-content">
                      <div className="overview-value">{filteredItems.length}</div>
                      <div className="overview-label">Total Items</div>
                    </div>
                  </div>

                  <div className="overview-card">
                    <div className="overview-icon">📂</div>
                    <div className="overview-content">
                      <div className="overview-value">{categoryStats.length}</div>
                      <div className="overview-label">Active Categories</div>
                    </div>
                  </div>

                  <div className="overview-card">
                    <div className="overview-icon">✨</div>
                    <div className="overview-content">
                      <div className="overview-value">{customCategories.length}</div>
                      <div className="overview-label">Custom Categories</div>
                    </div>
                  </div>

                  <div className="overview-card">
                    <div className="overview-icon">🎯</div>
                    <div className="overview-content">
                      <div className="overview-value">{categoryRatio.customPercentage}%</div>
                      <div className="overview-label">Custom Usage</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Category Distribution Pie Chart */}
              <section className="stats-section">
                <h3>Category Distribution</h3>
                <div className="distribution-container">
                  {/* Visual Pie Chart using CSS */}
                  <div className="pie-chart-wrapper">
                    <div className="pie-chart">
                      {categoryStats.map((stat, index) => {
                        const prevPercentage = categoryStats
                          .slice(0, index)
                          .reduce((sum, s) => sum + s.percentage, 0);

                        return (
                          <div
                            key={stat.name}
                            className="pie-slice"
                            style={{
                              '--percentage': `${stat.percentage}%`,
                              '--rotation': `${prevPercentage * 3.6}deg`,
                              '--color': getCategoryColor(stat),
                            } as React.CSSProperties}
                            title={`${stat.name}: ${stat.percentage}%`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="pie-legend">
                    {categoryStats.map(stat => (
                      <div key={stat.name} className="legend-item">
                        <div
                          className="legend-color"
                          style={{ backgroundColor: getCategoryColor(stat) }}
                        />
                        <div className="legend-content">
                          <div className="legend-name">
                            {stat.icon && <span className="legend-icon">{stat.icon}</span>}
                            {stat.name}
                            {stat.isCustom && <span className="legend-badge">Custom</span>}
                          </div>
                          <div className="legend-stats">
                            {stat.count} items ({stat.percentage}%)
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Bar Chart */}
              <section className="stats-section">
                <h3>Items per Category</h3>
                <div className="bar-chart">
                  {categoryStats.map(stat => (
                    <div key={stat.name} className="bar-chart-row">
                      <div className="bar-chart-label">
                        {stat.icon && <span className="bar-icon">{stat.icon}</span>}
                        <span className="bar-name">{stat.name}</span>
                        {stat.isCustom && <span className="bar-badge">Custom</span>}
                      </div>
                      <div className="bar-chart-bar-container">
                        <div
                          className="bar-chart-bar"
                          style={{
                            width: `${stat.percentage}%`,
                            backgroundColor: getCategoryColor(stat),
                          }}
                        >
                          <span className="bar-chart-value">{stat.count}</span>
                        </div>
                      </div>
                      <div className="bar-chart-percentage">{stat.percentage}%</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Custom vs Predefined Categories */}
              {customCategories.length > 0 && (
                <section className="stats-section">
                  <h3>Custom vs Predefined Categories</h3>
                  <div className="ratio-container">
                    <div className="ratio-bars">
                      <div className="ratio-bar">
                        <div className="ratio-bar-label">
                          <span>Predefined Categories</span>
                          <span className="ratio-bar-count">
                            {categoryRatio.predefinedCount} items
                          </span>
                        </div>
                        <div className="ratio-bar-track">
                          <div
                            className="ratio-bar-fill predefined"
                            style={{ width: `${categoryRatio.predefinedPercentage}%` }}
                          >
                            <span className="ratio-bar-percentage">
                              {categoryRatio.predefinedPercentage}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="ratio-bar">
                        <div className="ratio-bar-label">
                          <span>Custom Categories</span>
                          <span className="ratio-bar-count">
                            {categoryRatio.customCount} items
                          </span>
                        </div>
                        <div className="ratio-bar-track">
                          <div
                            className="ratio-bar-fill custom"
                            style={{ width: `${categoryRatio.customPercentage}%` }}
                          >
                            <span className="ratio-bar-percentage">
                              {categoryRatio.customPercentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="ratio-insight">
                      {categoryRatio.customPercentage > 50 ? (
                        <p>
                          You're making great use of custom categories! Over half of your items use
                          custom categories you've created.
                        </p>
                      ) : categoryRatio.customPercentage > 0 ? (
                        <p>
                          You're using a mix of predefined and custom categories. Custom categories
                          help personalize your shopping experience!
                        </p>
                      ) : (
                        <p>
                          You're using predefined categories. Try creating custom categories to
                          better organize your unique shopping needs!
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* Most Used Custom Categories */}
              {topCustomCategories.length > 0 && (
                <section className="stats-section">
                  <h3>Most Used Custom Categories</h3>
                  <div className="top-categories">
                    {topCustomCategories.map((stat, index) => (
                      <div key={stat.name} className="top-category-item">
                        <div className="top-category-rank">{index + 1}</div>
                        <div
                          className="top-category-icon"
                          style={{
                            backgroundColor: stat.color || '#9C27B0',
                          }}
                        >
                          {stat.icon || '📦'}
                        </div>
                        <div className="top-category-info">
                          <div className="top-category-name">{stat.name}</div>
                          <div className="top-category-count">
                            {stat.count} items ({stat.percentage}%)
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Most Frequently Purchased Items by Category */}
              <section className="stats-section">
                <h3>Most Frequent Items by Category</h3>
                <div className="frequent-items">
                  {categoryStats.slice(0, 5).map(stat => {
                    const topItems = topItemsByCategory[stat.name] || [];
                    if (topItems.length === 0) return null;

                    return (
                      <div key={stat.name} className="frequent-category">
                        <div className="frequent-category-header">
                          {stat.icon && <span className="frequent-icon">{stat.icon}</span>}
                          <span className="frequent-category-name">{stat.name}</span>
                          {stat.isCustom && <span className="frequent-badge">Custom</span>}
                        </div>
                        <div className="frequent-items-list">
                          {topItems.map(item => (
                            <div key={item.name} className="frequent-item">
                              <span className="frequent-item-name">{item.name}</span>
                              <span className="frequent-item-count">
                                {item.frequency}x
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Recent Category Changes */}
              {categoryActivities.length > 0 && (
                <section className="stats-section">
                  <h3>Recent Category Changes</h3>
                  <div className="category-activity-list">
                    {categoryActivities.map(activity => (
                      <div key={activity.id} className="category-activity-item">
                        <div className="category-activity-icon">
                          {activity.action === 'category_created' && '🏷️'}
                          {activity.action === 'category_updated' && '✏️'}
                          {activity.action === 'category_archived' && '📦'}
                          {activity.action === 'category_restored' && '♻️'}
                          {activity.action === 'category_deleted' && '🗑️'}
                          {activity.action === 'category_merged' && '🔀'}
                        </div>
                        <div className="category-activity-content">
                          <p className="category-activity-message">
                            {formatCategoryActivity(activity)}
                          </p>
                          <span className="category-activity-time">
                            {formatRelativeTime(activity.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="category-activity-hint">
                    View all category activities in the Activity Log
                  </p>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
