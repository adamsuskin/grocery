/**
 * Debounce and Performance Utilities
 *
 * This module provides utilities for debouncing expensive operations
 * and optimizing performance in React components.
 *
 * PERFORMANCE BENEFITS:
 * - Reduces unnecessary API calls and re-renders
 * - Improves search/filter responsiveness
 * - Prevents excessive computation
 */

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';

/**
 * Debounce function - delays execution until after wait time has elapsed
 * since the last invocation
 *
 * @param func - Function to debounce
 * @param wait - Milliseconds to wait before executing
 * @returns Debounced function
 *
 * @example
 * ```typescript
 * const debouncedSearch = debounce((query: string) => {
 *   performSearch(query);
 * }, 300);
 *
 * // Called many times quickly, but only executes once after 300ms
 * debouncedSearch('apple');
 * debouncedSearch('apples');
 * debouncedSearch('apples and oranges'); // Only this executes
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle function - ensures function is called at most once per time period
 *
 * @param func - Function to throttle
 * @param limit - Minimum milliseconds between calls
 * @returns Throttled function
 *
 * @example
 * ```typescript
 * const throttledScroll = throttle((e: Event) => {
 *   handleScroll(e);
 * }, 100);
 *
 * // Called many times quickly, but only executes every 100ms
 * window.addEventListener('scroll', throttledScroll);
 * ```
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function throttled(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * React hook for debounced values
 * Updates the debounced value after delay has passed since last change
 *
 * PERFORMANCE BENEFITS:
 * - Prevents excessive re-renders during rapid input changes
 * - Reduces API calls for search/filter operations
 * - Improves UI responsiveness
 *
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced value
 *
 * @example
 * ```typescript
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedQuery = useDebounce(searchQuery, 300);
 *
 * useEffect(() => {
 *   // Only runs 300ms after user stops typing
 *   performSearch(debouncedQuery);
 * }, [debouncedQuery]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up the timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up on value change or unmount
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * React hook for debounced callbacks
 * Returns a memoized debounced version of the callback
 *
 * @param callback - Callback to debounce
 * @param delay - Delay in milliseconds
 * @param deps - Dependencies array
 * @returns Debounced callback
 *
 * @example
 * ```typescript
 * const handleSearch = useDebouncedCallback(
 *   (query: string) => {
 *     performSearch(query);
 *   },
 *   300,
 *   []
 * );
 *
 * // In input onChange:
 * <input onChange={(e) => handleSearch(e.target.value)} />
 * ```
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Return memoized debounced callback
  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay, ...deps] // eslint-disable-line react-hooks/exhaustive-deps
  );
}

/**
 * React hook for throttled callbacks
 * Returns a memoized throttled version of the callback
 *
 * @param callback - Callback to throttle
 * @param limit - Minimum milliseconds between calls
 * @param deps - Dependencies array
 * @returns Throttled callback
 *
 * @example
 * ```typescript
 * const handleScroll = useThrottledCallback(
 *   () => {
 *     updateScrollPosition();
 *   },
 *   100,
 *   []
 * );
 *
 * <div onScroll={handleScroll}>...</div>
 * ```
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  limit: number,
  deps: React.DependencyList = []
): (...args: Parameters<T>) => void {
  const inThrottleRef = useRef<boolean>(false);
  const callbackRef = useRef(callback);

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Return memoized throttled callback
  return useCallback(
    (...args: Parameters<T>) => {
      if (!inThrottleRef.current) {
        callbackRef.current(...args);
        inThrottleRef.current = true;
        setTimeout(() => {
          inThrottleRef.current = false;
        }, limit);
      }
    },
    [limit, ...deps] // eslint-disable-line react-hooks/exhaustive-deps
  );
}

/**
 * Hook to filter categories with debounced search
 * Optimized for large category lists
 *
 * @param categories - Array of categories to filter
 * @param searchQuery - Search query string
 * @param debounceMs - Debounce delay (default: 300ms)
 * @returns Filtered categories array
 *
 * @example
 * ```typescript
 * const [searchQuery, setSearchQuery] = useState('');
 * const filteredCategories = useFilteredCategories(allCategories, searchQuery);
 * ```
 */
export function useFilteredCategories<T extends { name: string }>(
  categories: T[],
  searchQuery: string,
  debounceMs: number = 300
): T[] {
  const debouncedQuery = useDebounce(searchQuery, debounceMs);

  return useMemo(() => {
    if (!debouncedQuery.trim()) {
      return categories;
    }

    const query = debouncedQuery.toLowerCase();
    return categories.filter((category) =>
      category.name.toLowerCase().includes(query)
    );
  }, [categories, debouncedQuery]);
}

/**
 * Hook to batch multiple state updates
 * Useful for bulk operations to avoid excessive re-renders
 *
 * @returns Function to batch updates
 *
 * @example
 * ```typescript
 * const batchUpdates = useBatchUpdates();
 *
 * batchUpdates(() => {
 *   setName('New Name');
 *   setColor('#FF0000');
 *   setIcon('🎉');
 * });
 * // All three state updates happen in a single render
 * ```
 */
export function useBatchUpdates() {
  return useCallback((callback: () => void) => {
    // In React 18+, state updates are automatically batched
    // This function is a compatibility wrapper
    callback();
  }, []);
}
