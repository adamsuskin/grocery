# Push Notifications Setup Guide

Complete guide for setting up push notifications in the Grocery List application.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Generating VAPID Keys](#generating-vapid-keys)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Service Worker Setup](#service-worker-setup)
7. [Testing Notifications](#testing-notifications)
8. [Notification Event Types](#notification-event-types)
9. [Troubleshooting](#troubleshooting)
10. [Security Considerations](#security-considerations)

## Overview

The push notification system uses the Web Push API with VAPID (Voluntary Application Server Identification) authentication. This allows the backend to send notifications to users' browsers even when they're not actively using the app.

### Architecture

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   Browser   │──────▶│ Your Server  │──────▶│ Push Service│
│             │       │              │       │  (Browser)  │
│ Service     │◀──────│ Notification │◀──────│             │
│ Worker      │       │ Controller   │       │             │
└─────────────┘       └──────────────┘       └─────────────┘
```

### Key Components

- **Frontend**: `src/utils/pushNotifications.ts` - Handles subscription and client-side logic
- **Backend**: `server/notifications/controller.ts` - Manages subscriptions and sends notifications
- **Database**: `push_subscriptions` table - Stores user push subscriptions
- **Service Worker**: Receives and displays push notifications

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- HTTPS connection (required for push notifications in production)
- Modern browser that supports Push API (Chrome, Firefox, Safari, Edge)

## Generating VAPID Keys

VAPID keys are required to identify your application to push services. Generate them using the `web-push` library:

### Step 1: Install web-push globally (optional)

```bash
npm install -g web-push
```

### Step 2: Generate keys

```bash
npx web-push generate-vapid-keys
```

You'll see output like this:

```
=======================================

Public Key:
BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U

Private Key:
dUiRvALz7vPG7mZNJKh7vjEzg8ACpRF4QYs3v_4bx5c

=======================================
```

**IMPORTANT**:
- Keep the private key secret - never commit it to version control
- Store both keys securely in environment variables
- Generate new keys for each environment (development, staging, production)

## Environment Configuration

### Backend (.env)

Create or update your `server/.env` file:

```env
# VAPID Configuration
VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U
VAPID_PRIVATE_KEY=dUiRvALz7vPG7mZNJKh7vjEzg8ACpRF4QYs3v_4bx5c
VAPID_SUBJECT=mailto:admin@your-domain.com

# Database (if not already configured)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grocery_db
DB_USER=grocery
DB_PASSWORD=your_secure_password
```

### Frontend (.env)

Create or update your frontend `.env` file:

```env
# VAPID Public Key (same as backend)
VITE_VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U

# API URL
VITE_API_URL=http://localhost:3001
```

**Note**: The `VITE_` prefix is required for Vite to include the variable in the build.

## Database Setup

### Step 1: Update the database schema

The schema has already been updated with the `push_subscriptions` table. Run the migration:

```bash
# If using the provided schema.sql
npm run db:init

# Or run the SQL directly
psql -h localhost -U grocery -d grocery_db -f server/db/schema.sql
```

### Step 2: Verify the table was created

```bash
psql -h localhost -U grocery -d grocery_db -c "\d push_subscriptions"
```

You should see the table structure with columns:
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key to users)
- `endpoint` (TEXT)
- `p256dh_key` (TEXT)
- `auth_key` (TEXT)
- `expiration_time` (BIGINT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Service Worker Setup

Create a service worker file to handle push notifications:

### Step 1: Create `public/sw.js`

```javascript
// Service Worker for Push Notifications

self.addEventListener('push', function(event) {
  console.log('Push notification received:', event);

  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const title = data.title || 'Grocery List';
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/badge-72.png',
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    data: data.data || {},
    actions: [
      {
        action: 'open',
        title: 'View'
      },
      {
        action: 'close',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'open' || !event.action) {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event);
});
```

### Step 2: Create notification icons

Place these files in your `public/` directory:
- `icon-192.png` - 192x192px app icon
- `badge-72.png` - 72x72px monochrome badge icon

You can use existing app icons or create simple ones for testing.

## Testing Notifications

### Step 1: Start the application

```bash
# Terminal 1: Start database
npm run db:up

# Terminal 2: Start backend server
npm run server:dev

# Terminal 3: Start frontend
npm run dev
```

### Step 2: Enable notifications in the UI

1. Open the app in your browser (http://localhost:5173)
2. Log in or create an account
3. Wait for the notification prompt to appear (after 2 minutes for new users)
4. Click "Allow Notifications"
5. Grant permission in the browser prompt

### Step 3: Test with API

Send a test notification:

```bash
# Get your auth token first (from localStorage or login response)
TOKEN="your_jwt_token_here"

# Send test notification
curl -X POST http://localhost:3001/api/notifications/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

You should receive a notification in your browser!

### Step 4: Test with collaboration events

1. Create a shared list
2. Invite another user (or use a different browser/device)
3. Add/edit/delete items in the shared list
4. Both users should receive notifications

## Notification Event Types

The system supports the following notification types:

### Item Events
- `ITEM_ADDED` - Someone added an item to a shared list
- `ITEM_EDITED` - Someone edited an item
- `ITEM_DELETED` - Someone deleted an item
- `ITEM_CHECKED` - Someone checked off an item
- `ITEM_UNCHECKED` - Someone unchecked an item

### List Events
- `LIST_SHARED` - Someone shared a list with you
- `LIST_UPDATED` - List properties were updated
- `PERMISSION_CHANGED` - Your permissions on a list changed

### Budget Events
- `BUDGET_WARNING` - Approaching budget limit (e.g., 80%)
- `BUDGET_EXCEEDED` - Exceeded the budget

### Sync Events
- `SYNC_CONFLICT` - A conflict occurred that needs resolution

## Notification Examples

### Sending Item Notification (from your code)

```typescript
import {
  notifyListMembers,
  createItemNotification
} from './server/notifications/controller';
import { NotificationType } from './server/notifications/types';

// After adding an item
const payload = createItemNotification(
  NotificationType.ITEM_ADDED,
  {
    listId: 'list-uuid',
    listName: 'Weekly Groceries',
    itemName: 'Milk',
    actorName: 'John Doe',
    actorId: 'user-uuid'
  }
);

// Notify all list members except the actor
await notifyListMembers('list-uuid', payload, 'user-uuid');
```

### Sending Budget Alert

```typescript
import {
  sendNotificationToUser,
  createBudgetNotification
} from './server/notifications/controller';
import { NotificationType } from './server/notifications/types';

// When budget threshold is reached
const payload = createBudgetNotification(
  NotificationType.BUDGET_WARNING,
  {
    listId: 'list-uuid',
    listName: 'Weekly Groceries',
    budget: 100,
    spent: 85,
    percentUsed: 85
  }
);

await sendNotificationToUser('user-uuid', payload);
```

## Troubleshooting

### Notifications not working

**Check browser support:**
```javascript
console.log('Push supported:', 'serviceWorker' in navigator && 'PushManager' in window);
console.log('Notification supported:', 'Notification' in window);
console.log('Permission:', Notification.permission);
```

**Common issues:**

1. **VAPID keys mismatch**
   - Ensure frontend and backend use the same public key
   - Verify private key is correctly set in backend .env

2. **Service worker not registered**
   - Check browser console for service worker errors
   - Ensure `sw.js` is in the `public/` directory
   - Clear browser cache and reload

3. **Permission denied**
   - Check browser notification settings
   - On macOS: System Preferences → Notifications
   - On Windows: Settings → Notifications & actions
   - In browser: Site settings → Notifications

4. **HTTPS required**
   - Push notifications require HTTPS in production
   - `localhost` is allowed for development
   - Use ngrok or similar for testing on devices

5. **Database errors**
   - Verify `push_subscriptions` table exists
   - Check database connection in backend logs

### Debugging Tips

**Frontend debugging:**
```javascript
import { getNotificationStatus } from './utils/pushNotifications';

// Check status
const status = await getNotificationStatus();
console.log('Notification status:', status);
// {
//   supported: true,
//   permission: 'granted',
//   subscribed: true,
//   canEnable: true
// }
```

**Backend debugging:**
```typescript
// In controller.ts, enable verbose logging
console.log('Subscriptions for user:', userSubscriptions);
console.log('Sending notification:', payload);
console.log('Result:', result);
```

**Check database subscriptions:**
```sql
SELECT
  u.email,
  ps.endpoint,
  ps.created_at
FROM push_subscriptions ps
JOIN users u ON ps.user_id = u.id
ORDER BY ps.created_at DESC;
```

## Security Considerations

### Best Practices

1. **Never expose private key**
   - Store VAPID private key in environment variables only
   - Never commit to version control
   - Use different keys per environment

2. **Validate user permissions**
   - Only send notifications to authorized users
   - Verify list membership before notifying
   - Authenticate all notification endpoints

3. **Rate limiting**
   - Implement rate limits on notification endpoints
   - Prevent spam and abuse
   - Consider notification frequency caps

4. **Data privacy**
   - Don't include sensitive data in notifications
   - Use generic messages with details only in app
   - Respect user notification preferences

5. **Subscription management**
   - Clean up expired subscriptions
   - Handle unsubscribe requests
   - Remove subscriptions on user deletion (handled by CASCADE)

### Production Checklist

- [ ] Generate unique VAPID keys for production
- [ ] Store keys in secure environment variables
- [ ] Enable HTTPS on your domain
- [ ] Configure proper CORS settings
- [ ] Set up monitoring for notification failures
- [ ] Implement notification preferences UI
- [ ] Test on multiple browsers and devices
- [ ] Configure push service retry logic
- [ ] Set up notification analytics (optional)
- [ ] Document notification types for users

## Additional Resources

- [Web Push Protocol](https://datatracker.ietf.org/doc/html/rfc8030)
- [Push API MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [web-push Node.js Library](https://github.com/web-push-libs/web-push)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [VAPID Specification](https://datatracker.ietf.org/doc/html/rfc8292)

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review browser console logs
3. Check server logs for errors
4. Verify database schema is up to date
5. Test with the `/api/notifications/test` endpoint

For additional help, refer to the main project documentation or open an issue.
