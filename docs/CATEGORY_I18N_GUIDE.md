# Category Internationalization (i18n) Integration Guide

## Overview

This guide explains how to integrate internationalization support for categories in the grocery list application. The i18n system provides multi-language support for predefined categories, custom category UI labels, error messages, and help text.

## Architecture

### Files Created

```
src/
├── utils/
│   ├── i18n.ts                           # Core i18n utility with useTranslation hook
│   └── categoryValidation.i18n.ts        # Validation with translation key support
├── locales/
│   ├── en.json                           # English translations
│   ├── es.json                           # Spanish translations
│   ├── fr.json                           # French translations
│   └── de.json                           # German translations
└── components/
    └── CustomCategoryManager.i18n.example.tsx  # Example integration
```

### Supported Languages

- **English (en)** - Default language
- **Spanish (es)** - Español
- **French (fr)** - Français
- **German (de)** - Deutsch

## Quick Start

### 1. Basic Usage in a Component

```typescript
import { useTranslation } from '../utils/i18n';

function MyComponent() {
  const { t, language, setLanguage, availableLanguages } = useTranslation();

  return (
    <div>
      <h1>{t('categories.ui.manageCustomCategories')}</h1>
      <p>{t('categories.help.categoryNameHelp')}</p>

      {/* Language Selector */}
      <select value={language} onChange={(e) => setLanguage(e.target.value as any)}>
        {availableLanguages.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### 2. Translation with Interpolation

For dynamic messages with variables:

```typescript
const { t } = useTranslation();

// Translation key: "Successfully deleted {count} {categories}"
const count = 5;
const categories = count === 1 ? 'category' : 'categories';
const message = t('categories.messages.bulkDeleted', { count, categories });
// Result: "Successfully deleted 5 categories"
```

### 3. Predefined Category Translation

Predefined categories are automatically translated based on the user's language:

```typescript
const { t } = useTranslation();

// English: "Produce"
// Spanish: "Productos Frescos"
// French: "Produits Frais"
// German: "Obst und Gemüse"
const categoryName = t('categories.predefined.Produce');
```

### 4. Validation with Translation Keys

The new validation module returns translation keys instead of hardcoded messages:

```typescript
import { validateCategoryName } from '../utils/categoryValidation.i18n';
import { useTranslation } from '../utils/i18n';

