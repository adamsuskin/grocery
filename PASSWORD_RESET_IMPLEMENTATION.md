# Password Reset Implementation Guide

This document provides a complete overview of the password reset functionality implementation for the Grocery application.

## Overview

A complete password reset flow has been implemented with the following features:
- Secure token-based password reset
- Email notifications (mocked for development)
- Rate limiting to prevent abuse
- Token expiration (1 hour)
- Client-side and server-side validation
- Responsive UI components

## Architecture

### Flow Diagram

```
1. User clicks "Forgot Password" on login page
2. User enters email address
3. Server generates secure reset token
4. Server stores hashed token in database with expiration
5. Server sends email with reset link (mocked in dev)
6. User clicks link in email
7. User enters new password
8. Server validates token and updates password
9. User redirected to login page
```

## Implementation Details

### 1. Database Schema

#### Migration File
- **Location**: `/home/adam/grocery/src/migrations/002_add_password_reset_fields.sql`

#### Changes to `users` table:
```sql
ALTER TABLE users
ADD COLUMN reset_token VARCHAR(255);

ALTER TABLE users
ADD COLUMN reset_token_expires TIMESTAMP WITH TIME ZONE;

CREATE INDEX idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;
```

#### To Apply Migration:
```bash
# Connect to your PostgreSQL database and run:
psql -U your_user -d your_database -f src/migrations/002_add_password_reset_fields.sql
```

### 2. Server Components

#### A. Email Utility
- **Location**: `/home/adam/grocery/server/utils/email.ts`
- **Features**:
  - Mock email sending for development
  - Password reset email template (HTML + text)
  - Password reset success notification
  - Ready for production email service integration

**Production Integration Notes**:
Replace the mock `sendEmail` function with real email service:
```typescript
// Example with SendGrid
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    await sgMail.send({
      from: process.env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    return true;
  } catch (error) {
    console.error('Email send failed:', error);
    return false;
  }
}
```

#### B. Controller Functions
- **Location**: `/home/adam/grocery/server/auth/controller.ts`

**New Functions**:

1. `forgotPassword(req, res)` - POST `/api/auth/forgot-password`
   - Validates email
   - Generates secure reset token using crypto
   - Stores hashed token in database
   - Sends reset email
   - Returns success message (to prevent email enumeration)

2. `resetPassword(req, res)` - POST `/api/auth/reset-password`
   - Validates token and new password
   - Checks token expiration
   - Updates password
   - Clears reset token
   - Sends success notification email

**Security Features**:
- Tokens are hashed (SHA-256) before storage
- Tokens expire after 1 hour
- Email enumeration prevention
- Password strength validation
- Rate limiting (5 requests per 15 minutes)

#### C. Routes
- **Location**: `/home/adam/grocery/server/auth/routes.ts`

**New Routes**:
```typescript
POST /api/auth/forgot-password
Body: { email: string }
Response: { success: boolean, message: string }

POST /api/auth/reset-password
Body: { token: string, newPassword: string }
Response: { success: boolean, message: string }
```

Both routes include:
- Rate limiting (authLimiter - 5 requests per 15 minutes)
- Input validation (express-validator)
- Required field validation

#### D. Types
- **Location**: `/home/adam/grocery/server/types/index.ts`

**New Interfaces**:
```typescript
interface User {
  // ... existing fields
  reset_token?: string;
  reset_token_expires?: Date;
}

interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}
```

### 3. Client Components

#### A. ForgotPasswordForm Component
- **Location**: `/home/adam/grocery/src/components/ForgotPasswordForm.tsx`

**Features**:
- Email input with validation
- Loading states
- Error handling
- Success message display
- Back to login navigation

**Props**:
```typescript
interface ForgotPasswordFormProps {
  onBackToLogin?: () => void;
}
```

**Usage Example**:
```tsx
import { ForgotPasswordForm } from './components/ForgotPasswordForm';

function ForgotPasswordPage() {
  return (
    <ForgotPasswordForm
      onBackToLogin={() => navigate('/login')}
    />
  );
}
```

#### B. ResetPasswordForm Component
- **Location**: `/home/adam/grocery/src/components/ResetPasswordForm.tsx`

**Features**:
- Password and confirm password inputs
- Password strength requirements display
- Show/hide password toggle
- Real-time validation
- Success message with auto-redirect
- Token validation

**Props**:
```typescript
interface ResetPasswordFormProps {
  token: string;                  // From URL query parameter
  onSuccess?: () => void;         // Called after successful reset
  onBackToLogin?: () => void;     // Navigate back to login
}
```

