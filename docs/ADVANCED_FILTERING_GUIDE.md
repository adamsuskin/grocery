# Advanced Category Filtering - Quick Reference Guide

## Overview

The Advanced Category Filtering system allows you to create powerful, customized views of your grocery items with saved filter presets and intelligent category suggestions.

## Key Features

### 🎯 Filter Modes

**Include Mode** (default)
- Shows only items in selected categories
- Example: Select "Produce" and "Dairy" to see only those items

**Exclude Mode**
- Shows items NOT in selected categories
- Example: Select "Other" to hide miscellaneous items

### 📋 Category Types

- **All Categories**: Shows both predefined and custom categories
- **Predefined Only**: Filters to system categories (Produce, Dairy, etc.)
- **Custom Only**: Shows only your custom categories

### ⭐ Filter Presets

Save your frequently used filter combinations for one-click access:
1. Set up your desired filters
2. Click "⭐ Presets"
3. Click "+ Save Current Filters"
4. Name your preset
5. Apply anytime with one click

### 🔍 Frequently Used Categories

The top 5 most-used categories appear at the top of the dropdown for quick access, with usage counts shown.

## Quick Actions

### Bulk Operations
- **Select All**: Check all categories at once
- **Deselect All**: Uncheck all categories
- **Clear All Filters**: Reset to default state

### Active Filters
Filter chips show what's currently active:
- Click the ✕ on any chip to remove that filter
- See at a glance what filters are applied

## Usage Examples

### Example 1: Shopping Trip Focus
**Scenario**: You're going to the store and only want to see fresh items

1. Open category dropdown
2. Select "Predefined Only"
3. Check: Produce, Dairy, Meat, Bakery
4. Save as preset: "Fresh Items"

### Example 2: Hide Completed Sections
**Scenario**: You've finished shopping for produce and dairy

1. Switch to "Exclude" mode
2. Select: Produce, Dairy
3. Items from those categories are hidden

### Example 3: Custom Category Focus
**Scenario**: You have custom categories for meal planning

1. Select "Custom Only" type
2. Check your meal prep categories
3. Save as preset: "Meal Prep"

### Example 4: Weekly Staples
**Scenario**: Create a reusable filter for weekly shopping

1. Select categories you buy every week
2. Uncheck "Show gotten items"
3. Save as preset: "Weekly Staples"
4. Apply each week for quick list creation

## Keyboard Shortcuts

- **Escape**: Close any open dropdown
- **Tab**: Navigate through filter controls
- **Space/Enter**: Toggle checkboxes
- **Arrow Keys**: Navigate list items

## Tips & Tricks

### Efficient Filtering
- Use presets for recurring shopping patterns
- Combine search with category filters for precision
- Use exclude mode to focus on remaining items

### Organizing Large Lists
- Create category-specific presets
- Use custom categories for special occasions
- Hide gotten items to see what's left

### Quick List Management
- Save "Active Items" preset (hide gotten)
- Create "Needs Price" preset (filter unpriced items)
- Use "Fresh First" preset (produce, dairy, meat)

## Filter Persistence

### Per-List Memory
Your filter settings are automatically saved for each list separately. When you switch lists, your preferred filters for that list are restored.

### Filter Presets
Presets are global and work across all lists. They're stored in your browser and persist across sessions.

### Export/Import
Use the filter preferences API to export your presets for backup:

```javascript
import { exportFilterPreferences } from './utils/filterPreferences';
const backup = exportFilterPreferences();
// Save this JSON string
```

## Troubleshooting

**Filters not saving?**
- Check localStorage is enabled in browser
- Ensure you have storage space available

**Frequently used categories empty?**
- Add items to categories and filter by them
- Analytics build over time with usage

**Preset limit reached?**
- Maximum 20 presets supported
- Delete unused presets to make room
- Export presets before deleting

**Filters reset unexpectedly?**
- Check if localStorage was cleared
- Browser incognito mode doesn't persist
- Export presets regularly as backup

## Best Practices

### Naming Presets
- Use descriptive names: "Weekly Produce", not "Filter1"
- Include context: "Holiday Baking", "Meal Prep Mon-Wed"
- Keep names short for mobile display

### Managing Presets
- Delete unused presets regularly
- Export presets before major changes
- Group similar presets with naming conventions

### Category Organization
- Use custom categories for special needs
- Keep category names concise
- Archive unused custom categories

### Performance
- Avoid extremely complex filter combinations
- Clear search text when not needed
- Use category filters instead of many search terms

## Integration with Other Features

### Category Analytics
Filter usage is tracked in category analytics:
- Most filtered categories appear in "Frequently Used"
- Filter patterns inform future suggestions
- Usage data helps optimize your workflow

### List Sharing
Filter preferences are personal:
- Each user has their own filter settings
- Presets aren't shared with list members
- Great for different shopping preferences

### Budget Tracking
Combine filters with budget tracking:
- Filter by category to see category spending
- Use presets to track regular purchases
- Monitor budget per category group

## API Integration

### Programmatic Filter Management

```typescript
import {
  getListFilters,
  saveListFilters,
  getSavedFilters,
  saveFilterPreset,
  applySavedFilter
} from './utils/filterPreferences';

// Get current list filters
const filters = getListFilters('list-123', allCategories);

// Save a new preset
const preset = saveFilterPreset('My Preset', {
  searchText: '',
  showGotten: false,
  categories: ['Produce', 'Dairy'],
  categoryMode: 'include',
  categoryType: 'predefined'
});

// Apply a preset
const applied = applySavedFilter(preset.id);
```

## Accessibility

The filtering system is fully accessible:
- Screen reader compatible
- Full keyboard navigation
- ARIA labels and roles
- High contrast support
- Focus management

Navigate entirely by keyboard:
1. Tab to filter controls
2. Space/Enter to activate
3. Arrow keys within dropdowns
4. Escape to close

## Mobile Experience

Optimized for mobile devices:
- Touch-friendly controls
- Responsive dropdowns
- Swipe to close
- Optimized scrolling
- Full-width on small screens

## Advanced Usage

### Power User Features

**Rapid Filtering**
1. Create presets for common scenarios
2. Use frequently used categories section
3. Combine with keyboard shortcuts
4. Master include/exclude toggle

**Complex Filters**
- Exclude common categories, include rare ones
- Mix predefined and custom in smart ways
- Use search + category filtering
- Stack multiple filter chips

**Workflow Optimization**
- Create presets for different family members
- Set up meal-plan specific filters
- Build store-section presets
- Organize by dietary restrictions

## Support

For issues or questions:
1. Check this guide first
2. Review the main documentation
3. Check browser console for errors
4. Export presets before troubleshooting
5. Clear cache as last resort

---

**Version**: 1.0.0
**Last Updated**: 2025-10-26
**Component**: SearchFilterBar
**Status**: Production Ready
