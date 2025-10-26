/**
 * Share Target API Type Definitions
 *
 * This module provides TypeScript type definitions for the Web Share Target API,
 * enabling the application to receive shared content from other applications.
 *
 * @module shareTarget
 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest/share_target
 */

/**
 * Error types that can occur during share target processing
 *
 * @enum {string}
 */
export enum ShareTargetError {
  /** No shared content was provided */
  NO_CONTENT = 'NO_CONTENT',

  /** The shared content type is not supported */
  UNSUPPORTED_TYPE = 'UNSUPPORTED_TYPE',

  /** An error occurred while processing shared files */
  FILE_PROCESSING_ERROR = 'FILE_PROCESSING_ERROR',

  /** The shared content exceeds size limits */
  SIZE_LIMIT_EXCEEDED = 'SIZE_LIMIT_EXCEEDED',

  /** An error occurred while parsing the shared data */
  PARSE_ERROR = 'PARSE_ERROR',

  /** Network error during share processing */
  NETWORK_ERROR = 'NETWORK_ERROR',

  /** Generic error during share handling */
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Raw content received through the Share Target API
 *
 * Represents the data that can be shared from other applications,
 * including text content, URLs, and file attachments.
 *
 * @interface SharedContent
 */
export interface SharedContent {
  /**
   * The title of the shared content
   * @example "My Shopping List"
   */
  title?: string;

  /**
   * The main text content being shared
   * @example "Milk\nBread\nEggs"
   */
  text?: string;

  /**
   * A URL associated with the shared content
   * @example "https://example.com/list/123"
   */
  url?: string;

  /**
   * Array of files being shared (e.g., images, documents)
   * Typically used for sharing images of receipts or shopping lists
   */
  files?: File[];
}

/**
 * Form data structure matching the web app manifest share_target configuration
 *
 * This interface defines the parameter names used in the share target form
 * as configured in the PWA manifest. The keys correspond to the form field
 * names, and the values contain the shared data.
 *
 * @interface ShareTargetFormData
 * @see manifest.json share_target.params
 */
export interface ShareTargetFormData {
  /**
   * Form parameter for the shared title
   * Maps to the 'title' param in manifest share_target
   */
  title?: string;

  /**
   * Form parameter for the shared text content
   * Maps to the 'text' param in manifest share_target
   */
  text?: string;

  /**
   * Form parameter for the shared URL
   * Maps to the 'url' param in manifest share_target
   */
  url?: string;

  /**
   * Form parameter for shared files
   * Maps to the 'files' param in manifest share_target
   * Can be a single file or array of files
   */
  files?: File | File[];
}

/**
 * Service worker fetch event for share target requests
 *
 * Represents the service worker fetch event with additional context for handling
 * share target requests received through the Share Target API.
 *
 * Note: This type is primarily for use in service worker context.
 * In the main application, use the ProcessedShareData interface instead.
 *
 * @interface ShareTargetEvent
 */
export interface ShareTargetEvent {
  /**
   * The incoming request containing shared data
   * For share targets, this is typically a POST request with FormData
   */
  request: Request;

  /**
   * The URL of the share target endpoint
   * Should match the action URL defined in manifest share_target
   */
  readonly target: string;

  /**
   * Wait until promise for the event
   */
  waitUntil: (promise: Promise<any>) => void;

  /**
   * Respond with a response for the request
   */
  respondWith: (response: Response | Promise<Response>) => void;
}

/**
 * Result of processing shared content
 *
 * Represents the cleaned and validated data after processing the raw
 * shared content. This structure is ready to be consumed by the application.
 *
 * @interface ProcessedShareData
 */
export interface ProcessedShareData {
  /**
   * Processed title, trimmed and validated
   */
  title: string | null;

  /**
   * Processed text content, trimmed and validated
   */
  text: string | null;

  /**
   * Processed URL, validated as a proper URL
   */
  url: string | null;

  /**
   * Parsed grocery items extracted from shared text
   * Each item represents a line from the shared content
   * @example ["Milk", "Bread", "Eggs"]
   */
  items: string[];

  /**
   * Processed file data with metadata
   * Includes file information and optional data URLs for images
   */
  files: ProcessedFile[];

  /**
   * Timestamp when the share was processed
   * ISO 8601 format string
   * @example "2025-10-26T12:34:56.789Z"
   */
  timestamp: string;

  /**
   * The source/origin of the shared content, if available
   * @example "twitter.com", "notes.app"
   */
  source?: string;
}

/**
 * Metadata and content for a processed shared file
 *
 * @interface ProcessedFile
 */
export interface ProcessedFile {
  /**
   * Original filename
   * @example "shopping-list.jpg"
   */
  name: string;

  /**
   * MIME type of the file
   * @example "image/jpeg"
   */
  type: string;

  /**
   * File size in bytes
   */
  size: number;

  /**
   * Data URL representation of the file content (for images)
   * Used to display image previews
   * @example "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
   */
  dataUrl?: string;

  /**
   * Whether this file type is supported by the application
   */
  supported: boolean;

  /**
   * Error message if file processing failed
   */
  error?: string;
}

/**
 * Configuration options for share target processing
 *
 * @interface ShareTargetConfig
 */
export interface ShareTargetConfig {
  /**
   * Maximum file size allowed in bytes
   * @default 5242880 (5MB)
   */
  maxFileSize?: number;

  /**
   * Maximum number of files that can be processed
   * @default 10
   */
  maxFiles?: number;

  /**
   * Supported MIME types for file sharing
   * @default ["image/jpeg", "image/png", "image/gif", "image/webp", "text/plain"]
   */
  supportedTypes?: string[];

  /**
   * Whether to automatically extract items from shared text
   * @default true
   */
  autoExtractItems?: boolean;

  /**
   * Maximum length for shared text content
   * @default 10000
   */
  maxTextLength?: number;
}

/**
 * Result of a share target operation
 *
 * @interface ShareTargetResult
 */
export interface ShareTargetResult {
  /**
   * Whether the share operation was successful
   */
  success: boolean;

  /**
   * The processed share data, if successful
   */
  data?: ProcessedShareData;

  /**
   * Error information, if the operation failed
   */
  error?: {
    code: ShareTargetError;
    message: string;
    details?: unknown;
  };
}

/**
 * Handler function type for processing share target requests
 *
 * @callback ShareTargetHandler
 * @param {Request} request - The incoming share target request
 * @returns {Promise<Response>} Response to send back to the browser
 */
export type ShareTargetHandler = (request: Request) => Promise<Response>;

/**
 * Callback function type for handling processed share data
 *
 * @callback ShareDataCallback
 * @param {ProcessedShareData} data - The processed share data
 * @returns {void | Promise<void>}
 */
export type ShareDataCallback = (data: ProcessedShareData) => void | Promise<void>;
