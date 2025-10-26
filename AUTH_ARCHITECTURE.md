# Authentication Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         React Application                            │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      AuthProvider                            │   │
│  │  ┌────────────────────────────────────────────────────────┐ │   │
│  │  │           Authentication State                         │ │   │
│  │  │  • user: User | null                                  │ │   │
│  │  │  • token: string | null                               │ │   │
│  │  │  • loading: boolean                                   │ │   │
│  │  │  • error: string | null                               │ │   │
│  │  │  • isAuthenticated: boolean                           │ │   │
│  │  └────────────────────────────────────────────────────────┘ │   │
│  │                                                               │   │
│  │  ┌────────────────────────────────────────────────────────┐ │   │
│  │  │           Authentication Methods                       │ │   │
│  │  │  • login(credentials)                                 │ │   │
│  │  │  • register(credentials)                              │ │   │
│  │  │  • logout()                                           │ │   │
│  │  │  • refreshToken()                                     │ │   │
│  │  │  • clearError()                                       │ │   │
│  │  └────────────────────────────────────────────────────────┘ │   │
│  │                            ▲                                  │   │
│  └────────────────────────────┼──────────────────────────────────┘   │
│                               │                                       │
│  ┌────────────────────────────┴──────────────────────────────────┐   │
│  │                      useAuth() Hook                           │   │
│  │  Components consume auth via context                          │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow - Login

```
┌──────────┐      ┌──────────────┐      ┌──────────────┐      ┌──────────┐
│          │      │              │      │              │      │          │
│  User    │─────▶│  AuthContext │─────▶│  Backend API │─────▶│  Backend │
│  Input   │      │  login()     │      │  /auth/login │      │  Server  │
│          │      │              │      │              │      │          │
└──────────┘      └──────────────┘      └──────────────┘      └──────────┘
                         │                      │
                         │                      │ {user, tokens}
                         │                      ▼
                         │              ┌──────────────┐
                         │              │              │
                         │◀─────────────│  API Response│
                         │              │              │
                         │              └──────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │              │
                  │ localStorage │──────┐
                  │  • token     │      │
                  │  • refresh   │      │
                  │  • user      │      │
                  │  • expiry    │      │
                  └──────────────┘      │
                         │              │
                         │              ▼
                         │      ┌──────────────┐
                         │      │              │
                         └─────▶│ Zero Client  │
                                │ Initialization│
                                │              │
                                └──────────────┘
```

## Token Refresh Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Token Lifecycle                              │
│                                                                 │
│  Login                                                          │
│    │                                                            │
│    ▼                                                            │
│  ┌────────────────────┐                                        │
│  │ Store Token        │                                        │
│  │ expiresAt: T + 1hr │                                        │
│  └──────┬─────────────┘                                        │
│         │                                                       │
│         │ Schedule refresh at T + 55min                        │
│         │                                                       │
│         ▼                                                       │
│  ┌────────────────────┐                                        │
│  │ Wait until         │                                        │
│  │ T + 55min          │                                        │
│  └──────┬─────────────┘                                        │
│         │                                                       │
│         │ Automatic                                            │
│         │                                                       │
│         ▼                                                       │
│  ┌────────────────────┐      ┌─────────────────┐              │
│  │ Call               │─────▶│ Backend API     │              │
│  │ refreshToken()     │      │ /auth/refresh   │              │
│  └──────┬─────────────┘      └─────┬───────────┘              │
│         │                           │                          │
│         │                           │ {newToken, expiresAt}   │
│         │                           │                          │
│         ▼                           ▼                          │
│  ┌────────────────────┐      ┌─────────────────┐              │
│  │ Update Token       │◀─────│ Success         │              │
│  │ Schedule Next      │      │                 │              │
│  └────────────────────┘      └─────────────────┘              │
│         │                                                      │
│         │ Loop back                                            │
│         └──────────────────────────────────────────────────┐  │
│                                                             │  │
│  ┌─────────────────┐                                       │  │
│  │ Refresh Failed  │                                       │  │
│  └──────┬──────────┘                                       │  │
│         │                                                   │  │
│         ▼                                                   │  │
│  ┌────────────────────┐                                    │  │
│  │ Trigger Logout     │                                    │  │
│  │ Clear Tokens       │                                    │  │
│  └────────────────────┘                                    │  │
│                                                             │  │
└─────────────────────────────────────────────────────────────┘  │
                                                                  │
