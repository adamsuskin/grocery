# Category i18n Quick Start Guide

## 🚀 5-Minute Setup

### 1. Install (No Dependencies Needed!)

All i18n functionality is already included. No npm packages to install.

### 2. Use in Your Component

```typescript
import { useTranslation } from '../utils/i18n';

function MyComponent() {
  const { t, language, setLanguage } = useTranslation();

  return (
    <div>
      <h1>{t('categories.ui.manageCustomCategories')}</h1>
      <button>{t('categories.ui.addCategory')}</button>

      {/* Language Selector */}
      <select value={language} onChange={(e) => setLanguage(e.target.value as any)}>
        <option value="en">English</option>
        <option value="es">Español</option>
        <option value="fr">Français</option>
        <option value="de">Deutsch</option>
      </select>
    </div>
  );
}
```

### 3. That's It!

The system will:
- ✅ Automatically detect user's browser language
- ✅ Fall back to English if translation is missing
- ✅ Save language preference to localStorage
- ✅ Load translations lazily for performance

## 📋 Common Translation Keys

```typescript
// UI Labels
t('categories.ui.addCategory')           // "Add Category"
t('categories.ui.editCategory')          // "Edit Category"
t('categories.ui.deleteCategory')        // "Delete Category"
t('categories.ui.categoryName')          // "Category Name"

// Predefined Categories
t('categories.predefined.Produce')       // "Produce" / "Productos Frescos" / etc.
t('categories.predefined.Dairy')         // "Dairy" / "Lácteos" / etc.

// Error Messages
t('categories.errors.cannotBeEmpty')     // "Category name cannot be empty"
t('categories.errors.alreadyExists')     // "A category with this name already exists"

// Success Messages
t('categories.messages.categoryAdded')   // "Category added successfully"
```

## 🔧 Validation with i18n

```typescript
import { validateCategoryName } from '../utils/categoryValidation.i18n';
import { useTranslation } from '../utils/i18n';

function CategoryForm() {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (name: string) => {
    // Validate and get translation key
    const errorKey = validateCategoryName(name, existingCategories);

    if (errorKey) {
      // Translate the key to get localized error message
      setError(t(errorKey));
      return;
    }

    // Success - proceed
  };
}
```

## 💡 Important Rules

### ✅ DO Translate:
- Predefined category names (Produce, Dairy, etc.)
- UI labels and buttons
- Error messages
- Help text
- Confirmation dialogs

### ❌ DON'T Translate:
- Custom category names (user-created)
- User input data
- API responses

## 🌍 Supported Languages

| Code | Language | Native Name |
|------|----------|-------------|
| `en` | English  | English     |
| `es` | Spanish  | Español     |
| `fr` | French   | Français    |
| `de` | German   | Deutsch     |

## 📚 Full Documentation

See [CATEGORY_I18N_GUIDE.md](./CATEGORY_I18N_GUIDE.md) for:
- Complete API reference
- Integration steps
- Adding new languages
- Troubleshooting
- Best practices

## 🎯 Example Files

- **Full Component**: `src/components/CustomCategoryManager.i18n.example.tsx`
- **i18n Utility**: `src/utils/i18n.ts`
- **Validation**: `src/utils/categoryValidation.i18n.ts`
- **Translations**: `src/locales/*.json`

## 🐛 Quick Troubleshooting

**Translation not showing?**
```typescript
// Check console for warnings
console.log('Translation missing for key: categories.ui.myKey');

// Verify key exists in src/locales/en.json
```

**Language not persisting?**
```typescript
// Check localStorage
console.log(localStorage.getItem('grocery-app-language'));
```

**Validation errors not translated?**
```typescript
// Make sure you're using the i18n version
import { validateCategoryFields } from '../utils/categoryValidation.i18n'; // ✅
// NOT from '../utils/categoryValidation'; // ❌
```

## 🎨 Adding Language Selector to UI

```typescript
function LanguageSelector() {
  const { language, setLanguage, availableLanguages } = useTranslation();

  return (
    <div className="language-selector">
      <label>Language:</label>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as any)}
      >
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

## 🔥 Pro Tips

1. **Interpolation**: Use variables in translations
   ```typescript
   t('categories.messages.bulkDeleted', { count: 5, categories: 'categories' })
   // "Successfully deleted 5 categories"
   ```

2. **Pluralization**: Handle singular/plural
   ```typescript
   const count = items.length;
   const word = count === 1 ? 'category' : 'categories';
   t('categories.messages.bulkDeleted', { count, categories: word })
   ```

3. **Loading State**: Check if translations are loading
   ```typescript
   const { isLoading } = useTranslation();
   if (isLoading) return <Spinner />;
   ```

4. **Type Safety**: Use TypeScript autocomplete
   ```typescript
   // t() is fully typed with all available keys
   t('categories.ui.') // <-- Auto-complete will show all options
   ```

That's it! You now have full internationalization support for categories. 🎉
