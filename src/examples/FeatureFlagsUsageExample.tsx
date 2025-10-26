/**
 * Feature Flags Usage Examples
 *
 * This file demonstrates various ways to use the feature flag system
 * in your React components.
 */

import React from 'react';
import { useFeatureFlags, useFeatureFlag, useCustomCategoriesFlags } from '../hooks/useFeatureFlags';
import { useFeatureFlagsContext, FeatureGate, withFeatureFlag } from '../contexts/FeatureFlagsContext';
import { isFeatureEnabled } from '../utils/featureFlags';

/**
 * Example 1: Using useFeatureFlags hook
 * Best for: Components that need to check multiple flags
 */
export function Example1_UseFeatureFlags() {
  const flags = useFeatureFlags();

  return (
    <div>
      <h2>All Feature Flags</h2>
      <ul>
        <li>Custom Categories: {flags.customCategories.enabled ? 'ON' : 'OFF'}</li>
        <li>Colors: {flags.customCategories.colors ? 'ON' : 'OFF'}</li>
        <li>Icons: {flags.customCategories.icons ? 'ON' : 'OFF'}</li>
        <li>Bulk Ops: {flags.customCategories.bulkOperations ? 'ON' : 'OFF'}</li>
      </ul>
    </div>
  );
}

/**
 * Example 2: Using useFeatureFlag hook for a single flag
 * Best for: Components that only need to check one specific flag
 * More efficient than useFeatureFlags() when only checking one flag
 */
export function Example2_UseFeatureFlag() {
  const colorsEnabled = useFeatureFlag('customCategories.colors');

  if (!colorsEnabled) {
    return <p>Color picker is not available</p>;
  }

  return (
    <div>
      <h2>Color Picker</h2>
      <p>Color picker is enabled!</p>
      {/* <ColorPicker /> would go here */}
    </div>
  );
}

/**
 * Example 3: Using useCustomCategoriesFlags convenience hook
 * Best for: Components working specifically with custom categories
 */
export function Example3_UseCustomCategoriesFlags() {
  const categoryFlags = useCustomCategoriesFlags();

  if (!categoryFlags.enabled) {
    return null; // Hide entire component if feature disabled
  }

  return (
    <div>
      <h2>Custom Categories Manager</h2>
      {categoryFlags.colors && <button>Pick Color</button>}
      {categoryFlags.icons && <button>Pick Icon</button>}
      {categoryFlags.bulkOperations && <button>Bulk Actions</button>}
      {categoryFlags.importExport && <button>Import/Export</button>}
    </div>
  );
}

/**
 * Example 4: Using FeatureFlagsContext
 * Best for: Components that need to toggle flags or perform actions
 */
export function Example4_UseContext() {
  const { flags, isEnabled, setFlag } = useFeatureFlagsContext();

  const handleToggleColors = () => {
    setFlag('customCategories.colors', !flags.customCategories.colors);
  };

  return (
    <div>
      <h2>Feature Flag Controls</h2>
      <button onClick={handleToggleColors}>
        Toggle Colors: {isEnabled('customCategories.colors') ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}

/**
 * Example 5: Using FeatureGate component
 * Best for: Declarative conditional rendering in JSX
 */
export function Example5_FeatureGate() {
  return (
    <div>
      <h2>Feature Gates</h2>

      {/* Show component only if flag is enabled */}
      <FeatureGate flag="customCategories.colors">
        <div className="color-picker-section">
          <p>Color picker is available!</p>
          {/* <ColorPicker /> */}
        </div>
      </FeatureGate>

      {/* Show fallback if flag is disabled */}
      <FeatureGate
        flag="customCategories.icons"
        fallback={<p>Icon picker coming soon...</p>}
      >
        <div className="icon-picker-section">
          <p>Icon picker is available!</p>
          {/* <EmojiPicker /> */}
        </div>
      </FeatureGate>

      {/* Nested gates for multiple conditions */}
      <FeatureGate flag="customCategories.enabled">
        <FeatureGate flag="customCategories.bulkOperations">
          <button>Bulk Delete</button>
        </FeatureGate>
      </FeatureGate>
    </div>
  );
}

/**
 * Example 6: Using withFeatureFlag HOC
 * Best for: Wrapping entire components with feature flag checks
 */
function ColorPickerImpl() {
  return <div>Color Picker Component</div>;
}

// Wrap the component with feature flag check
export const Example6_WithFeatureFlag = withFeatureFlag(
  ColorPickerImpl,
  'customCategories.colors',
  <div>Color picker is not available</div>
);

/**
 * Example 7: Using isFeatureEnabled utility directly
 * Best for: Non-React code, utilities, or when hooks can't be used
 */
export function Example7_DirectUtility() {
  // This can be used outside of React components
  const performAction = () => {
    if (isFeatureEnabled('customCategories.bulkOperations')) {
      console.log('Performing bulk operation...');
      // Bulk operation logic
    } else {
      console.log('Bulk operations not available');
    }
  };

  return (
    <div>
      <h2>Direct Utility Usage</h2>
      <button onClick={performAction}>Perform Action</button>
    </div>
  );
}

/**
 * Example 8: Conditional rendering with early return
 * Best for: Components that should not render at all if feature is disabled
 */
export function Example8_EarlyReturn() {
  const categoryFlags = useCustomCategoriesFlags();

  // Early return if feature is disabled
  if (!categoryFlags.enabled) {
    return null;
  }

  return (
    <div>
      <h2>Custom Categories</h2>
      <p>This component only renders if custom categories are enabled</p>
    </div>
  );
}

/**
 * Example 9: Complex feature flag logic
 * Best for: Components with multiple interdependent flags
 */
export function Example9_ComplexLogic() {
  const flags = useFeatureFlags();

  const canShowAdvancedFeatures =
    flags.customCategories.enabled &&
    flags.customCategories.bulkOperations &&
    flags.customCategories.analytics;

  const canShowColorAndIcon =
    flags.customCategories.enabled &&
    (flags.customCategories.colors || flags.customCategories.icons);

  return (
    <div>
      <h2>Advanced Category Manager</h2>

      {canShowColorAndIcon && (
        <div>
          <h3>Appearance Options</h3>
          {flags.customCategories.colors && <button>Choose Color</button>}
          {flags.customCategories.icons && <button>Choose Icon</button>}
        </div>
      )}

      {canShowAdvancedFeatures && (
        <div>
          <h3>Advanced Features</h3>
          <button>Bulk Operations</button>
          <button>View Analytics</button>
        </div>
      )}
    </div>
  );
}

/**
 * Example 10: Feature flag debugging
 * Best for: Development and debugging
 */
export function Example10_Debugging() {
  const flags = useFeatureFlags();

  return (
    <div>
      <h2>Feature Flags Debug Panel</h2>
      <pre>{JSON.stringify(flags, null, 2)}</pre>
    </div>
  );
}

/**
 * Complete App Example with FeatureFlagsProvider
 */
export function AppExample() {
  return (
    <div>
      <h1>Feature Flags Examples</h1>
      <Example1_UseFeatureFlags />
      <Example2_UseFeatureFlag />
      <Example3_UseCustomCategoriesFlags />
      <Example4_UseContext />
      <Example5_FeatureGate />
      <Example6_WithFeatureFlag />
      <Example7_DirectUtility />
      <Example8_EarlyReturn />
      <Example9_ComplexLogic />
      <Example10_Debugging />
    </div>
  );
}
