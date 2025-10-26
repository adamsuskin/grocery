/**
 * List Export Utilities
 *
 * Provides functions to export grocery lists in various formats:
 * - JSON: Full data export with metadata
 * - CSV: Spreadsheet-compatible format
 * - Plain Text: Simple readable format
 * - Print: Printer-friendly HTML view
 *
 * @module utils/listExport
 */

import type { GroceryItem, ListWithMembers, Category, CustomCategory } from '../types';
import { apiClient } from './api';
import { getZeroInstance } from '../zero-store';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Export metadata included in all export formats
 */
export interface ExportMetadata {
  listName: string;
  listId: string;
  exportDate: string;
  exportTimestamp: number;
  itemCount: number;
  memberCount: number;
  members: Array<{
    name: string;
    email: string;
    permission: string;
  }>;
}

/**
 * Full export data structure
 */
export interface ExportData {
  metadata: ExportMetadata;
  items: GroceryItem[];
  customCategories?: CustomCategory[];
}

/**
 * Options for CSV export
 */
export interface CSVExportOptions {
  includeMetadata?: boolean;
  delimiter?: string;
}

/**
 * Options for text export
 */
export interface TextExportOptions {
  groupByCategory?: boolean;
  includeMetadata?: boolean;
  includeNotes?: boolean;
}

/**
 * Options for print export
 */
export interface PrintExportOptions {
  groupByCategory?: boolean;
  includeNotes?: boolean;
  showCheckboxes?: boolean;
}

// =============================================================================
// DATA FETCHING
// =============================================================================

/**
 * Fetches list data and items for export
 *
 * @param listId - The list ID to export
 * @returns Export data with metadata, items, and custom categories
 * @throws {Error} If fetch fails
 */
async function fetchExportData(listId: string): Promise<ExportData> {
  try {
    // Fetch list details with members
    const listResponse = await apiClient.get<{ success: boolean; data: { list: ListWithMembers } }>(
      `/lists/${listId}`
    );

    if (!listResponse.success || !listResponse.data) {
      throw new Error('Failed to fetch list data');
    }

    const list = listResponse.data.list;

    // Fetch items for the list
    const itemsResponse = await apiClient.get<{ items: GroceryItem[] }>(
      `/items?listId=${listId}`
    );

    const items = itemsResponse.items || [];

    // Fetch custom categories for the list
    const zero = getZeroInstance();
    let customCategories: CustomCategory[] = [];
    try {
      // Query custom categories using Zero's query API
      const categoriesQueryResult = await (zero.query as any).custom_categories
        .where('list_id', listId);

      // Convert the query result to an array by iterating
      const categoriesArray = Array.isArray(categoriesQueryResult)
        ? categoriesQueryResult
        : [];

      customCategories = categoriesArray.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        listId: cat.list_id,
        createdBy: cat.created_by,
        color: cat.color || undefined,
        icon: cat.icon || undefined,
        displayOrder: cat.display_order ?? 0,
        isArchived: cat.is_archived ?? false,
        isLocked: cat.is_locked ?? false,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
      }));
    } catch (categoryError) {
      console.warn('Failed to fetch custom categories, continuing without them:', categoryError);
      // Continue export without custom categories
    }

    // Build metadata
    const metadata: ExportMetadata = {
      listName: list.name,
      listId: list.id,
      exportDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      exportTimestamp: Date.now(),
      itemCount: items.length,
      memberCount: list.memberCount,
      members: (list.members || []).map(member => ({
        name: member.userName,
        email: member.userEmail,
        permission: member.permission,
      })),
    };

    return {
      metadata,
      items,
      customCategories: customCategories.length > 0 ? customCategories : undefined
    };
  } catch (error) {
    console.error('Error fetching export data:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to fetch export data'
    );
  }
}

// =============================================================================
// FILENAME GENERATION
// =============================================================================

/**
 * Generates a safe filename from list name and format
 *
 * @param listName - The list name
 * @param format - File format extension
 * @returns Safe filename with date
 *
 * @example
 * generateFileName('Weekly Groceries', 'csv')
 * // Returns: 'weekly-groceries-2024-01-15.csv'
 */
function generateFileName(listName: string, format: string): string {
  // Clean list name: lowercase, replace spaces/special chars with hyphens
  const safeName = listName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Get current date in YYYY-MM-DD format
  const date = new Date().toISOString().split('T')[0];

  return `${safeName}-${date}.${format}`;
}

