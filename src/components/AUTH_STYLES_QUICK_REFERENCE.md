# Auth Styles - Quick Reference

## Import

```tsx
import './Auth.css';
```

## Common Patterns

### Login Form Structure

```tsx
<div className="login-form-container">
  <div className="login-form-card">
    <div className="login-form-header">
      <h2>Welcome Back</h2>
      <p className="login-form-subtitle">Sign in to continue</p>
    </div>

    <form className="login-form">
      {/* Content */}
    </form>
  </div>
</div>
```

### Form Field with Error

```tsx
<div className="form-field">
  <label htmlFor="email" className="form-label">
    Email Address
  </label>
  <input
    type="email"
    id="email"
    className={`input ${error ? 'input-error' : ''}`}
    aria-invalid={!!error}
    aria-describedby={error ? 'email-error' : undefined}
  />
  {error && (
    <span id="email-error" className="field-error" role="alert">
      {error}
    </span>
  )}
</div>
```

### Password Field with Toggle

```tsx
<div className="form-field">
  <label htmlFor="password" className="form-label">
    Password
  </label>
  <div className="password-input-wrapper">
    <input
      type={showPassword ? 'text' : 'password'}
      id="password"
      className="input"
    />
    <button
      type="button"
      className="password-toggle"
      onClick={() => setShowPassword(!showPassword)}
      aria-label={showPassword ? 'Hide password' : 'Show password'}
    >
      {showPassword ? '👁️' : '👁️‍🗨️'}
    </button>
  </div>
</div>
```

### Error Banner

```tsx
{error && (
  <div className="login-error-banner" role="alert">
    <span className="error-icon">⚠</span>
    <span className="error-message">{error}</span>
  </div>
)}
```

### Submit Button with Loading

```tsx
<button
  type="submit"
  className="btn btn-primary btn-login"
  disabled={loading}
  aria-busy={loading}
>
  {loading ? (
    <>
      <span className="spinner" aria-hidden="true"></span>
      <span>Signing in...</span>
    </>
  ) : (
    'Sign In'
  )}
</button>
```

### User Menu

```tsx
<div className="header-content">
  <div className="header-title">
    <h1>Grocery List</h1>
  </div>

  <div className="user-menu">
    <div className="user-info">
      <div className="user-icon">
        {user?.name?.charAt(0).toUpperCase() || '👤'}
      </div>
      <div className="user-details">
        <div className="user-name">{user?.name}</div>
        <div className="user-email">{user?.email}</div>
      </div>
    </div>
    <button className="btn btn-logout" onClick={handleLogout}>
      Logout
    </button>
  </div>
</div>
```

### Loading State (Full Page)

```tsx
<div className="auth-loading">
  <div className="loading-spinner-large"></div>
  <p>Loading...</p>
</div>
```

### Password Strength Indicator

```tsx
<div className="password-strength">
  <div className="password-strength-bars">
    {[1, 2, 3, 4].map((level) => (
      <div
        key={level}
        className={`strength-bar ${
          strength >= level ? 'active' : ''
        } ${
          strength === 1 ? 'weak' :
          strength === 2 ? 'medium' :
          strength >= 3 ? 'strong' : ''
        }`}
      />
    ))}
  </div>
  <span className="password-strength-label">
    {strength === 0 ? '' :
     strength === 1 ? 'Weak' :
     strength === 2 ? 'Medium' :
     strength === 3 ? 'Strong' :
     'Very Strong'}
  </span>
</div>
```

### Password Requirements List

```tsx
<ul className="password-requirements">
  <li className={hasMinLength ? 'met' : ''}>
    <span className="requirement-icon"></span>
    At least 8 characters
  </li>
  <li className={hasUppercase ? 'met' : ''}>
    <span className="requirement-icon"></span>
    One uppercase letter
  </li>
  <li className={hasLowercase ? 'met' : ''}>
    <span className="requirement-icon"></span>
    One lowercase letter
  </li>
  <li className={hasNumber ? 'met' : ''}>
    <span className="requirement-icon"></span>
    One number
  </li>
</ul>
```

### Form Footer with Link

```tsx
<div className="form-footer">
  <p className="register-prompt">
    Don't have an account?{' '}
    <button
      type="button"
      className="link-button link-primary"
      onClick={onSwitchToRegister}
    >
      Create account
    </button>
  </p>
</div>
```

### Link Button

```tsx
<button
  type="button"
  className="link-button"
  onClick={handleForgotPassword}
>
  Forgot password?
</button>
```

## Key Classes Cheat Sheet

### Containers
- `.auth-page` - Full page wrapper
- `.login-form-container` / `.register-form-container` - Form page
- `.login-form-card` / `.register-form-card` - Form card

### Forms
- `.login-form` / `.register-form` - Form element
- `.form-field` - Field container
- `.form-label` - Label element
- `.input` - Text input
- `.input-error` - Error state

### Buttons
- `.btn-login` / `.btn-register` - Submit buttons
- `.btn-logout` - Logout button
- `.link-button` - Text link button
- `.link-button.link-primary` - Primary link

### Errors
- `.login-error-banner` / `.error-banner` - Banner error
- `.error-icon` - Error icon
- `.error-message` - Error text
- `.field-error` - Field-level error

### Loading
- `.auth-loading` - Full page loading
- `.loading-spinner-large` - Large spinner
- `.spinner` / `.loading-spinner` - Small spinner

### User Menu
- `.user-menu` - Menu container
- `.user-info` - Info section
- `.user-icon` - Avatar circle
- `.user-details` - Name + email
- `.user-name` - User name
- `.user-email` - User email

### Password
- `.password-input-wrapper` - Password field wrapper
- `.password-toggle` - Show/hide button
- `.password-strength` - Strength indicator
- `.password-requirements` - Requirements list

## Responsive Breakpoints

- **768px** - Tablet (header stacks, user menu full width)
- **480px** - Mobile (reduced padding, smaller fonts)
- **360px** - Small mobile (user menu stacks)

## Color Variables

```css
var(--primary-color)      /* #4caf50 - Primary green */
var(--primary-hover)      /* #45a049 - Darker green */
var(--danger-color)       /* #f44336 - Error red */
var(--danger-hover)       /* #da190b - Darker red */
var(--text-color)         /* #333 - Main text */
var(--text-muted)         /* #666 - Secondary text */
var(--border-color)       /* #ddd - Borders */
var(--card-bg)           /* #ffffff - Card background */
var(--bg-color)          /* #f5f5f5 - Page background */
```

## Accessibility Checklist

- ✅ Use `htmlFor` on labels
- ✅ Add `aria-invalid` on error inputs
- ✅ Add `aria-describedby` pointing to error message
- ✅ Add `aria-required` on required fields
- ✅ Add `aria-busy` on loading buttons
- ✅ Add `aria-label` on icon buttons
- ✅ Use `role="alert"` on error messages
- ✅ Add `aria-hidden="true"` on decorative spinners
