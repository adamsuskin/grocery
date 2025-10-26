# Custom Categories Onboarding Tour

This document describes the implementation of the custom categories onboarding tour feature.

## Overview

The custom categories onboarding tour provides an interactive, context-aware tutorial for users to learn how to use custom categories in the Grocery List application. The tour consists of multiple contexts with different steps based on where the user is in the application.

## Files Created

### 1. `/src/components/CustomCategoriesOnboardingTour.tsx`
The main tour component that renders the interactive tour overlay with:
- Spotlight highlighting of UI elements
- Step-by-step tooltips with navigation
- Progress indicators
- "Don't show again" checkbox
- Keyboard navigation support
- Responsive design for mobile and desktop

**Tour Contexts:**
- **manager**: Tour for the CustomCategoryManager (5 steps)
- **additem**: Tour for the AddItemForm when using custom categories (4 steps)
- **filter**: Tour for filtering by custom categories (3 steps)

### 2. `/src/hooks/useCustomCategoriesTour.ts`
Custom React hook for managing tour state with localStorage persistence:
- Tracks completion status per context
- Tracks dismissal status (when "Don't show again" is checked)
- Provides resume functionality if tour is interrupted
- Determines when to show tours based on context and custom category availability

**Key Functions:**
- `shouldShowTour(context, hasCustomCategories)`: Determines if tour should be shown
- `startTour(context)`: Manually start a tour
- `completeTour(context)`: Mark tour as completed
- `skipTour(context)`: Close tour without completing
- `resetTour(context)`: Reset tour state for testing/replay
- `resetAllCustomCategoriesTours()`: Reset all tour contexts

### 3. `/src/components/OnboardingTour.css` (updated)
Added custom styling for the custom categories tour:
- Purple/violet highlight color to distinguish from main onboarding tour
- Custom pulse animation for highlighted elements
- "Don't show again" checkbox styling
- Mobile responsive adjustments
- Interactive element support (allows clicking through spotlight)

## Integration Points

### 1. CustomCategoryManager Component
**File**: `/src/components/CustomCategoryManager.tsx`

The tour automatically shows when:
- User opens the category manager for the first time
- User has edit permissions
- Tour hasn't been completed or dismissed

```typescript
// Show tour on first visit (if not already completed/dismissed)
useEffect(() => {
  if (canEdit && shouldShowTour('manager', categories.length > 0)) {
    startTour('manager');
  }
}, [canEdit, categories.length, shouldShowTour, startTour]);
```

**Tour Steps:**
1. Welcome message explaining custom categories
2. Highlight the category creation form
3. Show where custom categories are listed
4. Explain bulk operations toolbar
5. Final message about using categories

### 2. AddItemForm Component
**File**: `/src/components/AddItemForm.tsx`

The tour automatically shows when:
- User has custom categories created
- User hasn't seen the additem tour
- User has edit permissions

```typescript
// Show tour when user has custom categories but hasn't seen the additem tour
useEffect(() => {
  if (canEdit && listId && shouldShowTour('additem', customCategories.length > 0)) {
    const timer = setTimeout(() => {
      startTour('additem');
    }, 500);
    return () => clearTimeout(timer);
  }
}, [canEdit, listId, customCategories.length, shouldShowTour, startTour]);
```

**Tour Steps:**
1. Welcome message about using custom categories
2. Highlight the category dropdown
3. Show the "Manage" button for quick access
4. Final message to start using categories

### 3. UserProfile Component (Replay Tours)
**File**: `/src/components/UserProfile.tsx`

Added a button in the user profile settings to replay all custom categories tours:

```typescript
<button
  className="btn-profile-action btn-profile-tour"
  onClick={() => {
    resetAllCustomCategoriesTours();
    setShowProfileModal(false);
    alert('Custom categories tours have been reset...');
  }}
>
  Replay Custom Categories Tours
</button>
```

## Tour Features

### 1. Interactive Tour
- **Spotlight Effect**: Highlights target UI elements with a pulsing border
- **Allow Interaction**: Some steps allow users to interact with highlighted elements (e.g., create category form)
- **Scroll to Target**: Automatically scrolls target elements into view
- **Position Calculation**: Smart tooltip positioning to avoid viewport edges

### 2. Navigation
- **Next/Previous Buttons**: Navigate between tour steps
- **Progress Dots**: Visual indicator of current step (clickable to jump to steps)
- **Step Counter**: Shows "Step X of Y"
- **Keyboard Shortcuts**:
  - `Arrow Right`: Next step
  - `Arrow Left`: Previous step
  - `Enter`: Complete tour (on last step)
  - `Escape`: Skip/close tour

