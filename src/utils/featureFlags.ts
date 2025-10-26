/**
 * Feature Flags System
 *
 * Provides a centralized feature flag system for gradual rollout of features.
 * Supports environment-based, localStorage-based, and user-based feature flags.
 *
 * ## Usage
 *
 * ```typescript
 * import { isFeatureEnabled, getFeatureFlags } from './utils/featureFlags';
 *
 * // Check if a specific feature is enabled
 * if (isFeatureEnabled('customCategories.enabled')) {
 *   // Render custom categories UI
 * }
 *
 * // Get all flags
 * const flags = getFeatureFlags();
 * if (flags.customCategories.colors) {
 *   // Show color picker
 * }
 * ```
 */

/**
 * Feature flag configuration interface
 * Defines all available feature flags in the application
 */
export interface FeatureFlags {
  customCategories: {
    /** Main toggle for custom categories feature */
    enabled: boolean;
    /** Enable color picker for categories */
    colors: boolean;
    /** Enable icon/emoji picker for categories */
    icons: boolean;
    /** Enable category import/export functionality */
    importExport: boolean;
    /** Enable smart category suggestions based on item names */
    suggestions: boolean;
    /** Enable bulk operations (merge, delete multiple, etc.) */
    bulkOperations: boolean;
    /** Enable category statistics and analytics */
    analytics: boolean;
    /** Enable category backup and restore */
    backup: boolean;
    /** Enable category recommendations */
    recommendations: boolean;
    /** Enable category activity logging */
    activityLog: boolean;
  };
  /** Feature flags for other features can be added here */
  notifications: {
    enabled: boolean;
    pushNotifications: boolean;
  };
  offlineMode: {
    enabled: boolean;
    backgroundSync: boolean;
  };
  collaboration: {
    enabled: boolean;
    realTimeSync: boolean;
  };
}

/**
 * Default feature flag values
 * These are used when no environment variables are set
 *
 * In development: all features are enabled by default
 * In production: features are disabled by default for gradual rollout
 */
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

const DEFAULT_FLAGS: FeatureFlags = {
  customCategories: {
    enabled: isDevelopment ? true : false,
    colors: isDevelopment ? true : false,
    icons: isDevelopment ? true : false,
    importExport: isDevelopment ? true : false,
    suggestions: isDevelopment ? true : false,
    bulkOperations: isDevelopment ? true : false,
    analytics: isDevelopment ? true : false,
    backup: isDevelopment ? true : false,
    recommendations: isDevelopment ? true : false,
    activityLog: isDevelopment ? true : false,
  },
  notifications: {
    enabled: true,
    pushNotifications: true,
  },
  offlineMode: {
    enabled: true,
    backgroundSync: true,
  },
  collaboration: {
    enabled: true,
    realTimeSync: true,
  },
};

/**
 * Storage key for feature flags in localStorage
 */
const FEATURE_FLAGS_STORAGE_KEY = 'grocery_feature_flags';

/**
 * Parse environment variable to boolean
 * Supports: true, false, 1, 0, yes, no (case-insensitive)
 */
function parseEnvBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === '') {
    return defaultValue;
  }

  const normalized = value.toLowerCase().trim();

  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }

  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }

  return defaultValue;
}

/**
 * Load feature flags from environment variables
 * Environment variables take precedence over defaults
 *
 * Expected environment variable format:
 * VITE_FEATURE_CUSTOM_CATEGORIES_ENABLED=true
 * VITE_FEATURE_CUSTOM_CATEGORIES_COLORS=true
 * etc.
 */
