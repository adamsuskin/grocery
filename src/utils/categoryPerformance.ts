/**
 * Custom Categories Performance Benchmarking Utilities
 *
 * This module provides utilities for measuring and monitoring
 * performance of custom category operations.
 *
 * FEATURES:
 * - Component render time tracking
 * - Query performance monitoring
 * - Memory usage profiling
 * - Performance regression detection
 */

import { useEffect, useRef, useState, useMemo } from 'react';

/**
 * Performance metric storage
 */
interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics

  /**
   * Record a performance metric
   */
  record(name: string, duration: number, metadata?: Record<string, any>) {
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    });

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * Get average duration for a metric
   */
  getAverage(name: string): number {
    const filtered = this.metrics.filter((m) => m.name === name);
    if (filtered.length === 0) return 0;

    const sum = filtered.reduce((acc, m) => acc + m.duration, 0);
    return sum / filtered.length;
  }

  /**
   * Get percentile duration for a metric
   */
  getPercentile(name: string, percentile: number): number {
    const filtered = this.metrics
      .filter((m) => m.name === name)
      .map((m) => m.duration)
      .sort((a, b) => a - b);

    if (filtered.length === 0) return 0;

    const index = Math.ceil((percentile / 100) * filtered.length) - 1;
    return filtered[index];
  }

  /**
   * Get all metrics for a name
   */
  getMetrics(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name);
  }

  /**
   * Get summary statistics
   */
  getSummary(name: string) {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) {
      return null;
    }

    const durations = metrics.map((m) => m.duration).sort((a, b) => a - b);
    const sum = durations.reduce((acc, d) => acc + d, 0);

    return {
      count: metrics.length,
      average: sum / metrics.length,
      median: durations[Math.floor(durations.length / 2)],
      min: durations[0],
      max: durations[durations.length - 1],
      p95: this.getPercentile(name, 95),
      p99: this.getPercentile(name, 99),
    };
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
  }

  /**
   * Export metrics as JSON
   */
  export(): string {
    return JSON.stringify(this.metrics, null, 2);
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Measure execution time of a function
 *
 * @param name - Name of the operation
 * @param fn - Function to measure
 * @param metadata - Optional metadata
 * @returns Result of the function
 *
 * @example
 * ```typescript
 * const result = await measurePerformance('fetchCategories', async () => {
 *   return await fetchCategories(listId);
 * }, { listId });
 * ```
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => T | Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const start = performance.now();

  try {
    const result = await fn();
    const duration = performance.now() - start;
    performanceMonitor.record(name, duration, metadata);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    performanceMonitor.record(`${name}_error`, duration, {
      ...metadata,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * React hook to measure component render time
 *
 * @param componentName - Name of the component
 * @param deps - Dependencies that trigger re-renders
 *
 * @example
 * ```typescript
 * function MyComponent({ data }) {
 *   useRenderPerformance('MyComponent', [data]);
 *   return <div>...</div>;
 * }
 * ```
 */
export function useRenderPerformance(
  componentName: string,
  deps: React.DependencyList = []
) {
  const renderStartRef = useRef<number>(0);
  const renderCountRef = useRef<number>(0);

  useEffect(() => {
    renderStartRef.current = performance.now();
  });

  useEffect(() => {
    const duration = performance.now() - renderStartRef.current;
    renderCountRef.current += 1;

    performanceMonitor.record(`${componentName}_render`, duration, {
      renderCount: renderCountRef.current,
    });
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * React hook to track query performance
 *
 * @param queryName - Name of the query
 * @param queryResult - Result from useQuery
 * @returns Query metadata
 *
 * @example
 * ```typescript
 * const categories = useQuery(query);
 * useQueryPerformance('customCategories', categories);
 * ```
 */
export function useQueryPerformance(queryName: string, queryResult: any) {
  const [startTime] = useState(() => performance.now());
  const resultCountRef = useRef<number>(0);

  useEffect(() => {
    if (queryResult) {
      const duration = performance.now() - startTime;
      const count = Array.isArray(queryResult) ? queryResult.length : 1;
      resultCountRef.current = count;

      performanceMonitor.record(`${queryName}_query`, duration, {
        resultCount: count,
      });
    }
  }, [queryName, queryResult, startTime]);

  return useMemo(
    () => ({
      resultCount: resultCountRef.current,
      queryName,
    }),
    [queryName]
  );
}

/**
 * React hook to monitor memory usage
 * Only works in browsers that support performance.memory
 *
 * @param componentName - Name of the component
 * @returns Memory usage info
 *
 * @example
 * ```typescript
 * const memoryInfo = useMemoryMonitor('CategoryManager');
 * console.log(`Heap: ${memoryInfo.usedHeapMB}MB`);
 * ```
 */
export function useMemoryMonitor(componentName: string) {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedHeapMB: number;
    totalHeapMB: number;
  } | null>(null);

  useEffect(() => {
    // Check if performance.memory is available (Chrome only)
    const memory = (performance as any).memory;
    if (memory) {
      const usedHeapMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      const totalHeapMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);

      setMemoryInfo({ usedHeapMB, totalHeapMB });

      performanceMonitor.record(`${componentName}_memory`, usedHeapMB, {
        totalHeapMB,
      });
    }
  }, [componentName]);

  return memoryInfo;
}

/**
 * Generate performance report for custom categories
 *
 * @returns Performance report as string
 *
 * @example
 * ```typescript
 * const report = generatePerformanceReport();
 * console.log(report);
 * // Or download as file
 * downloadPerformanceReport();
 * ```
 */
export function generatePerformanceReport(): string {
  const metrics = [
    'useCustomCategories_render',
    'CustomCategoryManager_render',
    'customCategories_query',
    'addCustomCategory',
    'updateCustomCategory',
    'deleteCustomCategory',
  ];

  let report = '# Custom Categories Performance Report\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;

  for (const metricName of metrics) {
    const summary = performanceMonitor.getSummary(metricName);
    if (summary) {
      report += `## ${metricName}\n`;
      report += `- Count: ${summary.count}\n`;
      report += `- Average: ${summary.average.toFixed(2)}ms\n`;
      report += `- Median: ${summary.median.toFixed(2)}ms\n`;
      report += `- Min: ${summary.min.toFixed(2)}ms\n`;
      report += `- Max: ${summary.max.toFixed(2)}ms\n`;
      report += `- P95: ${summary.p95.toFixed(2)}ms\n`;
      report += `- P99: ${summary.p99.toFixed(2)}ms\n\n`;
    }
  }

  return report;
}

/**
 * Download performance report as text file
 */
export function downloadPerformanceReport() {
  const report = generatePerformanceReport();
  const blob = new Blob([report], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `category-performance-${Date.now()}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Performance thresholds for alerts
 */
export const PERFORMANCE_THRESHOLDS = {
  // Component render times (ms)
  RENDER_WARNING: 16, // One frame at 60fps
  RENDER_CRITICAL: 50,

  // Query times (ms)
  QUERY_WARNING: 100,
  QUERY_CRITICAL: 500,

  // Mutation times (ms)
  MUTATION_WARNING: 200,
  MUTATION_CRITICAL: 1000,
};

/**
 * Check if performance metric exceeds threshold
 *
 * @param metricName - Name of the metric
 * @param threshold - Warning or critical threshold
 * @returns true if metric exceeds threshold
 */
export function isPerformanceIssue(
  metricName: string,
  threshold: 'warning' | 'critical'
): boolean {
  const summary = performanceMonitor.getSummary(metricName);
  if (!summary) return false;

  const thresholdValue =
    threshold === 'warning'
      ? PERFORMANCE_THRESHOLDS.RENDER_WARNING
      : PERFORMANCE_THRESHOLDS.RENDER_CRITICAL;

  return summary.p95 > thresholdValue;
}

/**
 * Performance test data generator
 * Creates mock categories for testing large lists
 *
 * @param count - Number of categories to generate
 * @returns Array of mock categories
 *
 * @example
 * ```typescript
 * const testCategories = generateTestCategories(1000);
 * // Test rendering performance with 1000 categories
 * ```
 */
export function generateTestCategories(count: number) {
  const categories = [];
  for (let i = 0; i < count; i++) {
    categories.push({
      id: `test-category-${i}`,
      name: `Test Category ${i}`,
      listId: 'test-list',
      createdBy: 'test-user',
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      icon: ['🍎', '🥕', '🥛', '🍞', '🥫'][i % 5],
      displayOrder: 0,
      isArchived: false,
      createdAt: Date.now() - i * 1000,
      updatedAt: Date.now() - i * 1000,
    });
  }
  return categories;
}
