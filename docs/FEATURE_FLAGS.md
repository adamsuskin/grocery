# Feature Flags System

A comprehensive feature flag system for gradual rollout, A/B testing, and feature management in the Grocery List application.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Usage](#usage)
- [Admin Panel](#admin-panel)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

## Overview

The feature flag system allows you to:

- **Gradual Rollout**: Enable features for a subset of users before full deployment
- **Quick Rollback**: Disable problematic features instantly without redeploying
- **A/B Testing**: Test different features with different user groups
- **Development**: Test incomplete features in production without exposing them to users
- **Conditional Features**: Enable/disable features based on environment, user role, or other criteria

### Available Feature Flags

#### Custom Categories
- `customCategories.enabled` - Main toggle for custom categories feature
- `customCategories.colors` - Enable color picker for categories
- `customCategories.icons` - Enable icon/emoji picker for categories
- `customCategories.importExport` - Enable import/export functionality
- `customCategories.suggestions` - Enable smart category suggestions
- `customCategories.bulkOperations` - Enable bulk operations (merge, delete multiple)
- `customCategories.analytics` - Enable category analytics and statistics
- `customCategories.backup` - Enable category backup and restore
- `customCategories.recommendations` - Enable category recommendations
- `customCategories.activityLog` - Enable activity logging

#### Other Features
- `notifications.enabled` - Main notification toggle
- `notifications.pushNotifications` - Browser push notifications
- `offlineMode.enabled` - Offline functionality
- `offlineMode.backgroundSync` - Background synchronization
- `collaboration.enabled` - Collaborative features
- `collaboration.realTimeSync` - Real-time sync for shared lists

## Architecture

The feature flag system consists of three layers:

1. **Configuration Layer** (`src/utils/featureFlags.ts`)
   - Loads flags from environment variables
   - Supports localStorage overrides
   - Provides utility functions

2. **React Integration** (`src/hooks/useFeatureFlags.ts`, `src/contexts/FeatureFlagsContext.tsx`)
   - React hooks for accessing flags
   - Context provider for global state
   - Components for conditional rendering

3. **Admin Interface** (`src/components/FeatureFlagsAdmin.tsx`)
   - UI for managing flags at runtime
   - Import/export configurations
   - Visual flag status dashboard

### Priority Order

Feature flags are resolved in the following priority order (highest to lowest):

1. **localStorage overrides** - Set via admin panel or programmatically
2. **Environment variables** - Set in `.env` files
3. **Default values** - Hardcoded in `featureFlags.ts`

## Quick Start

### 1. Add Feature Flags to Your App

Wrap your app with the `FeatureFlagsProvider`:

```typescript
// src/main.tsx
import { FeatureFlagsProvider } from './contexts/FeatureFlagsContext';
import { initializeFeatureFlags } from './utils/featureFlags';

// Initialize on app start
initializeFeatureFlags();

function App() {
  return (
    <FeatureFlagsProvider>
      <YourApp />
    </FeatureFlagsProvider>
  );
}
```

### 2. Use Feature Flags in Components

```typescript
import { useFeatureFlags } from '../hooks/useFeatureFlags';

function MyComponent() {
  const flags = useFeatureFlags();

  if (!flags.customCategories.enabled) {
    return null;
  }

  return (
    <div>
      {flags.customCategories.colors && <ColorPicker />}
      {flags.customCategories.icons && <EmojiPicker />}
    </div>
  );
}
```

### 3. Access Admin Panel

Add the admin panel to your app (restrict access in production):

```typescript
import { FeatureFlagsAdmin } from '../components/FeatureFlagsAdmin';

function Settings() {
  const [showAdmin, setShowAdmin] = useState(false);

  return (
    <div>
      <button onClick={() => setShowAdmin(true)}>
        Feature Flags
      </button>

      {showAdmin && (
        <FeatureFlagsAdmin onClose={() => setShowAdmin(false)} />
      )}
    </div>
  );
}
```

## Configuration

### Environment Variables

Set feature flags in your `.env` file:

```bash
# Enable custom categories
VITE_FEATURE_CUSTOM_CATEGORIES_ENABLED=true

# Enable sub-features
VITE_FEATURE_CUSTOM_CATEGORIES_COLORS=true
VITE_FEATURE_CUSTOM_CATEGORIES_ICONS=true
VITE_FEATURE_CUSTOM_CATEGORIES_BULK_OPS=false

# Other features
VITE_FEATURE_NOTIFICATIONS_ENABLED=true
VITE_FEATURE_OFFLINE_MODE_ENABLED=true
```

### Environment-Specific Configuration

#### Development (`.env.development`)
```bash
# All features enabled for testing
VITE_FEATURE_CUSTOM_CATEGORIES_ENABLED=true
VITE_FEATURE_CUSTOM_CATEGORIES_COLORS=true
VITE_FEATURE_CUSTOM_CATEGORIES_ICONS=true
VITE_FEATURE_CUSTOM_CATEGORIES_BULK_OPS=true
```

#### Production (`.env.production`)
```bash
# Gradual rollout - some features disabled
VITE_FEATURE_CUSTOM_CATEGORIES_ENABLED=true
VITE_FEATURE_CUSTOM_CATEGORIES_COLORS=true
VITE_FEATURE_CUSTOM_CATEGORIES_ICONS=true
VITE_FEATURE_CUSTOM_CATEGORIES_BULK_OPS=false  # Not ready for production
```

### Runtime Configuration

Use localStorage to override flags at runtime (via admin panel or programmatically):

```typescript
import { setFeatureFlag } from '../utils/featureFlags';

// Enable a feature
setFeatureFlag('customCategories.bulkOperations', true);

// Disable a feature
setFeatureFlag('customCategories.colors', false);
```

## Usage

### Method 1: useFeatureFlags Hook

Best for components that check multiple flags:

```typescript
import { useFeatureFlags } from '../hooks/useFeatureFlags';

function CategoryManager() {
  const flags = useFeatureFlags();

  if (!flags.customCategories.enabled) {
    return null;
  }

  return (
    <div>
      {flags.customCategories.colors && <ColorPicker />}
      {flags.customCategories.icons && <EmojiPicker />}
      {flags.customCategories.bulkOperations && <BulkActions />}
    </div>
  );
}
```

### Method 2: useFeatureFlag Hook

Best for checking a single flag (more efficient):

```typescript
import { useFeatureFlag } from '../hooks/useFeatureFlags';

function ColorPicker() {
  const enabled = useFeatureFlag('customCategories.colors');

  if (!enabled) {
    return null;
  }

  return <div>Color picker UI</div>;
}
```

### Method 3: FeatureGate Component

Best for declarative conditional rendering:

```typescript
import { FeatureGate } from '../contexts/FeatureFlagsContext';

function CategoryForm() {
  return (
    <form>
      <input type="text" placeholder="Category name" />

      <FeatureGate flag="customCategories.colors">
        <ColorPicker />
      </FeatureGate>

      <FeatureGate
        flag="customCategories.icons"
        fallback={<p>Icon picker coming soon</p>}
      >
        <EmojiPicker />
      </FeatureGate>
    </form>
  );
}
```

### Method 4: withFeatureFlag HOC

Best for wrapping entire components:

```typescript
import { withFeatureFlag } from '../contexts/FeatureFlagsContext';

function ColorPickerImpl() {
  return <div>Color picker</div>;
}

export const ColorPicker = withFeatureFlag(
  ColorPickerImpl,
  'customCategories.colors',
  <div>Color picker not available</div>
);
```

### Method 5: Direct Utility

Best for non-React code:

```typescript
import { isFeatureEnabled } from '../utils/featureFlags';

function performBulkOperation() {
  if (!isFeatureEnabled('customCategories.bulkOperations')) {
    throw new Error('Bulk operations are not enabled');
  }

  // Perform operation
}
```

## Admin Panel

The admin panel provides a UI for managing feature flags at runtime.

### Features

- **View all flags** with descriptions and current status
- **Toggle flags** on/off with a switch
- **Search and filter** by name, description, or group
- **Export configuration** to JSON file
- **Import configuration** from JSON file
- **Reset all flags** to default values
- **Real-time updates** across all components

### Access Control

⚠️ **Important**: Restrict access to the admin panel in production!

```typescript
import { FeatureFlagsAdmin } from '../components/FeatureFlagsAdmin';

function Settings() {
  const { user } = useAuth();
  const [showAdmin, setShowAdmin] = useState(false);

  // Only allow admins to access feature flags
  const canAccessFeatureFlags = user?.role === 'admin' || user?.role === 'owner';

  if (!canAccessFeatureFlags) {
    return null;
  }

  return (
    <div>
      <button onClick={() => setShowAdmin(true)}>
        Feature Flags Admin
      </button>

      {showAdmin && (
        <FeatureFlagsAdmin onClose={() => setShowAdmin(false)} />
      )}
    </div>
  );
}
```

### Export/Import Configurations

Export current configuration:

```typescript
// Via admin panel: Click "Export" button
// Or programmatically:
import { getFeatureFlags } from '../utils/featureFlags';

const config = getFeatureFlags();
const json = JSON.stringify(config, null, 2);
// Save to file or send to server
```

Import configuration:

```typescript
// Via admin panel: Click "Import" button and select JSON file
// Or programmatically:
import { setFeatureFlag } from '../utils/featureFlags';

const config = {
  'customCategories.enabled': true,
  'customCategories.colors': false,
  // ... more flags
};

Object.entries(config).forEach(([key, value]) => {
  setFeatureFlag(key, value);
});
```

## Best Practices

### 1. Feature Flag Naming

Use descriptive, hierarchical names:

```typescript
// Good
customCategories.enabled
customCategories.bulkOperations
customCategories.analytics

// Bad
customCatsEnabled
bulkOps
analytics
```

### 2. Parent-Child Relationships

Always check parent flags before child flags:

```typescript
// Good
if (flags.customCategories.enabled) {
  if (flags.customCategories.colors) {
    // Show color picker
  }
}

// Or use logical AND
if (flags.customCategories.enabled && flags.customCategories.colors) {
  // Show color picker
}

// Bad - checking child without parent
if (flags.customCategories.colors) {
  // Might show color picker even if custom categories are disabled
}
```

### 3. Graceful Degradation

Provide fallbacks when features are disabled:

```typescript
<FeatureGate
  flag="customCategories.colors"
  fallback={<DefaultColorPicker />}
>
  <AdvancedColorPicker />
</FeatureGate>
```

### 4. Performance

Use specific hooks when possible:

```typescript
// Good - only subscribes to specific flag changes
const enabled = useFeatureFlag('customCategories.colors');

// Less efficient - subscribes to all flag changes
const flags = useFeatureFlags();
const enabled = flags.customCategories.colors;
```

### 5. Testing

Test both enabled and disabled states:

```typescript
import { FeatureFlagsProvider } from '../contexts/FeatureFlagsContext';

describe('CategoryManager', () => {
  it('renders when feature is enabled', () => {
    render(
      <FeatureFlagsProvider
        initialFlags={{
          customCategories: { enabled: true, colors: true }
        }}
      >
        <CategoryManager />
      </FeatureFlagsProvider>
    );

    expect(screen.getByText('Category Manager')).toBeInTheDocument();
  });

  it('does not render when feature is disabled', () => {
    render(
      <FeatureFlagsProvider
        initialFlags={{
          customCategories: { enabled: false }
        }}
      >
        <CategoryManager />
      </FeatureFlagsProvider>
    );

    expect(screen.queryByText('Category Manager')).not.toBeInTheDocument();
  });
});
```

### 6. Cleanup

Remove feature flags once features are stable:

1. Set flag to `true` in all environments
2. Wait for one release cycle
3. Remove flag checks from code
4. Remove flag from configuration

### 7. Documentation

Document why flags exist and when they should be removed:

```typescript
// TODO: Remove this flag after Q2 2025 when bulk operations are stable
if (flags.customCategories.bulkOperations) {
  // Bulk operations code
}
```

## API Reference

### Utilities

#### `getFeatureFlags()`

Returns all feature flags with current values.

```typescript
const flags: FeatureFlags = getFeatureFlags();
```

#### `isFeatureEnabled(flagPath: string)`

Checks if a specific feature flag is enabled.

```typescript
const enabled: boolean = isFeatureEnabled('customCategories.colors');
```

#### `setFeatureFlag(flagPath: string, value: boolean)`

Updates a feature flag at runtime (saves to localStorage).

```typescript
setFeatureFlag('customCategories.colors', true);
```

#### `clearStorageFlags()`

Removes all localStorage overrides, reverting to environment/default values.

```typescript
clearStorageFlags();
```

#### `initializeFeatureFlags()`

Initializes the feature flag system and logs current configuration.

```typescript
initializeFeatureFlags();
```

### React Hooks

#### `useFeatureFlags()`

Returns all feature flags. Updates when flags change.

```typescript
const flags: FeatureFlags = useFeatureFlags();
```

#### `useFeatureFlag(flagPath: string)`

Returns whether a specific flag is enabled. More efficient than `useFeatureFlags()`.

```typescript
const enabled: boolean = useFeatureFlag('customCategories.colors');
```

#### `useCustomCategoriesFlags()`

Convenience hook for custom categories flags.

```typescript
const categoryFlags = useCustomCategoriesFlags();
```

#### `useFeatureFlagsContext()`

Returns feature flags context with additional utilities.

```typescript
const { flags, isEnabled, setFlag, clearOverrides, reload } = useFeatureFlagsContext();
```

### React Components

#### `<FeatureGate>`

Conditionally renders children based on a feature flag.

```typescript
<FeatureGate
  flag="customCategories.colors"
  fallback={<div>Not available</div>}
>
  <ColorPicker />
</FeatureGate>
```

#### `withFeatureFlag(Component, flagPath, fallback?)`

Higher-order component that wraps a component with a feature flag check.

```typescript
const FeatureFlaggedComponent = withFeatureFlag(
  MyComponent,
  'customCategories.enabled',
  <div>Not available</div>
);
```

## Troubleshooting

### Flags not updating

1. Check that `FeatureFlagsProvider` wraps your app
2. Verify environment variables are prefixed with `VITE_`
3. Restart dev server after changing `.env` files
4. Check browser console for feature flag logs

### localStorage overrides persist

Clear localStorage overrides:

```typescript
import { clearStorageFlags } from '../utils/featureFlags';

clearStorageFlags();
```

Or via admin panel: Click "Reset All" button.

### Feature flag not found

Ensure the flag is defined in `src/utils/featureFlags.ts`:

```typescript
export interface FeatureFlags {
  customCategories: {
    myNewFlag: boolean;  // Add new flag here
  };
}
```

## Examples

See `/home/adam/grocery/src/examples/FeatureFlagsUsageExample.tsx` for comprehensive usage examples.

## Support

For questions or issues, please:

1. Check this documentation
2. Review the example file
3. Check the browser console for logs
4. Use the admin panel to debug flag values