function CategoryForm() {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (name: string) => {
    const errorKey = validateCategoryName(name, existingCategories);
    if (errorKey) {
      // Translate the error key to get the localized message
      setError(t(errorKey));
      return;
    }
    // Proceed with valid name
  };
}
```

## Translation Keys Reference

### Predefined Categories

```typescript
'categories.predefined.Produce'
'categories.predefined.Dairy'
'categories.predefined.Meat'
'categories.predefined.Bakery'
'categories.predefined.Pantry'
'categories.predefined.Frozen'
'categories.predefined.Beverages'
'categories.predefined.Other'
```

### UI Labels

```typescript
'categories.ui.customCategories'          // "Custom Categories"
'categories.ui.addCategory'               // "Add Category"
'categories.ui.editCategory'              // "Edit Category"
'categories.ui.deleteCategory'            // "Delete Category"
'categories.ui.categoryName'              // "Category Name"
'categories.ui.categoryColor'             // "Category Color"
'categories.ui.categoryIcon'              // "Category Icon"
'categories.ui.manageCustomCategories'    // "Manage Custom Categories"
'categories.ui.addNewCategory'            // "Add New Category"
'categories.ui.yourCustomCategories'      // "Your Custom Categories"
'categories.ui.predefinedCategories'      // "Predefined Categories"
'categories.ui.saveCategory'              // "Save Category"
'categories.ui.cancel'                    // "Cancel"
'categories.ui.save'                      // "Save"
'categories.ui.delete'                    // "Delete"
'categories.ui.edit'                      // "Edit"
'categories.ui.close'                     // "Close"
```

### Error Messages

```typescript
'categories.errors.cannotBeEmpty'         // "Category name cannot be empty"
'categories.errors.tooLong'               // "Category name must be 100 characters or less"
'categories.errors.predefinedName'        // "Cannot use predefined category names..."
'categories.errors.alreadyExists'         // "A category with this name already exists"
'categories.errors.invalidColor'          // "Color must be a valid hex code..."
'categories.errors.invalidIcon'           // "Icon must be between 1 and 10 characters"
'categories.errors.failedToAdd'           // "Failed to add category. Please try again."
'categories.errors.failedToUpdate'        // "Failed to update category. Please try again."
'categories.errors.failedToDelete'        // "Failed to delete category. Please try again."
```

### Success Messages

```typescript
'categories.messages.categoryAdded'       // "Category added successfully"
'categories.messages.categoryUpdated'     // "Category updated successfully"
'categories.messages.categoryDeleted'     // "Category deleted successfully"
'categories.messages.bulkDeleted'         // "Successfully deleted {count} {categories}"
'categories.messages.bulkUpdated'         // "Successfully updated color for {count} {categories}"
```

### Confirmation Dialogs

```typescript
'categories.confirmations.deleteTitle'           // "Delete Category?"
'categories.confirmations.deleteMessage'         // "Are you sure you want to delete \"{name}\"?"
'categories.confirmations.deleteWarning'         // Warning text for deletion
'categories.confirmations.bulkDeleteTitle'       // "Delete Multiple Categories?"
'categories.confirmations.bulkDeleteMessage'     // Bulk delete confirmation message
```

### Help Text

```typescript
'categories.help.categoryNameHelp'        // "Choose a descriptive name for your category..."
'categories.help.colorHelp'               // "Pick a color to help visually identify this category"
'categories.help.iconHelp'                // "Add an emoji or icon to make your category stand out"
'categories.help.customCategoriesHelp'    // "Custom categories are specific to this list..."
```

## Integration Steps

### Step 1: Update Existing Component

Replace hardcoded strings in your component with translation calls:

**Before:**
```typescript
<h2>Manage Custom Categories</h2>
<button>Add Category</button>
```

**After:**
```typescript
const { t } = useTranslation();

<h2>{t('categories.ui.manageCustomCategories')}</h2>
<button>{t('categories.ui.addCategory')}</button>
```

### Step 2: Handle Validation Errors

Update validation error handling to use translation keys:

**Before:**
```typescript
const validationErrors = validateCategoryFields({ name, color, icon }, categories);
if (validationErrors.name) {
  setError(validationErrors.name); // Hardcoded English message
}
```

**After:**
```typescript
import { validateCategoryFields } from '../utils/categoryValidation.i18n';

const { t } = useTranslation();
const validationErrors = validateCategoryFields({ name, color, icon }, categories);
if (validationErrors.name) {
  setError(t(validationErrors.name)); // Translated message
}
```

### Step 3: Add Language Selector (Optional)

Add a language selector to allow users to change the interface language:

```typescript
import { useTranslation } from '../utils/i18n';

function LanguageSelector() {
  const { language, setLanguage, availableLanguages } = useTranslation();

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value as any)}
      className="language-select"
    >
      {availableLanguages.map(lang => (
        <option key={lang.code} value={lang.code}>
          {lang.nativeName}
        </option>
      ))}
    </select>
  );
}
```

### Step 4: Replace CustomCategoryManager (Optional)

To fully integrate i18n into the CustomCategoryManager component:

1. Review the example file: `src/components/CustomCategoryManager.i18n.example.tsx`
2. Compare changes with your current `CustomCategoryManager.tsx`
3. Merge the i18n changes into your component

Key changes needed:
- Add `const { t } = useTranslation()` at the top
- Replace all string literals with `t()` calls
- Update validation to use translation keys
- Add optional language selector

## Custom Categories Handling

### Important: Custom Categories Are NOT Translated

Custom categories are user-created and should **always** be displayed exactly as the user entered them:

```typescript
// ✅ CORRECT: Display custom category name as-is
<span className="category-name">{category.name}</span>

// ❌ WRONG: Don't try to translate custom category names
<span className="category-name">{t(category.name)}</span>
```

### Why?

1. **User Intent**: Custom categories are personal to the user and their language
2. **Data Integrity**: The name is stored exactly as entered
3. **Simplicity**: No need for complex translation management
4. **Flexibility**: Users can name categories in any language they prefer

### Predefined vs Custom Categories

```typescript
// Predefined categories: ALWAYS translate
const predefinedCategory = "Produce";
<span>{t(`categories.predefined.${predefinedCategory}`)}</span>
// English: "Produce"
// Spanish: "Productos Frescos"

