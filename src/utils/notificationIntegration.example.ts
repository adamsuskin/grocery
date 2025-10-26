/**
 * Notification Integration Examples
 *
 * This file demonstrates how to integrate push notifications
 * into your grocery list application components.
 */

import {
  notifyListMembers,
  createItemNotification,
  createListNotification,
  createBudgetNotification,
  createConflictNotification,
  sendNotificationToUser,
} from '../../server/notifications/controller';
import { NotificationType } from '../../server/notifications/types';

/**
 * Example 1: Notify when a user adds an item
 *
 * Call this after successfully adding an item to a shared list
 */
export async function notifyItemAdded(
  listId: string,
  listName: string,
  itemName: string,
  actorName: string,
  actorId: string
) {
  const payload = createItemNotification(NotificationType.ITEM_ADDED, {
    listId,
    listName,
    itemName,
    actorName,
    actorId,
  });

  // Notify all list members except the one who added the item
  await notifyListMembers(listId, payload, actorId);
}

/**
 * Example 2: Notify when a user edits an item
 */
export async function notifyItemEdited(
  listId: string,
  listName: string,
  itemName: string,
  actorName: string,
  actorId: string
) {
  const payload = createItemNotification(NotificationType.ITEM_EDITED, {
    listId,
    listName,
    itemName,
    actorName,
    actorId,
  });

  await notifyListMembers(listId, payload, actorId);
}

/**
 * Example 3: Notify when a user deletes an item
 */
export async function notifyItemDeleted(
  listId: string,
  listName: string,
  itemName: string,
  actorName: string,
  actorId: string
) {
  const payload = createItemNotification(NotificationType.ITEM_DELETED, {
    listId,
    listName,
    itemName,
    actorName,
    actorId,
  });

  await notifyListMembers(listId, payload, actorId);
}

/**
 * Example 4: Notify when a user checks off an item
 */
export async function notifyItemChecked(
  listId: string,
  listName: string,
  itemName: string,
  actorName: string,
  actorId: string
) {
  const payload = createItemNotification(NotificationType.ITEM_CHECKED, {
    listId,
    listName,
    itemName,
    actorName,
    actorId,
  });

  await notifyListMembers(listId, payload, actorId);
}

/**
 * Example 5: Notify when a list is shared
 */
export async function notifyListShared(
  listId: string,
  listName: string,
  newMemberId: string,
  actorName: string,
  actorId: string
) {
  const payload = createListNotification(NotificationType.LIST_SHARED, {
    listId,
    listName,
    actorName,
    actorId,
  });

  // Send to the new member only
  await sendNotificationToUser(newMemberId, payload);
}

/**
 * Example 6: Notify when permissions change
 */
export async function notifyPermissionChanged(
  listId: string,
  listName: string,
  affectedUserId: string,
  actorName: string,
  actorId: string
) {
  const payload = createListNotification(NotificationType.PERMISSION_CHANGED, {
    listId,
    listName,
    actorName,
    actorId,
  });

  // Send to the user whose permissions changed
  await sendNotificationToUser(affectedUserId, payload);
}

/**
 * Example 7: Notify when budget warning threshold is reached
 */
export async function notifyBudgetWarning(
  userId: string,
  listId: string,
  listName: string,
  budget: number,
  spent: number
) {
  const percentUsed = (spent / budget) * 100;

  const payload = createBudgetNotification(NotificationType.BUDGET_WARNING, {
    listId,
    listName,
    budget,
    spent,
    percentUsed,
  });

  await sendNotificationToUser(userId, payload);
}

/**
 * Example 8: Notify when budget is exceeded
 */
export async function notifyBudgetExceeded(
  userId: string,
  listId: string,
  listName: string,
  budget: number,
  spent: number
) {
  const percentUsed = (spent / budget) * 100;

  const payload = createBudgetNotification(NotificationType.BUDGET_EXCEEDED, {
    listId,
    listName,
    budget,
    spent,
    percentUsed,
  });

  await sendNotificationToUser(userId, payload);
}

/**
 * Example 9: Notify when a sync conflict occurs
 */
export async function notifySyncConflict(
  userId: string,
  listId: string,
  listName: string,
  itemId: string,
  itemName: string
) {
  const payload = createConflictNotification({
    listId,
    listName,
    itemId,
    itemName,
  });

  await sendNotificationToUser(userId, payload);
}

