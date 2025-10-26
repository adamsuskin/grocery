/**
 * useOfflineDetection Hook
 *
 * A custom React hook for detecting online/offline network transitions with enhanced features.
 * This hook provides real-time monitoring of network connectivity status and handles edge cases
 * like slow connections and reconnection scenarios.
 *
 * ## Features
 * - Real-time online/offline detection using navigator.onLine
 * - Track last offline timestamp for analytics
 * - Detect slow/poor connections (optional)
 * - Handle reconnecting state transitions
 * - Callback support for state changes
 * - TypeScript support with full type safety
 *
 * ## Usage
 * ```tsx
 * import { useOfflineDetection } from './hooks/useOfflineDetection';
 *
 * function MyComponent() {
 *   const {
 *     isOnline,
 *     isOffline,
 *     isReconnecting,
 *     lastOfflineTime,
 *     offlineDuration
 *   } = useOfflineDetection({
 *     onOnline: () => console.log('Back online!'),
 *     onOffline: () => console.log('Connection lost!'),
 *   });
 *
 *   return (
 *     <div>
 *       {isOffline && <p>You are currently offline</p>}
 *       {isReconnecting && <p>Reconnecting...</p>}
 *     </div>
 *   );
 * }
 * ```
 *
 * ## Edge Cases Handled
 * - Slow connection detection: Uses fetch with timeout to detect poor connections
 * - Reconnecting state: Temporary state when connection is being restored
 * - Browser tab visibility: Handles cases when browser tab becomes visible
 * - Page lifecycle: Properly cleans up listeners on unmount
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Connection quality enum
 */
export type ConnectionQuality = 'good' | 'poor' | 'offline';

/**
 * Offline detection configuration options
 */
export interface OfflineDetectionOptions {
  /**
   * Callback invoked when connection comes online
   */
  onOnline?: () => void;

  /**
   * Callback invoked when connection goes offline
   */
  onOffline?: () => void;

  /**
   * Callback invoked when reconnecting
   */
  onReconnecting?: () => void;

  /**
   * Enable slow connection detection
   * @default false
   */
  detectSlowConnection?: boolean;

  /**
   * Timeout for slow connection detection (ms)
   * @default 5000
   */
  slowConnectionTimeout?: number;

  /**
   * URL to ping for connection quality check
   * @default '/api/ping' or null (disables ping check)
   */
  pingUrl?: string | null;

  /**
   * Interval for periodic connection quality checks (ms)
   * @default 30000 (30 seconds)
   */
  checkInterval?: number;
}

/**
 * Offline detection state
 */
export interface OfflineDetectionState {
  /**
   * Whether the device is currently online
   */
  isOnline: boolean;

  /**
   * Whether the device is currently offline
   */
  isOffline: boolean;

  /**
   * Whether the device is attempting to reconnect
   */
  isReconnecting: boolean;

  /**
   * Connection quality (good, poor, offline)
   */
  connectionQuality: ConnectionQuality;

  /**
   * Timestamp when device went offline (null if online)
   */
  lastOfflineTime: number | null;

  /**
   * Duration of offline period in milliseconds (null if online)
   */
  offlineDuration: number | null;

  /**
   * Manual function to check connection status
   */
  checkConnection: () => Promise<boolean>;