// =============================================================================
// DOWNLOAD HELPER
// =============================================================================

/**
 * Triggers browser download of content
 *
 * @param content - File content
 * @param fileName - Name of file to download
 * @param mimeType - MIME type of content
 */
function triggerDownload(content: string, fileName: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// =============================================================================
// JSON EXPORT
// =============================================================================

/**
 * Exports list to JSON format
 * Includes full data with metadata
 *
 * @param listId - The list ID to export
 * @returns Promise that resolves when download starts
 *
 * @example
 * ```typescript
 * await exportToJSON('list-123');
 * // Downloads: weekly-groceries-2024-01-15.json
 * ```
 */
export async function exportToJSON(listId: string): Promise<void> {
  try {
    const data = await fetchExportData(listId);

    // Format JSON with indentation for readability
    const jsonContent = JSON.stringify(data, null, 2);

    const fileName = generateFileName(data.metadata.listName, 'json');
    triggerDownload(jsonContent, fileName, 'application/json');
  } catch (error) {
    console.error('JSON export failed:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to export to JSON'
    );
  }
}

// =============================================================================
// CSV EXPORT
// =============================================================================

/**
 * Escapes CSV field values
 *
 * @param value - Value to escape
 * @returns Escaped CSV field
 */
function escapeCSVField(value: string | number | boolean): string {
  const stringValue = String(value);

  // If contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Exports list to CSV format
 * Compatible with Excel and Google Sheets
 *
 * @param listId - The list ID to export
 * @param options - CSV export options
 * @returns Promise that resolves when download starts
 *
 * @example
 * ```typescript
 * await exportToCSV('list-123', { includeMetadata: true });
 * // Downloads: weekly-groceries-2024-01-15.csv
 * ```
 */
export async function exportToCSV(
  listId: string,
  options: CSVExportOptions = {}
): Promise<void> {
  try {
    const { includeMetadata = true, delimiter = ',' } = options;
    const data = await fetchExportData(listId);

    const lines: string[] = [];

    // Add metadata as comments if requested
    if (includeMetadata) {
      lines.push(`# List: ${data.metadata.listName}`);
      lines.push(`# Exported: ${data.metadata.exportDate}`);
      lines.push(`# Items: ${data.metadata.itemCount}`);
      lines.push(`# Members: ${data.metadata.memberCount}`);

      if (data.metadata.members.length > 0) {
        const memberNames = data.metadata.members.map(m => m.name).join(', ');
        lines.push(`# Collaborators: ${memberNames}`);
      }

      if (data.customCategories && data.customCategories.length > 0) {
        const categoryNames = data.customCategories.map(c => c.name).join(', ');
        lines.push(`# Custom Categories: ${categoryNames}`);
        lines.push(`# Note: Custom categories (color/icon) are preserved in JSON exports`);
      }

      lines.push(''); // Blank line
    }

    // Add header row
    const headers = ['Name', 'Quantity', 'Category', 'Status', 'Notes'];
    lines.push(headers.map(escapeCSVField).join(delimiter));

    // Add data rows
    for (const item of data.items) {
      const row = [
        item.name,
        item.quantity,
        item.category,
        item.gotten ? 'Completed' : 'Pending',
        item.notes || '',
      ];
      lines.push(row.map(escapeCSVField).join(delimiter));
    }

    const csvContent = lines.join('\n');
    const fileName = generateFileName(data.metadata.listName, 'csv');
    triggerDownload(csvContent, fileName, 'text/csv');
  } catch (error) {
    console.error('CSV export failed:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to export to CSV'
    );
  }
}

// =============================================================================
// TEXT EXPORT
// =============================================================================

/**
 * Groups items by category
 *
 * @param items - Items to group
 * @returns Map of category to items
 */
function groupItemsByCategory(items: GroceryItem[]): Map<Category, GroceryItem[]> {
  const groups = new Map<Category, GroceryItem[]>();

  for (const item of items) {
    const category = item.category;
    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category)!.push(item);
  }

  return groups;
}

/**
 * Exports list to plain text format
 * Simple, readable format suitable for printing or email
 *
 * @param listId - The list ID to export
 * @param options - Text export options
 * @returns Promise that resolves when download starts
 *
 * @example
 * ```typescript
 * await exportToText('list-123', { groupByCategory: true });
 * // Downloads: weekly-groceries-2024-01-15.txt
 * ```
 */
export async function exportToText(
  listId: string,
  options: TextExportOptions = {}
): Promise<void> {
  try {
    const { groupByCategory = true, includeMetadata = true, includeNotes = true } = options;
    const data = await fetchExportData(listId);

    const lines: string[] = [];

    // Add header
    lines.push('='.repeat(60));
    lines.push(data.metadata.listName.toUpperCase());
    lines.push('='.repeat(60));
    lines.push('');

    // Add metadata
    if (includeMetadata) {
      lines.push(`Exported: ${data.metadata.exportDate}`);
      lines.push(`Total Items: ${data.metadata.itemCount}`);

      if (data.metadata.members.length > 0) {
        lines.push(`Collaborators: ${data.metadata.members.map(m => m.name).join(', ')}`);
      }

      lines.push('');
      lines.push('-'.repeat(60));
      lines.push('');
    }

    if (groupByCategory) {
      // Group items by category
      const groups = groupItemsByCategory(data.items);
      const sortedCategories = Array.from(groups.keys()).sort();

      for (const category of sortedCategories) {
        const items = groups.get(category)!;

        // Category header
        lines.push(`[${category}]`);
        lines.push('');

        // Items in category
        for (const item of items) {
          const status = item.gotten ? '[X]' : '[ ]';
          const quantityStr = item.quantity > 1 ? ` (${item.quantity})` : '';
          lines.push(`  ${status} ${item.name}${quantityStr}`);

          if (includeNotes && item.notes) {
            lines.push(`      Note: ${item.notes}`);
          }
        }

        lines.push('');
      }
    } else {
      // Simple list without grouping
      for (const item of data.items) {
        const status = item.gotten ? '[X]' : '[ ]';
        const quantityStr = item.quantity > 1 ? ` (${item.quantity})` : '';
        lines.push(`${status} ${item.name}${quantityStr} - ${item.category}`);

        if (includeNotes && item.notes) {
          lines.push(`    Note: ${item.notes}`);
        }
      }
    }

    // Add footer
    lines.push('');
    lines.push('='.repeat(60));
    lines.push(`${data.items.filter(i => i.gotten).length} of ${data.items.length} items completed`);
    lines.push('='.repeat(60));

    const textContent = lines.join('\n');
    const fileName = generateFileName(data.metadata.listName, 'txt');
    triggerDownload(textContent, fileName, 'text/plain');
  } catch (error) {
    console.error('Text export failed:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to export to text'
    );
  }
}

// =============================================================================
// PRINT EXPORT
// =============================================================================

/**
 * Exports list to print-friendly HTML view
 * Opens in new window for printing
 *
 * @param listId - The list ID to export
 * @param options - Print export options
 * @returns Promise that resolves when print window opens
 *
 * @example
 * ```typescript
 * await exportToPrint('list-123', { groupByCategory: true });
 * // Opens print dialog with formatted list
 * ```
 */
export async function exportToPrint(
  listId: string,
  options: PrintExportOptions = {}
): Promise<void> {
  try {
    const { groupByCategory = true, includeNotes = true, showCheckboxes = true } = options;
    const data = await fetchExportData(listId);

    // Build HTML content
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.metadata.listName} - Grocery List</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
      color: #333;
      line-height: 1.6;
    }

    header {
      border-bottom: 3px solid #4caf50;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    h1 {
      font-size: 2rem;
      color: #2c3e50;
      margin-bottom: 10px;
    }

    .metadata {
      color: #666;
      font-size: 0.9rem;
      margin-top: 10px;
    }

    .metadata p {
      margin: 4px 0;
    }

    .category-section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }

    .category-header {
      background-color: #f5f5f5;
      padding: 10px 15px;
      border-left: 4px solid #4caf50;
      font-size: 1.2rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 15px;
    }

    .items-list {
      list-style: none;
      padding-left: 0;
    }

    .item {
      padding: 10px 15px;
      margin-bottom: 8px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      page-break-inside: avoid;
    }

    .item.completed {
      background-color: #f9f9f9;
      opacity: 0.7;
    }

    .checkbox {
      width: 20px;
      height: 20px;
      border: 2px solid #666;
      border-radius: 3px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .checkbox.checked {
      background-color: #4caf50;
      border-color: #4caf50;
      position: relative;
    }

    .checkbox.checked::after {
      content: '✓';
      color: white;
      position: absolute;
      top: -2px;
      left: 3px;
      font-size: 16px;
      font-weight: bold;
    }

    .item-content {
      flex: 1;
    }

    .item-name {
      font-size: 1.05rem;
      font-weight: 500;
      color: #333;
    }

    .item.completed .item-name {
      text-decoration: line-through;
    }

    .item-quantity {
      color: #4caf50;
      font-weight: 600;
      margin-left: 8px;
    }

    .item-notes {
      font-size: 0.9rem;
      color: #666;
      margin-top: 4px;
      font-style: italic;
    }

    footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
      text-align: center;
      color: #666;
      font-size: 0.9rem;
    }

    .stats {
      margin-bottom: 10px;
      font-weight: 600;
    }

    @media print {
      body {
        padding: 20px;
      }

      .no-print {
        display: none;
      }

      .category-section {
        page-break-inside: avoid;
      }

      .item {
        page-break-inside: avoid;
      }
    }

    @media screen {
      .print-button {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        background-color: #4caf50;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        z-index: 1000;
      }

      .print-button:hover {
        background-color: #45a049;
      }
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">Print List</button>

  <header>
    <h1>${data.metadata.listName}</h1>
    <div class="metadata">
      <p><strong>Exported:</strong> ${data.metadata.exportDate}</p>
      <p><strong>Total Items:</strong> ${data.metadata.itemCount}</p>
      ${
        data.metadata.members.length > 0
          ? `<p><strong>Collaborators:</strong> ${data.metadata.members.map(m => m.name).join(', ')}</p>`
          : ''
      }
    </div>
  </header>

  <main>
    ${
      groupByCategory
        ? generateCategoryGroupsHTML(data.items, includeNotes, showCheckboxes)
        : generateSimpleListHTML(data.items, includeNotes, showCheckboxes)
    }
  </main>

  <footer>
    <p class="stats">
      ${data.items.filter(i => i.gotten).length} of ${data.items.length} items completed
      (${Math.round((data.items.filter(i => i.gotten).length / data.items.length) * 100) || 0}%)
    </p>
    <p>Generated by Grocery List App</p>
  </footer>

  <script>
    // Auto-print dialog on load (optional)
    // Uncomment to enable auto-print
    // window.onload = () => setTimeout(() => window.print(), 500);
  </script>
</body>
</html>
    `.trim();

    // Open in new window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Failed to open print window. Please allow popups for this site.');
    }

    printWindow.document.write(html);
    printWindow.document.close();
  } catch (error) {
    console.error('Print export failed:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to export for printing'
    );
  }
}

/**
 * Generates HTML for category-grouped items
 */
function generateCategoryGroupsHTML(
  items: GroceryItem[],
  includeNotes: boolean,
  showCheckboxes: boolean
): string {
  const groups = groupItemsByCategory(items);
  const sortedCategories = Array.from(groups.keys()).sort();

  return sortedCategories
    .map(category => {
      const categoryItems = groups.get(category)!;
      return `
    <div class="category-section">
      <div class="category-header">${category}</div>
      <ul class="items-list">
        ${categoryItems.map(item => generateItemHTML(item, includeNotes, showCheckboxes)).join('')}
      </ul>
    </div>
      `;
    })
    .join('');
}

/**
 * Generates HTML for simple item list
 */
function generateSimpleListHTML(
  items: GroceryItem[],
  includeNotes: boolean,
  showCheckboxes: boolean
): string {
  return `
    <ul class="items-list">
      ${items.map(item => generateItemHTML(item, includeNotes, showCheckboxes)).join('')}
    </ul>
  `;
}

/**
 * Generates HTML for a single item
 */
function generateItemHTML(
  item: GroceryItem,
  includeNotes: boolean,
  showCheckboxes: boolean
): string {
  const completedClass = item.gotten ? 'completed' : '';
  const checkedClass = item.gotten ? 'checked' : '';
  const quantityStr = item.quantity > 1 ? `<span class="item-quantity">×${item.quantity}</span>` : '';
  const notesStr =
    includeNotes && item.notes ? `<div class="item-notes">${item.notes}</div>` : '';

  return `
    <li class="item ${completedClass}">
      ${showCheckboxes ? `<div class="checkbox ${checkedClass}"></div>` : ''}
      <div class="item-content">
        <div class="item-name">${item.name}${quantityStr}</div>
        ${notesStr}
      </div>
    </li>
  `;
}

// =============================================================================
// EXPORT API
// =============================================================================

/**
 * List export API
 */
export const listExport = {
  exportToJSON,
  exportToCSV,
  exportToText,
  exportToPrint,
};

/**
 * Default export for convenience
 */
export default listExport;
