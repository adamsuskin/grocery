/**
 * Share Target Handler Utilities
 *
 * Provides functions to process shared content from the Web Share Target API:
 * - Text content (including URLs and grocery list text)
 * - Files (CSV, JSON, text files)
 * - Validation and parsing of various formats
 *
 * This utility integrates with the existing listImport utilities to provide
 * a seamless experience for sharing content into the grocery list app.
 *
 * @module utils/shareTargetHandler
 */

import {
  importList,
  importFromJSON,
  importFromCSV,
  type ImportResult,
  type ImportedItem,
} from './listImport';

/**
 * Type of shared content
 */
export type ShareContentType = 'text' | 'url' | 'file' | 'unknown';

/**
 * Result of processing shared content
 */
export interface ShareProcessResult {
  success: boolean;
  type: ShareContentType;
  listName: string;
  items: ImportedItem[];
  errors: string[];
  warnings: string[];
  metadata?: {
    originalUrl?: string;
    fileName?: string;
    fileType?: string;
    textLength?: number;
  };
}

/**
 * Shared data from Web Share Target API
 */
export interface SharedData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

/**
 * Options for processing shared content
 */
export interface ProcessOptions {
  maxFileSize?: number; // Maximum file size in bytes (default: 5MB)
  maxTextLength?: number; // Maximum text length (default: 50000 characters)
  defaultListName?: string; // Default name if none can be determined
  strictValidation?: boolean; // Enable strict validation (default: false)
}

/**
 * Default processing options
 */
const DEFAULT_OPTIONS: Required<ProcessOptions> = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxTextLength: 50000, // 50k characters
  defaultListName: 'Shared List',
  strictValidation: false,
};

/**
 * Validates shared data before processing
 *
 * @param data - Shared data to validate
 * @returns Error message if invalid, null if valid
 */
export function validateSharedData(data: SharedData): string | null {
  if (!data) {
    return 'No data provided';
  }

  // Check if at least one type of content is provided
  const hasText = data.text && data.text.trim().length > 0;
  const hasUrl = data.url && data.url.trim().length > 0;
  const hasFiles = data.files && data.files.length > 0;

  if (!hasText && !hasUrl && !hasFiles) {
    return 'No valid content provided (text, URL, or files required)';
  }

  return null;
}

/**
 * Determines the type of shared content
 *
 * @param data - Shared data to analyze
 * @returns Content type
 */
export function detectContentType(data: SharedData): ShareContentType {
  // Files take priority
  if (data.files && data.files.length > 0) {
    return 'file';
  }

  // Check if text contains a URL
  if (data.url || isValidUrl(data.text || '')) {
    return 'url';
  }

  // Check if text content exists
  if (data.text && data.text.trim().length > 0) {
    return 'text';
  }

  return 'unknown';
}

/**
 * Checks if a string is a valid URL
 *
 * @param text - Text to check
 * @returns True if valid URL
 */
