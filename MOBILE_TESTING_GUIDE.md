# Mobile Optimization Testing Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. Test on Mobile Device

#### Option A: Local Network (Recommended)
1. Find your computer's IP address:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet "

   # Windows
   ipconfig
   ```

2. Open on mobile browser:
   ```
   http://YOUR_IP:5173
   ```

#### Option B: Browser DevTools
1. Open Chrome DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select device or set custom dimensions

#### Option C: Use ngrok for Remote Testing
```bash
npx ngrok http 5173
```

## Testing Checklist

### Touch Target Testing

#### All Interactive Elements
- [ ] Buttons are >= 48x48px
- [ ] Form inputs are >= 48px tall
- [ ] Color swatches are >= 48x48px
- [ ] Emoji buttons are >= 52x52px
- [ ] Close buttons are >= 44x44px
- [ ] Spacing between targets >= 8px

**How to Test:**
1. Open browser DevTools
2. Enable "Show rulers" in device toolbar
3. Measure each interactive element
4. Tap with finger (not stylus) to verify comfortable targeting

### Swipe Gesture Testing

#### Swipe Left (Reveal Actions)
1. Open category list on mobile
2. Swipe left on a category item
3. Verify edit and delete buttons appear
4. Buttons should be 56x56px minimum
5. Animation should be smooth (60fps)

**Expected Behavior:**
- Item slides left by 120px
- Action buttons fade in
- Background darkens slightly
- Smooth animation (0.3s ease)

#### Swipe Right (Hide Actions)
1. With actions revealed
2. Swipe right on the item
3. Verify actions hide smoothly
4. Item returns to original position

#### Swipe Threshold Test
- [ ] Swipe < 50px: No action
- [ ] Swipe >= 50px: Actions reveal
- [ ] Fast swipe: Immediate action
- [ ] Slow swipe: Follows finger

### Long Press Testing

1. Long press category item (500ms)
2. Verify context menu or actions appear
3. Should not trigger on tap
4. Should not trigger on scroll

**Timing Test:**
- [ ] < 500ms: No action
- [ ] >= 500ms: Action triggers
- [ ] Visual feedback during hold

### Bottom Sheet Modal Testing

#### Open Animation
1. Tap "Manage Categories"
2. Modal should slide up from bottom
3. Animation duration: 0.3s
4. Should respect safe area insets

#### Drag to Dismiss
1. Touch drag handle at top
2. Drag down > 100px
3. Modal should close
4. Drag < 100px: Springs back

#### Tap Outside
1. Tap overlay (outside modal)
2. Modal should close
3. Animation should reverse smoothly

### Color Picker Testing

#### iOS Safari
1. Tap color input
2. Native iOS color picker should open
3. Should be full screen
4. Changes reflect immediately

**iOS Issues to Check:**
- [ ] Picker opens on first tap
- [ ] No zoom on input focus
- [ ] Colors update in real-time
- [ ] Dismiss works correctly

#### Android Chrome
1. Tap color input
2. Native Android color picker opens
3. Should be compact/inline
4. Changes reflect immediately

**Android Issues to Check:**
- [ ] Picker opens properly
- [ ] Color format correct (hex)
- [ ] Dismiss/cancel works
- [ ] No layout shift

#### Preset Colors
- [ ] Grid shows 6 columns on mobile
- [ ] Each button >= 48x48px
- [ ] Clear visual feedback on tap
- [ ] Selected state visible
- [ ] Smooth animations

### Emoji Picker Testing

#### Toggle Behavior
1. Tap dropdown arrow
2. Grid should expand/collapse
3. Animation should be smooth
4. Should scroll if needed

#### Emoji Selection
- [ ] Buttons >= 52x52px
- [ ] Clear tap feedback
- [ ] Selected emoji updates preview
- [ ] Input field updates
- [ ] Grid auto-closes after selection

#### Text Input
- [ ] Can type emoji directly
- [ ] Can paste emoji
- [ ] Clear button works
- [ ] No zoom on focus (iOS)

### Form Input Testing

#### Prevent iOS Zoom
All inputs should have `font-size: 16px` minimum.

**Test:**
1. Tap each input field
2. Page should NOT zoom
3. If zooms, increase font size

#### Keyboard Behavior
- [ ] Correct keyboard type opens
- [ ] "Go" button works
- [ ] Tab navigation works
- [ ] Form doesn't scroll behind keyboard

### Responsive Layout Testing

#### Portrait Mode
**iPhone SE (375x667)**
- [ ] Modal fills screen
- [ ] No horizontal scroll
- [ ] All content visible
- [ ] Touch targets adequate

**iPhone 12 (390x844)**
- [ ] Bottom sheet 90% height
- [ ] Drag handle visible
- [ ] Content scrolls smoothly
- [ ] Safe areas respected

**iPhone 14 Pro Max (428x926)**
- [ ] Layout adapts properly
- [ ] No wasted space
- [ ] Notch area handled
- [ ] Dynamic Island respected

#### Landscape Mode
- [ ] Modal height adapts
- [ ] All content accessible
- [ ] No overlap issues
- [ ] Buttons still reachable

**Test Orientations:**
1. Rotate device while modal open
2. Verify layout adjusts
3. Check all functions still work

### Performance Testing

#### Animation Frame Rate
Use Chrome DevTools Performance tab:

1. Start recording
2. Perform gestures
3. Stop recording
4. Check FPS (should be 60fps)

**Critical Animations:**
- [ ] Bottom sheet slide up
- [ ] Category swipe reveal
- [ ] Modal drag
- [ ] Color picker open

#### Touch Response Time
Should be < 100ms from touch to visual feedback.

**Test:**
1. Tap button
2. Should see immediate feedback
3. Use "Show paint flashing" in DevTools

#### Scroll Performance
- [ ] Smooth 60fps scrolling
- [ ] No janky frames
- [ ] Bounce effect works (iOS)
- [ ] Momentum scrolling smooth

### Accessibility Testing

#### Screen Reader (VoiceOver/TalkBack)
1. Enable VoiceOver (iOS) or TalkBack (Android)
2. Navigate through UI
3. All elements should be announced
4. Swipe gestures should have voice alternatives

**Required Announcements:**
- [ ] Button names and roles
- [ ] Form labels
- [ ] Error messages
- [ ] State changes

#### Keyboard Navigation
Even on mobile, keyboard should work:
- [ ] Tab through all elements
- [ ] Enter/Space activates
- [ ] Escape closes modals
- [ ] Arrow keys navigate

#### Color Contrast
Use browser DevTools Lighthouse audit:
- [ ] All text meets WCAG AA (4.5:1)
- [ ] Interactive elements visible
- [ ] Error states distinguishable

### Device-Specific Testing

#### iOS Safari
**Common Issues:**
- Input zoom
- Color picker not opening
- Touch events not firing
- Safe area insets

**Test:**
1. iPhone SE (iOS 15+)
2. iPhone 12 (iOS 16+)
3. iPhone 14 Pro (iOS 17+)
4. iPad Mini (iPadOS 16+)

#### Android Chrome
**Common Issues:**
- Color format differences
- Touch delay
- Scroll issues
- Keyboard overlapping

**Test:**
1. Samsung Galaxy S21
2. Google Pixel 6
3. OnePlus 9
4. Samsung Galaxy Tab

#### Samsung Internet
**Specific Checks:**
- [ ] Color picker works
- [ ] Touch gestures work
- [ ] Animations smooth
- [ ] Modal displays correctly

### Edge Cases

#### Slow Network
1. Throttle network in DevTools
2. Test all interactions
3. Should still be responsive
4. No blocking operations

#### Interrupted Gestures
- [ ] Start swipe, then lift finger early
- [ ] Start long press, move before timeout
- [ ] Start drag modal, quickly release
- [ ] All should handle gracefully

#### Rapid Interactions
- [ ] Tap buttons rapidly
- [ ] Swipe multiple items quickly
- [ ] Open/close modal repeatedly
- [ ] No race conditions

#### Multiple Categories
- [ ] Test with 0 categories
- [ ] Test with 1 category
- [ ] Test with 20+ categories
- [ ] Scroll performance good

#### Orientation Changes
- [ ] Change orientation during swipe
- [ ] Change during modal drag
- [ ] Change during form input
- [ ] All should handle gracefully

## Debugging Tools

### Chrome DevTools
```javascript
// Show touch points
document.addEventListener('touchstart', (e) => {
  Array.from(e.touches).forEach(touch => {
    console.log('Touch:', touch.clientX, touch.clientY);
  });
});