// Custom categories: NEVER translate
const customCategory = "Especias Mexicanas"; // User's input
<span>{category.name}</span>
// Always displays: "Especias Mexicanas"
```

## Adding New Languages

To add support for a new language (e.g., Italian):

### 1. Create Translation File

Create `src/locales/it.json`:

```json
{
  "categories": {
    "predefined": {
      "Produce": "Prodotti Freschi",
      "Dairy": "Latticini",
      // ... other translations
    },
    "ui": {
      "customCategories": "Categorie Personalizzate",
      "addCategory": "Aggiungi Categoria",
      // ... other translations
    }
  }
}
```

### 2. Update i18n.ts

Add the new language to the type and available languages:

```typescript
// Update SupportedLanguage type
export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'it';

// Update detectBrowserLanguage function
export function detectBrowserLanguage(): SupportedLanguage {
  const browserLang = navigator.language.toLowerCase();

  if (browserLang.startsWith('es')) return 'es';
  if (browserLang.startsWith('fr')) return 'fr';
  if (browserLang.startsWith('de')) return 'de';
  if (browserLang.startsWith('it')) return 'it'; // Add this

  return 'en';
}

// Update availableLanguages in useTranslation hook
const availableLanguages: Array<{ code: SupportedLanguage; name: string; nativeName: string }> = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' }, // Add this
];
```

### 3. Test the New Language

```typescript
const { setLanguage } = useTranslation();
setLanguage('it'); // Switch to Italian
```

## Best Practices

### 1. Always Use Translation Keys

```typescript
// ✅ GOOD
<button>{t('categories.ui.addCategory')}</button>

// ❌ BAD
<button>Add Category</button>
```

### 2. Handle Pluralization

```typescript
// ✅ GOOD
const count = items.length;
const word = count === 1 ? 'category' : 'categories';
const message = t('categories.messages.bulkDeleted', { count, categories: word });

// ❌ BAD (hardcoded English pluralization)
const message = `Deleted ${count} categories`;
```

### 3. Use Consistent Keys

Follow the namespace structure:
- `categories.predefined.*` - Predefined category names
- `categories.ui.*` - UI labels and buttons
- `categories.errors.*` - Error messages
- `categories.messages.*` - Success/info messages
- `categories.confirmations.*` - Confirmation dialog text
- `categories.help.*` - Help text and tooltips

### 4. Test All Languages

After making changes, test your component in all supported languages:

```typescript
['en', 'es', 'fr', 'de'].forEach(lang => {
  setLanguage(lang);
  // Test component behavior
});
```

### 5. Provide Fallbacks

The i18n system automatically falls back to English if a translation is missing, but log warnings:

```typescript
// The system will log: "Translation missing for key: categories.ui.newKey"
// And display the key itself or English fallback
```

## Performance Considerations

### Translation Caching

The i18n system caches loaded translations to avoid repeated imports:

```typescript
// First load: Fetches from file system
await loadTranslations('es');

// Subsequent loads: Returns from cache
await loadTranslations('es'); // Instant
```

### Lazy Loading

Translations are loaded lazily when the language is first selected:

```typescript
// English is loaded by default
// Spanish is only loaded when user switches to Spanish
setLanguage('es'); // Triggers async load
```

## Troubleshooting

### Translation Not Showing

1. **Check the key exists** in the JSON file
2. **Verify the language file** is in `src/locales/`
3. **Check console** for warnings about missing translations
4. **Ensure proper import** of the useTranslation hook

### Language Not Persisting

The language preference is saved to localStorage:

```typescript
// Check if localStorage is working
localStorage.getItem('grocery-app-language'); // Should return language code

// Clear and reset
localStorage.removeItem('grocery-app-language');
```

### Validation Errors Not Translated

Make sure you're using the i18n version of validation:

```typescript
// ✅ Use this
import { validateCategoryFields } from '../utils/categoryValidation.i18n';

