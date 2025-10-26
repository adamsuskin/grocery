# Custom Categories Onboarding Tour - Flow Diagram

## Overview Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    User Opens Application                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         Has user completed main onboarding tour?             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                ┌───────────┴──────────┐
                │ No                   │ Yes
                ▼                      ▼
    ┌──────────────────────┐    ┌──────────────────────┐
    │ Show Main Tour       │    │ Continue to App      │
    │ (OnboardingTour)     │    │                      │
    └──────────┬───────────┘    └──────────┬───────────┘
               │                           │
               │ Complete                  │
               └───────────┬───────────────┘
                           │
                           ▼
             ┌─────────────────────────────┐
             │   User Interacts with App   │
             └─────────────────────────────┘
```

## Custom Categories Tour Contexts

### Context 1: Category Manager Tour

```
┌─────────────────────────────────────────────────────────────┐
│        User Opens CustomCategoryManager Component            │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Check: shouldShowTour('manager', hasCustomCategories)       │
│  - Has user completed manager tour?                          │
│  - Has user dismissed with "Don't show again"?               │
│  - Does user have edit permissions?                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                ┌───────────┴──────────┐
                │ Show Tour            │ Skip Tour
                ▼                      ▼
    ┌──────────────────────┐    ┌──────────────────────┐
    │ Manager Tour (5 Steps)│    │ Show Manager UI      │
    └──────────┬───────────┘    │ without tour         │
               │                 └──────────────────────┘
               │
┌──────────────┴───────────────┐
│  Step 1: Welcome              │
│  Position: center             │
│  "Welcome to Custom           │
│   Categories!"                │
└──────────────┬───────────────┘
               │ Next
               ▼
┌──────────────────────────────┐
│  Step 2: Create Category      │
│  Target: .category-form       │
│  Position: bottom             │
│  Highlight: Creation form     │
│  Interactive: Yes             │
└──────────────┬───────────────┘
               │ Next
               ▼
┌──────────────────────────────┐
│  Step 3: Category List        │
│  Target: .custom-categories   │
│  Position: top                │
│  Highlight: Category list     │
└──────────────┬───────────────┘
               │ Next
               ▼
┌──────────────────────────────┐
│  Step 4: Bulk Operations      │
│  Target: .bulk-operations-    │
│           toolbar             │
│  Position: bottom             │
│  Highlight: Bulk toolbar      │
└──────────────┬───────────────┘
               │ Next
               ▼
┌──────────────────────────────┐
│  Step 5: Complete             │
│  Position: center             │
│  Shows: Don't show again      │
│         checkbox              │
└──────────────┬───────────────┘
               │
     ┌─────────┴────────┐
     │ Complete         │ Skip
     ▼                  ▼
┌─────────────┐    ┌─────────────┐
│ Save to     │    │ Save to     │
│ localStorage│    │ localStorage│
│ as completed│    │ if checked  │
└─────────────┘    └─────────────┘
```

### Context 2: AddItem Form Tour

```
┌─────────────────────────────────────────────────────────────┐
│           User Views AddItemForm Component                   │
│         (After creating custom categories)                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Check: shouldShowTour('additem', hasCustomCategories > 0)   │
│  - Has user completed additem tour?                          │
│  - Has user dismissed with "Don't show again"?               │
│  - Does user have custom categories?                         │
│  - Does user have edit permissions?                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                ┌───────────┴──────────┐
                │ Show Tour            │ Skip Tour
                ▼                      ▼
    ┌──────────────────────┐    ┌──────────────────────┐
    │AddItem Tour (4 Steps) │    │ Show Form UI         │
    └──────────┬───────────┘    │ without tour         │
               │                 └──────────────────────┘
               │
┌──────────────┴───────────────┐
│  Step 1: Welcome              │
│  Position: center             │
│  "Custom Categories           │
│   in Action"                  │
└──────────────┬───────────────┘
               │ Next
               ▼
┌──────────────────────────────┐
│  Step 2: Category Dropdown    │
│  Target: .category-select-    │
│           wrapper             │
│  Position: bottom             │
│  Highlight: Dropdown          │
│  Interactive: Yes             │
└──────────────┬───────────────┘
               │ Next
               ▼
┌──────────────────────────────┐
│  Step 3: Manage Button        │
│  Target: .manage-categories-  │
│           btn                 │
│  Position: bottom             │
│  Highlight: Manage button     │
└──────────────┬───────────────┘
               │ Next
               ▼
┌──────────────────────────────┐
│  Step 4: Complete             │
│  Position: center             │
│  Shows: Don't show again      │
│         checkbox              │
└──────────────┬───────────────┘
               │
     ┌─────────┴────────┐
     │ Complete         │ Skip
     ▼                  ▼
┌─────────────┐    ┌─────────────┐
│ Save to     │    │ Save to     │
│ localStorage│    │ localStorage│
│ as completed│    │ if checked  │
└─────────────┘    └─────────────┘
```

### Context 3: Filter Tour (Future)

```
┌─────────────────────────────────────────────────────────────┐
│         User Interacts with Category Filters                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Check: shouldShowTour('filter', hasCustomCategories > 0)    │
│  - Has user completed filter tour?                           │
│  - Has user dismissed with "Don't show again"?               │
│  - Does user have custom categories?                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                ┌───────────┴──────────┐
                │ Show Tour            │ Skip Tour
                ▼                      ▼
    ┌──────────────────────┐    ┌──────────────────────┐
    │ Filter Tour (3 Steps) │    │ Show Filter UI       │
    └──────────┬───────────┘    │ without tour         │
               │                 └──────────────────────┘
               │
┌──────────────┴───────────────┐
│  Step 1: Welcome              │
│  "Filter by Custom            │
│   Categories"                 │
└──────────────┬───────────────┘
               │ Next
               ▼
