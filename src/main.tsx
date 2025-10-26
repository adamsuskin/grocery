import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ZeroProvider } from '@rocicorp/zero/react';
import App from './App';
import './index.css';
import { zeroInstance } from './zero-store';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ZeroProvider zero={zeroInstance}>
      <App />
    </ZeroProvider>
  </StrictMode>
);
