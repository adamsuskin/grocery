/**
 * Unit Conversion Utility
 *
 * Provides comprehensive unit conversion capabilities for grocery and recipe ingredients.
 * Supports volume, weight, and count conversions with flexible unit normalization.
 *
 * @module unitConversion
 */

import { MeasurementUnit } from '../types';

/**
 * Category of measurement units
 */
export type UnitCategory = 'volume' | 'weight' | 'count';

/**
 * Represents a single unit conversion relationship
 */
export interface UnitConversion {
  /** Unique identifier for this conversion */
  id: string;
  /** Source unit for conversion */
  fromUnit: string;
  /** Target unit for conversion */
  toUnit: string;
  /** Multiplication factor to convert from source to target */
  conversionFactor: number;
  /** Category this conversion belongs to */
  category: UnitCategory;
  /** Additional notes about this conversion */
  notes?: string;
  /** Timestamp when this conversion was created */
  createdAt: number;
}

/**
 * Result of a unit conversion operation
 */
export interface UnitConversionResult {
  /** Original numeric value before conversion */
  originalValue: number;
  /** Original unit before conversion */
  originalUnit: string;
  /** Converted numeric value */
  convertedValue: number;
  /** Target unit after conversion */
  convertedUnit: string;
  /** Factor used in the conversion */
  conversionFactor: number;
}

/**
 * Unit normalization map for handling plurals and common abbreviations
 */
const UNIT_NORMALIZATION_MAP: Record<string, string> = {
  // Volume units
  'cups': 'cup',
  'c': 'cup',
  'tablespoons': 'tbsp',
  'tablespoon': 'tbsp',
  'T': 'tbsp',
  'teaspoons': 'tsp',
  'teaspoon': 'tsp',
  't': 'tsp',
  'ounces': 'oz',
  'ounce': 'oz',
  'fluid ounces': 'oz',
  'fluid ounce': 'oz',
  'fl oz': 'oz',
  'pounds': 'lb',
  'pound': 'lb',
  'lbs': 'lb',
  'grams': 'g',
  'gram': 'g',
  'kilograms': 'kg',
  'kilogram': 'kg',
  'kgs': 'kg',
  'milliliters': 'ml',
  'milliliter': 'ml',
  'millilitres': 'ml',
  'millilitre': 'ml',
  'liters': 'l',
  'liter': 'l',
  'litres': 'l',
  'litre': 'l',

  // Count units
  'pieces': 'piece',
  'pcs': 'piece',
  'pc': 'piece',
  'wholes': 'whole',
  'cloves': 'clove',
  'bunches': 'bunch',
  'packages': 'package',
  'pkg': 'package',
  'pkgs': 'package',
};

/**
 * Default conversion factors for common unit conversions
 * Base conversions are defined here, bidirectional conversions are computed automatically
 */
const DEFAULT_CONVERSIONS: Omit<UnitConversion, 'id' | 'createdAt'>[] = [
  // Volume conversions (US System)
  { fromUnit: 'cup', toUnit: 'tbsp', conversionFactor: 16, category: 'volume' },
  { fromUnit: 'cup', toUnit: 'tsp', conversionFactor: 48, category: 'volume' },
  { fromUnit: 'cup', toUnit: 'oz', conversionFactor: 8, category: 'volume' },
  { fromUnit: 'tbsp', toUnit: 'tsp', conversionFactor: 3, category: 'volume' },
  { fromUnit: 'tbsp', toUnit: 'oz', conversionFactor: 0.5, category: 'volume' },

  // Metric volume conversions
  { fromUnit: 'l', toUnit: 'ml', conversionFactor: 1000, category: 'volume' },
  { fromUnit: 'cup', toUnit: 'ml', conversionFactor: 236.588, category: 'volume' },
  { fromUnit: 'tbsp', toUnit: 'ml', conversionFactor: 14.7868, category: 'volume' },
  { fromUnit: 'tsp', toUnit: 'ml', conversionFactor: 4.92892, category: 'volume' },
  { fromUnit: 'oz', toUnit: 'ml', conversionFactor: 29.5735, category: 'volume' },

  // Weight conversions
  { fromUnit: 'lb', toUnit: 'oz', conversionFactor: 16, category: 'weight' },
  { fromUnit: 'kg', toUnit: 'g', conversionFactor: 1000, category: 'weight' },
  { fromUnit: 'lb', toUnit: 'g', conversionFactor: 453.592, category: 'weight' },
  { fromUnit: 'oz', toUnit: 'g', conversionFactor: 28.3495, category: 'weight' },
  { fromUnit: 'kg', toUnit: 'lb', conversionFactor: 2.20462, category: 'weight' },
];

