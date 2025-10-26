/**
 * List Import Utilities
 *
 * Provides functions to import grocery lists from various file formats:
 * - JSON: Structured format with full item details
 * - CSV: Comma-separated values with headers
 * - Plain Text: Simple line-by-line item names
 *
 * @module utils/listImport
 */

import type { Category } from '../types';

/**
 * Imported item structure
 */
export interface ImportedItem {
  name: string;
  quantity: number;
  category: Category;
  notes: string;
}

/**
 * Result of import operation
 */
export interface ImportResult {
  success: boolean;
  listName: string;
  items: ImportedItem[];
  errors: string[];
  warnings: string[];
}

/**
 * Valid categories for validation
 */
const VALID_CATEGORIES: readonly Category[] = [
  'Produce',
  'Dairy',
  'Meat',
  'Bakery',
  'Pantry',
  'Frozen',
  'Beverages',
  'Other',
] as const;

/**
 * Validate and normalize category
 */
function normalizeCategory(category: string): Category {
  const normalized = category.trim();
  const found = VALID_CATEGORIES.find(
    c => c.toLowerCase() === normalized.toLowerCase()
  );
  return found || 'Other';
}

/**
 * Validate item name
 */
function validateItemName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Item name cannot be empty');
  }
  if (trimmed.length > 200) {
    throw new Error('Item name is too long (max 200 characters)');
  }
  return trimmed;
}

/**
 * Validate and normalize quantity
 */
function normalizeQuantity(quantity: any): number {
  const num = typeof quantity === 'string' ? parseFloat(quantity) : Number(quantity);
  if (isNaN(num) || num < 0) {
    return 1;
  }
  return Math.max(1, Math.floor(num));
}

/**
 * Import list from JSON file
 * Expected format:
 * {
 *   "name": "List Name",
 *   "items": [
 *     {
 *       "name": "Item Name",
 *       "quantity": 1,
 *       "category": "Produce",
 *       "notes": "Optional notes"
 *     }
 *   ]
 * }
 */
export async function importFromJSON(file: File): Promise<ImportResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const items: ImportedItem[] = [];

  try {
    // Read file content
    const content = await file.text();

    // Parse JSON
    let data: any;
    try {
      data = JSON.parse(content);
    } catch (parseError) {
      return {
        success: false,
        listName: '',
        items: [],
        errors: ['Invalid JSON format. Please check the file structure.'],
        warnings: [],
      };
    }

    // Validate structure
    if (typeof data !== 'object' || data === null) {
      return {
        success: false,
        listName: '',
        items: [],
        errors: ['JSON must contain an object with list data'],
        warnings: [],
      };
    }

    // Extract list name
    const listName = typeof data.name === 'string' ? data.name.trim() : 'Imported List';
    if (!data.name) {
      warnings.push('No list name found, using default name');
    }

    // Validate items array
    if (!Array.isArray(data.items)) {
      return {
        success: false,
        listName,
        items: [],
        errors: ['JSON must contain an "items" array'],
        warnings: [],
      };
    }

    if (data.items.length === 0) {
      return {
        success: false,
        listName,
        items: [],
        errors: ['No items found in the list'],
        warnings: [],
      };
    }

    // Process each item
    data.items.forEach((item: any, index: number) => {
      try {
        if (typeof item !== 'object' || item === null) {
          errors.push(`Item ${index + 1}: Invalid item format`);
          return;
        }

        const name = validateItemName(item.name || '');
        const quantity = normalizeQuantity(item.quantity);
        const category = normalizeCategory(item.category || 'Other');
        const notes = typeof item.notes === 'string' ? item.notes.trim() : '';

        // Warn if category was changed
        if (item.category && category !== item.category) {
          warnings.push(`Item "${name}": Category "${item.category}" changed to "${category}"`);
        }

        items.push({ name, quantity, category, notes });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Item ${index + 1}: ${message}`);
      }
    });

    // Check if we got any valid items
    if (items.length === 0) {
      return {
        success: false,
        listName,
        items: [],
        errors: errors.length > 0 ? errors : ['No valid items found'],
        warnings,
      };
    }

    return {
      success: true,
      listName,
      items,
      errors,
      warnings,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      listName: '',
      items: [],
      errors: [`Failed to import JSON: ${message}`],
      warnings: [],
    };
  }
}

/**
 * Import list from CSV file
 * Expected format:
 * name,quantity,category,notes
 * Milk,2,Dairy,Whole milk
 * Apples,6,Produce,
 */
export async function importFromCSV(file: File): Promise<ImportResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const items: ImportedItem[] = [];

  try {
    // Read file content
    const content = await file.text();
    const lines = content.split(/\r?\n/).filter(line => line.trim());

    if (lines.length === 0) {
      return {
        success: false,
        listName: '',
        items: [],
        errors: ['CSV file is empty'],
        warnings: [],
      };
    }

    // Extract list name from filename
    const listName = file.name.replace(/\.csv$/i, '').trim() || 'Imported List';

    // Check for header row
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('name') || firstLine.includes('item');
    const startIndex = hasHeader ? 1 : 0;

    if (hasHeader && lines.length === 1) {
      return {
        success: false,
        listName,
        items: [],
        errors: ['CSV file contains only headers, no data'],
        warnings: [],
      };
    }

    // Process each line
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        // Simple CSV parser (handles basic quotes)
        const values = parseCSVLine(line);

        if (values.length === 0) continue;

        const name = validateItemName(values[0] || '');
        const quantity = normalizeQuantity(values[1] || 1);
        const category = normalizeCategory(values[2] || 'Other');
        const notes = values[3] ? values[3].trim() : '';

        // Warn if category was normalized
        if (values[2] && category !== values[2].trim() && category === 'Other') {
          warnings.push(`Line ${i + 1}: Unknown category "${values[2]}", using "Other"`);
        }

        items.push({ name, quantity, category, notes });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Line ${i + 1}: ${message}`);
      }
    }

    // Check if we got any valid items
    if (items.length === 0) {
      return {
        success: false,
        listName,
        items: [],
        errors: errors.length > 0 ? errors : ['No valid items found in CSV'],
        warnings,
      };
    }

    return {
      success: true,
      listName,
      items,
      errors,
      warnings,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      listName: '',
      items: [],
      errors: [`Failed to import CSV: ${message}`],
      warnings: [],
    };
  }
}