**Usage Example**:
```tsx
import { ResetPasswordForm } from './components/ResetPasswordForm';
import { useSearchParams } from 'react-router-dom';

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  return (
    <ResetPasswordForm
      token={token}
      onSuccess={() => navigate('/login')}
      onBackToLogin={() => navigate('/login')}
    />
  );
}
```

#### C. LoginForm Updates
- **Location**: `/home/adam/grocery/src/components/LoginForm.tsx`

**Changes**:
- Added `onForgotPassword` prop
- Updated "Forgot password?" button handler
- Fallback to window.location.href if no prop provided

**Updated Props**:
```typescript
interface LoginFormProps {
  onSwitchToRegister?: () => void;
  onForgotPassword?: () => void;  // NEW
}
```

**Usage Example**:
```tsx
<LoginForm
  onSwitchToRegister={() => navigate('/register')}
  onForgotPassword={() => navigate('/forgot-password')}
/>
```

### 4. Styling

#### CSS Updates
- **Location**: `/home/adam/grocery/src/components/LoginForm.css`

**New Styles Added**:
- `.success-message` - Success state display
- `.success-icon` - Checkmark icon styling
- `.password-requirements` - Password rules display
- `.text-muted` - Muted text utility

All styles are responsive and follow the existing design system.

## Integration Guide

### Step 1: Apply Database Migration

```bash
# Connect to PostgreSQL
psql -U your_user -d grocery_db

# Run migration
\i src/migrations/002_add_password_reset_fields.sql

# Verify changes
\d users
```

### Step 2: Update Environment Variables

Add to your `.env` file:
```env
# Frontend URL for password reset links
FRONTEND_URL=http://localhost:5173

# Email service credentials (when ready for production)
# SENDGRID_API_KEY=your_api_key
# EMAIL_FROM=noreply@yourapp.com
```

### Step 3: Set Up Routes (if using React Router)

```tsx
// App.tsx or Routes.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoginForm } from './components/LoginForm';
import { ForgotPasswordForm } from './components/ForgotPasswordForm';
import { ResetPasswordForm } from './components/ResetPasswordForm';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          <LoginForm
            onForgotPassword={() => navigate('/forgot-password')}
          />
        } />
        <Route path="/forgot-password" element={
          <ForgotPasswordForm
            onBackToLogin={() => navigate('/login')}
          />
        } />
        <Route path="/reset-password" element={
          <ResetPasswordPageWrapper />
        } />
      </Routes>
    </BrowserRouter>
  );
}

function ResetPasswordPageWrapper() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  return (
    <ResetPasswordForm
      token={token}
      onSuccess={() => {
        navigate('/login');
      }}
      onBackToLogin={() => navigate('/login')}
    />
  );
}
```

### Step 4: Test the Flow

#### Development Testing:

1. **Start the server**:
   ```bash
   cd server
   npm run dev
   ```

2. **Start the client**:
   ```bash
   npm run dev
   ```

3. **Test forgot password**:
   - Go to login page
   - Click "Forgot password?"
   - Enter email address
   - Check server console for email output (mock)
   - Copy the reset URL from console

4. **Test reset password**:
   - Paste the reset URL in browser
   - Enter new password
   - Verify password requirements
   - Submit and verify success
   - Try logging in with new password

## API Documentation

### POST /api/auth/forgot-password

**Request**:
```json
{
  "email": "user@example.com"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "If an account exists with that email, a password reset link has been sent"
}
```

**Error Response** (400):
```json
{
  "success": false,
  "error": "Validation error",
  "message": "Invalid email format"
}
```

**Rate Limit** (429):
```json
{
  "success": false,
  "error": "Too many requests",
  "message": "Too many authentication attempts. Please try again later."
}
```

### POST /api/auth/reset-password