// Measure gesture timing
let touchStart;
document.addEventListener('touchstart', () => {
  touchStart = Date.now();
});
document.addEventListener('touchend', () => {
  console.log('Duration:', Date.now() - touchStart, 'ms');
});

// Monitor FPS
let lastTime = performance.now();
let frames = 0;
function checkFPS() {
  frames++;
  const now = performance.now();
  if (now >= lastTime + 1000) {
    console.log('FPS:', frames);
    frames = 0;
    lastTime = now;
  }
  requestAnimationFrame(checkFPS);
}
checkFPS();
```

### Mobile Debug Console
Add to your app for on-device debugging:

```tsx
import { useState, useEffect } from 'react';

function MobileDebugConsole() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const originalLog = console.log;
    console.log = (...args) => {
      setLogs(prev => [...prev, args.join(' ')].slice(-10));
      originalLog(...args);
    };
    return () => {
      console.log = originalLog;
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'rgba(0,0,0,0.8)',
      color: 'lime',
      padding: 10,
      fontFamily: 'monospace',
      fontSize: 10,
      maxHeight: 200,
      overflow: 'auto',
      zIndex: 9999,
    }}>
      {logs.map((log, i) => <div key={i}>{log}</div>)}
    </div>
  );
}
```

## Common Issues & Solutions

### Issue: Swipe not working
**Solution:**
1. Check `touch-action` CSS property
2. Verify event listeners attached
3. Check if another scroll container interfering

### Issue: Color picker not opening (iOS)
**Solution:**
1. Input must be visible (not `display: none`)
2. Must be in DOM when clicked
3. Use click/touch event, not programmatic click

### Issue: Modal jerky when dragging
**Solution:**
1. Use `transform` instead of `top`
2. Set `transition: none` during drag
3. Use `will-change: transform` sparingly

### Issue: Inputs zoom on focus (iOS)
**Solution:**
1. Set `font-size: 16px` minimum
2. Use viewport meta tag:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
   ```