/**
 * Parse a CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

/**
 * Import list from plain text file
 * Expected format:
 * - One item per line
 * - Optionally with quantity prefix (e.g., "2 Apples" or "2x Apples")
 * - Empty lines are ignored
 */
export async function importFromText(file: File): Promise<ImportResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const items: ImportedItem[] = [];

  try {
    // Read file content
    const content = await file.text();
    const lines = content.split(/\r?\n/).filter(line => line.trim());

    if (lines.length === 0) {
      return {
        success: false,
        listName: '',
        items: [],
        errors: ['Text file is empty'],
        warnings: [],
      };
    }

    // Extract list name from filename
    const listName = file.name.replace(/\.txt$/i, '').trim() || 'Imported List';

    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        // Try to extract quantity from beginning of line
        // Formats: "2 Apples", "2x Apples", "Apples"
        const quantityMatch = line.match(/^(\d+)\s*x?\s+(.+)$/i);

        let name: string;
        let quantity: number;

        if (quantityMatch) {
          quantity = parseInt(quantityMatch[1], 10);
          name = validateItemName(quantityMatch[2]);
        } else {
          quantity = 1;
          name = validateItemName(line);
        }

        items.push({
          name,
          quantity: Math.max(1, quantity),
          category: 'Other',
          notes: '',
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Line ${i + 1}: ${message}`);
      }
    }

    // Check if we got any valid items
    if (items.length === 0) {
      return {
        success: false,
        listName,
        items: [],
        errors: errors.length > 0 ? errors : ['No valid items found in text file'],
        warnings,
      };
    }

    // Add warning about categories
    if (items.length > 0) {
      warnings.push('All items imported with "Other" category. You can change categories after import.');
    }

    return {
      success: true,
      listName,
      items,
      errors,
      warnings,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      listName: '',
      items: [],
      errors: [`Failed to import text file: ${message}`],
      warnings: [],
    };
  }
}

/**
 * Detect file format and import accordingly
 */
export async function importList(file: File): Promise<ImportResult> {
  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      success: false,
      listName: '',
      items: [],
      errors: ['File is too large (max 5MB)'],
      warnings: [],
    };
  }

  // Detect format from file extension
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'json':
      return importFromJSON(file);
    case 'csv':
      return importFromCSV(file);
    case 'txt':
      return importFromText(file);
    default:
      return {
        success: false,
        listName: '',
        items: [],
        errors: [`Unsupported file format: .${extension}. Supported formats: .json, .csv, .txt`],
        warnings: [],
      };
  }
}
