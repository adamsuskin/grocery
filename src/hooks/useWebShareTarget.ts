/**
 * useWebShareTarget Hook
 *
 * A custom React hook for handling Web Share Target data in a Progressive Web App.
 * This hook enables the app to receive shared content from other applications via
 * the operating system's share sheet.
 *
 * ## Features
 * - Check URL parameters for share target data (from GET requests)
 * - Listen for service worker messages about shared content
 * - Retrieve shared data from Cache API or IndexedDB
 * - Return the shared content and processing state
 * - Provide a cleanup function
 * - Handle errors gracefully
 * - Clean up blob URLs and cached data after use
 *
 * ## Browser Support
 * - Chrome/Edge 76+ (full support)
 * - Safari/Firefox: Not supported (gracefully degrades)
 *
 * ## Usage
 * ```tsx
 * import { useWebShareTarget } from './hooks/useWebShareTarget';
 *
 * function App() {
 *   const { sharedData, isProcessing, error, clearSharedData } = useWebShareTarget();
 *
 *   useEffect(() => {
 *     if (sharedData) {
 *       console.log('Received shared data:', sharedData);
 *       // Process the shared content (e.g., add items to list)
 *       processSharedContent(sharedData);
 *       // Clean up when done
 *       clearSharedData();
 *     }
 *   }, [sharedData]);
 *
 *   return (
 *     <div>
 *       {isProcessing && <p>Processing shared content...</p>}
 *       {error && <p>Error: {error.message}</p>}
 *     </div>
 *   );
 * }
 * ```
 *
 * ## Share Target Flow
 *
 * 1. User shares content to the app from another app
 * 2. Service worker intercepts the POST request to /share-target
 * 3. Service worker stores data in Cache API or IndexedDB
 * 4. Service worker posts message to client with cache key
 * 5. This hook receives the message and retrieves data
 * 6. Hook returns processed data to component
 * 7. Component processes data and calls clearSharedData()
 *
 * ## Storage Locations
 *
 * The hook checks for shared data in multiple locations:
 * - URL parameters (for GET-based share targets)
 * - Cache API (temporary storage by service worker)
 * - IndexedDB (persistent storage by service worker)
 * - Service worker messages (real-time notifications)
 *
 * @module useWebShareTarget
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  ProcessedShareData,
} from '../types/shareTarget';

/**
 * Default configuration for share target storage
 */
const SHARE_TARGET_CONFIG = {
  cacheName: 'grocery-share-target',
  dbName: 'grocery-share-target-db',
  storeName: 'shared-data',
  maxAge: 3600000, // 1 hour
} as const;

/**
 * Storage key for temporary shared data in localStorage
 */
const TEMP_SHARE_KEY = 'grocery_temp_share_data';

/**
 * Hook state interface
 */
interface UseWebShareTargetState {
  /**
   * The shared data, if any has been received
   */
  sharedData: ProcessedShareData | null;

  /**
   * Whether shared data is currently being processed/retrieved
   */
  isProcessing: boolean;

  /**
   * Error that occurred during processing, if any
   */
  error: Error | null;

  /**
   * Function to clear shared data and reset state
   */
  clearSharedData: () => void;
}

/**
 * Message from service worker about shared content
 */
interface ShareTargetMessage {
  type: 'SHARE_TARGET_DATA' | 'SHARE_TARGET_ERROR';
  data?: ProcessedShareData;
  error?: string;
  cacheKey?: string;
  dbKey?: string;
  timestamp: number;
}

/**
 * useWebShareTarget Hook
 *
 * Handles incoming shared content from the Web Share Target API.
 * Automatically checks URL parameters, listens for service worker messages,
 * and retrieves data from various storage locations.
 *
 * @returns {UseWebShareTargetState} Shared data and processing state
 *
 * @example
 * ```tsx
 * const { sharedData, isProcessing, error, clearSharedData } = useWebShareTarget();
 *
 * useEffect(() => {
 *   if (sharedData) {
 *     // Process shared items
 *     sharedData.items.forEach(item => addItemToList(item));
 *     clearSharedData();
 *   }
 * }, [sharedData]);
 * ```
 */