function loadFlagsFromEnvironment(): FeatureFlags {
  return {
    customCategories: {
      enabled: parseEnvBoolean(
        import.meta.env.VITE_FEATURE_CUSTOM_CATEGORIES_ENABLED,
        DEFAULT_FLAGS.customCategories.enabled
      ),
      colors: parseEnvBoolean(
        import.meta.env.VITE_FEATURE_CUSTOM_CATEGORIES_COLORS,
        DEFAULT_FLAGS.customCategories.colors
      ),
      icons: parseEnvBoolean(
        import.meta.env.VITE_FEATURE_CUSTOM_CATEGORIES_ICONS,
        DEFAULT_FLAGS.customCategories.icons
      ),
      importExport: parseEnvBoolean(
        import.meta.env.VITE_FEATURE_CUSTOM_CATEGORIES_IMPORT_EXPORT,
        DEFAULT_FLAGS.customCategories.importExport
      ),
      suggestions: parseEnvBoolean(
        import.meta.env.VITE_FEATURE_CUSTOM_CATEGORIES_SUGGESTIONS,
        DEFAULT_FLAGS.customCategories.suggestions
      ),
      bulkOperations: parseEnvBoolean(
        import.meta.env.VITE_FEATURE_CUSTOM_CATEGORIES_BULK_OPS,
        DEFAULT_FLAGS.customCategories.bulkOperations
      ),
      analytics: parseEnvBoolean(
        import.meta.env.VITE_FEATURE_CUSTOM_CATEGORIES_ANALYTICS,
        DEFAULT_FLAGS.customCategories.analytics
      ),
      backup: parseEnvBoolean(
        import.meta.env.VITE_FEATURE_CUSTOM_CATEGORIES_BACKUP,
        DEFAULT_FLAGS.customCategories.backup
      ),
      recommendations: parseEnvBoolean(
        import.meta.env.VITE_FEATURE_CUSTOM_CATEGORIES_RECOMMENDATIONS,
        DEFAULT_FLAGS.customCategories.recommendations
      ),
      activityLog: parseEnvBoolean(
        import.meta.env.VITE_FEATURE_CUSTOM_CATEGORIES_ACTIVITY_LOG,
        DEFAULT_FLAGS.customCategories.activityLog
      ),
    },
    notifications: {
      enabled: parseEnvBoolean(
        import.meta.env.VITE_FEATURE_NOTIFICATIONS_ENABLED,
        DEFAULT_FLAGS.notifications.enabled
      ),
      pushNotifications: parseEnvBoolean(
        import.meta.env.VITE_FEATURE_PUSH_NOTIFICATIONS,
        DEFAULT_FLAGS.notifications.pushNotifications
      ),
    },
    offlineMode: {
      enabled: parseEnvBoolean(
        import.meta.env.VITE_FEATURE_OFFLINE_MODE_ENABLED,
        DEFAULT_FLAGS.offlineMode.enabled
      ),
      backgroundSync: parseEnvBoolean(
        import.meta.env.VITE_FEATURE_BACKGROUND_SYNC,
        DEFAULT_FLAGS.offlineMode.backgroundSync
      ),
    },
    collaboration: {
      enabled: parseEnvBoolean(
        import.meta.env.VITE_FEATURE_COLLABORATION_ENABLED,
        DEFAULT_FLAGS.collaboration.enabled
      ),
      realTimeSync: parseEnvBoolean(
        import.meta.env.VITE_FEATURE_REAL_TIME_SYNC,
        DEFAULT_FLAGS.collaboration.realTimeSync
      ),
    },
  };
}

/**
 * Load feature flags from localStorage
 * Allows runtime overrides for testing and development
 */
function loadFlagsFromStorage(): Partial<FeatureFlags> {
  try {
    const stored = localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('[FeatureFlags] Failed to load flags from localStorage:', error);
  }
  return {};
}

/**
 * Save feature flags to localStorage
 * Used by admin panel to persist runtime overrides
 */
export function saveFlagsToStorage(flags: Partial<FeatureFlags>): void {
  try {
    localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(flags));
    console.log('[FeatureFlags] Saved flags to localStorage:', flags);
  } catch (error) {
    console.error('[FeatureFlags] Failed to save flags to localStorage:', error);
  }
}

/**
 * Clear all feature flag overrides from localStorage
 * Reverts to environment/default values
 */
export function clearStorageFlags(): void {
  try {
    localStorage.removeItem(FEATURE_FLAGS_STORAGE_KEY);
    console.log('[FeatureFlags] Cleared flags from localStorage');
  } catch (error) {
    console.error('[FeatureFlags] Failed to clear flags from localStorage:', error);
  }
}

