# Push Notifications Quick Start

Get push notifications working in 5 minutes!

## 1. Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

Copy the output keys.

## 2. Configure Environment Variables

Create/update `server/.env`:

```env
VAPID_PUBLIC_KEY=<your_public_key>
VAPID_PRIVATE_KEY=<your_private_key>
VAPID_SUBJECT=mailto:your-email@example.com
```

Create/update `.env` (frontend):

```env
VITE_VAPID_PUBLIC_KEY=<same_public_key_as_above>
VITE_API_URL=http://localhost:3001
```

## 3. Install Dependencies

```bash
# Install web-push for backend
cd server
npm install web-push@^3.6.7

# Or use pnpm from project root
cd ..
pnpm install
```

## 4. Update Database

Run the schema update to create the `push_subscriptions` table:

```bash
npm run db:init
# or
psql -h localhost -U grocery -d grocery_db -f server/db/schema.sql
```

## 5. Start the Application

```bash
# Start everything
npm run dev:all

# Or separately:
# Terminal 1: Database
npm run db:up

# Terminal 2: Backend
npm run server:dev

# Terminal 3: Frontend
npm run dev
```

## 6. Test Notifications

1. Open http://localhost:5173
2. Log in or create an account
3. Wait for notification prompt (or trigger it from settings)
4. Click "Allow Notifications"
5. Grant permission in browser

Test with curl:

```bash
# Get your token (from browser localStorage or login response)
TOKEN="your_jwt_token"

# Send test notification
curl -X POST http://localhost:3001/api/notifications/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

You should see a notification!

## 7. Add Notification Prompt to Your App

In your main App component:

```tsx
import { NotificationPrompt } from './components/NotificationPrompt';

function App() {
  return (
    <div>
      <NotificationPrompt />
      {/* Your app content */}
    </div>
  );
}
```

## Notification Event Types

The system will automatically send notifications for:

- ✅ Item added to shared list
- ✏️ Item edited in shared list
- ❌ Item deleted from shared list
- ☑️ Item checked off
- 🔗 List shared with you
- 🔑 Your permissions changed
- 💰 Budget warning (80% used)
- 💸 Budget exceeded
- ⚠️ Sync conflict detected

## Integration Example

To send notifications from your code:

```typescript
import { notifyListMembers, createItemNotification } from '../server/notifications/controller';
import { NotificationType } from '../server/notifications/types';

// After adding an item
const payload = createItemNotification(NotificationType.ITEM_ADDED, {
  listId: 'list-123',
  listName: 'Groceries',
  itemName: 'Milk',
  actorName: 'John',
  actorId: 'user-456'
});

await notifyListMembers('list-123', payload, 'user-456');
```

## Troubleshooting

**Notifications not appearing?**

1. Check browser console for errors
2. Verify VAPID keys match in frontend and backend
3. Ensure service worker is registered (check DevTools → Application → Service Workers)
4. Check notification permission in browser settings
5. Make sure `push_subscriptions` table exists

**VAPID keys mismatch?**

```bash
# Frontend
echo $VITE_VAPID_PUBLIC_KEY

# Backend
echo $VAPID_PUBLIC_KEY

# Should be identical!
```

**Service worker not found?**

Make sure `public/sw.js` exists and is accessible at `/sw.js`

**Database table missing?**

```bash
psql -h localhost -U grocery -d grocery_db -c "\d push_subscriptions"
```

If not found, run the schema:
```bash
npm run db:init
```

## Next Steps

- See [PUSH_NOTIFICATIONS_SETUP.md](./PUSH_NOTIFICATIONS_SETUP.md) for complete documentation
- Check [notificationIntegration.example.ts](../src/utils/notificationIntegration.example.ts) for integration examples
- Customize notification messages in `server/notifications/controller.ts`
- Add notification preferences UI for users

## Production Checklist

Before deploying:

- [ ] Generate production VAPID keys (different from dev)
- [ ] Set environment variables on production server
- [ ] Enable HTTPS (required for push notifications)
- [ ] Test on multiple browsers
- [ ] Configure notification icons
- [ ] Set up error monitoring
- [ ] Implement notification preferences

## Need Help?

- Check the [full documentation](./PUSH_NOTIFICATIONS_SETUP.md)
- Review browser console logs
- Check server logs for errors
- Verify database schema is current
