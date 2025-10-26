/**
 * Category Validation Utilities with i18n Support
 *
 * This module provides comprehensive validation functions for custom categories
 * with internationalization support. Instead of returning hardcoded error messages,
 * these functions return translation keys that can be used with the i18n system.
 *
 * ## Features
 * - Name validation (length, duplicates, predefined conflicts)
 * - Color format validation (hex codes)
 * - Icon validation (length, character restrictions)
 * - Case-insensitive duplicate detection
 * - Returns translation keys for error messages
 *
 * ## Usage
 *
 * ```typescript
 * import { validateCategoryName } from './utils/categoryValidation.i18n';
 * import { useTranslation } from './utils/i18n';
 *
 * function MyComponent() {
 *   const { t } = useTranslation();
 *
 *   const errorKey = validateCategoryName('Snacks', existingCategories);
 *   if (errorKey) {
 *     const errorMessage = t(errorKey);
 *     console.error(errorMessage);
 *   }
 * }
 * ```
 */

import { CATEGORIES } from '../types';
import type { TranslationKey } from './i18n';

/**
 * Translation keys for category validation errors
 */
export type CategoryValidationErrorKey =
  | 'categories.errors.cannotBeEmpty'
  | 'categories.errors.tooLong'
  | 'categories.errors.predefinedName'
  | 'categories.errors.alreadyExists'
  | 'categories.errors.invalidColor'
  | 'categories.errors.invalidIcon';

/**
 * Validates a custom category name
 *
 * Returns a translation key if validation fails, null if valid.
 *
 * Checks:
 * - Name is not empty (after trimming)
 * - Name length is between 1 and 100 characters
 * - Name doesn't conflict with predefined categories (case-insensitive)
 * - Name doesn't duplicate existing custom categories (case-insensitive)
 *
 * @param name - The category name to validate
 * @param existingCategories - Array of existing custom category names
 * @param excludeId - Optional category ID to exclude from duplicate check (for updates)
 * @returns Translation key for error message if validation fails, null if valid
 *
 * @example
 * ```typescript
 * import { useTranslation } from './utils/i18n';
 *
 * const { t } = useTranslation();
 *
 * // Valid name
 * const error1 = validateCategoryName('Snacks', ['Cleaning', 'Spices']); // null
 *
 * // Empty name
 * const error2 = validateCategoryName('', []); // 'categories.errors.cannotBeEmpty'
 * console.log(t(error2)); // "Category name cannot be empty"
 *
 * // Too long
 * const error3 = validateCategoryName('A'.repeat(101), []); // 'categories.errors.tooLong'
 *
 * // Conflicts with predefined
 * const error4 = validateCategoryName('Produce', []); // 'categories.errors.predefinedName'
 *
 * // Duplicate (case-insensitive)
 * const error5 = validateCategoryName('snacks', ['Snacks']); // 'categories.errors.alreadyExists'
 *
 * // When updating, exclude current category
 * const error6 = validateCategoryName('Snacks', ['Snacks'], 'category-123'); // null
 * ```
 */
export function validateCategoryName(
  name: string,
  existingCategories: Array<string | { name: string; id?: string }>,
  excludeId?: string
): CategoryValidationErrorKey | null {
  const trimmedName = name.trim();

  // Check if name is empty
  if (trimmedName.length === 0) {
    return 'categories.errors.cannotBeEmpty';
  }

  // Check length constraints
  if (trimmedName.length < 1 || trimmedName.length > 100) {
    return 'categories.errors.tooLong';
  }

  // Check if name conflicts with predefined categories (case-insensitive)
  const predefinedNames = CATEGORIES.map(cat => cat.toLowerCase());
  if (predefinedNames.includes(trimmedName.toLowerCase())) {
    return 'categories.errors.predefinedName';
  }

  // Check if name conflicts with existing custom categories (case-insensitive)
  const duplicate = existingCategories.find((cat) => {
    const catName = typeof cat === 'string' ? cat : cat.name;
    const catId = typeof cat === 'string' ? undefined : cat.id;

    return (
      catId !== excludeId &&
      catName.toLowerCase() === trimmedName.toLowerCase()
    );
  });

  if (duplicate) {
    return 'categories.errors.alreadyExists';
  }

  return null;
}

/**
 * Validates a category color format
 *
 * Accepts:
 * - 6-digit hex codes: #RRGGBB (e.g., #FF5733)
 * - 3-digit hex codes: #RGB (e.g., #F53)
 * - Undefined/null (color is optional)
 *
 * @param color - The color string to validate (optional)
 * @returns true if valid or undefined, false otherwise
 *
 * @example
 * ```typescript
 * validateCategoryColor('#FF5733'); // true
 * validateCategoryColor('#F53'); // true
 * validateCategoryColor('#ff5733'); // true (lowercase ok)
 * validateCategoryColor(undefined); // true (optional)
 * validateCategoryColor(''); // true (empty string treated as optional)
 * validateCategoryColor('FF5733'); // false (missing #)
 * validateCategoryColor('#FF57'); // false (wrong length)
 * validateCategoryColor('#GGGGGG'); // false (invalid hex)
 * ```
 */
export function validateCategoryColor(color?: string | null): boolean {
  // Color is optional
  if (!color || color.trim() === '') {
    return true;
  }

  // Must start with # and be followed by exactly 3 or 6 hex digits
  const hexColorRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
  return hexColorRegex.test(color.trim());
}