### 3. State Management
- **localStorage Persistence**: Tour completion tracked per context
- **sessionStorage Resume**: If page is refreshed during tour, resumes from last step
- **Dismissal Tracking**: "Don't show again" checkbox saves preference
- **Context-Aware**: Different tours for different contexts

### 4. Responsive Design
- **Mobile Optimized**: Adjusted layouts for small screens
- **Touch-Friendly**: Larger touch targets on mobile
- **Adaptive Positioning**: Tooltips reposition based on viewport size

## Usage Examples

### Example 1: First-Time User Flow
1. User creates their first custom category in CustomCategoryManager
2. Tour appears explaining the manager features
3. User completes or skips the tour
4. Later, when adding an item, the additem tour appears
5. User learns how to select custom categories in the dropdown

### Example 2: Returning User
1. User who dismissed the manager tour won't see it again
2. User can replay tours from profile settings if needed
3. Tour state is preserved across sessions

### Example 3: Testing/Development
```typescript
// Reset a specific tour
import { useCustomCategoriesTour } from '../hooks/useCustomCategoriesTour';
const { resetTour } = useCustomCategoriesTour();
resetTour('manager');

// Reset all tours
import { resetAllCustomCategoriesTours } from '../hooks/useCustomCategoriesTour';
resetAllCustomCategoriesTours();
```

## LocalStorage Keys

The tour uses the following localStorage keys:
- `custom-categories-tour-manager-completed`: Manager tour completion
- `custom-categories-tour-manager-dismissed`: Manager tour dismissed
- `custom-categories-tour-additem-completed`: AddItem tour completion
- `custom-categories-tour-additem-dismissed`: AddItem tour dismissed
- `custom-categories-tour-filter-completed`: Filter tour completion
- `custom-categories-tour-filter-dismissed`: Filter tour dismissed

SessionStorage keys (for resume):
- `custom-categories-tour-resume-step`: Last viewed step number
- `custom-categories-tour-resume-context`: Last active context

## Accessibility

- **ARIA Labels**: All interactive elements have descriptive labels
- **Keyboard Navigation**: Full keyboard support for tour controls
- **Focus Management**: Proper focus handling when tour opens/closes
- **Screen Reader Support**: Descriptive text for tour steps
- **High Contrast**: Tour UI works with high contrast modes

## CSS Classes

Key CSS classes for targeting:
- `.custom-categories-tour`: Root tour container
- `.tour-overlay`: Semi-transparent background overlay
- `.tour-highlight`: Spotlight highlight around target elements
- `.tour-tooltip`: Tooltip container
- `.tour-progress-dot`: Progress indicator dots
- `.tour-checkbox`: "Don't show again" checkbox

## Future Enhancements

Potential improvements:
1. Add analytics to track tour completion rates
2. Add mini-tooltips for individual features
3. Add video/GIF demonstrations in tour steps
4. Add contextual help bubbles that appear on hover
5. Add a tour for the filter/search functionality
6. Add localization support for tour content
7. Add ability to pause and resume tours manually

## Testing

To test the tours:

1. **Test First Visit**:
   ```typescript
   localStorage.clear(); // Clear all tour state
   // Open category manager - tour should appear
   ```

2. **Test Don't Show Again**:
   - Complete tour with checkbox checked
   - Verify localStorage has dismissal key
   - Reopen manager - tour should not appear

3. **Test Resume**:
   - Start tour, navigate to step 3
   - Refresh page
   - Tour should resume at step 3

4. **Test Replay**:
   - Go to user profile settings
   - Click "Replay Custom Categories Tours"
   - Open manager - tour should appear again

## Troubleshooting

### Tour doesn't appear
- Check localStorage for completion/dismissal keys
- Verify user has appropriate permissions (canEdit)
- Check console for errors
- Verify target elements exist on page

### Tour position is off
- Check that target selectors match actual DOM elements
- Verify viewport size (responsive behavior)
- Check for CSS conflicts with z-index

### Tour doesn't persist state
- Check localStorage is enabled
- Check for errors in console
- Verify storage quota isn't exceeded

## Related Files

- `/src/components/OnboardingTour.tsx`: Main app onboarding tour (reference)
- `/src/hooks/useOnboardingTour.ts`: Main tour hook (similar pattern)
- `/src/components/CustomCategoryManager.tsx`: Integration point
- `/src/components/AddItemForm.tsx`: Integration point
- `/src/components/UserProfile.tsx`: Replay functionality

## Summary

The custom categories onboarding tour provides a comprehensive, context-aware tutorial system that:
- Guides users through custom category features
- Adapts to different contexts (manager, adding items, filtering)
- Persists state across sessions
- Allows replay from settings
- Provides a smooth, interactive learning experience
- Supports accessibility and keyboard navigation
- Works seamlessly on mobile and desktop

The implementation follows React best practices with proper hooks, TypeScript types, and separation of concerns between UI and state management.
