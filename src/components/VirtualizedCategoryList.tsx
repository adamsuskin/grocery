/**
 * Virtualized Category List Component
 *
 * This component uses virtual scrolling to efficiently render large lists of categories.
 * Only visible items are rendered in the DOM, dramatically improving performance
 * for lists with 50+ categories.
 *
 * PERFORMANCE BENEFITS:
 * - Only renders visible items (~10-15 instead of 100+)
 * - Reduces DOM node count by 90%+
 * - Smooth scrolling even with 1000+ categories
 * - Minimal memory footprint
 *
 * For lists with < 50 categories, the standard list rendering is recommended
 * as the virtualization overhead isn't necessary.
 */

import { memo, useCallback, useRef, useEffect, useState, useMemo } from 'react';
import type { CustomCategory } from '../types';
import { CategoryItem } from './CategoryItem';

interface VirtualizedCategoryListProps {
  categories: CustomCategory[];
  selectedCategories: Set<string>;
  editingId: string | null;
  canEdit: boolean;
  onToggleSelect: (categoryId: string) => void;
  onStartEdit: (categoryId: string) => void;
  onSaveEdit: (categoryId: string, name: string, color: string, icon: string) => void;
  onCancelEdit: () => void;
  onStartDelete: (categoryId: string) => void;
  itemHeight?: number;
  overscan?: number;
}

/**
 * Simple virtualized list component
 * Renders only visible items based on scroll position
 */
export const VirtualizedCategoryList = memo(function VirtualizedCategoryList({
  categories,
  selectedCategories,
  editingId,
  canEdit,
  onToggleSelect,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onStartDelete,
  itemHeight = 60, // Default height per item in pixels
  overscan = 3, // Number of items to render outside visible area
}: VirtualizedCategoryListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  // Update container height on mount and resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      categories.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, itemHeight, overscan, categories.length]);

  // Get visible items
  const visibleCategories = useMemo(() => {
    return categories.slice(visibleRange.startIndex, visibleRange.endIndex);
  }, [categories, visibleRange]);

  // Calculate total height and offset
  const totalHeight = categories.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  // If list is small (< 50 items), render all items without virtualization
  if (categories.length < 50) {
    return (
      <div className="custom-categories">
        {categories.map((category) => (
          <CategoryItem
            key={category.id}
            category={category}
            isSelected={selectedCategories.has(category.id)}
            isEditing={editingId === category.id}
            canEdit={canEdit}
            onToggleSelect={onToggleSelect}
            onStartEdit={onStartEdit}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
            onStartDelete={onStartDelete}
          />
        ))}
      </div>
    );
  }

  // Virtualized rendering for large lists
  return (
    <div
      ref={containerRef}
      className="custom-categories virtualized-list"
      onScroll={handleScroll}
      style={{
        height: '600px',
        overflow: 'auto',
        position: 'relative',
      }}
    >
      {/* Spacer to maintain scroll height */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items container */}
        <div
          style={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0,
          }}
        >
          {visibleCategories.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              isSelected={selectedCategories.has(category.id)}
              isEditing={editingId === category.id}
              canEdit={canEdit}
              onToggleSelect={onToggleSelect}
              onStartEdit={onStartEdit}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onStartDelete={onStartDelete}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

/**
 * Hook to calculate optimal item height based on content
 * Useful for dynamic item heights
 */
export function useOptimalItemHeight(hasIcon: boolean, hasColor: boolean): number {
  return useMemo(() => {
    let height = 50; // Base height
    if (hasIcon) height += 10;
    if (hasColor) height += 10;
    return height;
  }, [hasIcon, hasColor]);
}
