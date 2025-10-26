/**
 * ServiceWorkerContext - Manages service worker state globally
 *
 * This context provides centralized service worker lifecycle management for the app.
 * It tracks registration state, service worker instances, and provides methods for
 * controlling updates.
 *
 * ## Features
 * - Service worker registration management
 * - Tracks installing, waiting, and active workers
 * - Update detection and notification
 * - skipWaiting() control for immediate updates
 * - Manual update checking
 * - Automatic update checks on visibility change/focus
 * - Event listeners for service worker state changes
 *
 * ## Usage
 * ```tsx
 * import { useServiceWorker } from './contexts/ServiceWorkerContext';
 *
 * function MyComponent() {
 *   const {
 *     updateAvailable,
 *     isInstalling,
 *     isActivating,
 *     update,
 *     skipWaiting,
 *     checkForUpdates
 *   } = useServiceWorker();
 *
 *   return (
 *     <div>
 *       {updateAvailable && (
 *         <button onClick={update}>Update Now</button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import {
  getServiceWorkerState,
  skipWaiting as skipWaitingHelper,
  checkForUpdates as checkForUpdatesHelper,
  registerServiceWorker,
  reloadAfterUpdate,
} from '../utils/serviceWorkerHelpers';

/**
 * Service worker lifecycle state
 */
export type ServiceWorkerLifecycleState =
  | 'idle'
  | 'installing'
  | 'waiting'
  | 'activating'
  | 'activated'
  | 'redundant';

/**
 * Service worker context state
 */
export interface ServiceWorkerContextState {
  /** Service worker registration */
  registration: ServiceWorkerRegistration | null;
  /** Currently installing service worker */
  installing: ServiceWorker | null;
  /** Service worker waiting to activate */
  waiting: ServiceWorker | null;
  /** Currently active service worker */
  active: ServiceWorker | null;
  /** Whether an update is available */
  updateAvailable: boolean;
  /** Current lifecycle state */
  lifecycleState: ServiceWorkerLifecycleState;
  /** Whether currently checking for updates */
  isCheckingForUpdates: boolean;
  /** Whether currently updating */
  isUpdating: boolean;
  /** Last time an update check was performed */
  lastUpdateCheck: number | null;
  /** Error message if registration or update failed */
  error: string | null;
}

/**
 * Service worker context value with methods
 */
export interface ServiceWorkerContextValue extends ServiceWorkerContextState {
  /** Trigger service worker update (skipWaiting + reload) */
  update: () => Promise<void>;
  /** Call skipWaiting on waiting service worker */
  skipWaitingOnly: () => Promise<void>;
  /** Manually check for updates */
  checkForUpdates: () => Promise<boolean>;
  /** Dismiss update notification (postpone) */
  dismissUpdate: () => void;
  /** Register a service worker */
  register: (scriptURL: string, options?: RegistrationOptions) => Promise<void>;
  /** Unregister the service worker */
  unregister: () => Promise<void>;
}

/**
 * Storage keys
 */
const STORAGE_KEYS = {
  UPDATE_DISMISSED: 'sw_update_dismissed',
  LAST_UPDATE_CHECK: 'sw_last_update_check',
} as const;

/**
 * Initial state
 */
const initialState: ServiceWorkerContextState = {
  registration: null,
  installing: null,
  waiting: null,
  active: null,
  updateAvailable: false,
  lifecycleState: 'idle',
  isCheckingForUpdates: false,
  isUpdating: false,
  lastUpdateCheck: null,
  error: null,
};

/**
 * Create the context
 */
const ServiceWorkerContext = createContext<ServiceWorkerContextValue | undefined>(undefined);

/**
 * How often to check for updates (15 minutes)
 */
const UPDATE_CHECK_INTERVAL = 15 * 60 * 1000;

/**
 * ServiceWorkerProvider component
 */