// ❌ Not this
import { validateCategoryFields } from '../utils/categoryValidation';
```

## API Reference

### useTranslation Hook

```typescript
interface UseTranslationReturn {
  t: (key: TranslationKey, interpolations?: Record<string, string | number>) => string;
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  availableLanguages: Array<{
    code: SupportedLanguage;
    name: string;
    nativeName: string;
  }>;
  isLoading: boolean;
}

const { t, language, setLanguage, availableLanguages, isLoading } = useTranslation();
```

### Translation Functions

```typescript
// Get user's preferred language
function getUserLanguage(): SupportedLanguage;

// Set user's language preference
function setUserLanguage(language: SupportedLanguage): void;

// Detect browser language
function detectBrowserLanguage(): SupportedLanguage;

// Load translations for a language
async function loadTranslations(language: SupportedLanguage): Promise<any>;

// Translate a key
function translate(
  key: TranslationKey | string,
  translations: any,
  fallbackTranslations?: any,
  interpolations?: Record<string, string | number>
): string;
```

### Validation Functions

```typescript
// Validate category name, returns translation key or null
function validateCategoryName(
  name: string,
  existingCategories: Array<string | { name: string; id?: string }>,
  excludeId?: string
): CategoryValidationErrorKey | null;

// Validate category color
function validateCategoryColor(color?: string | null): boolean;

// Validate category icon
function validateCategoryIcon(icon?: string | null): boolean;

// Validate all fields
function validateCategoryFields(
  input: { name: string; color?: string | null; icon?: string | null },
  existingCategories: Array<string | { name: string; id?: string }>,
  excludeId?: string
): {
  name?: CategoryValidationErrorKey;
  color?: CategoryValidationErrorKey;
  icon?: CategoryValidationErrorKey;
};
```

## Examples

### Complete Component Example

See `src/components/CustomCategoryManager.i18n.example.tsx` for a complete, production-ready example of a fully internationalized component.

### Adding a New Translation

To add a new translation string:

1. **Add to English** (`src/locales/en.json`):
```json
{
  "categories": {
    "ui": {
      "newFeature": "My New Feature"
    }
  }
}
```

2. **Add to other languages** (es.json, fr.json, de.json):
```json
{
  "categories": {
    "ui": {
      "newFeature": "Mi Nueva Función"
    }
  }
}
```

3. **Update TypeScript types** in `src/utils/i18n.ts`:
```typescript
export type TranslationKey =
  | 'categories.ui.newFeature' // Add this
  | // ... other keys
```

4. **Use in component**:
```typescript
const { t } = useTranslation();
<div>{t('categories.ui.newFeature')}</div>
```

## Migration Checklist

- [ ] Review `CustomCategoryManager.i18n.example.tsx`
- [ ] Update validation imports to use `categoryValidation.i18n.ts`
- [ ] Replace hardcoded strings with `t()` calls
- [ ] Add language selector to settings/preferences
- [ ] Test all supported languages (en, es, fr, de)
- [ ] Update error handling to translate validation keys
- [ ] Test pluralization for bulk operations
- [ ] Verify predefined categories display correctly
- [ ] Ensure custom categories are NOT translated
- [ ] Update documentation for team

## Future Enhancements

Potential improvements to the i18n system:

1. **Right-to-Left (RTL) Support**: Add Arabic, Hebrew support
2. **Date/Time Localization**: Use `Intl.DateTimeFormat`
3. **Number Localization**: Use `Intl.NumberFormat` for counts
4. **Currency Localization**: For budget features
5. **Dynamic Translation Loading**: Load only needed namespaces
6. **Translation Management**: Integration with services like Crowdin
7. **Context-Aware Translations**: Different translations based on context

## Support

For questions or issues with i18n integration:

1. Check this guide for common scenarios
2. Review example files in `src/components/*.i18n.example.tsx`
3. Check console for translation warnings
4. Verify JSON structure in locale files

## Related Documentation

- [Category Analytics Guide](./CATEGORY_ANALYTICS_README.md)
- [Category Validation Documentation](../src/utils/categoryValidation.ts)
- [React i18next Documentation](https://react.i18next.com/) (for reference, not used in this project)
