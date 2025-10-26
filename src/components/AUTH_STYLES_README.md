# Authentication Styles Documentation

## Overview

This document describes the CSS styles for all authentication-related components in the grocery list application.

## File Structure

### Primary Style Files

1. **`Auth.css`** (NEW - Comprehensive consolidated file)
   - Complete authentication styling system
   - All auth components covered
   - Responsive and accessible
   - Can be used standalone

2. **`LoginForm.css`** (Existing)
   - Specific to LoginForm component
   - Can be used alongside Auth.css or standalone

3. **`RegisterForm.css`** (Existing)
   - Specific to RegisterForm component
   - Can be used alongside Auth.css or standalone

4. **`ProtectedRoute.css`** (Existing)
   - Loading states for protected routes
   - Legacy login container styles

5. **`AuthPage.css`** (Existing)
   - Minimal page container styles

6. **`App.css`** (Existing)
   - Contains user menu and logout button styles
   - Auth loading states

## CSS Class Reference

### Page Containers

| Class | Description | Location |
|-------|-------------|----------|
| `.auth-page` | Full-page auth container | Auth.css |
| `.auth-main` | Main auth content wrapper | Auth.css, App.css |
| `.login-form-container` | Login form page wrapper | Auth.css, LoginForm.css |
| `.register-form-container` | Register form page wrapper | Auth.css, RegisterForm.css |

### Form Cards

| Class | Description | Features |
|-------|-------------|----------|
| `.login-form-card` | Login form card container | Shadow, border-radius, hover effect |
| `.register-form-card` | Register form card container | Shadow, border-radius, hover effect |

### Form Headers

| Class | Description | Location |
|-------|-------------|----------|
| `.login-form-header` | Login form header section | Auth.css, LoginForm.css |
| `.register-form-header` | Register form header section | Auth.css, RegisterForm.css |
| `.login-form-subtitle` | Subtitle text | Auth.css, LoginForm.css |
| `.register-form-subtitle` | Subtitle text | Auth.css, RegisterForm.css |

### Form Structure

| Class | Description | Features |
|-------|-------------|----------|
| `.login-form` | Login form wrapper | Flex column, 20px gap |
| `.register-form` | Register form wrapper | Flex column, 20px gap |
| `.form-field` | Individual field container | Label + input wrapper |
| `.form-label` | Field label | Bold, 0.95rem |

### Input Fields

| Class | Description | States |
|-------|-------------|--------|
| `.input` | Base input style | Focus, disabled, error |
| `.input-error` | Error state modifier | Red border, error shadow |
| `.password-input-wrapper` | Password field container | Relative positioning for toggle |
| `.password-toggle` | Show/hide password button | Hover, disabled, focus states |

### Error Messages

| Class | Description | Animation |
|-------|-------------|-----------|
| `.login-error-banner` | Form-level error banner | slideDown, shake |
| `.error-banner` | Generic error banner | slideDown, shake |
| `.error-icon` | Error icon | Fixed size, flex-shrink: 0 |
| `.error-message` | Error text content | Flexible width |
| `.field-error` | Field-level error | slideDown animation |
| `.field-help` | Help text for fields | Muted color |

### Success Messages

| Class | Description | Animation |
|-------|-------------|-----------|
| `.success-message` | Success banner | slideDown |
| `.success-icon` | Success icon | Bold |

### Password Strength

| Class | Description | Purpose |
|-------|-------------|---------|
| `.password-strength` | Strength indicator container | Flex layout |
| `.password-strength-bars` | Bar container | 4 bars |
| `.strength-bar` | Individual bar | Transitions color |
| `.strength-bar.active` | Filled bar | Primary color |
| `.strength-bar.weak` | Weak password | Danger color |
| `.strength-bar.medium` | Medium password | Warning color |
| `.strength-bar.strong` | Strong password | Primary color |
| `.password-strength-label` | "Weak/Medium/Strong" text | Right-aligned |

### Password Requirements

| Class | Description | Purpose |
|-------|-------------|---------|
| `.password-requirements` | Requirements list container | Gray background box |
| `.password-requirements li` | Individual requirement | Flex layout with icon |
| `.password-requirements li.met` | Met requirement | Green color |
| `.requirement-icon` | Checkmark/circle icon | Fixed width |

### Buttons

| Class | Description | States |
|-------|-------------|--------|
| `.btn-login` | Login submit button | Loading, disabled |
| `.btn-register` | Register submit button | Loading, disabled |
| `.link-button` | Text link button | Hover, disabled, focus |
| `.link-button.link-primary` | Primary colored link | Primary color |
| `.btn-logout` | Logout button | Hover to red |

### Loading States

| Class | Description | Size |
|-------|-------------|------|
| `.auth-loading` | Full-page loading state | Full viewport height |
| `.protected-route-loading` | Protected route loading | Full viewport height |
| `.loading-spinner-large` | Large spinner | 48px × 48px |
| `.spinner` | Small button spinner | 16px × 16px |
| `.loading-spinner` | Generic small spinner | 16px × 16px |

### User Menu