```

## Component Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                         main.tsx                                │
│                                                                 │
│  <StrictMode>                                                   │
│    <AuthProvider>                                               │
│      <ZeroProvider zero={zeroInstance}>                        │
│        <App />                                                  │
│      </ZeroProvider>                                            │
│    </AuthProvider>                                              │
│  </StrictMode>                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          App.tsx                                │
│                                                                 │
│  const { isAuthenticated } = useAuth();                         │
│                                                                 │
│  {isAuthenticated ? <Dashboard /> : <LoginPage />}             │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│      LoginPage           │   │       Dashboard          │
│                          │   │                          │
│  const { login } =       │   │  const { user, logout } =│
│    useAuth();            │   │    useAuth();            │
│                          │   │                          │
│  <LoginForm              │   │  <UserProfile            │
│    onSubmit={login} />   │   │    user={user}           │
│                          │   │    onLogout={logout} />  │
└──────────────────────────┘   └──────────────────────────┘
```

## Zero Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Without Zero Integration                     │
│                     (AuthContext.tsx)                           │
│                                                                 │
│  Login ──▶ AuthContext ──▶ Save State ──▶ Manual Zero Init    │
│                                            (you call it)        │
│                                                                 │
│  Logout ──▶ AuthContext ──▶ Clear State ──▶ Manual Zero Reset │
│                                              (you call it)      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     With Zero Integration                       │
│                  (AuthContextWithZero.tsx)                      │
│                                                                 │
│  Login ──▶ AuthContext ──▶ Save State ──▶ Auto Zero Init      │
│                                            (built-in)           │
│                                                                 │
│  Logout ──▶ AuthContext ──▶ Clear State ──▶ Auto Zero Reset   │
│                                              (built-in)         │
└─────────────────────────────────────────────────────────────────┘
```

## Storage Layer

```
┌──────────────────────────────────────────────────────────────────┐
│                        localStorage                              │
│                                                                  │
│  Key                          Value                             │
│  ─────────────────────────    ─────────────────────────────     │
│  grocery_auth_access_token    eyJhbGciOiJIUzI1NiIs...          │
│  grocery_auth_refresh_token   eyJhbGciOiJIUzI1NiIs...          │
│  grocery_auth_token_expiry    1635811200000                     │
│  grocery_auth_user            {"id":"user-123",...}             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                               ▲       │
                               │       │
                    ┌──────────┘       └──────────┐
                    │ Read on mount    Save on    │
                    │ Validate expiry  login      │
                    │ Auto refresh     Clear on   │
                    │                  logout     │
                               ▲                  │
                               │                  ▼
                    ┌──────────────────────────────────┐
                    │      AuthContext State           │
                    └──────────────────────────────────┘
```

## API Communication

```
┌──────────────────────────────────────────────────────────────────┐
│                      Backend API Endpoints                       │
│                                                                  │
│  POST /api/auth/login                                            │
│    Request:  { email, password }                                │
│    Response: { user, tokens: { accessToken, refreshToken,      │
│                                 expiresAt } }                    │
│                                                                  │
│  POST /api/auth/register                                         │
│    Request:  { email, password, name }                          │
│    Response: { user, tokens: { ... } }                          │
│                                                                  │
│  POST /api/auth/refresh                                          │
│    Request:  { refreshToken }                                   │
│    Response: { accessToken, expiresAt }                         │
│                                                                  │
│  POST /api/auth/logout                                           │
│    Headers:  Authorization: Bearer {token}                      │
│    Response: { success: true }                                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Type System Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                       types/auth.ts                              │
│                                                                  │
│  User                                                            │
│    ├─ id: string                                                │
│    ├─ email: string                                             │
│    ├─ name: string                                              │
│    └─ createdAt: number                                         │
│                                                                  │
│  AuthTokens                                                      │
│    ├─ accessToken: string                                       │
│    ├─ refreshToken: string                                      │
│    └─ expiresAt: number                                         │
│                                                                  │
│  LoginCredentials                                                │
│    ├─ email: string                                             │
│    └─ password: string                                          │
│                                                                  │
│  RegisterCredentials                                             │
│    ├─ email: string                                             │
│    ├─ password: string                                          │
│    └─ name: string                                              │
│                                                                  │
│  AuthState                                                       │
│    ├─ user: User | null                                         │
│    ├─ token: string | null                                      │
│    ├─ loading: boolean                                          │
│    ├─ error: string | null                                      │
│    └─ isAuthenticated: boolean                                  │
│                                                                  │
│  AuthContextValue extends AuthState                             │
│    ├─ login(credentials: LoginCredentials): Promise<void>      │
│    ├─ register(credentials: RegisterCredentials): Promise<void>│
│    ├─ logout(): Promise<void>                                   │
│    ├─ refreshToken(): Promise<void>                             │
│    └─ clearError(): void                                        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Hook Hierarchy

