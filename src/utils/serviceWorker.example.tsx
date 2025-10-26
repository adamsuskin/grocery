/**
 * Service Worker Integration Examples
 *
 * This file demonstrates how to integrate the service worker
 * into your React components and app entry point.
 */

import { useEffect, useState } from 'react';
import {
  register,
  update,
  isActive,
  getVersion,
  clearCaches,
  triggerSync,
  subscribeToPush,
  requestNotificationPermission,
  isServiceWorkerSupported,
  isBackgroundSyncSupported,
  isPushSupported,
  isNotificationSupported,
} from './serviceWorkerRegistration';

// ============================================================================
// Example 1: Basic Registration in App Entry Point (src/main.tsx)
// ============================================================================

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    register('/sw.js', {
      onSuccess: () => {
        console.log('Service worker registered successfully');
      },
      onUpdate: () => {
        console.log('New service worker version available');
        // Optionally show a toast notification
        // toast.info('New version available. Reload to update.');
      },
      onReady: () => {
        console.log('Service worker is ready');
      },
      onError: (error) => {
        console.error('Service worker registration failed:', error);
      },
      autoUpdate: true, // Automatically activate new versions
      updateCheckInterval: 60 * 60 * 1000, // Check for updates every hour
    });
  }
}

// ============================================================================
// Example 2: React Hook for Service Worker Status
// ============================================================================

export function useServiceWorker() {
  const [isReady, setIsReady] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [version, setVersion] = useState<string | undefined>();

  useEffect(() => {
    if (!isServiceWorkerSupported()) {
      console.warn('Service workers not supported');
      return;
    }

    // Check if already active
    isActive().then((active) => {
      if (active) {
        setIsReady(true);
        getVersion().then(setVersion);
      }
    });

    // Register service worker
    register('/sw.js', {
      onReady: () => {
        setIsReady(true);
        getVersion().then(setVersion);
      },
      onUpdate: () => {
        setUpdateAvailable(true);
      },
      autoUpdate: false, // Let user control updates
    });
  }, []);

  const handleUpdate = async () => {
    await update();
    window.location.reload();
  };

  return {
    isReady,
    updateAvailable,
    version,
    handleUpdate,
  };
}

// ============================================================================
// Example 3: Update Notification Component
// ============================================================================

export function ServiceWorkerUpdate() {
  const { updateAvailable, handleUpdate } = useServiceWorker();

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg">
      <h3 className="font-bold mb-2">New Version Available!</h3>
      <p className="mb-3">A new version of the app is ready to install.</p>
      <button
        onClick={handleUpdate}
        className="bg-white text-blue-500 px-4 py-2 rounded hover:bg-gray-100"
      >
        Update Now
      </button>
    </div>
  );
}

// ============================================================================
// Example 4: Offline Status Indicator
// ============================================================================

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Trigger background sync when coming online
      if (isBackgroundSyncSupported()) {
        triggerSync().catch(console.error);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white p-2 text-center">
      You are currently offline. Changes will sync when you reconnect.
    </div>
  );
}

// ============================================================================
// Example 5: Push Notification Setup
// ============================================================================

export function usePushNotifications(vapidPublicKey: string) {
  const [permission, setPermission] = useState<NotificationPermission>(
    isNotificationSupported() ? Notification.permission : 'denied'
  );
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  const requestPermission = async () => {
    if (!isPushSupported()) {
      console.warn('Push notifications not supported');
      return;
    }

    try {
      const result = await requestNotificationPermission();
      setPermission(result);

      if (result === 'granted') {
        const sub = await subscribeToPush(vapidPublicKey);
        if (sub) {
          setSubscription(sub);
          // Send subscription to your server
          await sendSubscriptionToServer(sub);
        }
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    }
  };

  return {
    permission,
    subscription,
    requestPermission,
    isSupported: isPushSupported(),
  };
}

// Helper function to send subscription to server
async function sendSubscriptionToServer(subscription: PushSubscription) {
  // Implement your server endpoint
  const response = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  });

  if (!response.ok) {
    throw new Error('Failed to save subscription');
  }
}

export function PushNotificationPrompt() {
  const { permission, requestPermission, isSupported } = usePushNotifications(
    import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
  );

  if (!isSupported || permission !== 'default') {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
      <h3 className="font-bold mb-2">Enable Notifications</h3>
      <p className="mb-3">Get notified about list updates and shared items.</p>
      <button
        onClick={requestPermission}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Enable
      </button>
    </div>
  );
}

