/**
 * Internationalization (i18n) Utility Module
 *
 * Provides translation support for the grocery list application.
 * This is a lightweight i18n solution that supports multiple languages
 * without requiring external dependencies like react-i18next.
 *
 * Features:
 * - Language detection from browser settings
 * - Fallback to English if translation missing
 * - Type-safe translation keys
 * - React hook for component integration
 *
 * Usage:
 * ```typescript
 * import { useTranslation } from './utils/i18n';
 *
 * function MyComponent() {
 *   const { t, language, setLanguage } = useTranslation();
 *
 *   return <div>{t('categories.ui.addCategory')}</div>;
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Supported languages
 */
export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de';

/**
 * Translation namespace structure
 */
export interface TranslationNamespace {
  categories: {
    predefined: Record<string, string>;
    ui: Record<string, string>;
    errors: Record<string, string>;
    help: Record<string, string>;
  };
}

/**
 * Translation key paths for type safety
 */
export type TranslationKey =
  | 'categories.predefined.Produce'
  | 'categories.predefined.Dairy'
  | 'categories.predefined.Meat'
  | 'categories.predefined.Bakery'
  | 'categories.predefined.Pantry'
  | 'categories.predefined.Frozen'
  | 'categories.predefined.Beverages'
  | 'categories.predefined.Other'
  | 'categories.ui.customCategories'
  | 'categories.ui.addCategory'
  | 'categories.ui.editCategory'
  | 'categories.ui.deleteCategory'
  | 'categories.ui.categoryName'
  | 'categories.ui.categoryColor'
  | 'categories.ui.categoryIcon'
  | 'categories.ui.manageCustomCategories'
  | 'categories.ui.addNewCategory'
  | 'categories.ui.yourCustomCategories'
  | 'categories.ui.predefinedCategories'
  | 'categories.ui.saveCategory'
  | 'categories.ui.cancel'
  | 'categories.ui.save'
  | 'categories.ui.delete'
  | 'categories.ui.edit'
  | 'categories.ui.close'
  | 'categories.ui.adding'
  | 'categories.ui.deleting'
  | 'categories.ui.optional'
  | 'categories.ui.required'
  | 'categories.ui.builtIn'
  | 'categories.ui.noCategoriesYet'
  | 'categories.ui.createFirstCategory'
  | 'categories.ui.predefinedDescription'
  | 'categories.ui.selectAll'
  | 'categories.ui.bulkActions'
  | 'categories.ui.deleteSelected'
  | 'categories.ui.changeColor'
  | 'categories.ui.exportSelected'
  | 'categories.ui.mergeCategories'
  | 'categories.ui.apply'
  | 'categories.ui.chooseAction'
  | 'categories.ui.viewOnly'
  | 'categories.ui.viewOnlyDescription'
  | 'categories.errors.cannotBeEmpty'
  | 'categories.errors.tooLong'
  | 'categories.errors.predefinedName'
  | 'categories.errors.alreadyExists'
  | 'categories.errors.invalidColor'
  | 'categories.errors.invalidIcon'
  | 'categories.errors.failedToAdd'
  | 'categories.errors.failedToUpdate'
  | 'categories.errors.failedToDelete'
  | 'categories.errors.selectAtLeastOne'
  | 'categories.errors.selectBulkAction'
  | 'categories.errors.selectTargetCategory'
  | 'categories.errors.targetCannotBeSelected'
  | 'categories.help.categoryNameHelp'
  | 'categories.help.colorHelp'
  | 'categories.help.iconHelp'
  | 'categories.help.customCategoriesHelp'
  | 'categories.messages.categoryAdded'
  | 'categories.messages.categoryUpdated'
  | 'categories.messages.categoryDeleted'
  | 'categories.messages.bulkDeleted'
  | 'categories.messages.bulkUpdated'
  | 'categories.messages.bulkExported'
  | 'categories.messages.bulkMerged'
  | 'categories.confirmations.deleteTitle'
  | 'categories.confirmations.deleteMessage'
  | 'categories.confirmations.deleteWarning'
  | 'categories.confirmations.bulkDeleteTitle'
  | 'categories.confirmations.bulkDeleteMessage'
  | 'categories.confirmations.bulkDeleteWarning'
  | 'categories.confirmations.mergeTitle'
  | 'categories.confirmations.mergeMessage'
  | 'categories.confirmations.mergeWarning'
  | 'categories.confirmations.changeColorTitle'
  | 'categories.confirmations.changeColorMessage';

/**
 * Storage key for user's language preference
 */
const LANGUAGE_STORAGE_KEY = 'grocery-app-language';