/**
 * Deep merge two objects
 */
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === 'object' &&
        !Array.isArray(source[key]) &&
        source[key] !== null &&
        typeof result[key] === 'object'
      ) {
        result[key] = deepMerge(result[key], source[key] as any);
      } else {
        result[key] = source[key] as any;
      }
    }
  }

  return result;
}

/**
 * Get the current feature flags
 * Priority: localStorage > environment > defaults
 *
 * @returns Complete feature flags object
 */
export function getFeatureFlags(): FeatureFlags {
  // Start with environment flags (which includes defaults)
  let flags = loadFlagsFromEnvironment();

  // Override with localStorage flags (if any)
  const storageFlags = loadFlagsFromStorage();
  if (Object.keys(storageFlags).length > 0) {
    flags = deepMerge(flags, storageFlags);
  }

  return flags;
}

/**
 * Check if a specific feature is enabled
 * Supports dot notation for nested flags
 *
 * @param flagPath - Dot-notation path to flag (e.g., 'customCategories.enabled')
 * @returns true if the feature is enabled
 *
 * @example
 * ```typescript
 * isFeatureEnabled('customCategories.enabled')
 * isFeatureEnabled('customCategories.colors')
 * isFeatureEnabled('notifications.pushNotifications')
 * ```
 */
export function isFeatureEnabled(flagPath: string): boolean {
  const flags = getFeatureFlags();
  const parts = flagPath.split('.');

  let current: any = flags;
  for (const part of parts) {
    if (current === undefined || current === null) {
      return false;
    }
    current = current[part];
  }

  return current === true;
}

/**
 * Update a specific feature flag at runtime
 * This updates localStorage, not environment variables
 *
 * @param flagPath - Dot-notation path to flag
 * @param value - New value for the flag
 *
 * @example
 * ```typescript
 * setFeatureFlag('customCategories.colors', false)
 * setFeatureFlag('customCategories.enabled', true)
 * ```
 */
export function setFeatureFlag(flagPath: string, value: boolean): void {
  const parts = flagPath.split('.');
  const storageFlags = loadFlagsFromStorage();

  // Build nested object
  let current: any = storageFlags;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part]) {
      current[part] = {};
    }
    current = current[part];
  }

  // Set the value
  const lastPart = parts[parts.length - 1];
  current[lastPart] = value;

  saveFlagsToStorage(storageFlags);

  // Dispatch custom event to notify components
  window.dispatchEvent(new CustomEvent('featureFlagsChanged', {
    detail: { flagPath, value }
  }));
}

/**
 * Get feature flag metadata for admin panel
 * Includes descriptions and grouping information
 */
export interface FeatureFlagMetadata {
  key: string;
  label: string;
  description: string;
  group: string;
  enabled: boolean;
  parentFlag?: string;
}

/**
 * Get all feature flags with metadata
 * Used by admin panel to display and manage flags
 */
