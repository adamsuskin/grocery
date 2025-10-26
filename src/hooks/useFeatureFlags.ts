/**
 * React hook for feature flags
 *
 * Provides a reactive way to access feature flags in React components.
 * Automatically re-renders when flags change at runtime.
 *
 * ## Usage
 *
 * ```typescript
 * import { useFeatureFlags, useFeatureFlag } from '../hooks/useFeatureFlags';
 *
 * function MyComponent() {
 *   const flags = useFeatureFlags();
 *
 *   if (!flags.customCategories.enabled) {
 *     return null;
 *   }
 *
 *   return (
 *     <div>
 *       {flags.customCategories.colors && <ColorPicker />}
 *       {flags.customCategories.icons && <EmojiPicker />}
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useEffect } from 'react';
import {
  getFeatureFlags,
  isFeatureEnabled,
  type FeatureFlags,
} from '../utils/featureFlags';

/**
 * Hook to get all feature flags
 * Subscribes to runtime changes via custom events
 *
 * @returns Complete FeatureFlags object
 *
 * @example
 * ```typescript
 * const flags = useFeatureFlags();
 *
 * if (!flags.customCategories.enabled) {
 *   return null;
 * }
 * ```
 */
export function useFeatureFlags(): FeatureFlags {
  const [flags, setFlags] = useState<FeatureFlags>(getFeatureFlags());

  useEffect(() => {
    // Listen for runtime flag changes
    const handleFlagsChanged = () => {
      setFlags(getFeatureFlags());
    };

    window.addEventListener('featureFlagsChanged', handleFlagsChanged);

    return () => {
      window.removeEventListener('featureFlagsChanged', handleFlagsChanged);
    };
  }, []);

  return flags;
}

/**
 * Hook to check if a specific feature is enabled
 * More efficient than useFeatureFlags() when only checking one flag
 *
 * @param flagPath - Dot-notation path to flag (e.g., 'customCategories.enabled')
 * @returns true if the feature is enabled
 *
 * @example
 * ```typescript
 * const colorsEnabled = useFeatureFlag('customCategories.colors');
 *
 * if (!colorsEnabled) {
 *   return null;
 * }
 * ```
 */
export function useFeatureFlag(flagPath: string): boolean {
  const [enabled, setEnabled] = useState<boolean>(isFeatureEnabled(flagPath));

  useEffect(() => {
    // Listen for runtime flag changes
    const handleFlagsChanged = (event: Event) => {
      const customEvent = event as CustomEvent;
      // Only update if this specific flag changed, or update all
      if (!customEvent.detail || customEvent.detail.flagPath === flagPath) {
        setEnabled(isFeatureEnabled(flagPath));
      }
    };

    window.addEventListener('featureFlagsChanged', handleFlagsChanged);

    return () => {
      window.removeEventListener('featureFlagsChanged', handleFlagsChanged);
    };
  }, [flagPath]);

  return enabled;
}

/**
 * Hook to get custom categories feature flags
 * Convenience hook that returns only custom categories flags
 *
 * @returns Custom categories feature flags object
 *
 * @example
 * ```typescript
 * const categoryFlags = useCustomCategoriesFlags();
 *
 * if (!categoryFlags.enabled) {
 *   return null;
 * }
 *
 * return (
 *   <div>
 *     {categoryFlags.colors && <ColorPicker />}
 *     {categoryFlags.icons && <EmojiPicker />}
 *   </div>
 * );
 * ```
 */
export function useCustomCategoriesFlags() {
  const flags = useFeatureFlags();
  return flags.customCategories;
}
