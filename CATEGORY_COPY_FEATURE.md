# Category Copy Feature Implementation

## Overview
This feature allows users to copy custom categories from one list to another, making it easy to reuse category configurations across multiple lists without manual recreation.

## Files Created

### 1. CategoryCopyModal Component
**Path:** `/home/adam/grocery/src/components/CategoryCopyModal.tsx`

A modal component that handles the category copying workflow:

**Features:**
- **List Selection:** Browse and select from available lists (excludes current list and archived lists)
- **Category Preview:** View all custom categories from the selected list with their icons and colors
- **Bulk Selection:** Select individual categories or use "Select All" for batch operations
- **Conflict Detection:** Automatically detect when category names already exist in the target list
- **Conflict Resolution:** Three resolution strategies:
  - **Skip:** Don't copy conflicting categories
  - **Rename:** Append " (Copy)" to conflicting category names
  - **Overwrite:** Replace existing categories (placeholder for future enhancement)
- **Custom Naming:** When using "Rename" strategy, users can customize the new name for each category
- **Preview:** Shows visual preview of categories with their icons and colors
- **Empty States:** Helpful messaging when no lists or categories are available

**Props:**
- `currentListId: string` - The ID of the list to copy categories to
- `onClose: () => void` - Callback when modal is closed
- `onSuccess: (count: number) => void` - Callback when categories are successfully copied

**Key Functions:**
- `handleToggleCategory()` - Toggle selection state for individual categories
- `handleToggleAll()` - Select/deselect all categories at once
- `handleConflictResolutionChange()` - Update conflict resolution strategy
- `handleUpdateNewName()` - Update custom name for renamed categories
- `handleCopy()` - Execute the copy operation with conflict resolution

### 2. CategoryCopyModal Styles
**Path:** `/home/adam/grocery/src/components/CategoryCopyModal.css`

**Key Styles:**
- Modal overlay and dialog with smooth animations (fadeIn, slideUp)
- Responsive grid layout for list selection
- List cards with hover effects and color-coded icons
- Category item cards with visual indicators (icon, color preview)
- Conflict warning section with highlighted styling
- Resolution option radio buttons
- Rename input fields for conflicting categories
- Empty state styling with helpful icons and messages
- Mobile-responsive design with flexible layouts
- Dark mode support for conflict warnings

## Files Modified

### 1. CustomCategoryManager Component
**Path:** `/home/adam/grocery/src/components/CustomCategoryManager.tsx`

**Changes:**
- Added `CategoryCopyModal` import
- Added `showCopyModal` state variable
- Updated escape key handler to include copy modal
- Added `handleCopySuccess()` function to handle successful category imports
- Added "Import from List" button in the section header with download icon
- Integrated `CategoryCopyModal` component at the end of the JSX

**New UI Elements:**
```tsx
<button
  className="btn btn-small btn-secondary"
  onClick={() => setShowCopyModal(true)}
  title="Import categories from another list"
>
  <svg>...</svg>
  Import from List
</button>
```

### 2. CustomCategoryManager Styles
**Path:** `/home/adam/grocery/src/components/CustomCategoryManager.css`

**Changes:**
- Updated `.category-section-header` to use flexbox column layout
- Added `.section-title-row` class for horizontal title/button layout
- Styled import button with icon alignment
- Responsive flex-wrap for smaller screens

## User Flow

### Step 1: Open Import Modal
1. User clicks "Import from List" button in Custom Category Manager
2. CategoryCopyModal opens with list selection view

### Step 2: Select Source List
1. User sees grid of available lists (excludes current list and archived lists)
2. Each list shows:
   - List icon with custom color
   - List name
3. User clicks a list card to select it

### Step 3: Select Categories
1. Modal displays all custom categories from selected list
2. Each category shows:
   - Checkbox for selection
   - Icon (if available)
   - Color preview (if available)
   - Category name
   - Conflict badge (if name already exists)
3. User can:
   - Select individual categories
   - Use "Select All" checkbox
   - View count of selected categories