export function isValidUrl(text: string): boolean {
  try {
    const url = new URL(text.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Processes shared text content into grocery list items
 *
 * Parses text line by line, extracting item names and optional quantities.
 * Supports formats like:
 * - "Apples"
 * - "2 Apples"
 * - "2x Apples"
 * - "Apples - 2kg"
 *
 * @param text - Text content to process
 * @param options - Processing options
 * @returns Processing result
 */
export async function processSharedText(
  text: string,
  options: ProcessOptions = {}
): Promise<ShareProcessResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const errors: string[] = [];
  const warnings: string[] = [];
  const items: ImportedItem[] = [];

  try {
    // Validate text length
    if (text.length > opts.maxTextLength) {
      return {
        success: false,
        type: 'text',
        listName: '',
        items: [],
        errors: [`Text is too long (max ${opts.maxTextLength} characters)`],
        warnings: [],
        metadata: { textLength: text.length },
      };
    }

    // Split into lines and filter empty lines
    const lines = text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      return {
        success: false,
        type: 'text',
        listName: '',
        items: [],
        errors: ['No text content found'],
        warnings: [],
      };
    }

    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      try {
        const item = parseTextLine(line, i + 1);
        if (item) {
          items.push(item);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Line ${i + 1}: ${message}`);
      }
    }

    // Check if we got any valid items
    if (items.length === 0) {
      return {
        success: false,
        type: 'text',
        listName: opts.defaultListName,
        items: [],
        errors: errors.length > 0 ? errors : ['No valid items found in text'],
        warnings,
        metadata: { textLength: text.length },
      };
    }

    // Add warning about categories
    warnings.push('All items imported with "Other" category. You can change categories after import.');

    return {
      success: true,
      type: 'text',
      listName: opts.defaultListName,
      items,
      errors,
      warnings,
      metadata: { textLength: text.length },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      type: 'text',
      listName: '',
      items: [],
      errors: [`Failed to process text: ${message}`],
      warnings: [],
      metadata: { textLength: text.length },
    };
  }
}

/**
 * Parses a single line of text into an item
 *
 * @param line - Line of text to parse
 * @param _lineNumber - Line number for error reporting
 * @returns Parsed item or null if line should be skipped
 */
function parseTextLine(line: string, _lineNumber: number): ImportedItem | null {
  // Skip common non-item lines
  const skipPatterns = [
    /^grocery list:?$/i,
    /^shopping list:?$/i,
    /^list:?$/i,
    /^items:?$/i,
    /^---+$/,
    /^===+$/,
    /^\d+\.\s*$/,
    /^[-*]\s*$/,
  ];

  if (skipPatterns.some(pattern => pattern.test(line))) {
    return null;
  }

  // Remove common list markers (bullets, dashes, numbers)
  let cleanLine = line.replace(/^[-*•◦▪▫]\s*/, ''); // Remove bullet points
  cleanLine = cleanLine.replace(/^\d+\.\s*/, ''); // Remove numbered list markers
  cleanLine = cleanLine.replace(/^\[\s*\]\s*/, ''); // Remove checkbox markers

  if (!cleanLine.trim()) {
    return null;
  }

  // Try to extract quantity from beginning of line
  // Formats: "2 Apples", "2x Apples", "2 x Apples"
  const quantityMatch = cleanLine.match(/^(\d+)\s*x?\s+(.+)$/i);

  let name: string;
  let quantity: number;

  if (quantityMatch) {
    quantity = parseInt(quantityMatch[1], 10);
    name = quantityMatch[2].trim();
  } else {
    quantity = 1;
    name = cleanLine.trim();
  }

  // Validate item name
  if (!name || name.length === 0) {
    throw new Error('Item name cannot be empty');
  }

  if (name.length > 200) {
    throw new Error('Item name is too long (max 200 characters)');
  }

  return {
    name,
    quantity: Math.max(1, quantity),
    category: 'Other',
    notes: '',
  };
}

/**
 * Processes shared URL content
 *
 * Attempts to fetch and parse content from the URL.
 * Note: Due to CORS restrictions, this may not work for all URLs.
 * For best results, URLs should point to plain text, CSV, or JSON files.
 *
 * @param url - URL to process
 * @param options - Processing options
 * @returns Processing result
 */
export async function processSharedUrl(
  url: string,
  options: ProcessOptions = {}
): Promise<ShareProcessResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const warnings: string[] = [];

  try {
    // Validate URL
    if (!isValidUrl(url)) {
      return {
        success: false,
        type: 'url',
        listName: '',
        items: [],
        errors: ['Invalid URL format'],
        warnings: [],
        metadata: { originalUrl: url },
      };
    }

    // Add warning about CORS
    warnings.push('URL content may not be accessible due to CORS restrictions');

    // Try to fetch the URL content
    let response: Response;
    try {
      response = await fetch(url);
    } catch (fetchError) {
      return {
        success: false,
        type: 'url',
        listName: '',
        items: [],
        errors: ['Cannot access URL content (possible CORS restriction)'],
        warnings,
        metadata: { originalUrl: url },
      };
    }

    if (!response.ok) {
      return {
        success: false,
        type: 'url',
        listName: '',
        items: [],
        errors: [`Failed to fetch URL: ${response.status} ${response.statusText}`],
        warnings,
        metadata: { originalUrl: url },
      };
    }

    // Get content type
    const contentType = response.headers.get('content-type') || '';

    // Get content as text
    const content = await response.text();

    if (content.length > opts.maxTextLength) {
      return {
        success: false,
        type: 'url',
        listName: '',
        items: [],
        errors: [`URL content is too large (max ${opts.maxTextLength} characters)`],
        warnings,
        metadata: { originalUrl: url, textLength: content.length },
      };
    }

    // Try to parse based on content type
    let result: ShareProcessResult;

    if (contentType.includes('application/json')) {
      // Create a virtual file for JSON processing
      const file = new File([content], 'shared.json', { type: 'application/json' });
      const importResult = await importFromJSON(file);
      result = convertImportResult(importResult, 'url');
    } else if (contentType.includes('text/csv')) {
      // Create a virtual file for CSV processing
      const file = new File([content], 'shared.csv', { type: 'text/csv' });
      const importResult = await importFromCSV(file);
      result = convertImportResult(importResult, 'url');
    } else {
      // Treat as plain text
      result = await processSharedText(content, options);
    }

    // Add URL to metadata
    result.metadata = {
      ...result.metadata,
      originalUrl: url,
    };

    // Merge warnings
    result.warnings = [...warnings, ...result.warnings];

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      type: 'url',
      listName: '',
      items: [],
      errors: [`Failed to process URL: ${message}`],
      warnings,
      metadata: { originalUrl: url },
    };
  }
}

/**
 * Processes shared files
 *
 * Supports CSV, JSON, and text files.
 * Uses the existing importList utilities for file processing.
 *
 * @param files - Files to process
 * @param options - Processing options
 * @returns Processing result
 */
export async function processSharedFiles(
  files: File[],
  options: ProcessOptions = {}
): Promise<ShareProcessResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const warnings: string[] = [];

  try {
    if (!files || files.length === 0) {
      return {
        success: false,
        type: 'file',
        listName: '',
        items: [],
        errors: ['No files provided'],
        warnings: [],
      };
    }

    // Only process the first file for now
    const file = files[0];

    // Validate file size
    if (file.size > opts.maxFileSize) {
      return {
        success: false,
        type: 'file',
        listName: '',
        items: [],
        errors: [`File is too large (max ${opts.maxFileSize / (1024 * 1024)}MB)`],
        warnings: [],
        metadata: {
          fileName: file.name,
          fileType: file.type,
        },
      };
    }

    // Get file extension
    const extension = file.name.split('.').pop()?.toLowerCase();

    // Check if file type is supported
    const supportedExtensions = ['json', 'csv', 'txt'];
    if (!extension || !supportedExtensions.includes(extension)) {
      return {
        success: false,
        type: 'file',
        listName: '',
        items: [],
        errors: [
          `Unsupported file format: .${extension}. Supported formats: ${supportedExtensions.join(', ')}`
        ],
        warnings: [],
        metadata: {
          fileName: file.name,
          fileType: file.type,
        },
      };
    }

    // Process file using existing import utilities
    const importResult = await importList(file);

    // Convert to ShareProcessResult
    const result = convertImportResult(importResult, 'file');

    // Add file metadata
    result.metadata = {
      ...result.metadata,
      fileName: file.name,
      fileType: file.type,
    };

    // Add warning if multiple files were provided
    if (files.length > 1) {
      result.warnings.unshift(`Only the first file (${file.name}) was processed. ${files.length - 1} file(s) ignored.`);
    }

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      type: 'file',
      listName: '',
      items: [],
      errors: [`Failed to process file: ${message}`],
      warnings,
    };
  }
}

/**
 * Converts ImportResult to ShareProcessResult
 *
 * @param importResult - Import result from listImport utilities
 * @param type - Content type
 * @returns Share process result
 */
function convertImportResult(
  importResult: ImportResult,
  type: ShareContentType
): ShareProcessResult {
  return {
    success: importResult.success,
    type,
    listName: importResult.listName,
    items: importResult.items,
    errors: importResult.errors,
    warnings: importResult.warnings,
  };
}

/**
 * Main entry point for processing shared data
 *
 * Automatically detects the type of shared content and processes it accordingly.
 *
 * @param data - Shared data from Web Share Target API
 * @param options - Processing options
 * @returns Processing result
 */
export async function processSharedData(
  data: SharedData,
  options: ProcessOptions = {}
): Promise<ShareProcessResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Validate shared data
  const validationError = validateSharedData(data);
  if (validationError) {
    return {
      success: false,
      type: 'unknown',
      listName: '',
      items: [],
      errors: [validationError],
      warnings: [],
    };
  }

  // Detect content type
  const contentType = detectContentType(data);

  // Determine list name from title if available
  const listName = data.title && data.title.trim().length > 0
    ? data.title.trim()
    : opts.defaultListName;

  // Update options with list name
  const processOptions: ProcessOptions = {
    ...options,
    defaultListName: listName,
  };

  // Process based on content type
  switch (contentType) {
    case 'file':
      return processSharedFiles(data.files!, processOptions);

    case 'url': {
      const url = data.url || data.text!;
      return processSharedUrl(url, processOptions);
    }

    case 'text':
      return processSharedText(data.text!, processOptions);

    default:
      return {
        success: false,
        type: 'unknown',
        listName: '',
        items: [],
        errors: ['Unable to determine content type'],
        warnings: [],
      };
  }
}

/**
 * Validates file format by checking file extension and MIME type
 *
 * @param file - File to validate
 * @returns Error message if invalid, null if valid
 */
export function validateFileFormat(file: File): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const supportedExtensions = ['json', 'csv', 'txt'];

  // Check extension
  if (!extension || !supportedExtensions.includes(extension)) {
    return `Unsupported file format. Supported formats: ${supportedExtensions.map(ext => `.${ext}`).join(', ')}`;
  }

  // Check MIME type for additional validation
  const supportedMimeTypes = [
    'application/json',
    'text/csv',
    'text/plain',
    'text/comma-separated-values',
    'application/csv',
  ];

  if (file.type && !supportedMimeTypes.includes(file.type)) {
    // Don't fail on MIME type alone as it can be unreliable
    // Just return null and let the extension-based processing handle it
  }

  return null;
}

/**
 * Creates a summary of the processing result for display to users
 *
 * @param result - Processing result
 * @returns Human-readable summary
 */
export function createResultSummary(result: ShareProcessResult): string {
  if (!result.success) {
    return `Failed to import: ${result.errors.join(', ')}`;
  }

  const itemCount = result.items.length;
  const itemWord = itemCount === 1 ? 'item' : 'items';
  const warnings = result.warnings.length > 0
    ? ` (${result.warnings.length} warning${result.warnings.length === 1 ? '' : 's'})`
    : '';

  return `Successfully imported ${itemCount} ${itemWord} to "${result.listName}"${warnings}`;
}