/**
 * Translation cache to avoid repeated JSON imports
 */
let translationCache: Record<SupportedLanguage, any> = {} as any;

/**
 * Detect the user's preferred language from browser settings
 */
export function detectBrowserLanguage(): SupportedLanguage {
  const browserLang = navigator.language.toLowerCase();

  // Check for exact match
  if (browserLang.startsWith('es')) return 'es';
  if (browserLang.startsWith('fr')) return 'fr';
  if (browserLang.startsWith('de')) return 'de';

  // Default to English
  return 'en';
}

/**
 * Get the user's saved language preference or detect it
 */
export function getUserLanguage(): SupportedLanguage {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLanguage | null;
    if (saved && ['en', 'es', 'fr', 'de'].includes(saved)) {
      return saved;
    }
  } catch (error) {
    console.warn('Failed to read language preference from localStorage:', error);
  }

  return detectBrowserLanguage();
}

/**
 * Save the user's language preference
 */
export function setUserLanguage(language: SupportedLanguage): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.warn('Failed to save language preference to localStorage:', error);
  }
}

/**
 * Load translations for a specific language
 */
export async function loadTranslations(language: SupportedLanguage): Promise<any> {
  // Return cached translations if available
  if (translationCache[language]) {
    return translationCache[language];
  }

  try {
    // Dynamically import translation file
    const translations = await import(`../locales/${language}.json`);
    translationCache[language] = translations.default || translations;
    return translationCache[language];
  } catch (error) {
    console.error(`Failed to load translations for language: ${language}`, error);

    // Fallback to English if not already trying to load English
    if (language !== 'en') {
      return loadTranslations('en');
    }

    // Return empty object if even English fails
    return {};
  }
}

/**
 * Get a nested property from an object using dot notation
 * Example: getNestedProperty(obj, 'categories.ui.addCategory')
 */
function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Translate a key to the user's language
 * Falls back to English if translation is missing
 */
export function translate(
  key: TranslationKey | string,
  translations: any,
  fallbackTranslations?: any,
  interpolations?: Record<string, string | number>
): string {
  // Try to get translation from current language
  let translated = getNestedProperty(translations, key);

  // Fall back to English if not found
  if (translated === undefined && fallbackTranslations) {
    translated = getNestedProperty(fallbackTranslations, key);
  }

  // Fall back to key itself if still not found
  if (translated === undefined) {
    console.warn(`Translation missing for key: ${key}`);
    return key;
  }

  // Handle interpolations (e.g., "Hello {name}")
  if (interpolations && typeof translated === 'string') {
    Object.entries(interpolations).forEach(([placeholder, value]) => {
      translated = translated.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), String(value));
    });
  }

  return translated;
}

/**
 * React hook for using translations in components
 */
export function useTranslation() {
  const [language, setLanguageState] = useState<SupportedLanguage>(getUserLanguage());
  const [translations, setTranslations] = useState<any>({});
  const [fallbackTranslations, setFallbackTranslations] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load translations when language changes
  useEffect(() => {
    let isMounted = true;

    async function loadLanguageData() {
      setIsLoading(true);

      try {
        // Load current language translations
        const currentTranslations = await loadTranslations(language);

        // Load English as fallback if current language is not English
        const englishTranslations = language !== 'en'
          ? await loadTranslations('en')
          : currentTranslations;

        if (isMounted) {
          setTranslations(currentTranslations);
          setFallbackTranslations(englishTranslations);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to load translations:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadLanguageData();

    return () => {
      isMounted = false;
    };
  }, [language]);

  /**
   * Translate function with interpolation support
   */
  const t = useCallback((
    key: TranslationKey | string,
    interpolations?: Record<string, string | number>
  ): string => {
    return translate(key, translations, fallbackTranslations, interpolations);
  }, [translations, fallbackTranslations]);

  /**
   * Change the current language
   */
  const setLanguage = useCallback((newLanguage: SupportedLanguage) => {
    setUserLanguage(newLanguage);
    setLanguageState(newLanguage);
  }, []);

  /**
   * Get available languages
   */
  const availableLanguages: Array<{ code: SupportedLanguage; name: string; nativeName: string }> = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
  ];

  return {
    t,
    language,
    setLanguage,
    availableLanguages,
    isLoading,
  };
}

/**
 * Get a translated predefined category name
 * This is a convenience function for category-specific translations
 */
export function getTranslatedCategoryName(
  categoryName: string,
  language: SupportedLanguage,
  translations?: any
): string {
  if (!translations) {
    return categoryName;
  }

  const key = `categories.predefined.${categoryName}`;
  const translated = getNestedProperty(translations, key);

  return translated || categoryName;
}