### Step 4: Resolve Conflicts (if any)
1. If selected categories have name conflicts, conflict warning appears
2. User selects resolution strategy:
   - **Skip:** Conflicting categories won't be copied
   - **Rename:** Categories will be renamed with " (Copy)" suffix
3. If "Rename" is selected, user can customize the new name for each category

### Step 5: Copy Categories
1. User clicks "Copy X Categories" button
2. System:
   - Validates selections
   - Applies conflict resolution
   - Creates new categories in target list
   - Shows success message with count
3. Modal closes automatically on success
4. CustomCategoryManager shows success message

### Step 6: View Results
1. Newly imported categories appear in the custom categories list
2. Success message shows count of imported categories
3. User can immediately use the new categories when adding items

## Technical Implementation

### Category Copying Logic

```typescript
// For each selected category
for (const category of selectedCategories) {
  if (category.hasConflict) {
    // Apply conflict resolution
    if (resolution === 'skip') {
      skippedCount++;
      continue;
    } else if (resolution === 'rename') {
      // Use custom name or default " (Copy)" suffix
      const finalName = category.newName || `${category.name} (Copy)`;

      // Verify renamed category doesn't also conflict
      if (currentCategoryNames.has(finalName.toLowerCase())) {
        throw new Error(`Category "${finalName}" already exists`);
      }

      // Create with new name
      await addCustomCategory({
        name: finalName,
        listId: currentListId,
        color: category.color,
        icon: category.icon,
      }, currentCategories);

      copiedCount++;
    }
  } else {
    // No conflict, copy directly
    await addCustomCategory({
      name: category.name,
      listId: currentListId,
      color: category.color,
      icon: category.icon,
    }, currentCategories);

    copiedCount++;
  }
}
```

### Conflict Detection

```typescript
const currentCategoryNames = useMemo(
  () => new Set(currentCategories.map(cat => cat.name.toLowerCase())),
  [currentCategories]
);

const categoriesWithConflicts: CategoryToCopy[] = sourceCategories.map(cat => {
  const hasConflict = currentCategoryNames.has(cat.name.toLowerCase());
  return {
    ...cat,
    selected: false,
    hasConflict,
    conflictResolution: hasConflict ? conflictResolution : undefined,
    newName: hasConflict ? `${cat.name} (Copy)` : undefined,
  };
});
```

### Data Integration

The feature integrates seamlessly with existing infrastructure:
- Uses `useGroceryLists()` hook to fetch available lists
- Uses `useCustomCategories()` hook to fetch categories for selected list
- Uses `addCustomCategory()` mutation from `useCustomCategoryMutations()`
- Leverages existing category validation logic
- Respects permission levels (only available to editors and owners)

## Error Handling

### Validation Errors
- Empty selection: "Please select at least one category to copy"
- Duplicate renamed category: "Category '[name]' already exists. Please choose a different name."
- Permission errors: Handled by existing `addCustomCategory` mutation

### User Feedback
- **Success:** Green message with count of imported categories
- **Partial Success:** Warning message indicating skipped categories due to conflicts
- **Error:** Red error message with specific failure reason
- **Auto-dismiss:** Success/error messages automatically disappear after 5 seconds

### Edge Cases
- No other lists available: Shows empty state with helpful message
- Selected list has no custom categories: Shows empty state with helpful message
- All selected categories conflict and "Skip" selected: Shows warning about no categories being copied
- Network errors: Caught and displayed as error messages

## Permissions

The "Import from List" button only appears when:
- User has `owner` or `editor` permission level
- This matches the permission requirements for creating categories

## Accessibility

### Keyboard Navigation
- Modal closes on Escape key (unless another dialog is open)
- Tab navigation through all interactive elements
- Enter key submits selections

### Screen Readers
- Proper ARIA labels on buttons and checkboxes
- Semantic HTML structure
- Descriptive button text with icons

### Visual Feedback
- Hover states on all interactive elements
- Active states for selected items
- Focus indicators on keyboard navigation
- Color-blind friendly: conflicts indicated with both color AND badge text

## Responsive Design