/**
 * UnitConverter class provides comprehensive unit conversion capabilities
 * with support for custom conversions, unit normalization, and formatting.
 */
export class UnitConverter {
  /** Internal storage for conversion relationships */
  private conversions: Map<string, Map<string, number>> = new Map();

  /** Cache for unit categories */
  private categoryCache: Map<string, UnitCategory> = new Map();

  constructor() {
    // Load default conversions
    this.loadDefaultConversions();
  }

  /**
   * Loads default conversion factors into the converter
   * @private
   */
  private loadDefaultConversions(): void {
    const conversionsWithIds = DEFAULT_CONVERSIONS.map((conv, index) => ({
      ...conv,
      id: `default-${index}`,
      createdAt: Date.now(),
    }));
    this.loadConversions(conversionsWithIds);
  }

  /**
   * Loads custom unit conversions into the converter
   *
   * @param conversions - Array of unit conversion definitions
   * @throws {Error} If conversion has invalid data (negative factor, missing units)
   *
   * @example
   * ```typescript
   * converter.loadConversions([
   *   {
   *     id: 'custom-1',
   *     fromUnit: 'gallon',
   *     toUnit: 'cup',
   *     conversionFactor: 16,
   *     category: 'volume',
   *     createdAt: Date.now()
   *   }
   * ]);
   * ```
   */
  public loadConversions(conversions: UnitConversion[]): void {
    if (!conversions || !Array.isArray(conversions)) {
      return;
    }

    for (const conversion of conversions) {
      // Validate conversion data
      if (!conversion.fromUnit || !conversion.toUnit) {
        console.warn('Skipping conversion with missing units:', conversion);
        continue;
      }

      if (conversion.conversionFactor <= 0) {
        console.warn('Skipping conversion with invalid factor:', conversion);
        continue;
      }

      const fromUnit = this.normalizeUnit(conversion.fromUnit);
      const toUnit = this.normalizeUnit(conversion.toUnit);

      // Store forward conversion
      this.addConversionMapping(fromUnit, toUnit, conversion.conversionFactor);

      // Store reverse conversion
      this.addConversionMapping(toUnit, fromUnit, 1 / conversion.conversionFactor);

      // Cache categories
      this.categoryCache.set(fromUnit, conversion.category);
      this.categoryCache.set(toUnit, conversion.category);
    }
  }

  /**
   * Adds a bidirectional conversion mapping
   * @private
   */
  private addConversionMapping(fromUnit: string, toUnit: string, factor: number): void {
    if (!this.conversions.has(fromUnit)) {
      this.conversions.set(fromUnit, new Map());
    }
    this.conversions.get(fromUnit)!.set(toUnit, factor);
  }

  /**
   * Converts a value from one unit to another
   *
   * @param value - The numeric value to convert
   * @param fromUnit - The source unit
   * @param toUnit - The target unit
   * @returns Conversion result object, or null if conversion is not possible
   *
   * @example
   * ```typescript
   * const result = converter.convert(2, 'cup', 'ml');
   * // Returns: {
   * //   originalValue: 2,
   * //   originalUnit: 'cup',
   * //   convertedValue: 473.176,
   * //   convertedUnit: 'ml',
   * //   conversionFactor: 236.588
   * // }
   * ```
   */
  public convert(
    value: number,
    fromUnit: string,
    toUnit: string
  ): UnitConversionResult | null {
    // Handle edge cases
    if (value === null || value === undefined || typeof value !== 'number') {
      console.warn('Invalid value for conversion:', value);
      return null;
    }

    if (isNaN(value) || !isFinite(value)) {
      console.warn('Value is NaN or Infinity:', value);
      return null;
    }

    if (!fromUnit || !toUnit) {
      console.warn('Missing units for conversion');
      return null;
    }

    const normalizedFrom = this.normalizeUnit(fromUnit);
    const normalizedTo = this.normalizeUnit(toUnit);

    // Same unit conversion (no-op)
    if (normalizedFrom === normalizedTo) {
      return {
        originalValue: value,
        originalUnit: fromUnit,
        convertedValue: value,
        convertedUnit: toUnit,
        conversionFactor: 1,
      };
    }

    // Direct conversion
    const directFactor = this.conversions.get(normalizedFrom)?.get(normalizedTo);
    if (directFactor !== undefined) {
      return {
        originalValue: value,
        originalUnit: fromUnit,
        convertedValue: value * directFactor,
        convertedUnit: toUnit,
        conversionFactor: directFactor,
      };
    }

    // Try path-based conversion (through intermediate units)
    const conversionPath = this.findConversionPath(normalizedFrom, normalizedTo);
    if (conversionPath) {
      let convertedValue = value;
      let totalFactor = 1;

      for (let i = 0; i < conversionPath.length - 1; i++) {
        const from = conversionPath[i];
        const to = conversionPath[i + 1];
        const factor = this.conversions.get(from)?.get(to);

        if (factor === undefined) {
          return null;
        }

        convertedValue *= factor;
        totalFactor *= factor;
      }

      return {
        originalValue: value,
        originalUnit: fromUnit,
        convertedValue,
        convertedUnit: toUnit,
        conversionFactor: totalFactor,
      };
    }

    // No conversion path found
    console.warn(`No conversion path from ${fromUnit} to ${toUnit}`);
    return null;
  }