```
┌──────────────────────────────────────────────────────────────────┐
│                    Hook System                                   │
│                                                                  │
│  useAuth()                                                       │
│    └─ Returns full AuthContextValue                             │
│       ├─ State: user, token, loading, error, isAuthenticated   │
│       └─ Methods: login, register, logout, refreshToken,        │
│                   clearError                                     │
│                                                                  │
│  useAuthUser()                                                   │
│    └─ Returns: User | null                                      │
│       (Helper hook for components that only need user data)     │
│                                                                  │
│  useAuthToken()                                                  │
│    └─ Returns: string | null                                    │
│       (Helper hook for API calls that need the token)           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    Error Handling                                │
│                                                                  │
│  API Call                                                        │
│     │                                                            │
│     ├─ Success ──▶ Update State ──▶ Clear Error                │
│     │                                                            │
│     └─ Failure ──▶ Catch Error ──▶ Set Error State             │
│                         │                                        │
│                         ├─ Network Error                         │
│                         ├─ API Error (400, 401, 500)            │
│                         └─ Validation Error                      │
│                                                                  │
│  Component Displays Error                                        │
│     │                                                            │
│     └─ User clicks clearError() ──▶ Error State Cleared        │
│                                                                  │
│  Auto-clear on next operation                                    │
│     │                                                            │
│     └─ New login/register/logout ──▶ Error automatically        │
│                                       cleared                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Complete Request/Response Cycle

```
User Action
    │
    ▼
┌─────────────────┐
│ Component       │
│ calls useAuth() │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ AuthContext     │
│ method called   │
└────────┬────────┘
         │
         ├──▶ Set loading: true
         │    Clear error: null
         │
         ▼
┌─────────────────┐
│ Fetch API       │
│ /api/auth/*     │
└────────┬────────┘
         │
         ├──▶ Success
         │    │
         │    ▼
         │    ┌─────────────────┐
         │    │ Save to storage │
         │    └────────┬────────┘
         │             │
         │             ▼
         │    ┌─────────────────┐
         │    │ Update state    │
         │    │ - user          │
         │    │ - token         │
         │    │ - loading: false│
         │    │ - error: null   │
         │    └────────┬────────┘
         │             │
         │             ▼
         │    ┌─────────────────┐
         │    │ Sync Zero       │
         │    │ (if enabled)    │
         │    └─────────────────┘
         │
         └──▶ Error
              │
              ▼
              ┌─────────────────┐
              │ Set error state │
              │ - loading: false│
              │ - error: message│
              └─────────────────┘
```

## File Dependencies

```
AuthContext.tsx
    │
    ├─── types/auth.ts
    │       └─── Type definitions
    │
    └─── Optional: utils/authZeroIntegration.ts
             └─── Zero sync functions

AuthContextWithZero.tsx
    │
    ├─── types/auth.ts
    │       └─── Type definitions
    │
    └─── utils/authZeroIntegration.ts (required)
             │
             └─── zero-store.ts
                     └─── Zero client management
```

## Summary

This architecture provides:
- ✅ Complete separation of concerns
- ✅ Type-safe API
- ✅ Automatic token management
- ✅ Seamless Zero integration
- ✅ Error handling at every level
- ✅ Persistent storage
- ✅ React best practices
- ✅ Production-ready code
