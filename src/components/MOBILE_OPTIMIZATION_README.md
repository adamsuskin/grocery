# Mobile Optimization for Custom Category UI

## Overview

This directory contains mobile-optimized versions of the custom category management components, designed to provide an excellent user experience on mobile devices with:

- Touch-friendly interfaces with larger tap targets (min 48x48px)
- Native mobile pickers (color and emoji)
- Swipe gestures for quick actions
- Bottom sheet modals instead of centered dialogs
- Responsive layouts that adapt to screen size
- Performance optimizations for mobile devices

## Components

### 1. Mobile Detection Hooks

#### `useMobileDetection.ts`
Detects device type and capabilities:
- `isMobile` - Screen width <= 600px
- `isTablet` - Screen width 601-1024px
- `isTouch` - Has touch support
- `screenSize` - 'mobile' | 'tablet' | 'desktop'

```tsx
import { useMobileDetection } from '../hooks/useMobileDetection';

function MyComponent() {
  const { isMobile, isTouch, screenSize } = useMobileDetection();

  if (isMobile) {
    return <MobileVersion />;
  }
  return <DesktopVersion />;
}
```

#### `useSwipeGesture.ts`
Provides swipe gesture detection:

```tsx
import { useSwipeGesture, useLongPress } from '../hooks/useSwipeGesture';

function CategoryItem({ onDelete, onEdit }) {
  const swipeRef = useSwipeGesture({
    onSwipeLeft: () => setShowActions(true),
    onSwipeRight: () => setShowActions(false),
    threshold: 50,
  });

  const longPressRef = useLongPress(() => {
    // Show context menu
  }, 500);

  return <div ref={swipeRef}>...</div>;
}
```

### 2. Mobile Components

#### `CategoryItemMobile`
Mobile-optimized category item with:
- Swipe-to-reveal actions
- Long press for context menu
- Large touch targets
- Simplified edit interface

#### `MobileModalWrapper`
Bottom sheet modal for mobile:
- Slides up from bottom
- Drag handle for pull-to-dismiss
- Touch gesture support
- Auto-adapts to mobile/desktop

#### `ColorPickerMobile`
Mobile-optimized color picker:
- Native HTML5 color input (opens OS color picker)
- Quick preset colors (reduced set)
- Large touch targets (52x52px minimum)
- Simple, focused interface

#### `EmojiPickerMobile`
Mobile-optimized emoji picker:
- Collapsible emoji grid
- Large emoji buttons (56x56px minimum)
- Text input with preview
- Touch-optimized layout

## Usage Examples

### Basic Integration

```tsx
import { useMobileDetection } from '../hooks/useMobileDetection';
import { ColorPickerMobile } from './ColorPicker.mobile';
import { ColorPicker } from './ColorPicker';

function CategoryForm() {
  const { isMobile } = useMobileDetection();
  const [color, setColor] = useState('#4caf50');

  return (
    <div>
      {isMobile ? (
        <ColorPickerMobile value={color} onChange={setColor} />
      ) : (
        <ColorPicker value={color} onChange={setColor} />
      )}
    </div>
  );
}
```

### Custom Category Manager with Mobile Support

```tsx
import { useMobileDetection } from '../hooks/useMobileDetection';
import { CustomCategoryManager } from './CustomCategoryManager';
import { MobileModalWrapper } from './CustomCategoryManager.mobile';

function App() {
  const { isMobile } = useMobileDetection();
  const [showManager, setShowManager] = useState(false);

  return (
    <>
      <button onClick={() => setShowManager(true)}>
        Manage Categories
      </button>

      {isMobile ? (
        <MobileModalWrapper
          isOpen={showManager}
          onClose={() => setShowManager(false)}
          title="Manage Categories"
        >
          <CustomCategoryManager
            listId={listId}
            onClose={() => setShowManager(false)}
          />
        </MobileModalWrapper>
      ) : (
        showManager && (
          <CustomCategoryManager
            listId={listId}
            onClose={() => setShowManager(false)}
          />
        )
      )}
    </>
  );
}
```

### Swipe Gestures Example

```tsx
import { CategoryItemMobile } from './CustomCategoryManager.mobile';

function CategoryList({ categories }) {
  const [editingId, setEditingId] = useState(null);

  return (
    <div>
      {categories.map(category => (
        <CategoryItemMobile
          key={category.id}
          category={category}
          isEditing={editingId === category.id}
          onEdit={() => setEditingId(category.id)}
          onDelete={() => handleDelete(category.id)}
          // ... other props
        />
      ))}
    </div>
  );
}
```

## Mobile Gestures

### Swipe Left
Reveals edit and delete actions for category items.

```tsx
// Swipe left on a category item to reveal:
// - Edit button (green)
// - Delete button (red)
```