  /**
   * Finds a conversion path between two units using BFS
   * @private
   */
  private findConversionPath(fromUnit: string, toUnit: string): string[] | null {
    if (fromUnit === toUnit) {
      return [fromUnit];
    }

    const visited = new Set<string>();
    const queue: { unit: string; path: string[] }[] = [{ unit: fromUnit, path: [fromUnit] }];

    while (queue.length > 0) {
      const { unit, path } = queue.shift()!;

      if (visited.has(unit)) {
        continue;
      }
      visited.add(unit);

      const neighbors = this.conversions.get(unit);
      if (!neighbors) {
        continue;
      }

      for (const [nextUnit] of Array.from(neighbors.entries())) {
        if (nextUnit === toUnit) {
          return [...path, nextUnit];
        }

        if (!visited.has(nextUnit)) {
          queue.push({ unit: nextUnit, path: [...path, nextUnit] });
        }
      }
    }

    return null;
  }

  /**
   * Checks if a conversion between two units is possible
   *
   * @param fromUnit - The source unit
   * @param toUnit - The target unit
   * @returns True if conversion is possible, false otherwise
   *
   * @example
   * ```typescript
   * converter.canConvert('cup', 'ml'); // true
   * converter.canConvert('cup', 'lb'); // false (different categories)
   * ```
   */
  public canConvert(fromUnit: string, toUnit: string): boolean {
    if (!fromUnit || !toUnit) {
      return false;
    }

    const normalizedFrom = this.normalizeUnit(fromUnit);
    const normalizedTo = this.normalizeUnit(toUnit);

    if (normalizedFrom === normalizedTo) {
      return true;
    }

    return this.findConversionPath(normalizedFrom, normalizedTo) !== null;
  }

  /**
   * Gets all units that can be converted to/from the given unit
   *
   * @param unit - The unit to find compatible units for
   * @returns Array of compatible unit names
   *
   * @example
   * ```typescript
   * converter.getCompatibleUnits('cup');
   * // Returns: ['tbsp', 'tsp', 'oz', 'ml', 'l', ...]
   * ```
   */
  public getCompatibleUnits(unit: string): string[] {
    if (!unit) {
      return [];
    }

    const normalizedUnit = this.normalizeUnit(unit);
    const compatible = new Set<string>();
    const visited = new Set<string>();
    const queue: string[] = [normalizedUnit];

    while (queue.length > 0) {
      const currentUnit = queue.shift()!;

      if (visited.has(currentUnit)) {
        continue;
      }
      visited.add(currentUnit);

      const neighbors = this.conversions.get(currentUnit);
      if (neighbors) {
        for (const [neighborUnit] of Array.from(neighbors.entries())) {
          compatible.add(neighborUnit);
          if (!visited.has(neighborUnit)) {
            queue.push(neighborUnit);
          }
        }
      }
    }

    // Remove the original unit from the result
    compatible.delete(normalizedUnit);

    return Array.from(compatible).sort();
  }

