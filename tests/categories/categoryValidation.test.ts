/**
 * Unit Tests for Category Validation
 *
 * Tests validation functions for custom categories including:
 * - Name validation (length, duplicates, predefined conflicts)
 * - Color validation (hex format)
 * - Icon validation (length, characters)
 * - Combined field validation
 * - Edge cases and boundary conditions
 */

import { describe, it, expect } from 'vitest';
import {
  validateCategoryName,
  validateCategoryColor,
  validateCategoryIcon,
  validateCategoryFields,
  normalizeCategoryName,
  isPredefinedCategory,
  getValidationErrorMessage,
} from '../../src/utils/categoryValidation';
import { CATEGORIES } from '../../src/types';

// =============================================================================
// TEST DATA
// =============================================================================

const existingCategoryNames = ['Snacks', 'Cleaning', 'Pet Supplies'];

const existingCategoryObjects = [
  { id: 'cat-1', name: 'Snacks' },
  { id: 'cat-2', name: 'Cleaning' },
  { id: 'cat-3', name: 'Pet Supplies' },
];

// =============================================================================
// TESTS: validateCategoryName
// =============================================================================

describe('validateCategoryName', () => {
  describe('empty name validation', () => {
    it('should reject empty string', () => {
      const error = validateCategoryName('', []);
      expect(error).toBe('Category name cannot be empty');
    });

    it('should reject whitespace-only string', () => {
      const error = validateCategoryName('   ', []);
      expect(error).toBe('Category name cannot be empty');
    });

    it('should reject tabs and newlines', () => {
      const error = validateCategoryName('\t\n', []);
      expect(error).toBe('Category name cannot be empty');
    });
  });

  describe('length validation', () => {
    it('should accept name with 1 character', () => {
      const error = validateCategoryName('A', []);
      expect(error).toBeNull();
    });

    it('should accept name with 100 characters', () => {
      const name = 'A'.repeat(100);
      const error = validateCategoryName(name, []);
      expect(error).toBeNull();
    });

    it('should reject name with 101 characters', () => {
      const name = 'A'.repeat(101);
      const error = validateCategoryName(name, []);
      expect(error).toBe('Category name must be between 1 and 100 characters');
    });

    it('should reject very long names', () => {
      const name = 'A'.repeat(500);
      const error = validateCategoryName(name, []);
      expect(error).toBe('Category name must be between 1 and 100 characters');
    });
  });

  describe('predefined category conflicts', () => {
    it('should reject all predefined category names', () => {
      CATEGORIES.forEach((category) => {
        const error = validateCategoryName(category, []);
        expect(error).toBe(
          'Cannot use predefined category names (Produce, Dairy, Meat, Bakery, Pantry, Frozen, Beverages, Other)'
        );
      });
    });

    it('should reject predefined names case-insensitively', () => {
      const testCases = [
        'produce',
        'PRODUCE',
        'ProDuCe',
        'dairy',
        'DAIRY',
        'meat',
        'MEAT',
        'other',
        'OTHER',
      ];

      testCases.forEach((name) => {
        const error = validateCategoryName(name, []);
        expect(error).toContain('Cannot use predefined category names');
      });
    });
  });

  describe('duplicate detection with string array', () => {
    it('should reject exact duplicates', () => {
      const error = validateCategoryName('Snacks', existingCategoryNames);
      expect(error).toBe('A category with this name already exists');
    });

    it('should reject case-insensitive duplicates', () => {
      expect(validateCategoryName('snacks', existingCategoryNames)).toBe(
        'A category with this name already exists'
      );
      expect(validateCategoryName('SNACKS', existingCategoryNames)).toBe(
        'A category with this name already exists'
      );
      expect(validateCategoryName('SnAcKs', existingCategoryNames)).toBe(
        'A category with this name already exists'
      );
    });

    it('should accept unique names', () => {
      const error = validateCategoryName('New Category', existingCategoryNames);
      expect(error).toBeNull();
    });
  });

  describe('duplicate detection with object array', () => {
    it('should reject exact duplicates', () => {
      const error = validateCategoryName('Snacks', existingCategoryObjects);
      expect(error).toBe('A category with this name already exists');
    });

    it('should reject case-insensitive duplicates', () => {
      expect(validateCategoryName('cleaning', existingCategoryObjects)).toBe(
        'A category with this name already exists'
      );
    });

    it('should accept unique names', () => {
      const error = validateCategoryName('Spices', existingCategoryObjects);
      expect(error).toBeNull();
    });
  });

  describe('excludeId parameter', () => {
    it('should allow same name when excluding current category', () => {
      const error = validateCategoryName(
        'Snacks',
        existingCategoryObjects,
        'cat-1'
      );
      expect(error).toBeNull();
    });

    it('should still reject duplicate when excluding different category', () => {
      const error = validateCategoryName(
        'Snacks',
        existingCategoryObjects,
        'cat-2'
      );
      expect(error).toBe('A category with this name already exists');
    });

    it('should work with non-existent excludeId', () => {
      const error = validateCategoryName(
        'Snacks',
        existingCategoryObjects,
        'non-existent'
      );
      expect(error).toBe('A category with this name already exists');
    });
  });

  describe('whitespace handling', () => {
    it('should trim leading whitespace', () => {
      const error = validateCategoryName('  Valid Name', []);
      expect(error).toBeNull();
    });

    it('should trim trailing whitespace', () => {
      const error = validateCategoryName('Valid Name  ', []);
      expect(error).toBeNull();
    });

    it('should allow internal whitespace', () => {
      const error = validateCategoryName('Valid Name Here', []);
      expect(error).toBeNull();
    });
  });

  describe('special characters', () => {
    it('should accept names with numbers', () => {
      const error = validateCategoryName('Aisle 5', []);
      expect(error).toBeNull();
    });

    it('should accept names with ampersand', () => {
      const error = validateCategoryName('Baby & Kids', []);
      expect(error).toBeNull();
    });

    it('should accept names with hyphens', () => {
      const error = validateCategoryName('Non-Food Items', []);
      expect(error).toBeNull();
    });

    it('should accept names with apostrophes', () => {
      const error = validateCategoryName("Children's Items", []);
      expect(error).toBeNull();
    });

    it('should accept names with accented characters', () => {
      const error = validateCategoryName('Café Items', []);
      expect(error).toBeNull();
    });

    it('should accept names with emojis', () => {
      const error = validateCategoryName('Party 🎉 Items', []);
      expect(error).toBeNull();
    });
  });
});