/**
 * Validates a category icon
 *
 * Checks:
 * - Icon is optional (can be undefined/null/empty)
 * - If provided, length is between 1 and 10 characters
 * - Contains only valid characters (emojis, unicode characters, alphanumeric)
 *
 * @param icon - The icon string to validate (optional)
 * @returns true if valid or undefined, false otherwise
 *
 * @example
 * ```typescript
 * validateCategoryIcon('🍎'); // true
 * validateCategoryIcon('🍕🌮'); // true
 * validateCategoryIcon(''); // true (optional)
 * validateCategoryIcon(undefined); // true (optional)
 * validateCategoryIcon('A'); // true
 * validateCategoryIcon('ABC'); // true
 * validateCategoryIcon('A'.repeat(11)); // false (too long)
 * ```
 */
export function validateCategoryIcon(icon?: string | null): boolean {
  // Icon is optional
  if (!icon || icon.trim() === '') {
    return true;
  }

  const trimmedIcon = icon.trim();

  // Check length (max 10 characters to support multi-character emojis)
  if (trimmedIcon.length < 1 || trimmedIcon.length > 10) {
    return false;
  }

  // Allow any unicode characters (emojis, letters, numbers, symbols)
  // Just ensure it's not only whitespace and within length limits
  return trimmedIcon.length > 0;
}

/**
 * Validates all category fields at once
 *
 * Convenience function that validates name, color, and icon together.
 * Returns an object with field-specific translation keys for error messages.
 *
 * @param input - Object containing category fields to validate
 * @param existingCategories - Array of existing custom category names
 * @param excludeId - Optional category ID to exclude from duplicate check (for updates)
 * @returns Object with translation keys for each field error, or empty object if all valid
 *
 * @example
 * ```typescript
 * import { useTranslation } from './utils/i18n';
 *
 * const { t } = useTranslation();
 *
 * const errors = validateCategoryFields(
 *   {
 *     name: 'Produce',
 *     color: '#invalid',
 *     icon: 'X'.repeat(20)
 *   },
 *   ['Snacks', 'Cleaning']
 * );
 *
 * // errors = {
 * //   name: 'categories.errors.predefinedName',
 * //   color: 'categories.errors.invalidColor',
 * //   icon: 'categories.errors.invalidIcon'
 * // }
 *
 * // Display translated errors
 * if (errors.name) console.log(t(errors.name));
 * if (errors.color) console.log(t(errors.color));
 * if (errors.icon) console.log(t(errors.icon));
 *
 * const noErrors = validateCategoryFields(
 *   {
 *     name: 'Spices',
 *     color: '#FF5733',
 *     icon: '🌶️'
 *   },
 *   ['Snacks', 'Cleaning']
 * );
 * // noErrors = {}
 * ```
 */
export function validateCategoryFields(
  input: {
    name: string;
    color?: string | null;
    icon?: string | null;
  },
  existingCategories: Array<string | { name: string; id?: string }>,
  excludeId?: string
): {
  name?: CategoryValidationErrorKey;
  color?: CategoryValidationErrorKey;
  icon?: CategoryValidationErrorKey;
} {
  const errors: {
    name?: CategoryValidationErrorKey;
    color?: CategoryValidationErrorKey;
    icon?: CategoryValidationErrorKey;
  } = {};

  // Validate name
  const nameError = validateCategoryName(input.name, existingCategories, excludeId);
  if (nameError) {
    errors.name = nameError;
  }

  // Validate color
  if (!validateCategoryColor(input.color)) {
    errors.color = 'categories.errors.invalidColor';
  }

  // Validate icon
  if (!validateCategoryIcon(input.icon)) {
    errors.icon = 'categories.errors.invalidIcon';
  }

  return errors;
}

/**
 * Normalizes category name for comparison
 *
 * Trims whitespace and converts to lowercase for case-insensitive comparisons.
 *
 * @param name - The category name to normalize
 * @returns Normalized category name
 *
 * @example
 * ```typescript
 * normalizeCategoryName('  Snacks  '); // 'snacks'
 * normalizeCategoryName('PRODUCE'); // 'produce'
 * ```
 */
export function normalizeCategoryName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Checks if a category name conflicts with predefined categories
 *
 * @param name - The category name to check
 * @returns true if conflicts with a predefined category, false otherwise
 *
 * @example
 * ```typescript
 * isPredefinedCategory('Produce'); // true
 * isPredefinedCategory('produce'); // true (case-insensitive)
 * isPredefinedCategory('Snacks'); // false
 * ```
 */
export function isPredefinedCategory(name: string): boolean {
  const normalized = normalizeCategoryName(name);
  const predefinedNames = CATEGORIES.map(cat => cat.toLowerCase());
  return predefinedNames.includes(normalized);
}

/**
 * Gets a user-friendly error message for validation failures
 *
 * This is a helper function that can be used with or without i18n.
 * If a translation function is provided, it will translate the error.
 * Otherwise, it returns the error key as-is.
 *
 * @param error - The error object, message, or translation key
 * @param translateFn - Optional translation function from useTranslation
 * @returns User-friendly error message
 *
 * @example
 * ```typescript
 * import { useTranslation } from './utils/i18n';
 *
 * const { t } = useTranslation();
 *
 * // With translation
 * getValidationErrorMessage('categories.errors.cannotBeEmpty', t);
 * // 'Category name cannot be empty'
 *
 * // Without translation
 * getValidationErrorMessage('categories.errors.cannotBeEmpty');
 * // 'categories.errors.cannotBeEmpty'
 *
 * // With Error object
 * getValidationErrorMessage(new Error('Failed to create custom category'), t);
 * // 'Failed to create custom category'
 * ```
 */
export function getValidationErrorMessage(
  error: unknown,
  translateFn?: (key: string) => string
): string {
  if (typeof error === 'string') {
    return translateFn ? translateFn(error) : error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return translateFn
    ? translateFn('categories.errors.failedToAdd')
    : 'An unknown error occurred';
}