### Issue: Touch events fire multiple times
**Solution:**
1. Use `preventDefault()` carefully
2. Debounce rapid touches
3. Track touch identifier

## Performance Benchmarks

### Target Metrics
- **Initial Load:** < 2s
- **Touch Response:** < 100ms
- **Animation FPS:** 60fps
- **Swipe Reveal:** < 300ms
- **Modal Open:** < 300ms
- **Color Picker:** < 200ms

### Measuring
```javascript
// Measure touch to visual feedback
const start = performance.now();
button.addEventListener('touchstart', () => {
  requestAnimationFrame(() => {
    console.log('Touch response:', performance.now() - start, 'ms');
  });
}, { once: true });
```

## Automated Testing

### Playwright Mobile Tests
```typescript
import { test, devices } from '@playwright/test';

test.use({
  ...devices['iPhone 12'],
});

test('swipe to reveal actions', async ({ page }) => {
  await page.goto('/');

  const category = page.locator('.category-item').first();

  // Simulate swipe
  await category.dispatchEvent('touchstart', {
    touches: [{ clientX: 300, clientY: 100 }],
  });
  await category.dispatchEvent('touchmove', {
    touches: [{ clientX: 100, clientY: 100 }],
  });
  await category.dispatchEvent('touchend', {});

  // Verify actions visible
  await expect(page.locator('.btn-swipe-delete')).toBeVisible();
});
```

## Reporting Issues

When reporting a mobile issue, include:

1. **Device:** Make, model, OS version
2. **Browser:** Name and version
3. **Screen Size:** Width x height
4. **Steps to Reproduce:** Detailed steps
5. **Expected:** What should happen
6. **Actual:** What actually happens
7. **Screenshots/Video:** Visual proof
8. **Console Logs:** Any errors

## Resources

- [iOS Safari Web Content Guide](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/Introduction/Introduction.html)
- [Chrome DevTools Device Mode](https://developer.chrome.com/docs/devtools/device-mode/)
- [MDN Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [Web.dev Mobile Performance](https://web.dev/mobile/)