// ============================================================================
// Example 6: Cache Management Component
// ============================================================================

export function CacheManagement() {
  const [cacheSize, setCacheSize] = useState<number>(0);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    // Get storage estimate
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then((estimate) => {
        setCacheSize(estimate.usage || 0);
      });
    }
  }, []);

  const handleClearCache = async () => {
    setClearing(true);
    try {
      await clearCaches();
      setCacheSize(0);
      // Optionally reload the page
      // window.location.reload();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setClearing(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h3 className="font-bold mb-2">Cache Management</h3>
      <p className="text-gray-600 mb-4">
        Cache size: {formatBytes(cacheSize)}
      </p>
      <button
        onClick={handleClearCache}
        disabled={clearing}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
      >
        {clearing ? 'Clearing...' : 'Clear Cache'}
      </button>
    </div>
  );
}

// ============================================================================
// Example 7: Service Worker Status Dashboard
// ============================================================================

export function ServiceWorkerDashboard() {
  const [status, setStatus] = useState({
    active: false,
    version: '',
    swSupported: isServiceWorkerSupported(),
    syncSupported: isBackgroundSyncSupported(),
    pushSupported: isPushSupported(),
  });

  useEffect(() => {
    async function checkStatus() {
      const active = await isActive();
      const version = await getVersion();
      setStatus((prev) => ({
        ...prev,
        active,
        version: version || 'unknown',
      }));
    }

    checkStatus();
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Service Worker Status</h2>

      <div className="space-y-2">
        <StatusItem
          label="Service Worker"
          value={status.active ? 'Active' : 'Inactive'}
          color={status.active ? 'green' : 'red'}
        />
        <StatusItem
          label="Version"
          value={status.version}
          color="blue"
        />
        <StatusItem
          label="SW Support"
          value={status.swSupported ? 'Yes' : 'No'}
          color={status.swSupported ? 'green' : 'red'}
        />
        <StatusItem
          label="Background Sync"
          value={status.syncSupported ? 'Yes' : 'No'}
          color={status.syncSupported ? 'green' : 'yellow'}
        />
        <StatusItem
          label="Push Notifications"
          value={status.pushSupported ? 'Yes' : 'No'}
          color={status.pushSupported ? 'green' : 'yellow'}
        />
      </div>
    </div>
  );
}

function StatusItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: 'green' | 'red' | 'yellow' | 'blue';
}) {
  const colorClasses = {
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="flex justify-between items-center">
      <span className="font-medium">{label}:</span>
      <span className={`px-2 py-1 rounded text-sm ${colorClasses[color]}`}>
        {value}
      </span>
    </div>
  );
}

// ============================================================================
// Example 8: Integration with Offline Queue
// ============================================================================

export function useServiceWorkerSync() {
  useEffect(() => {
    if (!isServiceWorkerSupported()) {
      return;
    }

    // Listen for background sync messages from service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'BACKGROUND_SYNC') {
        console.log('Background sync triggered by service worker');
        // The OfflineQueueManager will handle the actual processing
        // This is just for UI updates
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  const manualSync = async () => {
    if (isBackgroundSyncSupported()) {
      await triggerSync();
    }
  };

  return { manualSync };
}

// ============================================================================
// Example 9: Complete App Setup
// ============================================================================

export function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Offline indicator */}
      <OfflineIndicator />

      {/* Update notification */}
      <ServiceWorkerUpdate />

      {/* Your app content */}
      <main className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Grocery List</h1>

        {/* Service worker status */}
        <ServiceWorkerDashboard />

        {/* Push notification prompt */}
        <div className="mt-6">
          <PushNotificationPrompt />
        </div>

        {/* Cache management */}
        <div className="mt-6">
          <CacheManagement />
        </div>

        {/* Your other components */}
      </main>
    </div>
  );
}

// ============================================================================
// Example 10: Main Entry Point (src/main.tsx)
// ============================================================================

/*
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { registerServiceWorker } from './utils/serviceWorker.example';
import './index.css';

// Register service worker
if (import.meta.env.PROD) {
  // Only in production
  registerServiceWorker();
} else if (import.meta.env.VITE_SW_DEV) {
  // Or if explicitly enabled in development
  registerServiceWorker();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
*/
