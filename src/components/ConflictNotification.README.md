# ConflictNotification Component

A specialized notification component for alerting users about detected conflicts in multi-user collaborative environments. This component provides a clear visual interface for viewing and resolving conflicts when multiple users edit the same data.

## Files Created

- **`ConflictNotification.tsx`** - Main component implementation
- **`ConflictNotification.css`** - Comprehensive styling with animations
- **`ConflictNotification.example.tsx`** - Integration examples and patterns
- **`ConflictNotification.demo.tsx`** - Interactive demo page for testing
- **Updated `types.ts`** - Added conflict-related types

## Features

### Core Functionality
- **Visual Diff Preview**: Side-by-side comparison with color-coded changes (red for removed, green for added)
- **Three Resolution Options**:
  - "Use Mine" - Keep local changes
  - "Use Theirs" - Accept remote changes
  - "Merge Manually" - Open manual merge dialog
- **Auto-Dismiss**: 30-second countdown timer (configurable)
- **Persistent Mode**: Critical conflicts stay visible until resolved
- **Priority Ordering**: Higher priority conflicts shown first
- **Stacking**: Display multiple conflicts simultaneously (max 3 visible by default)

### User Experience
- **Animated Entrance**: Smooth slide-in from right
- **Expandable Details**: Toggle diff view on/off
- **Clear Messaging**: Human-readable conflict descriptions
- **Countdown Indicator**: Visual progress bar shows time remaining
- **Responsive Layout**: Adapts to mobile and tablet screens
- **Accessible**: Full keyboard navigation and ARIA labels

### Visual Design
- **Warning Colors**: Distinctive amber/yellow theme for attention
- **Dark Mode**: Automatic dark mode support
- **High Contrast**: Accessible for users with visual impairments
- **Reduced Motion**: Respects user's motion preferences

## Component API

### ConflictNotification

Single conflict notification component.

```tsx
interface ConflictNotificationProps {
  conflict: Conflict;
  onResolve: (conflictId: string, resolution: ConflictResolution) => void;
  onDismiss: (conflictId: string) => void;
  countdown?: number;        // Auto-dismiss time in seconds (default: 30)
  isPersistent?: boolean;    // If true, no auto-dismiss (default: false)
}
```

### ConflictNotifications

Container for multiple conflict notifications with stacking.

```tsx
interface ConflictNotificationsProps {
  conflicts: Conflict[];
  onResolve: (conflictId: string, resolution: ConflictResolution) => void;
  onDismiss: (conflictId: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxVisible?: number;       // Max conflicts to show at once (default: 3)
}
```

## Type Definitions

### Conflict Type

```typescript
interface Conflict {
  id: string;                // Unique identifier
  type: ConflictType;        // Type of conflict
  itemId: string;            // ID of conflicted item
  itemName: string;          // Display name
  listId: string;            // Parent list ID
  localVersion: ConflictVersion;
  remoteVersion: ConflictVersion;
  timestamp: number;         // When conflict detected
  priority: number;          // Display priority (higher = first)
  autoResolvable: boolean;   // Can be auto-resolved?
}

type ConflictType =
  | 'concurrent_edit'  // Both users edited same field
  | 'delete_edit'      // One deleted, other edited
  | 'edit_edit';       // Different fields edited

type ConflictResolution = 'mine' | 'theirs' | 'manual';

interface ConflictVersion {
  value: any;               // Full item value
  changes: FieldChange[];   // Individual field changes
  timestamp: number;        // When this version was created
  userId: string;           // Who made the changes
  userName: string;         // Display name
}

interface FieldChange {
  field: string;            // Field name (e.g., 'quantity')
  oldValue: any;            // Original value
  newValue: any;            // New value
}
```

## Usage Examples

### Basic Usage

```tsx
import { ConflictNotifications } from './components/ConflictNotification';
import { useConflictManager } from './hooks/useConflictManager';

function App() {
  const { conflicts, resolveConflict, dismissConflict } = useConflictManager();

  return (
    <div className="app">
      {/* Your app content */}

      <ConflictNotifications
        conflicts={conflicts}
        onResolve={resolveConflict}
        onDismiss={dismissConflict}
        position="top-right"
        maxVisible={3}
      />
    </div>
  );
}
```

### Creating a Conflict

```tsx
import { nanoid } from 'nanoid';
import type { Conflict } from '../types';

const conflict: Conflict = {
  id: nanoid(),
  type: 'concurrent_edit',
  itemId: 'item-123',
  itemName: 'Milk',
  listId: 'list-456',
  localVersion: {
    value: {
      name: 'Milk',
      quantity: 2,
      gotten: false,
    },
    changes: [
      {
        field: 'quantity',
        oldValue: 1,
        newValue: 2,
      },
    ],
    timestamp: Date.now() - 5000,
    userId: 'local-user',
    userName: 'You',
  },
  remoteVersion: {
    value: {
      name: 'Milk',
      quantity: 3,
      gotten: true,
    },
    changes: [
      {
        field: 'quantity',
        oldValue: 1,
        newValue: 3,
      },
      {
        field: 'gotten',
        oldValue: false,
        newValue: true,
      },
    ],
    timestamp: Date.now() - 3000,
    userId: 'remote-user',
    userName: 'Alice',
  },
  timestamp: Date.now(),
  priority: 2,
  autoResolvable: false,
};
```

### Handling Resolution