### Long Press
Opens context menu with additional actions (500ms hold).

```tsx
// Long press on a category to:
// - Select multiple items
// - Show quick actions
```

### Pull to Dismiss
Bottom sheet modals can be dragged down to close.

```tsx
// Drag the modal down > 100px to dismiss
```

## Responsive Breakpoints

- **Mobile**: <= 600px
- **Tablet**: 601-1024px
- **Desktop**: > 1024px

## Touch Target Guidelines

All interactive elements meet WCAG 2.1 Level AAA guidelines:
- Minimum size: 48x48px
- Recommended: 52x56px
- Spacing: 8-12px between targets

## Performance Optimizations

### 1. Reduced Animation Complexity
```css
@media (prefers-reduced-motion: reduce) {
  /* Disable animations */
  .mobile-bottom-sheet {
    animation: none;
    transition: none;
  }
}
```

### 2. Lazy Loading
Mobile components are separate files, loaded only when needed:

```tsx
const ColorPickerMobile = lazy(() => import('./ColorPicker.mobile'));
```

### 3. Native Inputs
Use native HTML5 inputs on mobile for better performance:
- `<input type="color">` - Opens OS color picker
- `<input type="text" inputmode="text">` - Optimized keyboard

### 4. CSS Optimizations
- Use CSS transforms for animations (GPU accelerated)
- Avoid layout thrashing
- Use `will-change` sparingly

## Accessibility

### Touch Targets
- Minimum 48x48px (WCAG 2.1 Level AAA)
- Clear visual feedback on interaction
- Proper spacing between interactive elements

### Screen Readers
- ARIA labels on all interactive elements
- Semantic HTML structure
- Keyboard navigation support

### Keyboard Support
All gestures have keyboard equivalents:
- Arrow keys for navigation
- Enter/Space for selection
- Escape to close modals

## Testing Checklist

### iOS Safari
- [ ] Touch gestures work correctly
- [ ] Native color picker opens
- [ ] Bottom sheet animates smoothly
- [ ] Safe area insets respected (notched devices)
- [ ] No zoom on input focus (font-size >= 16px)

### Android Chrome
- [ ] Touch gestures work correctly
- [ ] Native color picker opens
- [ ] Bottom sheet animates smoothly
- [ ] Swipe actions reveal correctly
- [ ] Long press triggers context menu

### Screen Sizes
- [ ] iPhone SE (375x667)
- [ ] iPhone 12 (390x844)
- [ ] iPhone 14 Pro Max (428x926)
- [ ] Samsung Galaxy S21 (360x800)
- [ ] iPad Mini (768x1024)
- [ ] iPad Pro (1024x1366)

### Touch Interactions
- [ ] All buttons have min 48x48px hit area
- [ ] Swipe left reveals actions
- [ ] Swipe right hides actions
- [ ] Long press shows context menu
- [ ] Pull down dismisses bottom sheet
- [ ] Tap outside closes modal

### Performance
- [ ] 60fps animations
- [ ] < 100ms touch response time
- [ ] No layout shifts
- [ ] Smooth scrolling
- [ ] Fast color picker opening

## Troubleshooting

### Issue: Color picker doesn't open on iOS
**Solution**: Ensure the native input is properly sized and not hidden with `display: none`. Use `opacity: 0` or positioning instead.

### Issue: Swipe gestures conflict with scroll
**Solution**: Set `touch-action: pan-y` on swipeable elements to allow vertical scroll but enable horizontal swipe.

### Issue: Bottom sheet jumps during drag
**Solution**: Use `transition: none` during dragging, re-enable after gesture ends.

### Issue: Text selected during swipe
**Solution**: Add `user-select: none` to swipeable elements.

### Issue: Input zooms on focus (iOS)
**Solution**: Set `font-size: 16px` minimum on all inputs to prevent iOS zoom.

## CSS Variables

Use these CSS variables for consistent theming:

```css
:root {
  --primary-color: #4caf50;
  --danger-color: #f44336;
  --text-color: #333;
  --text-muted: #666;
  --border-color: #ddd;
  --card-bg: #fff;
}
```

## Browser Support

- iOS Safari 14+
- Chrome for Android 90+
- Samsung Internet 14+
- Firefox for Android 90+

## Future Enhancements

- [ ] Pinch to zoom in/out of category manager
- [ ] Pull to refresh category list
- [ ] Haptic feedback on actions
- [ ] More gesture customization options
- [ ] Progressive Web App (PWA) optimizations
- [ ] Offline support for mobile

## Resources

- [iOS Human Interface Guidelines - Touch Targets](https://developer.apple.com/design/human-interface-guidelines/inputs/touchscreen-gestures)
- [Material Design - Touch Targets](https://material.io/design/usability/accessibility.html#layout-and-typography)
- [WCAG 2.1 - Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [MDN - Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