// =============================================================================
// TESTS: validateCategoryColor
// =============================================================================

describe('validateCategoryColor', () => {
  describe('valid hex colors', () => {
    it('should accept 6-digit hex colors', () => {
      expect(validateCategoryColor('#FF5733')).toBe(true);
      expect(validateCategoryColor('#000000')).toBe(true);
      expect(validateCategoryColor('#FFFFFF')).toBe(true);
      expect(validateCategoryColor('#123456')).toBe(true);
    });

    it('should accept lowercase hex colors', () => {
      expect(validateCategoryColor('#ff5733')).toBe(true);
      expect(validateCategoryColor('#abcdef')).toBe(true);
    });

    it('should accept mixed case hex colors', () => {
      expect(validateCategoryColor('#FfAa33')).toBe(true);
      expect(validateCategoryColor('#A1b2C3')).toBe(true);
    });

    it('should accept 3-digit hex colors', () => {
      expect(validateCategoryColor('#F53')).toBe(true);
      expect(validateCategoryColor('#000')).toBe(true);
      expect(validateCategoryColor('#FFF')).toBe(true);
      expect(validateCategoryColor('#abc')).toBe(true);
    });
  });

  describe('invalid hex colors', () => {
    it('should reject colors without # prefix', () => {
      expect(validateCategoryColor('FF5733')).toBe(false);
      expect(validateCategoryColor('F53')).toBe(false);
    });

    it('should reject colors with wrong length', () => {
      expect(validateCategoryColor('#FF')).toBe(false);
      expect(validateCategoryColor('#FF57')).toBe(false);
      expect(validateCategoryColor('#FF573')).toBe(false);
      expect(validateCategoryColor('#FF57333')).toBe(false);
    });

    it('should reject colors with invalid characters', () => {
      expect(validateCategoryColor('#GGGGGG')).toBe(false);
      expect(validateCategoryColor('#FF573Z')).toBe(false);
      expect(validateCategoryColor('#XYZ')).toBe(false);
    });

    it('should reject color names', () => {
      expect(validateCategoryColor('red')).toBe(false);
      expect(validateCategoryColor('blue')).toBe(false);
      expect(validateCategoryColor('transparent')).toBe(false);
    });

    it('should reject RGB/RGBA format', () => {
      expect(validateCategoryColor('rgb(255, 87, 51)')).toBe(false);
      expect(validateCategoryColor('rgba(255, 87, 51, 0.5)')).toBe(false);
    });
  });

  describe('optional color handling', () => {
    it('should accept undefined', () => {
      expect(validateCategoryColor(undefined)).toBe(true);
    });

    it('should accept null', () => {
      expect(validateCategoryColor(null)).toBe(true);
    });

    it('should accept empty string', () => {
      expect(validateCategoryColor('')).toBe(true);
    });

    it('should accept whitespace-only string', () => {
      expect(validateCategoryColor('   ')).toBe(true);
    });
  });

  describe('whitespace handling', () => {
    it('should trim and validate', () => {
      expect(validateCategoryColor('  #FF5733  ')).toBe(true);
      expect(validateCategoryColor('\t#FF5733\n')).toBe(true);
    });
  });
});