/**
 * Example 10: Budget monitoring integration
 *
 * Call this function after adding or updating an item with a price
 */
export async function checkBudgetAndNotify(
  userId: string,
  listId: string,
  listName: string,
  budget: number,
  totalSpent: number,
  previousSpent: number
) {
  const percentUsed = (totalSpent / budget) * 100;
  const previousPercentUsed = (previousSpent / budget) * 100;

  // Notify on budget warning (80% threshold)
  if (percentUsed >= 80 && previousPercentUsed < 80) {
    await notifyBudgetWarning(userId, listId, listName, budget, totalSpent);
  }

  // Notify on budget exceeded (100% threshold)
  if (percentUsed >= 100 && previousPercentUsed < 100) {
    await notifyBudgetExceeded(userId, listId, listName, budget, totalSpent);
  }
}

/**
 * Example 11: Integration with item mutation
 *
 * This shows how to add notifications to your existing mutations
 */
export async function addItemWithNotification(
  listId: string,
  itemData: {
    name: string;
    quantity: number;
    category: string;
    notes?: string;
    price?: number;
  },
  user: {
    id: string;
    name: string;
  }
) {
  // 1. Add the item to the database (your existing logic)
  // const newItem = await addItemToDatabase(listId, itemData, user.id);

  // 2. Get list details
  // const list = await getListById(listId);

  // 3. Send notification to other list members
  await notifyItemAdded(
    listId,
    'List Name', // Replace with actual list name
    itemData.name,
    user.name,
    user.id
  );

  // 4. Check budget if price was added
  if (itemData.price) {
    // const totalSpent = await calculateTotalSpent(listId);
    // const budget = list.budget;
    // await checkBudgetAndNotify(
    //   user.id,
    //   listId,
    //   list.name,
    //   budget,
    //   totalSpent,
    //   totalSpent - (itemData.price * itemData.quantity)
    // );
  }

  // return newItem;
}

/**
 * Example 12: Frontend usage - Request notification permission
 */
export async function setupNotificationsInApp() {
  // In your App.tsx or main component:
  /*
  import { NotificationPrompt } from './components/NotificationPrompt';
  import { subscribeToPushNotifications, hasNotificationPermission } from './utils/pushNotifications';

  function App() {
    useEffect(() => {
      // Check if already subscribed
      if (hasNotificationPermission()) {
        subscribeToPushNotifications().catch(console.error);
      }
    }, []);

    return (
      <div>
        <NotificationPrompt
          onEnabled={() => console.log('Notifications enabled!')}
          onDismissed={() => console.log('User dismissed prompt')}
        />
        {/* Rest of your app }
      </div>
    );
  }
  */
}

/**
 * Example 13: Manual notification trigger from settings
 */
export async function enableNotificationsFromSettings() {
  // In your settings/preferences page:
  /*
  import { requestNotificationPermission, subscribeToPushNotifications } from './utils/pushNotifications';

  async function handleEnableNotifications() {
    try {
      const permission = await requestNotificationPermission();

      if (permission === 'granted') {
        await subscribeToPushNotifications();
        alert('Notifications enabled successfully!');
      } else {
        alert('Notification permission denied');
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      alert('Failed to enable notifications');
    }
  }

  return (
    <button onClick={handleEnableNotifications}>
      Enable Push Notifications
    </button>
  );
  */
}

/**
 * Example 14: Check notification status in UI
 */
export async function displayNotificationStatus() {
  /*
  import { getNotificationStatus } from './utils/pushNotifications';

  function NotificationSettings() {
    const [status, setStatus] = useState(null);

    useEffect(() => {
      getNotificationStatus().then(setStatus);
    }, []);

    if (!status) return <div>Loading...</div>;

    return (
      <div>
        <h3>Notification Status</h3>
        <p>Supported: {status.supported ? 'Yes' : 'No'}</p>
        <p>Permission: {status.permission}</p>
        <p>Subscribed: {status.subscribed ? 'Yes' : 'No'}</p>
        {status.canEnable && (
          <button>Enable Notifications</button>
        )}
      </div>
    );
  }
  */
}
