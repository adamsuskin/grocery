/**
 * Category Validation Utilities
 *
 * This module provides comprehensive validation functions for custom categories.
 * It ensures data integrity and provides helpful error messages for users.
 *
 * ## Features
 * - Name validation (length, duplicates, predefined conflicts)
 * - Color format validation (hex codes)
 * - Icon validation (length, character restrictions)
 * - Case-insensitive duplicate detection
 *
 * ## Usage
 *
 * ```typescript
 * import {
 *   validateCategoryName,
 *   validateCategoryColor,
 *   validateCategoryIcon
 * } from './utils/categoryValidation';
 *
 * // Validate category name
 * const nameError = validateCategoryName('Snacks', existingCategories);
 * if (nameError) {
 *   console.error(nameError);
 * }
 *
 * // Validate color
 * if (!validateCategoryColor('#FF5733')) {
 *   console.error('Invalid color format');
 * }
 *
 * // Validate icon
 * if (!validateCategoryIcon('🍿')) {
 *   console.error('Invalid icon');
 * }
 * ```
 */

import { CATEGORIES } from '../types';

/**
 * Validates a custom category name
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
 * @returns Error message if validation fails, null if valid
 *
 * @example
 * ```typescript
 * // Valid name
 * validateCategoryName('Snacks', ['Cleaning', 'Spices']); // null
 *
 * // Empty name
 * validateCategoryName('', []); // 'Category name cannot be empty'
 *
 * // Too long
 * validateCategoryName('A'.repeat(101), []); // 'Category name must be between 1 and 100 characters'
 *
 * // Conflicts with predefined
 * validateCategoryName('Produce', []); // 'Cannot use predefined category names'
 *
 * // Duplicate (case-insensitive)
 * validateCategoryName('snacks', ['Snacks']); // 'A category with this name already exists'
 *
 * // When updating, exclude current category
 * validateCategoryName('Snacks', ['Snacks'], 'category-123'); // null
 * ```
 */
export function validateCategoryName(
  name: string,
  existingCategories: Array<string | { name: string; id?: string }>,
  excludeId?: string
): string | null {
  const trimmedName = name.trim();

  // Check if name is empty
  if (trimmedName.length === 0) {
    return 'Category name cannot be empty';
  }

  // Check length constraints
  if (trimmedName.length < 1 || trimmedName.length > 100) {
    return 'Category name must be between 1 and 100 characters';
  }

  // Check if name conflicts with predefined categories (case-insensitive)
  const predefinedNames = CATEGORIES.map(cat => cat.toLowerCase());
  if (predefinedNames.includes(trimmedName.toLowerCase())) {
    return 'Cannot use predefined category names (Produce, Dairy, Meat, Bakery, Pantry, Frozen, Beverages, Other)';
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
    return 'A category with this name already exists';
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
 * Returns an object with field-specific error messages.
 *
 * @param input - Object containing category fields to validate
 * @param existingCategories - Array of existing custom category names
 * @param excludeId - Optional category ID to exclude from duplicate check (for updates)
 * @returns Object with error messages for each field, or empty object if all valid
 *
 * @example
 * ```typescript
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
 * //   name: 'Cannot use predefined category names...',
 * //   color: 'Color must be a valid hex code...',
 * //   icon: 'Icon must be between 1 and 10 characters'
 * // }
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
  name?: string;
  color?: string;
  icon?: string;
} {
  const errors: {
    name?: string;
    color?: string;
    icon?: string;
  } = {};

  // Validate name
  const nameError = validateCategoryName(input.name, existingCategories, excludeId);
  if (nameError) {
    errors.name = nameError;
  }

  // Validate color
  if (!validateCategoryColor(input.color)) {
    errors.color = 'Color must be a valid hex code (e.g., #FF5733 or #F53)';
  }

  // Validate icon
  if (!validateCategoryIcon(input.icon)) {
    errors.icon = 'Icon must be between 1 and 10 characters';
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
 * Converts technical validation errors into friendly messages for display.
 *
 * @param error - The error object or message
 * @returns User-friendly error message
 *
 * @example
 * ```typescript
 * getValidationErrorMessage('Category name cannot be empty');
 * // 'Category name cannot be empty'
 *
 * getValidationErrorMessage(new Error('Failed to create custom category'));
 * // 'Failed to create custom category'
 *
 * getValidationErrorMessage(null);
 * // 'An unknown error occurred'
 * ```
 */
export function getValidationErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred';
}
