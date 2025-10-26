/**
 * Example main.tsx showing how to integrate AuthProvider
 *
 * This file demonstrates how to wrap your app with both ZeroProvider and AuthProvider.
 * To use this example, replace your main.tsx content with this.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ZeroProvider } from '@rocicorp/zero/react';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import './index.css';
import { getZeroInstance } from './zero-store';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ZeroProvider zero={getZeroInstance() as any}>
        <App />
      </ZeroProvider>
    </AuthProvider>
  </StrictMode>
);