// =============================================================================
// TESTS: validateCategoryIcon
// =============================================================================

describe('validateCategoryIcon', () => {
  describe('valid icons', () => {
    it('should accept single emoji', () => {
      expect(validateCategoryIcon('🍎')).toBe(true);
      expect(validateCategoryIcon('🍕')).toBe(true);
      expect(validateCategoryIcon('🧹')).toBe(true);
    });

    it('should accept multiple emojis', () => {
      expect(validateCategoryIcon('🍕🌮')).toBe(true);
      expect(validateCategoryIcon('🎉🎊')).toBe(true);
    });

    it('should accept single letter', () => {
      expect(validateCategoryIcon('A')).toBe(true);
      expect(validateCategoryIcon('Z')).toBe(true);
    });

    it('should accept multiple letters', () => {
      expect(validateCategoryIcon('ABC')).toBe(true);
      expect(validateCategoryIcon('XYZ')).toBe(true);
    });

    it('should accept numbers', () => {
      expect(validateCategoryIcon('1')).toBe(true);
      expect(validateCategoryIcon('123')).toBe(true);
    });

    it('should accept up to 10 characters', () => {
      expect(validateCategoryIcon('A'.repeat(10))).toBe(true);
      expect(validateCategoryIcon('1234567890')).toBe(true);
    });

    it('should accept special characters', () => {
      expect(validateCategoryIcon('★')).toBe(true);
      expect(validateCategoryIcon('♥')).toBe(true);
      expect(validateCategoryIcon('✓')).toBe(true);
    });
  });

  describe('invalid icons', () => {
    it('should reject icons exceeding 10 characters', () => {
      expect(validateCategoryIcon('A'.repeat(11))).toBe(false);
      expect(validateCategoryIcon('12345678901')).toBe(false);
    });

    it('should reject very long strings', () => {
      expect(validateCategoryIcon('A'.repeat(100))).toBe(false);
    });
  });

  describe('optional icon handling', () => {
    it('should accept undefined', () => {
      expect(validateCategoryIcon(undefined)).toBe(true);
    });

    it('should accept null', () => {
      expect(validateCategoryIcon(null)).toBe(true);
    });

    it('should accept empty string', () => {
      expect(validateCategoryIcon('')).toBe(true);
    });

    it('should accept whitespace-only string', () => {
      expect(validateCategoryIcon('   ')).toBe(true);
    });
  });

  describe('whitespace handling', () => {
    it('should trim and validate', () => {
      expect(validateCategoryIcon('  🍎  ')).toBe(true);
      expect(validateCategoryIcon('\tA\n')).toBe(true);
    });

    it('should count trimmed length', () => {
      const icon = '  ' + 'A'.repeat(11) + '  ';
      expect(validateCategoryIcon(icon)).toBe(false);
    });
  });
});