  /**
   * Normalizes a unit string to handle plurals and abbreviations
   *
   * @param unit - The unit string to normalize
   * @returns Normalized unit string
   *
   * @example
   * ```typescript
   * converter.normalizeUnit('cups'); // 'cup'
   * converter.normalizeUnit('tablespoons'); // 'tbsp'
   * converter.normalizeUnit('C'); // 'cup'
   * ```
   */
  public normalizeUnit(unit: string): string {
    if (!unit || typeof unit !== 'string') {
      return '';
    }

    const trimmed = unit.trim().toLowerCase();
    return UNIT_NORMALIZATION_MAP[trimmed] || trimmed;
  }

  /**
   * Formats a quantity with its unit for display
   *
   * @param value - The numeric value to format
   * @param unit - The unit to display
   * @param precision - Number of decimal places (default: 2)
   * @returns Formatted string like "2.5 cups" or "500 ml"
   *
   * @example
   * ```typescript
   * converter.formatQuantity(2.5, 'cup'); // "2.5 cups"
   * converter.formatQuantity(1, 'cup'); // "1 cup"
   * converter.formatQuantity(473.176, 'ml', 0); // "473 ml"
   * ```
   */
  public formatQuantity(value: number, unit: string, precision: number = 2): string {
    if (value === null || value === undefined || typeof value !== 'number') {
      return '';
    }

    if (isNaN(value) || !isFinite(value)) {
      return '';
    }

    if (!unit) {
      return value.toString();
    }

    // Format the number with specified precision
    const roundedValue = Number(value.toFixed(precision));

    // Remove trailing zeros after decimal point
    const formattedValue = roundedValue.toString().replace(/\.0+$/, '');

    // Normalize the unit
    const normalizedUnit = this.normalizeUnit(unit);

    // Handle pluralization for count >= 2 or count === 0
    let displayUnit = normalizedUnit;
    if (value !== 1) {
      const pluralMap: Record<string, string> = {
        'cup': 'cups',
        'tbsp': 'tbsp',
        'tsp': 'tsp',
        'oz': 'oz',
        'lb': 'lbs',
        'g': 'g',
        'kg': 'kg',
        'ml': 'ml',
        'l': 'l',
        'piece': 'pieces',
        'whole': 'wholes',
        'clove': 'cloves',
        'bunch': 'bunches',
        'package': 'packages',
      };
      displayUnit = pluralMap[normalizedUnit] || normalizedUnit;
    }

    return `${formattedValue} ${displayUnit}`;
  }

  /**
   * Gets the category of a unit
   *
   * @param unit - The unit to get the category for
   * @returns The unit category, or null if unknown
   */
  public getUnitCategory(unit: string): UnitCategory | null {
    if (!unit) {
      return null;
    }

    const normalizedUnit = this.normalizeUnit(unit);
    return this.categoryCache.get(normalizedUnit) || null;
  }
}

/**
 * Helper function to convert ingredient quantities
 *
 * @param quantity - The quantity to convert
 * @param fromUnit - The source unit
 * @param toUnit - The target unit
 * @param converter - The unit converter instance to use
 * @returns Converted quantity, or original quantity if conversion fails
 *
 * @example
 * ```typescript
 * const newQuantity = convertIngredientQuantity(2, 'cup', 'ml', defaultUnitConverter);
 * // Returns: 473.176
 * ```
 */
export function convertIngredientQuantity(
  quantity: number,
  fromUnit: string,
  toUnit: string,
  converter: UnitConverter
): number {
  if (quantity === null || quantity === undefined || typeof quantity !== 'number') {
    console.warn('Invalid quantity for conversion:', quantity);
    return 0;
  }

  if (quantity < 0) {
    console.warn('Negative quantity:', quantity);
    return 0;
  }

  const result = converter.convert(quantity, fromUnit, toUnit);
  return result ? result.convertedValue : quantity;
}

/**
 * Aggregates ingredients with the same name, converting to a common unit where possible
 *
 * @param ingredients - Array of ingredients with name, quantity, and unit
 * @returns Map of ingredient names to aggregated quantities and units
 *
 * @example
 * ```typescript
 * const ingredients = [
 *   { name: 'flour', quantity: 2, unit: 'cup' },
 *   { name: 'flour', quantity: 4, unit: 'tbsp' },
 *   { name: 'sugar', quantity: 1, unit: 'cup' }
 * ];
 *
 * const aggregated = aggregateIngredients(ingredients);
 * // Returns Map: {
 * //   'flour' => { quantity: 2.25, unit: 'cup' },
 * //   'sugar' => { quantity: 1, unit: 'cup' }
 * // }
 * ```
 */