export function useWebShareTarget(): UseWebShareTargetState {
  // State
  const [sharedData, setSharedData] = useState<ProcessedShareData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Track blob URLs for cleanup
  const blobUrlsRef = useRef<string[]>([]);

  /**
   * Clear shared data and clean up resources
   */
  const clearSharedData = useCallback(() => {
    console.log('[useWebShareTarget] Clearing shared data');

    // Revoke all blob URLs to prevent memory leaks
    blobUrlsRef.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (err) {
        console.warn('[useWebShareTarget] Failed to revoke blob URL:', err);
      }
    });
    blobUrlsRef.current = [];

    // Clear localStorage temp data
    try {
      localStorage.removeItem(TEMP_SHARE_KEY);
    } catch (err) {
      console.warn('[useWebShareTarget] Failed to clear localStorage:', err);
    }

    // Reset state
    setSharedData(null);
    setError(null);
    setIsProcessing(false);
  }, []);

  /**
   * Extract shared data from URL parameters (GET-based share target)
   */
  const checkURLParameters = useCallback((): ProcessedShareData | null => {
    try {
      const url = new URL(window.location.href);
      const params = url.searchParams;

      const title = params.get('title');
      const text = params.get('text');
      const urlParam = params.get('url');

      // Check if any share parameters are present
      if (!title && !text && !urlParam) {
        return null;
      }

      console.log('[useWebShareTarget] Found share data in URL parameters');

      // Extract items from text
      const items = text
        ? text
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0)
        : [];

      const shareData: ProcessedShareData = {
        title: title || null,
        text: text || null,
        url: urlParam || null,
        items,
        files: [],
        timestamp: new Date().toISOString(),
        source: 'url-params',
      };

      // Clean up URL (remove share parameters)
      params.delete('title');
      params.delete('text');
      params.delete('url');

      // Update URL without reloading
      const cleanUrl = url.origin + url.pathname;
      window.history.replaceState({}, '', cleanUrl);

      return shareData;
    } catch (err) {
      console.error('[useWebShareTarget] Error parsing URL parameters:', err);
      return null;
    }
  }, []);

  /**
   * Retrieve shared data from Cache API
   */
  const retrieveFromCache = useCallback(
    async (cacheKey: string): Promise<ProcessedShareData | null> => {
      try {
        if (!('caches' in window)) {
          console.warn('[useWebShareTarget] Cache API not available');
          return null;
        }

        const cache = await caches.open(SHARE_TARGET_CONFIG.cacheName);
        const response = await cache.match(cacheKey);

        if (!response) {
          console.log('[useWebShareTarget] No data found in cache for key:', cacheKey);
          return null;
        }

        const data = await response.json();
        console.log('[useWebShareTarget] Retrieved share data from cache');

        // Clean up cache entry
        await cache.delete(cacheKey);

        return data as ProcessedShareData;
      } catch (err) {
        console.error('[useWebShareTarget] Error retrieving from cache:', err);
        return null;
      }
    },
    []
  );

  /**
   * Retrieve shared data from IndexedDB
   */
  const retrieveFromIndexedDB = useCallback(
    async (dbKey: string): Promise<ProcessedShareData | null> => {
      try {
        if (!('indexedDB' in window)) {
          console.warn('[useWebShareTarget] IndexedDB not available');
          return null;
        }

        return new Promise((resolve, reject) => {
          const request = indexedDB.open(
            SHARE_TARGET_CONFIG.dbName,
            1
          );

          request.onerror = () => {
            console.error('[useWebShareTarget] IndexedDB open error:', request.error);
            reject(request.error);
          };

          request.onsuccess = () => {
            const db = request.result;

            try {
              const transaction = db.transaction(
                [SHARE_TARGET_CONFIG.storeName],
                'readwrite'
              );
              const store = transaction.objectStore(SHARE_TARGET_CONFIG.storeName);
              const getRequest = store.get(dbKey);

              getRequest.onsuccess = () => {
                const data = getRequest.result;

                if (data) {
                  console.log('[useWebShareTarget] Retrieved share data from IndexedDB');
                  // Clean up after retrieval
                  store.delete(dbKey);
                  resolve(data as ProcessedShareData);
                } else {
                  console.log('[useWebShareTarget] No data found in IndexedDB for key:', dbKey);
                  resolve(null);
                }
              };

              getRequest.onerror = () => {
                console.error('[useWebShareTarget] IndexedDB get error:', getRequest.error);
                reject(getRequest.error);
              };
            } catch (err) {
              console.error('[useWebShareTarget] Transaction error:', err);
              reject(err);
            } finally {
              db.close();
            }
          };

          request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Create object store if it doesn't exist
            if (!db.objectStoreNames.contains(SHARE_TARGET_CONFIG.storeName)) {
              db.createObjectStore(SHARE_TARGET_CONFIG.storeName);
            }
          };
        });
      } catch (err) {
        console.error('[useWebShareTarget] Error retrieving from IndexedDB:', err);
        return null;
      }
    },
    []
  );

  /**
   * Check localStorage for temporary shared data
   */
  const checkLocalStorage = useCallback((): ProcessedShareData | null => {
    try {
      const stored = localStorage.getItem(TEMP_SHARE_KEY);
      if (!stored) {
        return null;
      }

      console.log('[useWebShareTarget] Found share data in localStorage');
      const data = JSON.parse(stored) as ProcessedShareData;

      // Check if data is expired (older than maxAge)
      const timestamp = new Date(data.timestamp).getTime();
      const age = Date.now() - timestamp;

      if (age > SHARE_TARGET_CONFIG.maxAge) {
        console.log('[useWebShareTarget] Share data expired, clearing');
        localStorage.removeItem(TEMP_SHARE_KEY);
        return null;
      }

      return data;
    } catch (err) {
      console.error('[useWebShareTarget] Error reading localStorage:', err);
      return null;
    }
  }, []);

  /**
   * Handle service worker messages about shared content
   */
  const handleServiceWorkerMessage = useCallback(
    async (event: MessageEvent) => {
      const message = event.data as ShareTargetMessage;

      // Only handle share target messages
      if (
        message.type !== 'SHARE_TARGET_DATA' &&
        message.type !== 'SHARE_TARGET_ERROR'
      ) {
        return;
      }

      console.log('[useWebShareTarget] Received service worker message:', message.type);

      setIsProcessing(true);

      try {
        if (message.type === 'SHARE_TARGET_ERROR') {
          throw new Error(message.error || 'Unknown share target error');
        }

        let data: ProcessedShareData | null = null;

        // Check if data is directly included in message
        if (message.data) {
          data = message.data;
        }
        // Otherwise retrieve from cache
        else if (message.cacheKey) {
          data = await retrieveFromCache(message.cacheKey);
        }
        // Or retrieve from IndexedDB
        else if (message.dbKey) {
          data = await retrieveFromIndexedDB(message.dbKey);
        }

        if (data) {
          console.log('[useWebShareTarget] Successfully retrieved shared data');
          setSharedData(data);
          setError(null);

          // Track any blob URLs for cleanup
          if (data.files) {
            data.files.forEach((file) => {
              if (file.dataUrl && file.dataUrl.startsWith('blob:')) {
                blobUrlsRef.current.push(file.dataUrl);
              }
            });
          }
        } else {
          throw new Error('Failed to retrieve shared data from storage');
        }
      } catch (err) {
        console.error('[useWebShareTarget] Error processing service worker message:', err);
        setError(
          err instanceof Error ? err : new Error('Unknown error processing shared data')
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [retrieveFromCache, retrieveFromIndexedDB]
  );

  /**
   * Check all storage locations for shared data on mount
   */
  useEffect(() => {
    let mounted = true;

    const checkForSharedData = async () => {
      setIsProcessing(true);

      try {
        // 1. Check URL parameters first (highest priority)
        const urlData = checkURLParameters();
        if (urlData) {
          if (mounted) {
            setSharedData(urlData);
            setError(null);
          }
          return;
        }

        // 2. Check localStorage for temporary data
        const localData = checkLocalStorage();
        if (localData) {
          if (mounted) {
            setSharedData(localData);
            setError(null);
          }
          return;
        }

        // 3. No immediate data found, will wait for service worker messages
        console.log('[useWebShareTarget] No immediate shared data found');
      } catch (err) {
        console.error('[useWebShareTarget] Error checking for shared data:', err);
        if (mounted) {
          setError(
            err instanceof Error ? err : new Error('Failed to check for shared data')
          );
        }
      } finally {
        if (mounted) {
          setIsProcessing(false);
        }
      }
    };

    checkForSharedData();

    return () => {
      mounted = false;
    };
  }, [checkURLParameters, checkLocalStorage]);

  /**
   * Listen for service worker messages
   */
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      console.log('[useWebShareTarget] Service worker not supported');
      return;
    }

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

    // Send ready message to service worker
    navigator.serviceWorker.ready
      .then((registration) => {
        if (registration.active) {
          registration.active.postMessage({
            type: 'CLIENT_READY',
            timestamp: Date.now(),
          });
        }
      })
      .catch((err) => {
        console.error('[useWebShareTarget] Error getting service worker:', err);
      });

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [handleServiceWorkerMessage]);

  /**
   * Clean up on unmount
   */
  useEffect(() => {
    return () => {
      // Revoke all blob URLs
      blobUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (err) {
          console.warn('[useWebShareTarget] Failed to revoke blob URL on unmount:', err);
        }
      });
    };
  }, []);

  return {
    sharedData,
    isProcessing,
    error,
    clearSharedData,
  };
}

