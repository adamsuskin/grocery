import { useState, useEffect, useCallback } from 'react';

/**
 * Periodic Sync Hook
 *
 * Provides information about periodic background sync status and schedules.
 * Periodic Sync allows the app to sync data in the background at regular intervals,
 * even when the app is not open.
 *
 * Note: Periodic Sync is only supported in Chromium-based browsers (Chrome, Edge, Opera)
 */

interface PeriodicSyncInfo {
  isSupported: boolean;
  isRegistered: boolean;
  isActive: boolean;
  nextSyncTime: Date | null;
  lastSyncTime: Date | null;
  syncInterval: number; // in milliseconds
  error: string | null;
}

interface UsePeriodicSyncReturn extends PeriodicSyncInfo {
  register: (tag: string, minInterval?: number) => Promise<void>;
  unregister: (tag: string) => Promise<void>;
  getTags: () => Promise<string[]>;
  timeUntilNextSync: number | null; // in seconds
}

const PERIODIC_SYNC_TAG = 'grocery-periodic-sync';
const DEFAULT_SYNC_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
const MIN_SYNC_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours minimum (browser enforced)

export function usePeriodicSync(): UsePeriodicSyncReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [nextSyncTime, setNextSyncTime] = useState<Date | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncInterval] = useState(DEFAULT_SYNC_INTERVAL);
  const [error, setError] = useState<string | null>(null);
  const [timeUntilNextSync, setTimeUntilNextSync] = useState<number | null>(null);

  // Check if periodic sync is supported
  useEffect(() => {
    const checkSupport = async () => {
      if ('serviceWorker' in navigator && 'periodicSync' in ServiceWorkerRegistration.prototype) {
        setIsSupported(true);

        try {
          const registration = await navigator.serviceWorker.ready;
          const tags = await (registration as any).periodicSync.getTags();
          const registered = tags.includes(PERIODIC_SYNC_TAG);
          setIsRegistered(registered);

          // If registered, calculate next sync time
          if (registered) {
            setIsActive(true);
            updateSyncTimes();
          }
        } catch (err) {
          console.error('[usePeriodicSync] Error checking registration:', err);
          setError(err instanceof Error ? err.message : 'Failed to check periodic sync status');
        }
      } else {
        setIsSupported(false);
        console.log('[usePeriodicSync] Periodic Sync API not supported in this browser');
      }
    };

    checkSupport();
  }, []);

  // Update sync times from localStorage
  const updateSyncTimes = useCallback(() => {
    try {
      const lastSync = localStorage.getItem('periodicSync:lastSyncTime');
      if (lastSync) {
        const lastSyncDate = new Date(lastSync);
        setLastSyncTime(lastSyncDate);

        // Calculate next sync time (last sync + interval)
        const nextSync = new Date(lastSyncDate.getTime() + syncInterval);
        setNextSyncTime(nextSync);
      } else {
        // If no last sync, assume next sync is in the future
        const nextSync = new Date(Date.now() + syncInterval);
        setNextSyncTime(nextSync);
      }
    } catch (err) {
      console.error('[usePeriodicSync] Error updating sync times:', err);
    }
  }, [syncInterval]);

  // Update countdown timer
  useEffect(() => {
    if (!nextSyncTime || !isActive) {
      setTimeUntilNextSync(null);
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      const diff = nextSyncTime.getTime() - now;

      if (diff <= 0) {
        setTimeUntilNextSync(0);
        // Next sync should have happened, update times
        updateSyncTimes();
      } else {
        setTimeUntilNextSync(Math.floor(diff / 1000)); // convert to seconds
      }
    };

    // Update immediately
    updateCountdown();

    // Update every 10 seconds
    const interval = setInterval(updateCountdown, 10000);

    return () => clearInterval(interval);
  }, [nextSyncTime, isActive, updateSyncTimes]);

  // Listen for sync events from service worker
  useEffect(() => {
    if (!isSupported) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PERIODIC_SYNC_COMPLETE') {
        console.log('[usePeriodicSync] Periodic sync completed');

        // Update last sync time
        const now = new Date();
        localStorage.setItem('periodicSync:lastSyncTime', now.toISOString());
        setLastSyncTime(now);

        // Calculate next sync time
        const nextSync = new Date(now.getTime() + syncInterval);
        setNextSyncTime(nextSync);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [isSupported, syncInterval]);

  // Register periodic sync
  const register = useCallback(async (tag: string = PERIODIC_SYNC_TAG, minInterval: number = MIN_SYNC_INTERVAL) => {
    if (!isSupported) {
      const errorMsg = 'Periodic Sync not supported in this browser';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      // Register periodic sync with minimum interval
      await (registration as any).periodicSync.register(tag, {
        minInterval: Math.max(minInterval, MIN_SYNC_INTERVAL), // Ensure minimum interval
      });

      console.log(`[usePeriodicSync] Registered periodic sync: ${tag}`);
      setIsRegistered(true);
      setIsActive(true);
      setError(null);

      // Initialize sync times
      updateSyncTimes();
    } catch (err) {
      console.error('[usePeriodicSync] Registration failed:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to register periodic sync';
      setError(errorMsg);
      throw err;
    }
  }, [isSupported, updateSyncTimes]);

  // Unregister periodic sync
  const unregister = useCallback(async (tag: string = PERIODIC_SYNC_TAG) => {
    if (!isSupported) {
      const errorMsg = 'Periodic Sync not supported in this browser';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).periodicSync.unregister(tag);

      console.log(`[usePeriodicSync] Unregistered periodic sync: ${tag}`);
      setIsRegistered(false);
      setIsActive(false);
      setNextSyncTime(null);
      setError(null);

      // Clear stored times
      localStorage.removeItem('periodicSync:lastSyncTime');
    } catch (err) {
      console.error('[usePeriodicSync] Unregistration failed:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to unregister periodic sync';
      setError(errorMsg);
      throw err;
    }
  }, [isSupported]);

  // Get all registered tags
  const getTags = useCallback(async (): Promise<string[]> => {
    if (!isSupported) {
      return [];
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const tags = await (registration as any).periodicSync.getTags();
      return tags;
    } catch (err) {
      console.error('[usePeriodicSync] Failed to get tags:', err);
      return [];
    }
  }, [isSupported]);

  return {
    isSupported,
    isRegistered,
    isActive,
    nextSyncTime,
    lastSyncTime,
    syncInterval,
    error,
    timeUntilNextSync,
    register,
    unregister,
    getTags,
  };
}