┌──────────────────────────────┐
│  Step 2: Filter Controls      │
│  Target: .category-filter-    │
│           controls            │
│  Highlight: Filter dropdown   │
└──────────────┬───────────────┘
               │ Next
               ▼
┌──────────────────────────────┐
│  Step 3: Complete             │
│  "Happy shopping!"            │
│  Shows: Don't show again      │
└──────────────┬───────────────┘
               │
     ┌─────────┴────────┐
     │ Complete         │ Skip
     ▼                  ▼
┌─────────────┐    ┌─────────────┐
│ Save to     │    │ Save to     │
│ localStorage│    │ localStorage│
└─────────────┘    └─────────────┘
```

## State Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│               useCustomCategoriesTour Hook                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
            ▼                               ▼
┌──────────────────────┐        ┌──────────────────────┐
│   localStorage       │        │   sessionStorage     │
│   (Persistent)       │        │   (Temporary)        │
└──────────┬───────────┘        └──────────┬───────────┘
           │                               │
           │                               │
    ┌──────┴─────────┐              ┌─────┴──────┐
    │                │              │            │
    ▼                ▼              ▼            ▼
┌────────┐    ┌────────┐    ┌─────────┐  ┌─────────┐
│Completed│    │Dismissed│   │Resume   │  │Resume   │
│ Status  │    │ Status  │   │  Step   │  │ Context │
└────────┘    └────────┘    └─────────┘  └─────────┘
    │              │              │            │
    │              │              │            │
    ▼              ▼              ▼            ▼
  tour-          tour-          resume-      resume-
manager-       manager-         step        context
completed      dismissed
  tour-          tour-
additem-       additem-
completed      dismissed
  tour-          tour-
filter-        filter-
completed      dismissed
```

## User Actions and Navigation

```
┌─────────────────────────────────────────────────────────────┐
│                     Tour is Active                           │
└───────────────────────────┬─────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
    ┌──────────┐      ┌──────────┐    ┌──────────┐
    │ Keyboard │      │  Mouse   │    │  Touch   │
    │  Input   │      │  Input   │    │  Input   │
    └────┬─────┘      └────┬─────┘    └────┬─────┘
         │                 │                │
         │                 │                │
    ┌────┴─────────────────┴────────────────┴────┐
    │                                             │
    │  Available Actions:                         │
    │  - Arrow Right: Next step                   │
    │  - Arrow Left: Previous step                │
    │  - Enter: Complete (last step)              │
    │  - Escape: Skip tour                        │
    │  - Click Next: Next step                    │
    │  - Click Previous: Previous step            │
    │  - Click Skip: Skip tour                    │
    │  - Click Progress Dot: Jump to step         │
    │  - Click X: Close tour                      │
    │  - Check "Don't show again": Set preference │
    │                                             │
    └──────────────────┬──────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
    ┌─────────┐               ┌─────────┐
    │Continue │               │  Close  │
    │  Tour   │               │  Tour   │
    └─────────┘               └─────────┘
```

## Replay Tour Flow

```
┌─────────────────────────────────────────────────────────────┐
│          User Opens Profile Settings                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│   User Clicks "Replay Custom Categories Tours"              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│   resetAllCustomCategoriesTours()                            │
│   - Remove all completed flags                               │
│   - Remove all dismissed flags                               │
│   - Clear resume data                                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│   Alert: "Tours have been reset"                            │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│   Next time user triggers a tour context:                   │
│   - Manager tour shows when opening manager                  │
│   - AddItem tour shows when viewing form                     │
│   - Filter tour shows when using filters                     │
└─────────────────────────────────────────────────────────────┘
```

## Component Interaction Diagram

```
┌────────────────────────────────────────────────────────────┐
│                         App.tsx                             │
│  - Main application component                               │
│  - Contains list management                                 │
└──────────────┬──────────────┬──────────────────────────────┘
               │              │
     ┌─────────┘              └─────────┐
     │                                  │
     ▼                                  ▼
┌─────────────────────┐    ┌─────────────────────┐
│ CustomCategory      │    │ AddItemForm         │
│ Manager             │    │                     │
└────────┬────────────┘    └────────┬────────────┘
         │                          │
         │ Uses                     │ Uses
         ▼                          ▼
┌───────────────────────────────────────────────┐
│      useCustomCategoriesTour Hook             │
│  - Manages tour state                         │
│  - Checks completion status                   │
│  - Provides tour control functions            │
└───────────────────┬───────────────────────────┘
                    │
                    │ Renders
                    ▼
┌───────────────────────────────────────────────┐
│   CustomCategoriesOnboardingTour              │
│  - Renders tour UI                            │
│  - Handles spotlight and tooltips             │
│  - Manages step navigation                    │
│  - Persists preferences                       │
└───────────────────┬───────────────────────────┘
                    │
                    │ Styles
                    ▼
┌───────────────────────────────────────────────┐
│     OnboardingTour.css                        │
│  - Tour styling                               │
│  - Spotlight effects                          │
│  - Responsive design                          │
└───────────────────────────────────────────────┘
```

## Summary

The tour system provides:

1. **Three independent tour contexts** - Each with its own completion tracking
2. **Smart triggering logic** - Shows tours when conditions are met
3. **State persistence** - Remembers user preferences and progress
4. **Resume capability** - Can resume interrupted tours
5. **Replay functionality** - Users can reset and replay tours
6. **Interactive UI** - Spotlight highlights, tooltips, and navigation
7. **Accessibility** - Keyboard navigation and ARIA labels
8. **Mobile responsive** - Works on all screen sizes

Each tour is self-contained and can be completed, skipped, or dismissed independently, providing a flexible and non-intrusive onboarding experience.
