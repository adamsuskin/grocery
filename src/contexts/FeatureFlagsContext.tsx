/**
 * Feature Flags Context
 *
 * Provides feature flags to the entire application via React Context.
 * This is an alternative to using the useFeatureFlags hook directly.
 *
 * ## Usage
 *
 * ```typescript
 * // In App.tsx:
 * import { FeatureFlagsProvider } from './contexts/FeatureFlagsContext';
 *
 * function App() {
 *   return (
 *     <FeatureFlagsProvider>
 *       <YourApp />
 *     </FeatureFlagsProvider>
 *   );
 * }
 *
 * // In components:
 * import { useFeatureFlagsContext } from './contexts/FeatureFlagsContext';
 *
 * function MyComponent() {
 *   const { flags, isEnabled, setFlag } = useFeatureFlagsContext();
 *
 *   if (!flags.customCategories.enabled) {
 *     return null;
 *   }
 *
 *   return <div>Custom categories are enabled!</div>;
 * }
 * ```
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  getFeatureFlags,
  isFeatureEnabled,
  setFeatureFlag,
  clearStorageFlags,
  initializeFeatureFlags,
  type FeatureFlags,
} from '../utils/featureFlags';

interface FeatureFlagsContextValue {
  /** Current feature flags */
  flags: FeatureFlags;
  /** Check if a specific feature is enabled */
  isEnabled: (flagPath: string) => boolean;
  /** Update a feature flag at runtime */
  setFlag: (flagPath: string, value: boolean) => void;
  /** Clear all runtime overrides */
  clearOverrides: () => void;
  /** Reload flags from environment/storage */
  reload: () => void;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | undefined>(undefined);

interface FeatureFlagsProviderProps {
  children: ReactNode;
  /** Optional initial flags for testing */
  initialFlags?: Partial<FeatureFlags>;
}

/**
 * Feature Flags Provider Component
 * Wraps the application to provide feature flags via context
 */
export function FeatureFlagsProvider({ children, initialFlags }: FeatureFlagsProviderProps) {
  const [flags, setFlags] = useState<FeatureFlags>(() => {
    if (initialFlags) {
      // Merge initial flags with defaults (for testing)
      return { ...getFeatureFlags(), ...initialFlags };
    }
    return getFeatureFlags();
  });

  // Initialize on mount
  useEffect(() => {
    if (!initialFlags) {
      initializeFeatureFlags();
    }
  }, [initialFlags]);

  // Listen for flag changes
  useEffect(() => {
    const handleFlagsChanged = () => {
      setFlags(getFeatureFlags());
    };

    window.addEventListener('featureFlagsChanged', handleFlagsChanged);

    return () => {
      window.removeEventListener('featureFlagsChanged', handleFlagsChanged);
    };
  }, []);

  const isEnabled = useCallback((flagPath: string) => {
    return isFeatureEnabled(flagPath);
  }, []);

  const setFlag = useCallback((flagPath: string, value: boolean) => {
    setFeatureFlag(flagPath, value);
    // State will update via event listener
  }, []);

  const clearOverrides = useCallback(() => {
    clearStorageFlags();
    setFlags(getFeatureFlags());
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('featureFlagsChanged'));
  }, []);

  const reload = useCallback(() => {
    setFlags(getFeatureFlags());
  }, []);

  const value: FeatureFlagsContextValue = {
    flags,
    isEnabled,
    setFlag,
    clearOverrides,
    reload,
  };

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

/**
 * Hook to access feature flags context
 * Must be used within a FeatureFlagsProvider
 *
 * @throws Error if used outside of FeatureFlagsProvider
 */
export function useFeatureFlagsContext(): FeatureFlagsContextValue {
  const context = useContext(FeatureFlagsContext);

  if (context === undefined) {
    throw new Error('useFeatureFlagsContext must be used within a FeatureFlagsProvider');
  }

  return context;
}

/**
 * HOC to wrap a component with feature flag check
 * Component will only render if the specified flag is enabled
 *
 * @param Component - Component to wrap
 * @param flagPath - Feature flag path to check
 * @param fallback - Optional fallback to render when disabled
 *
 * @example
 * ```typescript
 * const CustomCategoryManager = withFeatureFlag(
 *   CustomCategoryManagerImpl,
 *   'customCategories.enabled',
 *   <div>Custom categories are not available</div>
 * );
 * ```
 */
export function withFeatureFlag<P extends object>(
  Component: React.ComponentType<P>,
  flagPath: string,
  fallback?: ReactNode
) {
  return function FeatureFlaggedComponent(props: P) {
    const { isEnabled } = useFeatureFlagsContext();

    if (!isEnabled(flagPath)) {
      return fallback || null;
    }

    return <Component {...props} />;
  };
}

/**
 * Component that conditionally renders children based on a feature flag
 *
 * @example
 * ```typescript
 * <FeatureGate flag="customCategories.enabled">
 *   <CustomCategoryManager />
 * </FeatureGate>
 *
 * <FeatureGate
 *   flag="customCategories.colors"
 *   fallback={<div>Color picker not available</div>}
 * >
 *   <ColorPicker />
 * </FeatureGate>
 * ```
 */
export function FeatureGate({
  flag,
  children,
  fallback = null,
}: {
  flag: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isEnabled } = useFeatureFlagsContext();

  if (!isEnabled(flag)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