export function getFeatureFlagsWithMetadata(): FeatureFlagMetadata[] {
  const flags = getFeatureFlags();

  return [
    // Custom Categories
    {
      key: 'customCategories.enabled',
      label: 'Custom Categories',
      description: 'Main toggle for custom categories feature. Disabling this hides all custom category functionality.',
      group: 'Custom Categories',
      enabled: flags.customCategories.enabled,
    },
    {
      key: 'customCategories.colors',
      label: 'Category Colors',
      description: 'Allow users to assign colors to custom categories.',
      group: 'Custom Categories',
      enabled: flags.customCategories.colors,
      parentFlag: 'customCategories.enabled',
    },
    {
      key: 'customCategories.icons',
      label: 'Category Icons',
      description: 'Allow users to assign icons/emojis to custom categories.',
      group: 'Custom Categories',
      enabled: flags.customCategories.icons,
      parentFlag: 'customCategories.enabled',
    },
    {
      key: 'customCategories.importExport',
      label: 'Import/Export',
      description: 'Enable category import and export functionality.',
      group: 'Custom Categories',
      enabled: flags.customCategories.importExport,
      parentFlag: 'customCategories.enabled',
    },
    {
      key: 'customCategories.suggestions',
      label: 'Smart Suggestions',
      description: 'Show smart category suggestions based on item names.',
      group: 'Custom Categories',
      enabled: flags.customCategories.suggestions,
      parentFlag: 'customCategories.enabled',
    },
    {
      key: 'customCategories.bulkOperations',
      label: 'Bulk Operations',
      description: 'Enable bulk operations like merge categories, delete multiple, etc.',
      group: 'Custom Categories',
      enabled: flags.customCategories.bulkOperations,
      parentFlag: 'customCategories.enabled',
    },
    {
      key: 'customCategories.analytics',
      label: 'Analytics',
      description: 'Enable category statistics and analytics tracking.',
      group: 'Custom Categories',
      enabled: flags.customCategories.analytics,
      parentFlag: 'customCategories.enabled',
    },
    {
      key: 'customCategories.backup',
      label: 'Backup & Restore',
      description: 'Enable category backup and restore functionality.',
      group: 'Custom Categories',
      enabled: flags.customCategories.backup,
      parentFlag: 'customCategories.enabled',
    },
    {
      key: 'customCategories.recommendations',
      label: 'Recommendations',
      description: 'Show category recommendations based on usage patterns.',
      group: 'Custom Categories',
      enabled: flags.customCategories.recommendations,
      parentFlag: 'customCategories.enabled',
    },
    {
      key: 'customCategories.activityLog',
      label: 'Activity Log',
      description: 'Track and display category activity logs.',
      group: 'Custom Categories',
      enabled: flags.customCategories.activityLog,
      parentFlag: 'customCategories.enabled',
    },

    // Notifications
    {
      key: 'notifications.enabled',
      label: 'Notifications',
      description: 'Main toggle for notification features.',
      group: 'Notifications',
      enabled: flags.notifications.enabled,
    },
    {
      key: 'notifications.pushNotifications',
      label: 'Push Notifications',
      description: 'Enable browser push notifications.',
      group: 'Notifications',
      enabled: flags.notifications.pushNotifications,
      parentFlag: 'notifications.enabled',
    },

    // Offline Mode
    {
      key: 'offlineMode.enabled',
      label: 'Offline Mode',
      description: 'Enable offline functionality.',
      group: 'Offline',
      enabled: flags.offlineMode.enabled,
    },
    {
      key: 'offlineMode.backgroundSync',
      label: 'Background Sync',
      description: 'Enable background synchronization when online.',
      group: 'Offline',
      enabled: flags.offlineMode.backgroundSync,
      parentFlag: 'offlineMode.enabled',
    },

    // Collaboration
    {
      key: 'collaboration.enabled',
      label: 'Collaboration',
      description: 'Enable collaborative features.',
      group: 'Collaboration',
      enabled: flags.collaboration.enabled,
    },
    {
      key: 'collaboration.realTimeSync',
      label: 'Real-time Sync',
      description: 'Enable real-time synchronization for collaborative lists.',
      group: 'Collaboration',
      enabled: flags.collaboration.realTimeSync,
      parentFlag: 'collaboration.enabled',
    },
  ];
}

/**
 * Log feature flag usage for analytics
 * Can be used to track which features are actually being used
 */
export function logFeatureFlagUsage(flagPath: string): void {
  if (isDevelopment) {
    console.log(`[FeatureFlags] Feature used: ${flagPath}`);
  }

  // In production, you could send this to an analytics service
  // analytics.track('feature_used', { flag: flagPath });
}

/**
 * Initialize feature flags system
 * Call this on app startup to log current configuration
 */
export function initializeFeatureFlags(): void {
  const flags = getFeatureFlags();
  console.log('[FeatureFlags] Initialized with configuration:', flags);

  // Log if any flags are overridden in localStorage
  const storageFlags = loadFlagsFromStorage();
  if (Object.keys(storageFlags).length > 0) {
    console.log('[FeatureFlags] localStorage overrides active:', storageFlags);
  }
}
