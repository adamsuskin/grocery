/**
 * CategoryStatistics Usage Example
 *
 * This example demonstrates how to integrate the CategoryStatistics component
 * into your application to show category usage patterns and shopping statistics.
 */

import { useState } from 'react';
import { CategoryStatistics } from './CategoryStatistics';

export function CategoryStatisticsExample() {
  const [showStats, setShowStats] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'all'>('all');
  const currentListId = 'example-list-123';

  return (
    <div>
      {/* Trigger button */}
      <button onClick={() => setShowStats(true)}>
        View Category Statistics
      </button>

      {/* Statistics Modal */}
      {showStats && (
        <CategoryStatistics
          listId={currentListId}
          timeRange={selectedTimeRange}
          onClose={() => setShowStats(false)}
        />
      )}
    </div>
  );
}

/**
 * Integration with ListActions Component
 *
 * Add to your App.tsx or ListDashboard component:
 */

export function IntegrationExample() {
  const [showCategoryStats, setShowCategoryStats] = useState(false);
  const [statsListId, setStatsListId] = useState<string | null>(null);

  const handleViewStatistics = (listId: string) => {
    setStatsListId(listId);
    setShowCategoryStats(true);
  };

  return (
    <div>
      {/* Your ListActions component with the new handler */}
      {/*
      <ListActions
        list={currentList}
        currentUserId={user.id}
        permission={permission}
        onViewStatistics={handleViewStatistics}
        // ... other props
      />
      */}

      {/* Render the statistics modal */}
      {showCategoryStats && statsListId && (
        <CategoryStatistics
          listId={statsListId}
          timeRange="all"
          onClose={() => {
            setShowCategoryStats(false);
            setStatsListId(null);
          }}
        />
      )}
    </div>
  );
}

/**
 * Integration with CustomCategoryManager
 *
 * Add to your CustomCategoryManager usage:
 */

export function CustomCategoryManagerIntegration() {
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showCategoryStats, setShowCategoryStats] = useState(false);
  const currentListId = 'example-list-123';

  const handleViewStatisticsFromManager = () => {
    // Close category manager
    setShowCategoryManager(false);
    // Open statistics
    setShowCategoryStats(true);
  };

  return (
    <div>
      {/* Open category manager button */}
      <button onClick={() => setShowCategoryManager(true)}>
        Manage Categories
      </button>

      {/* Category Manager with Statistics button */}
      {showCategoryManager && (
        /*
        <CustomCategoryManager
          listId={currentListId}
          onClose={() => setShowCategoryManager(false)}
          permissionLevel="owner"
          onViewStatistics={handleViewStatisticsFromManager}
        />
        */
        <div>Category Manager</div>
      )}

      {/* Statistics Modal */}
      {showCategoryStats && (
        <CategoryStatistics
          listId={currentListId}
          timeRange="all"
          onClose={() => setShowCategoryStats(false)}
        />
      )}
    </div>
  );
}

/**
 * Features Demonstrated:
 *
 * 1. Time Range Filtering
 *    - View statistics for "This Week", "This Month", or "All Time"
 *    - Switch between time ranges dynamically
 *
 * 2. Category Distribution
 *    - Visual pie chart showing percentage breakdown
 *    - Bar chart with item counts per category
 *    - Legend with color coding
 *
 * 3. Custom vs Predefined Analysis
 *    - Compare usage of custom categories vs predefined ones
 *    - Visual ratio bars showing percentage split
 *    - Insights based on usage patterns
 *
 * 4. Top Custom Categories
 *    - Ranked list of most used custom categories
 *    - Shows item count and percentage for each
 *
 * 5. Most Frequent Items by Category
 *    - Top 3 most frequently added items per category
 *    - Helps identify shopping patterns
 *    - Shows frequency count for each item
 *
 * 6. Responsive Design
 *    - Mobile-friendly layout
 *    - Touch-friendly controls
 *    - Adapts to different screen sizes
 */