```tsx
const handleResolve = async (
  conflictId: string,
  resolution: ConflictResolution
) => {
  const conflict = conflicts.find(c => c.id === conflictId);
  if (!conflict) return;

  switch (resolution) {
    case 'mine':
      // Apply local version to database
      await updateItem(conflict.itemId, conflict.localVersion.value);
      break;

    case 'theirs':
      // Apply remote version to database
      await updateItem(conflict.itemId, conflict.remoteVersion.value);
      break;

    case 'manual':
      // Open manual merge dialog
      openMergeDialog(conflict);
      break;
  }

  // Remove conflict from list
  setConflicts(prev => prev.filter(c => c.id !== conflictId));
};
```

## Integration with NotificationContext

You can extend the existing NotificationContext to support conflicts:

```tsx
// In NotificationContext.tsx
export interface NotificationContextValue {
  // ... existing notification properties
  conflicts: Conflict[];
  addConflict: (conflict: Conflict) => void;
  resolveConflict: (conflictId: string, resolution: ConflictResolution) => void;
  dismissConflict: (conflictId: string) => void;
}

export function NotificationProvider({ children }) {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  const addConflict = useCallback((conflict: Conflict) => {
    setConflicts(prev => [...prev, conflict]);
  }, []);

  const resolveConflict = useCallback((
    conflictId: string,
    resolution: ConflictResolution
  ) => {
    const conflict = conflicts.find(c => c.id === conflictId);
    if (conflict) {
      applyResolution(conflict, resolution);
    }
    setConflicts(prev => prev.filter(c => c.id !== conflictId));
  }, [conflicts]);

  const dismissConflict = useCallback((conflictId: string) => {
    setConflicts(prev => prev.filter(c => c.id !== conflictId));
  }, []);

  return (
    <NotificationContext.Provider value={{
      // ... existing values
      conflicts,
      addConflict,
      resolveConflict,
      dismissConflict,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}
```

## Conflict Detection

Example of detecting conflicts with Zero's sync system:

```tsx
import { useEffect } from 'react';
import { useNotification } from './contexts/NotificationContext';
import { getZeroInstance } from './zero-store';

export function useConflictDetection(listId: string) {
  const { addConflict } = useNotification();
  const zero = getZeroInstance();

  useEffect(() => {
    const handleSyncConflict = (event: SyncConflictEvent) => {
      const { localVersion, remoteVersion, itemId } = event;

      // Detect if changes overlap
      const hasConflict = detectConflict(localVersion, remoteVersion);

      if (hasConflict) {
        const conflict: Conflict = {
          id: nanoid(),
          type: determineConflictType(localVersion, remoteVersion),
          itemId,
          itemName: localVersion.name || remoteVersion.name,
          listId,
          localVersion: buildConflictVersion(localVersion, 'You'),
          remoteVersion: buildConflictVersion(remoteVersion, event.userName),
          timestamp: Date.now(),
          priority: calculatePriority(localVersion, remoteVersion),
          autoResolvable: isAutoResolvable(localVersion, remoteVersion),
        };

        addConflict(conflict);
      }
    };

    zero.on('conflict', handleSyncConflict);

    return () => {
      zero.off('conflict', handleSyncConflict);
    };
  }, [listId, addConflict, zero]);
}
```

## Styling Customization

The component uses CSS custom properties for easy theming:

```css
/* Override in your app's CSS */
.conflict-notification {
  --conflict-border-color: #ff9800;
  --conflict-bg-gradient-start: #fff3e0;
  --conflict-bg-gradient-end: #ffffff;
  --conflict-title-color: #e65100;
}

.conflict-persistent {
  --conflict-border-color: #f44336;
  --conflict-bg-gradient-start: #ffebee;
  --conflict-title-color: #c62828;
}
```

## Testing

Use the included demo page to test the component:

```tsx
import { ConflictNotificationDemo } from './components/ConflictNotification.demo';

// In your app or separate test page
function TestPage() {
  return <ConflictNotificationDemo />;
}
```

The demo provides:
- Buttons to create different conflict types
- Visual confirmation of resolution choices
- History of resolved conflicts
- Interactive testing of all features

## Accessibility

The component follows WCAG 2.1 guidelines:

- **Keyboard Navigation**: All buttons are keyboard accessible
- **Screen Readers**: ARIA labels and live regions for announcements
- **Focus Management**: Clear focus indicators
- **Color Contrast**: Meets WCAG AA standards
- **Reduced Motion**: Respects `prefers-reduced-motion` setting
- **High Contrast**: Enhanced borders in high contrast mode

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## Performance

- **Efficient Rendering**: Uses React.memo for optimization
- **Minimal Re-renders**: Callback memoization with useCallback
- **CSS Animations**: Hardware-accelerated transforms
- **Lazy Loading**: Diff details only rendered when expanded

## Known Limitations

1. **Maximum Conflicts**: Shows max 3 conflicts at once (configurable)
2. **Manual Merge**: Requires separate modal component (not included)
3. **Field Types**: Simple value comparison (no deep object diff)
4. **Auto-Resolve**: Logic must be implemented separately

## Future Enhancements

- [ ] Automatic conflict resolution for simple cases
- [ ] Inline field-by-field selection
- [ ] Conflict history log
- [ ] Email notifications for offline conflicts
- [ ] Conflict analytics and reporting
- [ ] Custom conflict icons per type
- [ ] Sound notifications (opt-in)
- [ ] Conflict grouping by list/item

## Related Components

- **Notifications.tsx** - Standard toast notifications
- **NotificationContext.tsx** - Notification management
- **ConflictResolutionModal.tsx** - Manual merge interface (create separately)

## Contributing

When adding new features:
1. Update types in `types.ts`
2. Add examples to `ConflictNotification.example.tsx`
3. Test with `ConflictNotification.demo.tsx`
4. Update this README

## License

Part of the Grocery List application. See main project LICENSE.
