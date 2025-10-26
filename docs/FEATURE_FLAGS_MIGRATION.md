# Feature Flags Migration Guide

This guide shows how to integrate feature flags into existing components and features.

## Table of Contents

- [Before You Start](#before-you-start)
- [Step-by-Step Migration](#step-by-step-migration)
- [Common Patterns](#common-patterns)
- [Examples](#examples)
- [Testing](#testing)

## Before You Start

### Prerequisites

1. Feature flag system is installed and configured
2. `FeatureFlagsProvider` wraps your app in `main.tsx`
3. Environment variables are set in `.env` files

### Planning

Before adding feature flags:

1. **Identify the scope**: What exactly needs to be flagged?
   - Entire feature
   - Specific sub-features
   - UI elements only
   - Backend functionality

2. **Choose flag granularity**: How many flags do you need?
   - Single toggle for entire feature
   - Multiple flags for different aspects
   - Hierarchical flags (parent/child)

3. **Define rollout strategy**: How will you enable the feature?
   - All users at once
   - Gradual percentage rollout
   - Specific user groups
   - Environment-based (dev, staging, prod)

## Step-by-Step Migration

### Step 1: Define Your Feature Flags

Add your flags to `src/utils/featureFlags.ts`:

```typescript
export interface FeatureFlags {
  // ... existing flags ...

  myNewFeature: {
    enabled: boolean;
    advancedMode: boolean;
    analytics: boolean;
  };
}

const DEFAULT_FLAGS: FeatureFlags = {
  // ... existing defaults ...

  myNewFeature: {
    enabled: isDevelopment ? true : false,
    advancedMode: isDevelopment ? true : false,
    analytics: isDevelopment ? true : false,
  },
};
```

### Step 2: Add Environment Variables

Add corresponding environment variables to `.env.example`:

```bash
# My New Feature Flags
VITE_FEATURE_MY_NEW_FEATURE_ENABLED=true
VITE_FEATURE_MY_NEW_FEATURE_ADVANCED_MODE=false
VITE_FEATURE_MY_NEW_FEATURE_ANALYTICS=false
```

### Step 3: Load Environment Variables

Update the `loadFlagsFromEnvironment()` function in `src/utils/featureFlags.ts`:

```typescript
function loadFlagsFromEnvironment(): FeatureFlags {
  return {
    // ... existing flags ...

    myNewFeature: {
      enabled: parseEnvBoolean(
        import.meta.env.VITE_FEATURE_MY_NEW_FEATURE_ENABLED,
        DEFAULT_FLAGS.myNewFeature.enabled
      ),
      advancedMode: parseEnvBoolean(
        import.meta.env.VITE_FEATURE_MY_NEW_FEATURE_ADVANCED_MODE,
        DEFAULT_FLAGS.myNewFeature.advancedMode
      ),
      analytics: parseEnvBoolean(
        import.meta.env.VITE_FEATURE_MY_NEW_FEATURE_ANALYTICS,
        DEFAULT_FLAGS.myNewFeature.analytics
      ),
    },
  };
}
```

### Step 4: Add Metadata for Admin Panel

Update `getFeatureFlagsWithMetadata()` in `src/utils/featureFlags.ts`:

```typescript
export function getFeatureFlagsWithMetadata(): FeatureFlagMetadata[] {
  const flags = getFeatureFlags();

  return [
    // ... existing metadata ...

    {
      key: 'myNewFeature.enabled',
      label: 'My New Feature',
      description: 'Main toggle for my new feature',
      group: 'My New Feature',
      enabled: flags.myNewFeature.enabled,
    },
    {
      key: 'myNewFeature.advancedMode',
      label: 'Advanced Mode',
      description: 'Enable advanced mode for power users',
      group: 'My New Feature',
      enabled: flags.myNewFeature.advancedMode,
      parentFlag: 'myNewFeature.enabled',
    },
    {
      key: 'myNewFeature.analytics',
      label: 'Analytics',
      description: 'Track usage analytics for this feature',
      group: 'My New Feature',
      enabled: flags.myNewFeature.analytics,
      parentFlag: 'myNewFeature.enabled',
    },
  ];
}
```

### Step 5: Integrate into Components

Choose the appropriate pattern based on your needs:

#### Option A: Wrap Existing Component

Create a new wrapper component:

```typescript
// MyFeatureWithFlags.tsx
import { MyFeature } from './MyFeature';
import { useFeatureFlag } from '../hooks/useFeatureFlags';

export function MyFeatureWithFlags(props) {
  const enabled = useFeatureFlag('myNewFeature.enabled');

  if (!enabled) {
    return null;
  }

  return <MyFeature {...props} />;
}
```

Update imports:

```typescript
// Before
import { MyFeature } from './components/MyFeature';

// After
import { MyFeature } from './components/MyFeatureWithFlags';
```

#### Option B: Add Flags Inside Component

Modify the existing component:

```typescript
// MyFeature.tsx
import { useFeatureFlags } from '../hooks/useFeatureFlags';

export function MyFeature() {
  const flags = useFeatureFlags();

  // Early return if feature disabled
  if (!flags.myNewFeature.enabled) {
    return null;
  }

  return (
    <div>
      <h2>My Feature</h2>

      {/* Conditional sub-features */}
      {flags.myNewFeature.advancedMode && (
        <AdvancedSettings />
      )}

      {flags.myNewFeature.analytics && (
        <AnalyticsTracker />
      )}
    </div>
  );
}
```

#### Option C: Use FeatureGate Component

For declarative rendering:

```typescript
import { FeatureGate } from '../contexts/FeatureFlagsContext';

export function MyPage() {
  return (
    <div>
      <h1>My Page</h1>

      <FeatureGate flag="myNewFeature.enabled">
        <MyFeature />
      </FeatureGate>

      <FeatureGate
        flag="myNewFeature.advancedMode"
        fallback={<BasicMode />}
      >
        <AdvancedMode />
      </FeatureGate>
    </div>
  );
}
```

### Step 6: Update Tests

Add tests for both enabled and disabled states:

```typescript
import { render, screen } from '@testing-library/react';
import { FeatureFlagsProvider } from '../contexts/FeatureFlagsContext';
import { MyFeature } from './MyFeature';

describe('MyFeature', () => {
  it('renders when feature is enabled', () => {
    render(
      <FeatureFlagsProvider
        initialFlags={{
          myNewFeature: { enabled: true, advancedMode: false, analytics: false }
        }}
      >
        <MyFeature />
      </FeatureFlagsProvider>
    );

    expect(screen.getByText('My Feature')).toBeInTheDocument();
  });

  it('does not render when feature is disabled', () => {
    render(
      <FeatureFlagsProvider
        initialFlags={{
          myNewFeature: { enabled: false, advancedMode: false, analytics: false }
        }}
      >
        <MyFeature />
      </FeatureFlagsProvider>
    );

    expect(screen.queryByText('My Feature')).not.toBeInTheDocument();
  });

  it('shows advanced mode when enabled', () => {
    render(
      <FeatureFlagsProvider
        initialFlags={{
          myNewFeature: { enabled: true, advancedMode: true, analytics: false }
        }}
      >
        <MyFeature />
      </FeatureFlagsProvider>
    );

    expect(screen.getByText('Advanced Settings')).toBeInTheDocument();
  });
});
```

### Step 7: Deploy and Test

1. **Development**: Test with flags enabled
2. **Staging**: Test with production-like flag configuration
3. **Production**: Deploy with flags disabled or partially enabled
4. **Monitor**: Watch for errors and user feedback
5. **Rollout**: Gradually enable flags for more users
6. **Cleanup**: Remove flags once feature is stable

## Common Patterns

### Pattern 1: Entire Feature Toggle

Use when you want to hide/show an entire feature:

```typescript
// In parent component or router
import { useFeatureFlag } from '../hooks/useFeatureFlags';

function AppRoutes() {
  const myFeatureEnabled = useFeatureFlag('myNewFeature.enabled');

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {myFeatureEnabled && (
        <Route path="/my-feature" element={<MyFeature />} />
      )}
    </Routes>
  );
}
```

### Pattern 2: Progressive Enhancement

Use when you want to add features on top of existing functionality:

```typescript
function UserProfile() {
  const flags = useFeatureFlags();

  return (
    <div>
      {/* Base functionality - always shown */}
      <BasicProfile />

      {/* Enhanced functionality - conditionally shown */}
      {flags.myNewFeature.advancedMode && (
        <AdvancedProfile />
      )}
    </div>
  );
}
```

### Pattern 3: A/B Testing

Use when testing different implementations:

```typescript
function SearchBox() {
  const useNewSearch = useFeatureFlag('search.newAlgorithm');

  return useNewSearch ? <NewSearchBox /> : <OldSearchBox />;
}
```

### Pattern 4: Backend Feature Flags

Use for API calls or backend functionality:

```typescript
import { isFeatureEnabled } from '../utils/featureFlags';

async function saveData(data) {
  const useNewAPI = isFeatureEnabled('api.newEndpoint');

  const endpoint = useNewAPI
    ? '/api/v2/data'
    : '/api/v1/data';

  return fetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
```

### Pattern 5: Gradual UI Updates

Use when updating UI incrementally:

```typescript
function Header() {
  const flags = useFeatureFlags();

  return (
    <header className={flags.ui.newDesign ? 'header-v2' : 'header-v1'}>
      <Logo />
      <Nav />

      {flags.ui.newActions && <NewActionButtons />}
      {!flags.ui.newActions && <OldActionButtons />}
    </header>
  );
}
```

## Examples

### Example 1: Migrating Custom Categories

**Before:**
```typescript
// CustomCategoryManager.tsx
export function CustomCategoryManager({ listId, onClose }) {
  const categories = useCustomCategories(listId);

  return (
    <div>
      <ColorPicker />
      <EmojiPicker />
      <CategoryList categories={categories} />
    </div>
  );
}
```

**After:**
```typescript
// CustomCategoryManager.tsx
import { useCustomCategoriesFlags } from '../hooks/useFeatureFlags';

export function CustomCategoryManager({ listId, onClose }) {
  const categoryFlags = useCustomCategoriesFlags();
  const categories = useCustomCategories(listId);

  // Early return if feature disabled
  if (!categoryFlags.enabled) {
    return null;
  }

  return (
    <div>
      {categoryFlags.colors && <ColorPicker />}
      {categoryFlags.icons && <EmojiPicker />}
      <CategoryList categories={categories} />
      {categoryFlags.bulkOperations && <BulkActions />}
    </div>
  );
}
```

### Example 2: Migrating a Settings Page

**Before:**
```typescript
function Settings() {
  return (
    <div>
      <h1>Settings</h1>
      <AccountSettings />
      <NotificationSettings />
      <PrivacySettings />
      <BetaFeatures />  {/* New experimental section */}
    </div>
  );
}
```

**After:**
```typescript
import { FeatureGate } from '../contexts/FeatureFlagsContext';

function Settings() {
  return (
    <div>
      <h1>Settings</h1>
      <AccountSettings />
      <NotificationSettings />
      <PrivacySettings />

      <FeatureGate
        flag="settings.betaFeatures"
        fallback={<div>Beta features coming soon!</div>}
      >
        <BetaFeatures />
      </FeatureGate>
    </div>
  );
}
```

### Example 3: Migrating an API Call

**Before:**
```typescript
async function fetchCategories(listId: string) {
  const response = await fetch(`/api/categories/${listId}`);
  return response.json();
}
```

**After:**
```typescript
import { isFeatureEnabled } from '../utils/featureFlags';

async function fetchCategories(listId: string) {
  // Use new GraphQL API if flag is enabled
  if (isFeatureEnabled('api.useGraphQL')) {
    const response = await fetch('/graphql', {
      method: 'POST',
      body: JSON.stringify({
        query: `query { categories(listId: "${listId}") { id name } }`
      }),
    });
    const data = await response.json();
    return data.data.categories;
  }

  // Fall back to REST API
  const response = await fetch(`/api/categories/${listId}`);
  return response.json();
}
```

## Testing

### Unit Tests

```typescript
import { render } from '@testing-library/react';
import { FeatureFlagsProvider } from '../contexts/FeatureFlagsContext';

describe('MyComponent with feature flags', () => {
  const renderWithFlags = (flags) => {
    return render(
      <FeatureFlagsProvider initialFlags={flags}>
        <MyComponent />
      </FeatureFlagsProvider>
    );
  };

  it('renders when enabled', () => {
    const { container } = renderWithFlags({
      myNewFeature: { enabled: true }
    });
    expect(container).not.toBeEmptyDOMElement();
  });

  it('does not render when disabled', () => {
    const { container } = renderWithFlags({
      myNewFeature: { enabled: false }
    });
    expect(container).toBeEmptyDOMElement();
  });
});
```

### Integration Tests

```typescript
import { setFeatureFlag, clearStorageFlags } from '../utils/featureFlags';

describe('Feature flag integration', () => {
  afterEach(() => {
    clearStorageFlags();
  });

  it('respects runtime flag changes', () => {
    const { rerender } = render(<MyComponent />);

    // Initially disabled
    expect(screen.queryByText('Feature')).not.toBeInTheDocument();

    // Enable flag
    setFeatureFlag('myNewFeature.enabled', true);
    rerender(<MyComponent />);

    // Now visible
    expect(screen.getByText('Feature')).toBeInTheDocument();
  });
});
```

### E2E Tests

```typescript
// Using Playwright or Cypress
test('feature flag controls visibility', async ({ page }) => {
  // Set flag via localStorage before loading page
  await page.addInitScript(() => {
    localStorage.setItem('grocery_feature_flags', JSON.stringify({
      myNewFeature: { enabled: true }
    }));
  });

  await page.goto('/');

  // Feature should be visible
  await expect(page.locator('[data-testid="my-feature"]')).toBeVisible();
});
```

## Rollout Strategy

### Phase 1: Development (Week 1)
- All flags enabled
- Test all functionality
- Fix bugs

### Phase 2: Internal Testing (Week 2)
- Deploy to staging with flags enabled
- Team testing
- Gather feedback

### Phase 3: Soft Launch (Week 3-4)
- Deploy to production with flags disabled
- Enable for 5% of users via admin panel
- Monitor metrics and errors

### Phase 4: Gradual Rollout (Week 5-8)
- Increase to 25% of users
- Then 50%
- Then 75%
- Monitor each step

### Phase 5: Full Release (Week 9)
- Enable for 100% of users
- Keep flag for 1 more release cycle
- Remove flag in next version

### Phase 6: Cleanup (Week 10+)
- Remove flag checks from code
- Remove environment variables
- Update documentation

## Troubleshooting

### Issue: Flag changes don't take effect

**Solution**: Make sure you're using hooks or context, not direct imports:

```typescript
// Wrong - won't update
import { getFeatureFlags } from '../utils/featureFlags';
const flags = getFeatureFlags();  // Static value

// Right - updates reactively
import { useFeatureFlags } from '../hooks/useFeatureFlags';
const flags = useFeatureFlags();  // Reactive value
```

### Issue: Tests fail with feature flags

**Solution**: Wrap tests in FeatureFlagsProvider:

```typescript
const renderWithFlags = (component, flags = {}) => {
  return render(
    <FeatureFlagsProvider initialFlags={flags}>
      {component}
    </FeatureFlagsProvider>
  );
};
```

### Issue: Flag not found in admin panel

**Solution**: Make sure you added metadata:

```typescript
// Add to getFeatureFlagsWithMetadata()
{
  key: 'myNewFeature.enabled',
  label: 'My New Feature',
  description: 'Description',
  group: 'Features',
  enabled: flags.myNewFeature.enabled,
}
```

## Next Steps

1. Identify features to flag
2. Follow the step-by-step migration
3. Test thoroughly in development
4. Deploy with flags disabled
5. Gradually enable for users
6. Monitor and iterate
7. Clean up flags when stable

## Resources

- [Feature Flags Documentation](./FEATURE_FLAGS.md)
- [Usage Examples](/home/adam/grocery/src/examples/FeatureFlagsUsageExample.tsx)
- [Admin Panel](/home/adam/grocery/src/components/FeatureFlagsAdmin.tsx)
