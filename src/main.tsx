import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ZeroProvider } from '@rocicorp/zero/react';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';
import { getZeroInstance } from './zero-store';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ZeroProvider zero={getZeroInstance()}>
        <App />
      </ZeroProvider>
    </AuthProvider>
  </StrictMode>
);