**Request**:
```json
{
  "token": "64-character-hex-string",
  "newPassword": "NewSecurePassword123"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

**Error Responses**:

Invalid token (400):
```json
{
  "success": false,
  "error": "Invalid or expired token",
  "message": "Password reset token is invalid or has expired"
}
```

Weak password (400):
```json
{
  "success": false,
  "error": "Validation error",
  "message": "Password must contain at least one uppercase letter"
}
```

## Security Considerations

### Current Implementation

1. **Token Security**:
   - Tokens are 32 bytes (256 bits) random data
   - Stored as SHA-256 hash in database
   - Only plain token sent in email
   - Tokens expire after 1 hour

2. **Rate Limiting**:
   - 5 requests per 15 minutes per IP
   - Prevents brute force attacks
   - Applies to both endpoints

3. **Email Enumeration Prevention**:
   - Same response whether user exists or not
   - Prevents attackers from discovering valid emails

4. **Password Requirements**:
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number

### Production Recommendations

1. **Email Service**:
   - Use dedicated email service (SendGrid, AWS SES, Mailgun)
   - Implement retry logic
   - Add email logging for audit trail
   - Monitor bounce rates

2. **Enhanced Security**:
   - Add CAPTCHA to prevent bot abuse
   - Implement account lockout after multiple failed attempts
   - Add 2FA for sensitive accounts
   - Log all password reset attempts
   - Monitor for suspicious patterns

3. **Token Management**:
   - Consider shorter expiration (30 minutes)
   - Invalidate token after first use
   - Store token usage attempts
   - Add IP validation

4. **Monitoring**:
   - Track password reset request frequency
   - Alert on unusual patterns
   - Monitor email delivery rates
   - Log all security events

5. **HTTPS**:
   - Ensure all traffic uses HTTPS
   - Use secure cookies
   - Implement HSTS headers

6. **Environment Variables**:
   - Never commit credentials
   - Use secret management service
   - Rotate secrets regularly

## Testing Checklist

### Manual Testing

- [ ] Can request password reset with valid email
- [ ] Receives appropriate message for invalid email
- [ ] Email contains correct reset link (check console in dev)
- [ ] Reset link works when clicked
- [ ] Cannot reset with expired token (wait 1+ hour)
- [ ] Cannot reset with invalid token
- [ ] Password validation works correctly
- [ ] Confirm password validation works
- [ ] Can successfully reset password
- [ ] Can login with new password
- [ ] Old password no longer works
- [ ] Success notification email sent (check console)
- [ ] Back to login buttons work
- [ ] Rate limiting works (try 6+ requests)
- [ ] UI is responsive on mobile
- [ ] Loading states display correctly
- [ ] Error messages are clear

### Automated Testing (Recommended)

```typescript
// Example test structure
describe('Password Reset Flow', () => {
  it('should send reset email for valid user', async () => {
    // Test forgot password endpoint
  });

  it('should reject invalid email format', async () => {
    // Test validation
  });

  it('should reset password with valid token', async () => {
    // Test reset password endpoint
  });

  it('should reject expired token', async () => {
    // Test token expiration
  });

  it('should enforce rate limiting', async () => {
    // Test rate limiter
  });
});
```

## Troubleshooting

### Issue: Reset emails not showing in console

**Solution**: Check that:
1. Server is running
2. Email utility is imported correctly
3. Console logs are visible (check log level)

### Issue: Token invalid or expired

**Causes**:
1. Token has expired (>1 hour old)
2. Token already used
3. Database not updated with migration
4. Token copied incorrectly

**Solution**: Request new reset link

### Issue: Database error on password reset

**Solution**: Verify migration was applied:
```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('reset_token', 'reset_token_expires');
```

### Issue: Rate limiting too aggressive

**Solution**: Adjust rate limits in `/home/adam/grocery/server/auth/routes.ts`:
```typescript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Increase from 5 to 10
  // ...
});
```

## Future Enhancements

1. **Email Verification**: Add email verification before allowing password reset
2. **Two-Factor Authentication**: Require 2FA for password changes
3. **Password History**: Prevent reusing last N passwords
4. **Account Recovery**: Alternative recovery methods (SMS, security questions)
5. **Notification Preferences**: Allow users to opt-in to security notifications
6. **Audit Log**: Track all password changes with IP and timestamp
7. **Password Strength Meter**: Visual indicator of password strength
8. **Social Recovery**: Allow trusted contacts to help recover account

## Support

For issues or questions:
1. Check this documentation
2. Review server logs
3. Verify database migration applied
4. Check environment variables
5. Test with curl/Postman to isolate client vs server issues

## File Checklist

All files have been created and are ready to use:

### Database
- ✓ `/home/adam/grocery/src/migrations/002_add_password_reset_fields.sql`

### Server
- ✓ `/home/adam/grocery/server/utils/email.ts`
- ✓ `/home/adam/grocery/server/auth/controller.ts` (updated)
- ✓ `/home/adam/grocery/server/auth/routes.ts` (updated)
- ✓ `/home/adam/grocery/server/types/index.ts` (updated)

### Client
- ✓ `/home/adam/grocery/src/components/ForgotPasswordForm.tsx`
- ✓ `/home/adam/grocery/src/components/ResetPasswordForm.tsx`
- ✓ `/home/adam/grocery/src/components/LoginForm.tsx` (updated)
- ✓ `/home/adam/grocery/src/components/LoginForm.css` (updated)

### Documentation
- ✓ `/home/adam/grocery/PASSWORD_RESET_IMPLEMENTATION.md` (this file)

---

**Implementation Date**: October 26, 2025
**Version**: 1.0.0
**Status**: Ready for Development Testing