// =============================================================================
// TESTS: validateCategoryFields
// =============================================================================

describe('validateCategoryFields', () => {
  describe('single field validation', () => {
    it('should validate name only', () => {
      const errors = validateCategoryFields(
        { name: '', color: undefined, icon: undefined },
        []
      );

      expect(errors.name).toBe('Category name cannot be empty');
      expect(errors.color).toBeUndefined();
      expect(errors.icon).toBeUndefined();
    });

    it('should validate color only', () => {
      const errors = validateCategoryFields(
        { name: 'Valid Name', color: 'invalid', icon: undefined },
        []
      );

      expect(errors.name).toBeUndefined();
      expect(errors.color).toBe(
        'Color must be a valid hex code (e.g., #FF5733 or #F53)'
      );
      expect(errors.icon).toBeUndefined();
    });

    it('should validate icon only', () => {
      const errors = validateCategoryFields(
        {
          name: 'Valid Name',
          color: undefined,
          icon: 'A'.repeat(11),
        },
        []
      );

      expect(errors.name).toBeUndefined();
      expect(errors.color).toBeUndefined();
      expect(errors.icon).toBe('Icon must be between 1 and 10 characters');
    });
  });

  describe('multiple field validation', () => {
    it('should validate all fields with multiple errors', () => {
      const errors = validateCategoryFields(
        {
          name: '',
          color: 'invalid',
          icon: 'A'.repeat(11),
        },
        []
      );

      expect(errors.name).toBe('Category name cannot be empty');
      expect(errors.color).toBe(
        'Color must be a valid hex code (e.g., #FF5733 or #F53)'
      );
      expect(errors.icon).toBe('Icon must be between 1 and 10 characters');
    });

    it('should return empty object when all fields valid', () => {
      const errors = validateCategoryFields(
        {
          name: 'Valid Name',
          color: '#FF5733',
          icon: '🍎',
        },
        []
      );

      expect(Object.keys(errors)).toHaveLength(0);
    });
  });

  describe('with existing categories', () => {
    it('should detect name conflicts', () => {
      const errors = validateCategoryFields(
        {
          name: 'Snacks',
          color: '#FF5733',
          icon: '🍿',
        },
        existingCategoryNames
      );

      expect(errors.name).toBe('A category with this name already exists');
    });

    it('should allow same name when excluding ID', () => {
      const errors = validateCategoryFields(
        {
          name: 'Snacks',
          color: '#FF5733',
          icon: '🍿',
        },
        existingCategoryObjects,
        'cat-1'
      );

      expect(errors.name).toBeUndefined();
    });
  });

  describe('optional fields', () => {
    it('should accept undefined optional fields', () => {
      const errors = validateCategoryFields(
        {
          name: 'Valid Name',
          color: undefined,
          icon: undefined,
        },
        []
      );

      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('should accept null optional fields', () => {
      const errors = validateCategoryFields(
        {
          name: 'Valid Name',
          color: null,
          icon: null,
        },
        []
      );

      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('should accept empty string optional fields', () => {
      const errors = validateCategoryFields(
        {
          name: 'Valid Name',
          color: '',
          icon: '',
        },
        []
      );

      expect(Object.keys(errors)).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle predefined category conflicts', () => {
      const errors = validateCategoryFields(
        {
          name: 'Produce',
          color: '#FF5733',
          icon: '🥬',
        },
        []
      );

      expect(errors.name).toContain('Cannot use predefined category names');
    });

    it('should validate with mixed valid and invalid fields', () => {
      const errors = validateCategoryFields(
        {
          name: 'Valid Name',
          color: 'invalid',
          icon: '🍎',
        },
        []
      );

      expect(errors.name).toBeUndefined();
      expect(errors.color).toBeDefined();
      expect(errors.icon).toBeUndefined();
    });
  });
});

// =============================================================================
// TESTS: normalizeCategoryName
// =============================================================================

describe('normalizeCategoryName', () => {
  it('should convert to lowercase', () => {
    expect(normalizeCategoryName('SNACKS')).toBe('snacks');
    expect(normalizeCategoryName('Snacks')).toBe('snacks');
    expect(normalizeCategoryName('SnAcKs')).toBe('snacks');
  });

  it('should trim whitespace', () => {
    expect(normalizeCategoryName('  Snacks  ')).toBe('snacks');
    expect(normalizeCategoryName('\tSnacks\n')).toBe('snacks');
  });

  it('should handle empty string', () => {
    expect(normalizeCategoryName('')).toBe('');
  });

  it('should preserve internal whitespace', () => {
    expect(normalizeCategoryName('Pet Supplies')).toBe('pet supplies');
  });

  it('should handle special characters', () => {
    expect(normalizeCategoryName('Baby & Kids')).toBe('baby & kids');
    expect(normalizeCategoryName("Children's Items")).toBe("children's items");
  });
});

// =============================================================================
// TESTS: isPredefinedCategory
// =============================================================================

describe('isPredefinedCategory', () => {
  it('should return true for predefined categories', () => {
    CATEGORIES.forEach((category) => {
      expect(isPredefinedCategory(category)).toBe(true);
    });
  });

  it('should be case-insensitive', () => {
    expect(isPredefinedCategory('produce')).toBe(true);
    expect(isPredefinedCategory('PRODUCE')).toBe(true);
    expect(isPredefinedCategory('ProDuCe')).toBe(true);
    expect(isPredefinedCategory('dairy')).toBe(true);
    expect(isPredefinedCategory('DAIRY')).toBe(true);
  });

  it('should return false for custom categories', () => {
    expect(isPredefinedCategory('Snacks')).toBe(false);
    expect(isPredefinedCategory('Cleaning')).toBe(false);
    expect(isPredefinedCategory('Pet Supplies')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isPredefinedCategory('')).toBe(false);
  });

  it('should trim whitespace before checking', () => {
    expect(isPredefinedCategory('  Produce  ')).toBe(true);
    expect(isPredefinedCategory('\tDairy\n')).toBe(true);
  });
});

// =============================================================================
// TESTS: getValidationErrorMessage
// =============================================================================

describe('getValidationErrorMessage', () => {
  it('should return string errors as-is', () => {
    expect(getValidationErrorMessage('Custom error message')).toBe(
      'Custom error message'
    );
  });

  it('should extract message from Error objects', () => {
    const error = new Error('Something went wrong');
    expect(getValidationErrorMessage(error)).toBe('Something went wrong');
  });

  it('should handle unknown error types', () => {
    expect(getValidationErrorMessage(null)).toBe('An unknown error occurred');
    expect(getValidationErrorMessage(undefined)).toBe(
      'An unknown error occurred'
    );
    expect(getValidationErrorMessage(123)).toBe('An unknown error occurred');
    expect(getValidationErrorMessage({})).toBe('An unknown error occurred');
  });

  it('should handle empty string', () => {
    expect(getValidationErrorMessage('')).toBe('');
  });

  it('should handle Error with empty message', () => {
    const error = new Error('');
    expect(getValidationErrorMessage(error)).toBe('');
  });
});