| Class | Description | Features |
|-------|-------------|----------|
| `.header-content` | Header with menu | Flex, space-between |
| `.header-title` | Title section | Flex: 1 |
| `.user-menu` | User menu card | Shadow, hover effect |
| `.user-info` | User info section | Icon + details |
| `.user-icon` | User avatar/icon | Circle, 40px, primary bg |
| `.user-details` | Name + email container | Column layout |
| `.user-name` | User's name | Bold, truncated |
| `.user-email` | User's email | Muted, truncated |

### Form Footer

| Class | Description | Purpose |
|-------|-------------|---------|
| `.form-links` | Link container | Right-aligned |
| `.form-footer` | Bottom section | Border-top, centered |
| `.register-prompt` | "Don't have account?" text | Centered |

## Animations

### Available Animations

```css
@keyframes fadeInUp {
  /* Card entrance animation */
}

@keyframes slideDown {
  /* Error/success message entrance */
}

@keyframes shake {
  /* Error emphasis animation */
}

@keyframes spin {
  /* Loading spinner rotation */
}

@keyframes pulse {
  /* Subtle pulsing effect */
}
```

## Responsive Breakpoints

| Breakpoint | Target | Changes |
|------------|--------|---------|
| 768px | Tablet | Header stacks vertically, user menu full width |
| 480px | Mobile | Reduced padding, smaller fonts, adjusted spacing |
| 360px | Small Mobile | Stacked user menu, full-width logout |

## Accessibility Features

### Focus States

- All interactive elements have visible focus indicators
- Uses `:focus-visible` for keyboard-only focus rings
- Primary color outlines with 2px offset

### ARIA Support

- Proper label associations via `htmlFor`
- Error states use `aria-invalid` and `aria-describedby`
- Loading states use `aria-busy`
- Interactive elements have `aria-label` where needed

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  /* All animations disabled */
  /* Spinners show static border */
}
```

### High Contrast

```css
@media (prefers-contrast: high) {
  /* Thicker borders on inputs */
  /* Increased border width on errors */
}
```

## Color System

All colors inherit from App.css CSS variables:

```css
--primary-color: #4caf50
--primary-hover: #45a049
--danger-color: #f44336
--danger-hover: #da190b
--bg-color: #f5f5f5
--card-bg: #ffffff
--text-color: #333
--text-muted: #666
--border-color: #ddd
```

Auth-specific additions:

```css
--auth-card-shadow: 0 4px 12px rgba(0, 0, 0, 0.1)
--auth-card-shadow-hover: 0 6px 16px rgba(0, 0, 0, 0.15)
--error-bg: #ffebee
--error-text: var(--danger-color)
--success-bg: #e8f5e9
--success-text: var(--primary-color)
```

## Usage Examples

### Import Auth Styles

```tsx
// In LoginForm.tsx
import './Auth.css';

// OR use component-specific CSS
import './LoginForm.css';
```

### Using Error States

```tsx
<input
  className={`input ${error ? 'input-error' : ''}`}
  aria-invalid={!!error}
  aria-describedby={error ? 'email-error' : undefined}
/>
{error && (
  <span id="email-error" className="field-error" role="alert">
    {error}
  </span>
)}
```

### Loading Button

```tsx
<button className="btn btn-primary btn-login" disabled={loading}>
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
<div className="user-menu">
  <div className="user-info">
    <div className="user-icon">👤</div>
    <div className="user-details">
      <div className="user-name">John Doe</div>
      <div className="user-email">john@example.com</div>
    </div>
  </div>
  <button className="btn btn-logout">Logout</button>
</div>
```

### Password Strength Indicator

```tsx
<div className="password-strength">
  <div className="password-strength-bars">
    <div className={`strength-bar ${strength >= 1 ? 'active weak' : ''}`} />
    <div className={`strength-bar ${strength >= 2 ? 'active medium' : ''}`} />
    <div className={`strength-bar ${strength >= 3 ? 'active strong' : ''}`} />
    <div className={`strength-bar ${strength >= 4 ? 'active strong' : ''}`} />
  </div>
  <span className="password-strength-label">
    {strengthLabel}
  </span>
</div>
```

## Design Principles

### Consistency
- All components share the same visual language
- Consistent spacing (12px, 16px, 20px system)
- Unified color palette from App.css

### Feedback
- Immediate visual feedback for interactions
- Clear error states with helpful messages
- Loading states for async operations

### Accessibility
- WCAG 2.1 AA compliant
- Keyboard navigable
- Screen reader friendly
- Respects user preferences (motion, contrast)

### Responsiveness
- Mobile-first approach
- Smooth transitions between breakpoints
- Touch-friendly tap targets (min 44px)

## Migration Guide

If you're currently using the individual CSS files (LoginForm.css, RegisterForm.css), you can:

### Option 1: Switch to Auth.css (Recommended)
```tsx
// Remove individual imports
// import './LoginForm.css';

// Add single import
import './Auth.css';
```

### Option 2: Keep Using Individual Files
```tsx
// Continue using component-specific CSS
import './LoginForm.css';
```

Both approaches work! Auth.css is a consolidated version that includes everything.

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- iOS Safari: iOS 12+
- Chrome Android: Latest

## Future Enhancements

Potential additions:
- Social auth button styles
- Two-factor authentication UI
- Password strength meter variations
- Dark mode support
- Custom theme variables
