import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ZeroProvider } from '@rocicorp/zero/react';
import { AuthProvider } from './context/AuthContext';
import { ListProvider } from './contexts/ListContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SyncProvider } from './contexts/SyncContext';
import { ServiceWorkerProvider, useServiceWorker } from './contexts/ServiceWorkerContext';
import App from './App';
import './index.css';
import { getZeroInstance } from './zero-store';

/**
 * ServiceWorkerRegistrar component
 * Handles service worker registration on app load
 */
function ServiceWorkerRegistrar() {
  const { register, checkForUpdates } = useServiceWorker();

  useEffect(() => {
    // Register service worker on mount
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      register('/service-worker.js', { scope: '/' })
        .then(() => {
          console.log('[App] Service worker registered successfully');
          // Check for updates immediately after registration
          checkForUpdates();
        })
        .catch((error) => {
          console.error('[App] Service worker registration failed:', error);
        });
    }
  }, [register, checkForUpdates]);

  return null;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ServiceWorkerProvider>
      <AuthProvider>
        <ZeroProvider zero={getZeroInstance() as any}>
          <SyncProvider>
            <ListProvider>
              <NotificationProvider>
                <ServiceWorkerRegistrar />
                <App />
              </NotificationProvider>
            </ListProvider>
          </SyncProvider>
        </ZeroProvider>
      </AuthProvider>
    </ServiceWorkerProvider>
  </StrictMode>
);
