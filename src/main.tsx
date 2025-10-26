import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ZeroProvider } from '@rocicorp/zero/react';
import { AuthProvider } from './context/AuthContext';
import { ListProvider } from './contexts/ListContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SyncProvider } from './contexts/SyncContext';
import App from './App';
import './index.css';
import { getZeroInstance } from './zero-store';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ZeroProvider zero={getZeroInstance() as any}>
        <SyncProvider>
          <ListProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </ListProvider>
        </SyncProvider>
      </ZeroProvider>
    </AuthProvider>
  </StrictMode>
);