  /**
   * Manual function to force reconnect
   */
  forceReconnect: () => void;
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: Required<OfflineDetectionOptions> = {
  onOnline: () => {},
  onOffline: () => {},
  onReconnecting: () => {},
  detectSlowConnection: false,
  slowConnectionTimeout: 5000,
  pingUrl: null, // Disabled by default
  checkInterval: 30000,
};

/**
 * Storage key for persisting last offline time
 */
const LAST_OFFLINE_KEY = 'grocery_last_offline_time';

/**
 * useOfflineDetection Hook
 *
 * Detects and monitors online/offline network transitions
 *
 * @param options - Configuration options
 * @returns Offline detection state and utilities
 */
export function useOfflineDetection(
  options: OfflineDetectionOptions = {}
): OfflineDetectionState {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // State
  const [isOnline, setIsOnline] = useState(() => {
    // Initialize from navigator.onLine
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [isReconnecting, setIsReconnecting] = useState(false);

  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>(() => {
    return typeof navigator !== 'undefined' && navigator.onLine ? 'good' : 'offline';
  });

  const [lastOfflineTime, setLastOfflineTime] = useState<number | null>(() => {
    // Try to load from localStorage
    try {
      const stored = localStorage.getItem(LAST_OFFLINE_KEY);
      return stored ? parseInt(stored, 10) : null;
    } catch (error) {
      console.error('[useOfflineDetection] Error loading last offline time:', error);
      return null;
    }
  });

  const [offlineDuration, setOfflineDuration] = useState<number | null>(null);

  // Refs to track callback options (avoid re-creating listeners)
  const onOnlineRef = useRef(opts.onOnline);
  const onOfflineRef = useRef(opts.onOffline);
  const onReconnectingRef = useRef(opts.onReconnecting);

  // Update refs when callbacks change
  useEffect(() => {
    onOnlineRef.current = opts.onOnline;
    onOfflineRef.current = opts.onOffline;
    onReconnectingRef.current = opts.onReconnecting;
  }, [opts.onOnline, opts.onOffline, opts.onReconnecting]);

  /**
   * Check connection by pinging a server endpoint
   */
  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (!opts.detectSlowConnection || !opts.pingUrl) {
      // Fallback to navigator.onLine
      return navigator.onLine;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), opts.slowConnectionTimeout);

      const response = await fetch(opts.pingUrl, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setConnectionQuality('good');
        return true;
      } else {
        setConnectionQuality('poor');
        return false;
      }
    } catch (error) {
      // Network error or timeout
      setConnectionQuality('offline');
      return false;
    }
  }, [opts.detectSlowConnection, opts.pingUrl, opts.slowConnectionTimeout]);

  /**
   * Handle online event
   */
  const handleOnline = useCallback(async () => {
    console.log('[useOfflineDetection] Online event detected');

    // Enter reconnecting state
    setIsReconnecting(true);
    onReconnectingRef.current();

    // Check if connection is truly stable
    let connectionOk = true;
    if (opts.detectSlowConnection) {
      connectionOk = await checkConnection();
    }

    if (connectionOk) {
      // Calculate offline duration
      if (lastOfflineTime !== null) {
        const duration = Date.now() - lastOfflineTime;
        setOfflineDuration(duration);
        console.log(`[useOfflineDetection] Was offline for ${duration}ms`);
      }

      // Clear offline time
      setLastOfflineTime(null);
      try {
        localStorage.removeItem(LAST_OFFLINE_KEY);
      } catch (error) {
        console.error('[useOfflineDetection] Error clearing offline time:', error);
      }

      // Update state
      setIsOnline(true);
      setConnectionQuality('good');
      setIsReconnecting(false);

      // Invoke callback
      onOnlineRef.current();
    } else {
      // Connection check failed, stay in offline state
      setIsReconnecting(false);
      console.warn('[useOfflineDetection] Connection check failed after online event');
    }
  }, [lastOfflineTime, opts.detectSlowConnection, checkConnection]);

  /**
   * Handle offline event
   */
  const handleOffline = useCallback(() => {
    console.log('[useOfflineDetection] Offline event detected');

    const now = Date.now();

    // Update state
    setIsOnline(false);
    setIsReconnecting(false);
    setConnectionQuality('offline');
    setLastOfflineTime(now);
    setOfflineDuration(null);

    // Persist to localStorage
    try {
      localStorage.setItem(LAST_OFFLINE_KEY, now.toString());
    } catch (error) {
      console.error('[useOfflineDetection] Error persisting offline time:', error);
    }

    // Invoke callback
    onOfflineRef.current();
  }, []);

  /**
   * Force reconnect (manually trigger reconnection)
   */
  const forceReconnect = useCallback(() => {
    console.log('[useOfflineDetection] Forcing reconnect');
    handleOnline();
  }, [handleOnline]);

  /**
   * Setup online/offline event listeners
   */
  useEffect(() => {
    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Handle visibility change (when tab becomes visible, check connection)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !navigator.onLine) {
        // Tab became visible while offline, verify offline state
        handleOffline();
      } else if (document.visibilityState === 'visible' && navigator.onLine && !isOnline) {
        // Tab became visible while we thought we were offline, but navigator says online
        handleOnline();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial check
    const initialCheck = async () => {
      const currentOnline = navigator.onLine;
      if (currentOnline !== isOnline) {
        if (currentOnline) {
          await handleOnline();
        } else {
          handleOffline();
        }
      }
    };

    initialCheck();

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleOnline, handleOffline, isOnline]);

  /**
   * Periodic connection quality checks
   */
  useEffect(() => {
    if (!opts.detectSlowConnection || !opts.pingUrl) {
      return;
    }

    const interval = setInterval(() => {
      if (isOnline) {
        checkConnection().then(ok => {
          if (!ok) {
            console.warn('[useOfflineDetection] Connection quality check failed');
            // Connection lost, trigger offline
            handleOffline();
          }
        });
      }
    }, opts.checkInterval);

    return () => clearInterval(interval);
  }, [opts.detectSlowConnection, opts.pingUrl, opts.checkInterval, isOnline, checkConnection, handleOffline]);

  return {
    isOnline,
    isOffline: !isOnline,
    isReconnecting,
    connectionQuality,
    lastOfflineTime,
    offlineDuration,
    checkConnection,
    forceReconnect,
  };
}

/**
 * Simple version of useOfflineDetection that only returns isOnline/isOffline
 *
 * @example
 * ```tsx
 * const { isOnline, isOffline } = useSimpleOfflineDetection();
 * ```
 */
export function useSimpleOfflineDetection() {
  const [isOnline, setIsOnline] = useState(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
  };
}