### Desktop (> 640px)
- Grid layout for list selection (auto-fill, min 200px)
- Side-by-side layout for section title and button
- Horizontal layout for conflict resolution options

### Mobile (≤ 640px)
- Single column list selection
- Stacked layout for title and button
- Vertical layout for conflict resolution options
- Full-screen modal (100% width/height, no border radius)
- Stacked layout for rename input labels

## Future Enhancements

1. **Overwrite Strategy:** Implement actual overwriting of existing categories (currently skips)
2. **Batch Import from Multiple Lists:** Allow selecting categories from multiple source lists
3. **Category Templates:** Pre-defined category sets users can import
4. **Import/Export:** Save category sets as JSON files for sharing
5. **Merge Categories:** Option to merge similar categories during import
6. **Import History:** Track which categories were imported from where
7. **Preview Changes:** Show a detailed preview before executing the copy
8. **Undo Import:** Ability to undo a bulk import operation
9. **Smart Suggestions:** AI-powered category suggestions based on existing categories
10. **Favorite Lists:** Pin frequently-used source lists for quick access

## Use Cases

### Scenario 1: New List Creation
User creates a new list for a specific occasion (e.g., "BBQ Party") and wants to use the same categories from their main grocery list:
1. Opens category manager for new list
2. Clicks "Import from List"
3. Selects main grocery list
4. Selects all categories or specific ones
5. Imports in one click

### Scenario 2: Category Standardization
User wants to standardize categories across multiple lists:
1. Creates comprehensive categories in one "master" list
2. Goes to each other list
3. Imports categories from master list
4. All lists now have consistent categorization

### Scenario 3: Seasonal Lists
User creates seasonal lists (e.g., "Summer BBQ", "Holiday Baking") that share some categories but have unique ones:
1. Starts with base categories from main list
2. Adds seasonal-specific categories
3. Next season, imports from previous seasonal list
4. Modifies as needed for current season

### Scenario 4: Shared List Setup
User shares a list with family and wants them to have the same category structure:
1. Imports categories from personal list to shared list
2. All family members see consistent categories
3. Easier collaboration and item organization

## Performance Considerations

- **Lazy Loading:** Modal content only rendered when opened
- **Memoization:** List filtering and conflict detection use `useMemo()`
- **Batch Operations:** Categories copied in sequence but with single success message
- **Optimistic UI:** Modal shows immediate feedback before API completion
- **Error Recovery:** Failed operations don't affect already-copied categories

## Testing Recommendations

### Unit Tests
- Category selection toggle logic
- Conflict detection algorithm
- Name normalization (case-insensitive matching)
- Rename validation logic

### Integration Tests
- Full copy workflow from selection to creation
- Conflict resolution strategies
- Permission checks
- Error handling paths

### E2E Tests
- Complete user flow from button click to success
- Empty state scenarios
- Multi-list workflow
- Mobile responsive behavior

## Dependencies

### Existing Hooks
- `useCustomCategories(listId)` - Fetch categories for a list
- `useCustomCategoryMutations()` - Mutations for category operations
- `useGroceryLists()` - Fetch all accessible lists

### Existing Components
- Color preview indicators (using existing category item styles)
- Button components (reusing existing button classes)
- Message components (reusing existing success/error message styles)

### Existing Types
- `CustomCategory` - Category data structure
- `PermissionLevel` - User permission types

## Summary

The Category Copy feature provides a powerful and user-friendly way to reuse category configurations across lists. It handles conflicts intelligently, provides clear feedback, and integrates seamlessly with the existing Custom Category Manager. The implementation is robust, accessible, and ready for production use.

**Key Benefits:**
- **Time Savings:** No more manual recreation of categories
- **Consistency:** Maintain standardized categories across lists
- **Flexibility:** Choose which categories to copy and how to handle conflicts
- **User-Friendly:** Clear UI with helpful feedback and guidance
- **Permission-Aware:** Respects existing permission model
- **Accessible:** Keyboard navigation and screen reader support
- **Responsive:** Works great on all device sizes