/**
 * Check if Web Share Target API is supported
 *
 * @returns {boolean} True if the API is supported
 *
 * @example
 * ```tsx
 * if (isShareTargetSupported()) {
 *   console.log('Share Target is supported');
 * }
 * ```
 */
export function isShareTargetSupported(): boolean {
  // Share Target requires service workers and manifest support
  return (
    'serviceWorker' in navigator &&
    'share' in navigator &&
    typeof window !== 'undefined'
  );
}

/**
 * Get share target capabilities
 *
 * @returns Information about what types of content can be shared
 *
 * @example
 * ```tsx
 * const capabilities = getShareTargetCapabilities();
 * if (capabilities.canReceiveFiles) {
 *   console.log('App can receive shared files');
 * }
 * ```
 */
export function getShareTargetCapabilities() {
  const hasServiceWorker = 'serviceWorker' in navigator;
  const hasShare = 'share' in navigator;
  const hasCaches = 'caches' in window;
  const hasIndexedDB = 'indexedDB' in window;

  return {
    hasShareTarget: hasServiceWorker && hasShare,
    canReceiveFiles: hasServiceWorker && hasCaches,
    canReceiveText: hasServiceWorker,
    canReceiveUrls: hasServiceWorker,
    hasStorage: hasCaches || hasIndexedDB,
  };
}
