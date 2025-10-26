# Mobile Optimization - Quick Start Guide

Get your custom category UI mobile-ready in 5 minutes!

## 1. Use Mobile Detection Hook

```tsx
import { useMobileDetection } from './hooks/useMobileDetection';

function MyComponent() {
  const { isMobile, isTouch } = useMobileDetection();

  return (
    <div>
      {isMobile && <p>You're on mobile!</p>}
      {isTouch && <p>Touch device detected</p>}
    </div>
  );
}
```

## 2. Swap Components for Mobile

### Color Picker
```tsx
import { useMobileDetection } from './hooks/useMobileDetection';
import { ColorPicker } from './components/ColorPicker';
import { ColorPickerMobile } from './components/ColorPicker.mobile';

function CategoryForm() {
  const { isMobile } = useMobileDetection();
  const [color, setColor] = useState('#4caf50');

  return (
    <>
      {isMobile ? (
        <ColorPickerMobile value={color} onChange={setColor} />
      ) : (
        <ColorPicker value={color} onChange={setColor} />
      )}
    </>
  );
}
```

### Emoji Picker
```tsx
import { EmojiPicker } from './components/EmojiPicker';
import { EmojiPickerMobile } from './components/EmojiPicker.mobile';

function CategoryForm() {
  const { isMobile } = useMobileDetection();
  const [icon, setIcon] = useState('');

  return (
    <>
      {isMobile ? (
        <EmojiPickerMobile value={icon} onChange={setIcon} />
      ) : (
        <EmojiPicker value={icon} onChange={setIcon} />
      )}
    </>
  );
}
```

## 3. Use Bottom Sheet Modal

```tsx
import { MobileModalWrapper } from './components/CustomCategoryManager.mobile';
import { CustomCategoryManager } from './components/CustomCategoryManager';

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
            listId="your-list-id"
            onClose={() => setShowManager(false)}
          />
        </MobileModalWrapper>
      ) : (
        showManager && (
          <CustomCategoryManager
            listId="your-list-id"
            onClose={() => setShowManager(false)}
          />
        )
      )}
    </>
  );
}
```

## 4. Add Swipe Gestures

```tsx
import { useSwipeGesture } from './hooks/useSwipeGesture';

function CategoryItem({ category, onDelete }) {
  const [showActions, setShowActions] = useState(false);

  const swipeRef = useSwipeGesture({
    onSwipeLeft: () => setShowActions(true),
    onSwipeRight: () => setShowActions(false),
  });

  return (
    <div
      ref={swipeRef}
      style={{
        transform: showActions ? 'translateX(-120px)' : 'translateX(0)',
        transition: 'transform 0.3s',
      }}
    >
      <span>{category.name}</span>

      {showActions && (
        <button onClick={onDelete}>Delete</button>
      )}
    </div>
  );
}
```

## 5. Import Mobile Styles

Add to your component files:

```tsx
import './CustomCategoryManager.mobile.css';
import './ColorPicker.mobile.css';
import './EmojiPicker.mobile.css';
```

## 6. Test on Mobile

### Local Network Testing
```bash
# Start dev server
npm run dev

# Find your IP
ifconfig | grep "inet "  # macOS/Linux
ipconfig                  # Windows

# Open on mobile
# http://YOUR_IP:5173
```

### Browser DevTools
1. Press F12
2. Click device icon (Ctrl+Shift+M)
3. Select device or custom size

## Common Patterns

### Adaptive Component
Create a single component that adapts:

```tsx
function AdaptiveColorPicker(props) {
  const { isMobile } = useMobileDetection();
  const Picker = isMobile ? ColorPickerMobile : ColorPicker;
  return <Picker {...props} />;
}
```

### Conditional Styling
```tsx
const { isMobile } = useMobileDetection();

return (
  <button className={isMobile ? 'btn-mobile' : 'btn-desktop'}>
    Click me
  </button>
);
```

### Touch-Friendly Buttons
```css
.btn-mobile {
  min-width: 48px;
  min-height: 48px;
  padding: 14px 24px;
  font-size: 16px;
}
```

## Key Rules

### Touch Targets
- ✅ Minimum 48x48px
- ✅ 8-12px spacing
- ❌ Don't make buttons smaller than 44x44px

### Forms
- ✅ Use `font-size: 16px` minimum
- ✅ Add `min-height: 48px`
- ❌ Don't use `font-size < 16px` (causes iOS zoom)

### Animations
- ✅ Use CSS `transform`
- ✅ Keep under 300ms
- ❌ Don't animate `top`, `left`, `width`, `height`

### Gestures
- ✅ Provide alternative (buttons) for gestures
- ✅ Show visual hints for gestures
- ❌ Don't rely solely on gestures

## Quick Checklist

Mobile-ready component checklist:

- [ ] Uses `useMobileDetection` hook
- [ ] Has mobile/desktop variants
- [ ] Touch targets ≥ 48x48px
- [ ] Form inputs ≥ 16px font-size
- [ ] Animations use `transform`
- [ ] Imports mobile CSS
- [ ] Tested on real device
- [ ] Swipe gestures (if applicable)
- [ ] Accessible (ARIA labels)

## Next Steps

1. **Read Full Docs**: [MOBILE_OPTIMIZATION_README.md](src/components/MOBILE_OPTIMIZATION_README.md)
2. **See Examples**: [CustomCategoryManager.mobile-example.tsx](src/components/CustomCategoryManager.mobile-example.tsx)
3. **Test Thoroughly**: [MOBILE_TESTING_GUIDE.md](MOBILE_TESTING_GUIDE.md)
4. **Check Summary**: [MOBILE_OPTIMIZATION_SUMMARY.md](MOBILE_OPTIMIZATION_SUMMARY.md)

## Help

**Not working?** Check:
1. Imported mobile hooks?
2. Imported mobile CSS?
3. Using conditional rendering?
4. Testing on real device (not just DevTools)?

**Still stuck?** See [MOBILE_TESTING_GUIDE.md](MOBILE_TESTING_GUIDE.md) troubleshooting section.

---

**Time to mobile-ready**: ~5 minutes ⚡
**Effort**: Low 🎯
**Impact**: High 🚀
