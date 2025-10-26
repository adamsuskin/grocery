# Password Reset - Quick Start Guide

Get your password reset feature running in 5 minutes!

## Prerequisites

- PostgreSQL database running
- Node.js server running
- React frontend running

## Step 1: Apply Database Migration (1 minute)

```bash
# Connect to your database
psql -U your_user -d grocery_db

# Run the migration
\i src/migrations/002_add_password_reset_fields.sql

# Verify (should show reset_token and reset_token_expires)
\d users
```

## Step 2: Install Dependencies (if needed)

The implementation uses only built-in Node.js modules and existing dependencies:
- `crypto` (built-in) ✓
- `bcrypt` (already installed) ✓
- `express` (already installed) ✓

No additional packages needed!

## Step 3: Set Environment Variable

Add to your `.env` file:
```bash
FRONTEND_URL=http://localhost:5173
```

Restart your server after adding this.

## Step 4: Add Routes to Your React App

### Option A: Using React Router (Recommended)

Add to your `App.tsx` or routes file:

```tsx
import { Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import { LoginForm } from './components/LoginForm';
import { ForgotPasswordForm } from './components/ForgotPasswordForm';
import { ResetPasswordForm } from './components/ResetPasswordForm';

function App() {
  return (
    <Routes>
      {/* Existing routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* NEW: Add these two routes */}
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
    </Routes>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  return (
    <LoginForm
      onForgotPassword={() => navigate('/forgot-password')}
    />
  );
}

function ForgotPasswordPage() {
  const navigate = useNavigate();
  return (
    <ForgotPasswordForm
      onBackToLogin={() => navigate('/login')}
    />
  );
}

function ResetPasswordPage() {
  const navigate = useNavigate();
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

### Option B: Without React Router

Update your existing login form integration:

```tsx
import { LoginForm } from './components/LoginForm';

<LoginForm
  onForgotPassword={() => {
    window.location.href = '/forgot-password.html';
  }}
/>
```

Then create separate HTML files for forgot-password and reset-password pages.

## Step 5: Test the Flow

### 1. Start Your Servers

Terminal 1 (Backend):
```bash
cd server
npm run dev
```

Terminal 2 (Frontend):
```bash
npm run dev
```

### 2. Test Forgot Password

1. Go to `http://localhost:5173/login`
2. Click "Forgot password?"
3. Enter a registered email address
4. Click "Send Reset Link"
5. Check your server console for output like:

```
==================== EMAIL SENT ====================
To: user@example.com
Subject: Reset Your Password - Grocery List
Text:
Hello John,

You recently requested to reset your password...

Click the link below to reset your password:
http://localhost:5173/reset-password?token=abc123...
====================================================
```

### 3. Test Password Reset

1. Copy the reset URL from the console
2. Paste it in your browser
3. Enter a new password (must meet requirements):
   - At least 8 characters
   - One uppercase letter
   - One lowercase letter
   - One number
4. Click "Reset Password"
5. You should see a success message
6. Try logging in with your new password

## Quick Troubleshooting

### "reset_token column does not exist"
**Fix**: Run the database migration (Step 1)

### "Email not showing in console"
**Fix**: Check that your server is running and logging is enabled

### "Token invalid or expired"
**Fix**:
- Tokens expire after 1 hour - request a new one
- Make sure you copied the full token from the URL
- Check that database migration was applied

### "Password doesn't meet requirements"
**Requirements**:
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)

Example valid password: `MyPassword123`

### "Cannot find module './components/ForgotPasswordForm'"
**Fix**: Make sure files are in the correct location:
- `/home/adam/grocery/src/components/ForgotPasswordForm.tsx`
- `/home/adam/grocery/src/components/ResetPasswordForm.tsx`

## Testing Checklist

Quickly verify everything works:

- [ ] Database migration applied (check with `\d users`)
- [ ] Server starts without errors
- [ ] Frontend starts without errors
- [ ] Can navigate to forgot password page
- [ ] Can submit email and see success message
- [ ] Email appears in server console with reset link
- [ ] Can navigate to reset password page with token
- [ ] Can submit new password
- [ ] Password requirements are enforced
- [ ] See success message after reset
- [ ] Can log in with new password
- [ ] Old password no longer works

## What's Next?

### For Development
- Everything is set up! The mock email system will log to console.
- Test with different scenarios (invalid tokens, expired tokens, etc.)

### For Production
1. **Email Service**: Replace mock email with real service
   - See: `PASSWORD_RESET_SECURITY.md` for integration guides
   - Recommended: SendGrid, AWS SES, or Postmark

2. **Security Enhancements**: Review `PASSWORD_RESET_SECURITY.md`
   - Configure HTTPS
   - Set up monitoring
   - Implement proper logging

3. **Testing**: Add automated tests for password reset flow

## Need More Details?

See the comprehensive guides:
- **Full Implementation Guide**: `PASSWORD_RESET_IMPLEMENTATION.md`
- **Security Best Practices**: `PASSWORD_RESET_SECURITY.md`
- **Integration Examples**: `src/examples/PasswordResetIntegration.example.tsx`

## Common Customizations

### Change Token Expiration

Edit `/home/adam/grocery/server/auth/controller.ts`:

```typescript
// In forgotPassword function
const expiresAt = new Date();
expiresAt.setMinutes(expiresAt.getMinutes() + 30); // Change from 60 to 30 minutes
```

### Customize Email Template

Edit `/home/adam/grocery/server/utils/email.ts`:

```typescript
export function generatePasswordResetEmail(
  email: string,
  resetToken: string,
  userName?: string
): EmailOptions {
  // Customize the email content here
}
```

### Change Password Requirements

Edit `/home/adam/grocery/server/auth/utils.ts`:

```typescript
export function validatePassword(password: string) {
  // Adjust requirements here
  if (password.length < 12) { // Change minimum length
    return { isValid: false, error: 'Password must be at least 12 characters' };
  }
  // Add more requirements...
}
```

### Style the Forms

Edit `/home/adam/grocery/src/components/LoginForm.css`:

```css
/* Customize colors, spacing, etc. */
.login-form-container {
  background-color: your-color;
}
```

## API Endpoints Reference

### Request Password Reset
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

### Reset Password
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token":"your-reset-token",
    "newPassword":"NewPassword123"
  }'
```

## Support

If you run into issues:
1. Check the troubleshooting section above
2. Review server logs for errors
3. Verify database schema is updated
4. Check that environment variables are set
5. See comprehensive docs in `PASSWORD_RESET_IMPLEMENTATION.md`

## File Locations

Quick reference for all created files:

```
grocery/
├── src/
│   ├── components/
│   │   ├── ForgotPasswordForm.tsx       ✓ NEW
│   │   ├── ResetPasswordForm.tsx        ✓ NEW
│   │   ├── LoginForm.tsx                ✓ UPDATED
│   │   └── LoginForm.css                ✓ UPDATED
│   ├── examples/
│   │   └── PasswordResetIntegration.example.tsx  ✓ NEW
│   └── migrations/
│       └── 002_add_password_reset_fields.sql     ✓ NEW
├── server/
│   ├── auth/
│   │   ├── controller.ts                ✓ UPDATED
│   │   └── routes.ts                    ✓ UPDATED
│   ├── types/
│   │   └── index.ts                     ✓ UPDATED
│   └── utils/
│       └── email.ts                     ✓ NEW
├── PASSWORD_RESET_IMPLEMENTATION.md     ✓ NEW
├── PASSWORD_RESET_SECURITY.md           ✓ NEW
└── QUICK_START_PASSWORD_RESET.md        ✓ NEW (this file)
```

---

**You're all set!** 🎉

The password reset feature is now fully implemented and ready to use. Test it out and refer to the detailed documentation if you need to customize or prepare for production deployment.