export function ServiceWorkerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ServiceWorkerContextState>(initialState);
  const updateDismissedRef = useRef<boolean>(false);

  /**
   * Update state from service worker registration
   */
  const updateStateFromRegistration = useCallback(
    (registration: ServiceWorkerRegistration | null) => {
      const swState = getServiceWorkerState(registration);

      // Determine lifecycle state
      let lifecycleState: ServiceWorkerLifecycleState = 'idle';
      if (swState.installing) {
        lifecycleState = 'installing';
      } else if (swState.waiting) {
        lifecycleState = 'waiting';
      } else if (swState.active) {
        lifecycleState = 'activated';
      }

      setState((prev) => ({
        ...prev,
        registration: swState.registration,
        installing: swState.installing,
        waiting: swState.waiting,
        active: swState.active,
        updateAvailable: swState.updateAvailable && !updateDismissedRef.current,
        lifecycleState,
      }));
    },
    []
  );

  /**
   * Setup service worker event listeners
   */
  const setupEventListeners = useCallback(
    (registration: ServiceWorkerRegistration) => {
      console.log('[ServiceWorkerContext] Setting up event listeners');

      // Listen for updatefound event (new service worker is being installed)
      registration.addEventListener('updatefound', () => {
        console.log('[ServiceWorkerContext] Update found, new service worker installing');

        const newWorker = registration.installing;
        if (!newWorker) return;

        setState((prev) => ({
          ...prev,
          installing: newWorker,
          lifecycleState: 'installing',
        }));

        // Listen to state changes on the new worker
        newWorker.addEventListener('statechange', () => {
          console.log('[ServiceWorkerContext] Service worker state changed:', newWorker.state);

          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // A new service worker is available
            console.log('[ServiceWorkerContext] New service worker installed and waiting');
            setState((prev) => ({
              ...prev,
              waiting: newWorker,
              installing: null,
              updateAvailable: !updateDismissedRef.current,
              lifecycleState: 'waiting',
            }));
          } else if (newWorker.state === 'activated') {
            console.log('[ServiceWorkerContext] New service worker activated');
            setState((prev) => ({
              ...prev,
              active: newWorker,
              waiting: null,
              installing: null,
              lifecycleState: 'activated',
            }));
          } else if (newWorker.state === 'redundant') {
            console.log('[ServiceWorkerContext] Service worker became redundant');
            setState((prev) => ({
              ...prev,
              lifecycleState: 'redundant',
              error: 'Service worker update failed',
            }));
          }
        });
      });

      // Listen for controller change (new service worker took control)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[ServiceWorkerContext] Controller changed, new service worker active');

        if (state.isUpdating) {
          // We triggered this change, reload the page
          console.log('[ServiceWorkerContext] Update complete, reloading page');
          reloadAfterUpdate();
        }
      });
    },
    [state.isUpdating]
  );

  /**
   * Register a service worker
   */
  const register = useCallback(
    async (scriptURL: string, options?: RegistrationOptions) => {
      try {
        console.log('[ServiceWorkerContext] Registering service worker');
        setState((prev) => ({ ...prev, error: null }));

        const registration = await registerServiceWorker(scriptURL, options);

        // Update state with registration
        updateStateFromRegistration(registration);

        // Setup event listeners
        setupEventListeners(registration);

        console.log('[ServiceWorkerContext] Service worker registered successfully');
      } catch (error) {
        console.error('[ServiceWorkerContext] Service worker registration failed:', error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Registration failed',
        }));
      }
    },
    [updateStateFromRegistration, setupEventListeners]
  );

  /**
   * Unregister the service worker
   */
  const unregister = useCallback(async () => {
    if (!state.registration) {
      console.warn('[ServiceWorkerContext] No service worker to unregister');
      return;
    }

    try {
      console.log('[ServiceWorkerContext] Unregistering service worker');
      await state.registration.unregister();
      setState(initialState);
      console.log('[ServiceWorkerContext] Service worker unregistered');
    } catch (error) {
      console.error('[ServiceWorkerContext] Failed to unregister service worker:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unregister failed',
      }));
    }
  }, [state.registration]);

  /**
   * Skip waiting only (without reload)
   */
  const skipWaitingOnly = useCallback(async () => {
    if (!state.registration || !state.waiting) {
      console.warn('[ServiceWorkerContext] No waiting service worker to activate');
      return;
    }

    try {
      console.log('[ServiceWorkerContext] Calling skipWaiting');
      setState((prev) => ({ ...prev, lifecycleState: 'activating', isUpdating: true }));

      await skipWaitingHelper(state.registration);

      console.log('[ServiceWorkerContext] Service worker activated');
      setState((prev) => ({
        ...prev,
        updateAvailable: false,
        lifecycleState: 'activated',
        isUpdating: false,
      }));
    } catch (error) {
      console.error('[ServiceWorkerContext] Failed to skip waiting:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Update failed',
        lifecycleState: 'waiting',
        isUpdating: false,
      }));
    }
  }, [state.registration, state.waiting]);

  /**
   * Trigger update (skipWaiting + reload)
   */
  const update = useCallback(async () => {
    if (!state.registration || !state.waiting) {
      console.warn('[ServiceWorkerContext] No waiting service worker to activate');
      return;
    }

    try {
      console.log('[ServiceWorkerContext] Triggering update with reload');
      setState((prev) => ({ ...prev, lifecycleState: 'activating', isUpdating: true }));

      // Send skipWaiting message to service worker
      state.waiting.postMessage({ type: 'SKIP_WAITING' });

      // The controllerchange event will trigger the reload
    } catch (error) {
      console.error('[ServiceWorkerContext] Failed to trigger update:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Update failed',
        lifecycleState: 'waiting',
        isUpdating: false,
      }));
    }
  }, [state.registration, state.waiting]);

  /**
   * Check for updates manually
   */
  const checkForUpdates = useCallback(async (): Promise<boolean> => {
    if (!state.registration) {
      console.warn('[ServiceWorkerContext] No service worker registered');
      return false;
    }

    if (state.isCheckingForUpdates) {
      console.log('[ServiceWorkerContext] Update check already in progress');
      return false;
    }

    try {
      console.log('[ServiceWorkerContext] Checking for updates');
      setState((prev) => ({ ...prev, isCheckingForUpdates: true }));

      const hasUpdate = await checkForUpdatesHelper(state.registration);
      const now = Date.now();

      setState((prev) => ({
        ...prev,
        isCheckingForUpdates: false,
        lastUpdateCheck: now,
        updateAvailable: hasUpdate && !updateDismissedRef.current,
      }));

      localStorage.setItem(STORAGE_KEYS.LAST_UPDATE_CHECK, now.toString());

      console.log('[ServiceWorkerContext] Update check complete, update available:', hasUpdate);
      return hasUpdate;
    } catch (error) {
      console.error('[ServiceWorkerContext] Update check failed:', error);
      setState((prev) => ({
        ...prev,
        isCheckingForUpdates: false,
        error: error instanceof Error ? error.message : 'Update check failed',
      }));
      return false;
    }
  }, [state.registration, state.isCheckingForUpdates]);

  /**
   * Dismiss update notification
   */
  const dismissUpdate = useCallback(() => {
    console.log('[ServiceWorkerContext] Update dismissed');
    updateDismissedRef.current = true;
    setState((prev) => ({ ...prev, updateAvailable: false }));
    localStorage.setItem(STORAGE_KEYS.UPDATE_DISMISSED, Date.now().toString());
  }, []);

  /**
   * Setup periodic update checks
   */
  useEffect(() => {
    if (!state.registration) return;

    const intervalId = setInterval(() => {
      checkForUpdates();
    }, UPDATE_CHECK_INTERVAL);

    return () => clearInterval(intervalId);
  }, [state.registration, checkForUpdates]);

  /**
   * Check for updates on visibility change (tab becomes visible)
   */
  useEffect(() => {
    if (!state.registration) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('[ServiceWorkerContext] Page visible, checking for updates');
        checkForUpdates();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.registration, checkForUpdates]);

  /**
   * Check for updates on window focus
   */
  useEffect(() => {
    if (!state.registration) return;

    const handleFocus = () => {
      console.log('[ServiceWorkerContext] Window focused, checking for updates');
      checkForUpdates();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [state.registration, checkForUpdates]);

  /**
   * Check for existing service worker on mount
   */
  useEffect(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          console.log('[ServiceWorkerContext] Found existing service worker registration');
          updateStateFromRegistration(registration);
          setupEventListeners(registration);
        }
      });
    }
  }, [updateStateFromRegistration, setupEventListeners]);

  const value: ServiceWorkerContextValue = {
    ...state,
    update,
    skipWaitingOnly,
    checkForUpdates,
    dismissUpdate,
    register,
    unregister,
  };

  return (
    <ServiceWorkerContext.Provider value={value}>
      {children}
    </ServiceWorkerContext.Provider>
  );
}

/**
 * Custom hook to use service worker context
 * @throws Error if used outside of ServiceWorkerProvider
 */
export function useServiceWorker(): ServiceWorkerContextValue {
  const context = useContext(ServiceWorkerContext);

  if (context === undefined) {
    throw new Error('useServiceWorker must be used within a ServiceWorkerProvider');
  }

  return context;
}

/**
 * Hook to check if service workers are supported
 */
export function useServiceWorkerSupport(): boolean {
  return 'serviceWorker' in navigator;
}
