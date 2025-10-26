/**
 * Category Analytics Viewer Component
 *
 * This is an optional component that displays analytics about custom category usage.
 * It can be integrated into the app to show users insights about their category usage patterns.
 *
 * ## Usage
 *
 * ```typescript
 * import { CategoryAnalyticsViewer } from './CategoryAnalyticsViewer';
 *
 * function MyComponent() {
 *   return (
 *     <CategoryAnalyticsViewer listId="list-123" />
 *   );
 * }
 * ```
 */

import { useState, useEffect } from 'react';
import {
  getCategoryAnalytics,
  getCategorySummaryStats,
  exportAnalyticsData,
  clearAnalyticsData,
  type CategoryAnalytics,
} from '../utils/categoryAnalytics';

interface CategoryAnalyticsViewerProps {
  listId: string;
  onClose: () => void;
}

export function CategoryAnalyticsViewer({ listId, onClose }: CategoryAnalyticsViewerProps) {
  const [analytics, setAnalytics] = useState<CategoryAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'trends'>('overview');

  useEffect(() => {
    loadAnalytics();
  }, [listId]);

  const loadAnalytics = () => {
    const data = getCategoryAnalytics(listId);
    setAnalytics(data);
  };

  const handleExport = () => {
    const jsonData = exportAnalyticsData();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `category-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
      clearAnalyticsData();
      loadAnalytics();
    }
  };

  if (!analytics) {
    return <div>Loading analytics...</div>;
  }

  const summary = getCategorySummaryStats(listId);

  return (
    <div className="category-manager-overlay" onClick={onClose}>
      <div className="category-manager-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="category-manager-header">
          <h2>Category Analytics</h2>
          <button className="btn-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="analytics-tabs">
          <button
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`tab ${activeTab === 'usage' ? 'active' : ''}`}
            onClick={() => setActiveTab('usage')}
          >
            Usage
          </button>
          <button
            className={`tab ${activeTab === 'trends' ? 'active' : ''}`}
            onClick={() => setActiveTab('trends')}
          >
            Trends
          </button>
        </div>

        {/* Body */}
        <div className="category-manager-body">
          {activeTab === 'overview' && (
            <section className="category-section">
              <h3>Overview</h3>

              <div className="analytics-stats">
                <div className="stat-card">
                  <div className="stat-value">{summary.totalCreated}</div>
                  <div className="stat-label">Categories Created</div>
                </div>

                <div className="stat-card">
                  <div className="stat-value">{summary.totalUsage}</div>
                  <div className="stat-label">Times Used</div>
                </div>

                <div className="stat-card">
                  <div className="stat-value">{summary.averageUsagePerCategory}</div>
                  <div className="stat-label">Avg Uses per Category</div>
                </div>

                <div className="stat-card">
                  <div className="stat-value">{analytics.totalFilterUsage}</div>
                  <div className="stat-label">Filter Applications</div>
                </div>
              </div>

              {summary.mostActiveDay && (
                <div className="analytics-insight">
                  <h4>Most Active Day</h4>
                  <p>
                    <strong>{new Date(summary.mostActiveDay.date).toLocaleDateString()}</strong> with{' '}
                    {summary.mostActiveDay.count} events
                  </p>
                </div>
              )}

              {analytics.deletedCategories.length > 0 && (
                <div className="analytics-insight">
                  <h4>Deleted Categories</h4>
                  <p>{analytics.deletedCategories.length} categories have been deleted</p>
                </div>
              )}
            </section>
          )}

          {activeTab === 'usage' && (
            <section className="category-section">
              <h3>Most Used Categories</h3>

              {analytics.mostUsedCategories.length === 0 ? (
                <div className="empty-categories">
                  <p>No usage data yet</p>
                  <p className="empty-hint">
                    Start adding items with custom categories to see usage statistics!
                  </p>
                </div>
              ) : (
                <div className="analytics-list">
                  {analytics.mostUsedCategories.map((cat, index) => (
                    <div key={cat.categoryName} className="analytics-item">
                      <div className="analytics-rank">#{index + 1}</div>
                      <div className="analytics-content">
                        <div className="analytics-name">{cat.categoryName}</div>
                        <div className="analytics-details">
                          <span className="analytics-count">{cat.usageCount} uses</span>
                          <span className="analytics-date">
                            Last used: {new Date(cat.lastUsed).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {analytics.filterUsageByCategory.length > 0 && (
                <>
                  <h3 style={{ marginTop: '2rem' }}>Filter Usage</h3>
                  <div className="analytics-list">
                    {analytics.filterUsageByCategory.slice(0, 5).map((cat) => (
                      <div key={cat.categoryName} className="analytics-item">
                        <div className="analytics-content">
                          <div className="analytics-name">{cat.categoryName}</div>
                          <div className="analytics-details">
                            <span className="analytics-count">{cat.filterCount} filter applications</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          )}

          {activeTab === 'trends' && (
            <section className="category-section">
              <h3>Creation Trend (Last 30 Days)</h3>

              {analytics.categoryCreationTrend.length === 0 ? (
                <div className="empty-categories">
                  <p>No creation data in the last 30 days</p>
                </div>
              ) : (
                <div className="analytics-trend">
                  {analytics.categoryCreationTrend.map((trend) => (
                    <div key={trend.date} className="trend-item">
                      <div className="trend-date">{new Date(trend.date).toLocaleDateString()}</div>
                      <div className="trend-bar">
                        <div
                          className="trend-bar-fill"
                          style={{
                            width: `${(trend.count / Math.max(...analytics.categoryCreationTrend.map(t => t.count))) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="trend-count">{trend.count}</div>
                    </div>
                  ))}
                </div>
              )}

              {analytics.recentlyCreatedCategories.length > 0 && (
                <>
                  <h3 style={{ marginTop: '2rem' }}>Recently Created</h3>
                  <div className="analytics-list">
                    {analytics.recentlyCreatedCategories.map((cat) => (
                      <div key={cat.categoryName} className="analytics-item">
                        <div className="analytics-content">
                          <div className="analytics-name">{cat.categoryName}</div>
                          <div className="analytics-details">
                            <span className="analytics-date">
                              {new Date(cat.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          )}
        </div>

        {/* Footer Actions */}
        <div className="category-manager-footer">
          <button className="btn btn-secondary" onClick={handleExport}>
            Export Data
          </button>
          <button className="btn btn-danger" onClick={handleClear}>
            Clear Analytics
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <style>{`
        .analytics-tabs {
          display: flex;
          gap: 0.5rem;
          padding: 1rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .analytics-tabs .tab {
          padding: 0.5rem 1rem;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          font-weight: 500;
          color: #64748b;
          transition: all 0.2s;
        }

        .analytics-tabs .tab:hover {
          color: #334155;
        }

        .analytics-tabs .tab.active {
          color: #2563eb;
          border-bottom-color: #2563eb;
        }

        .analytics-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          padding: 1.5rem;
          background: #f8fafc;
          border-radius: 8px;
          text-align: center;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: bold;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-size: 0.875rem;
          color: #64748b;
        }

        .analytics-insight {
          padding: 1rem;
          background: #eff6ff;
          border-left: 4px solid #2563eb;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .analytics-insight h4 {
          margin: 0 0 0.5rem 0;
          color: #1e40af;
          font-size: 1rem;
        }

        .analytics-insight p {
          margin: 0;
          color: #1e293b;
        }

        .analytics-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .analytics-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 8px;
        }

        .analytics-rank {
          font-size: 1.25rem;
          font-weight: bold;
          color: #94a3b8;
          min-width: 2rem;
        }

        .analytics-content {
          flex: 1;
        }

        .analytics-name {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.25rem;
        }

        .analytics-details {
          display: flex;
          gap: 1rem;
          font-size: 0.875rem;
          color: #64748b;
        }

        .analytics-count {
          font-weight: 500;
          color: #2563eb;
        }

        .analytics-trend {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .trend-item {
          display: grid;
          grid-template-columns: 120px 1fr 50px;
          align-items: center;
          gap: 1rem;
        }

        .trend-date {
          font-size: 0.875rem;
          color: #64748b;
        }

        .trend-bar {
          height: 24px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
        }

        .trend-bar-fill {
          height: 100%;
          background: linear-gradient(to right, #3b82f6, #2563eb);
          transition: width 0.3s;
        }

        .trend-count {
          font-weight: 600;
          color: #1e293b;
          text-align: right;
        }

        .category-manager-footer {
          display: flex;
          gap: 0.5rem;
          padding: 1rem;
          border-top: 1px solid #e2e8f0;
          justify-content: flex-end;
        }
      `}</style>
    </div>
  );
}
