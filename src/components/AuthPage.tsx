import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

/**
 * AuthPage - Example component showing how to integrate LoginForm and RegisterForm
 *
 * This component demonstrates:
 * - Switching between login and registration views
 * - Integration with AuthContext (handled internally by the forms)
 * - Proper state management for the auth flow
 *
 * Usage in App.tsx:
 *
 * import { AuthProvider } from './context/AuthContext';
 * import { useAuth } from './context/AuthContext';
 * import { AuthPage } from './components/AuthPage';
 *
 * function App() {
 *   const { isAuthenticated, loading } = useAuth();
 *
 *   if (loading) {
 *     return <div>Loading...</div>;
 *   }
 *
 *   if (!isAuthenticated) {
 *     return <AuthPage />;
 *   }
 *
 *   return <YourMainApp />;
 * }
 *
 * // Wrap your app with AuthProvider in main.tsx:
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 */

type ViewMode = 'login' | 'register';

export function AuthPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('login');

  return (
    <>
      {viewMode === 'login' ? (
        <LoginForm onSwitchToRegister={() => setViewMode('register')} />
      ) : (
        <RegisterForm onSwitchToLogin={() => setViewMode('login')} />
      )}
    </>
  );
}