export function aggregateIngredients(
  ingredients: Array<{ name: string; quantity: number; unit: string }>
): Map<string, { quantity: number; unit: string }> {
  const aggregated = new Map<string, { quantity: number; unit: string }>();

  if (!ingredients || !Array.isArray(ingredients)) {
    return aggregated;
  }

  const converter = defaultUnitConverter;

  for (const ingredient of ingredients) {
    if (!ingredient || !ingredient.name) {
      continue;
    }

    const name = ingredient.name.toLowerCase().trim();
    const quantity = ingredient.quantity;
    const unit = ingredient.unit;

    if (quantity === null || quantity === undefined || quantity < 0) {
      continue;
    }

    if (!unit) {
      continue;
    }

    if (aggregated.has(name)) {
      const existing = aggregated.get(name)!;

      // Try to convert to the existing unit
      const conversionResult = converter.convert(quantity, unit, existing.unit);

      if (conversionResult) {
        existing.quantity += conversionResult.convertedValue;
      } else {
        // Cannot convert, keep separate (append unit to name)
        const uniqueName = `${name} (${unit})`;
        aggregated.set(uniqueName, { quantity, unit });
      }
    } else {
      aggregated.set(name, { quantity, unit });
    }
  }

  return aggregated;
}

/**
 * Suggests the best unit for displaying a quantity based on preferred system
 *
 * @param quantity - The quantity to optimize
 * @param unit - The current unit
 * @param preferredSystem - The preferred measurement system
 * @returns Object with optimized quantity and unit
 *
 * @example
 * ```typescript
 * suggestBestUnit(0.0625, 'cup', 'imperial');
 * // Returns: { quantity: 1, unit: 'tbsp' }
 *
 * suggestBestUnit(1000, 'ml', 'metric');
 * // Returns: { quantity: 1, unit: 'l' }
 * ```
 */
export function suggestBestUnit(
  quantity: number,
  unit: string,
  preferredSystem: 'metric' | 'imperial' = 'imperial'
): { quantity: number; unit: string } {
  if (quantity === null || quantity === undefined || typeof quantity !== 'number') {
    return { quantity: 0, unit };
  }

  if (quantity <= 0 || !isFinite(quantity)) {
    return { quantity, unit };
  }

  if (!unit) {
    return { quantity, unit };
  }

  const converter = defaultUnitConverter;
  const normalizedUnit = converter.normalizeUnit(unit);

  // Define optimization rules
  const metricRules: Array<{ threshold: number; fromUnit: string; toUnit: string }> = [
    { threshold: 1000, fromUnit: 'ml', toUnit: 'l' },
    { threshold: 1000, fromUnit: 'g', toUnit: 'kg' },
  ];

  const imperialRules: Array<{ threshold: number; fromUnit: string; toUnit: string }> = [
    { threshold: 0.25, fromUnit: 'cup', toUnit: 'tbsp' },
    { threshold: 3, fromUnit: 'tbsp', toUnit: 'cup' },
    { threshold: 0.333, fromUnit: 'tbsp', toUnit: 'tsp' },
    { threshold: 16, fromUnit: 'oz', toUnit: 'lb' },
  ];

  const rules = preferredSystem === 'metric' ? metricRules : imperialRules;

  for (const rule of rules) {
    if (normalizedUnit === rule.fromUnit) {
      if (preferredSystem === 'metric' && quantity >= rule.threshold) {
        const result = converter.convert(quantity, rule.fromUnit, rule.toUnit);
        if (result) {
          return { quantity: result.convertedValue, unit: rule.toUnit };
        }
      } else if (preferredSystem === 'imperial' && quantity < rule.threshold) {
        const result = converter.convert(quantity, rule.fromUnit, rule.toUnit);
        if (result) {
          return { quantity: result.convertedValue, unit: rule.toUnit };
        }
      }
    }
  }

  // No optimization needed
  return { quantity, unit };
}

/**
 * Default singleton instance of UnitConverter
 * Use this for most conversion operations throughout the application
 *
 * @example
 * ```typescript
 * import { defaultUnitConverter } from './utils/unitConversion';
 *
 * const result = defaultUnitConverter.convert(2, 'cup', 'ml');
 * console.log(result.convertedValue); // 473.176
 * ```
 */
export const defaultUnitConverter = new UnitConverter();
