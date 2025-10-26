/**
 * Notifications Controller
 *
 * Handles push notification subscriptions and sending notifications
 * Uses web-push library for sending push notifications via VAPID
 */

import { Request, Response, NextFunction } from 'express';
import webpush from 'web-push';
import { pool } from '../config/db';
import { asyncHandler } from '../middleware/errorHandler';
import {
  PushSubscriptionData,
  NotificationPayload,
  NotificationType,
  ItemNotificationData,
  ListNotificationData,
  BudgetNotificationData,
  ConflictNotificationData,
} from './types';

/**
 * Configure web-push with VAPID keys
 * These should be set in environment variables
 */
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@grocery-list.app';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} else {
  console.warn('VAPID keys not configured. Push notifications will not work.');
  console.warn('Generate keys with: npx web-push generate-vapid-keys');
}

/**
 * Subscribe to push notifications
 * POST /api/notifications/subscribe
 */
export const subscribe = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'User not authenticated',
    });
  }

  const { subscription } = req.body as { subscription: PushSubscriptionData };

  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return res.status(400).json({
      success: false,
      error: 'Invalid subscription',
      message: 'Valid push subscription required',
    });
  }

  try {
    // Check if subscription already exists
    const existingQuery = `
      SELECT id FROM push_subscriptions
      WHERE user_id = $1 AND endpoint = $2
    `;
    const existingResult = await pool.query(existingQuery, [userId, subscription.endpoint]);

    if (existingResult.rows.length > 0) {
      // Update existing subscription
      const updateQuery = `
        UPDATE push_subscriptions
        SET p256dh_key = $1,
            auth_key = $2,
            expiration_time = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $4 AND endpoint = $5
        RETURNING id
      `;

      await pool.query(updateQuery, [
        subscription.keys.p256dh,
        subscription.keys.auth,
        subscription.expirationTime,
        userId,
        subscription.endpoint,
      ]);

      return res.status(200).json({
        success: true,
        message: 'Subscription updated successfully',
      });
    }

    // Create new subscription
    const insertQuery = `
      INSERT INTO push_subscriptions (
        user_id, endpoint, p256dh_key, auth_key, expiration_time
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

    const result = await pool.query(insertQuery, [
      userId,
      subscription.endpoint,
      subscription.keys.p256dh,
      subscription.keys.auth,
      subscription.expirationTime,
    ]);

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      subscriptionId: result.rows[0].id,
    });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to save push subscription',
    });
  }
});

/**
 * Unsubscribe from push notifications
 * POST /api/notifications/unsubscribe
 */
export const unsubscribe = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'User not authenticated',
    });
  }

  const { endpoint } = req.body;

  if (!endpoint) {
    return res.status(400).json({
      success: false,
      error: 'Invalid request',
      message: 'Subscription endpoint required',
    });
  }

  try {
    const deleteQuery = `
      DELETE FROM push_subscriptions
      WHERE user_id = $1 AND endpoint = $2
      RETURNING id
    `;

    const result = await pool.query(deleteQuery, [userId, endpoint]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Subscription not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Subscription removed successfully',
    });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to remove push subscription',
    });
  }
});

/**
 * Send a test notification
 * POST /api/notifications/test
 */
export const sendTestNotification = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'User not authenticated',
    });
  }

  const payload: NotificationPayload = {
    type: NotificationType.ITEM_ADDED,
    title: 'Test Notification',
    body: 'This is a test notification from your Grocery List app!',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: 'test',
  };

  try {
    const result = await sendNotificationToUser(userId, payload);

    if (result.sent > 0) {
      res.status(200).json({
        success: true,
        message: 'Test notification sent successfully',
        result,
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'No subscriptions',
        message: 'No active push subscriptions found for this user',
      });
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to send test notification',
    });
  }
});

/**
 * Helper: Send notification to a single user
 */
export async function sendNotificationToUser(
  userId: string,
  payload: NotificationPayload
): Promise<{ success: boolean; sent: number; failed: number; errors?: string[] }> {
  // Get all subscriptions for the user
  const query = `
    SELECT endpoint, p256dh_key, auth_key
    FROM push_subscriptions
    WHERE user_id = $1
  `;

  const result = await pool.query(query, [userId]);

  if (result.rows.length === 0) {
    return { success: false, sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  // Send to all user's subscriptions
  for (const sub of result.rows) {
    try {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh_key,
          auth: sub.auth_key,
        },
      };

      await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
      sent++;
    } catch (error: any) {
      failed++;
      errors.push(`Failed to send to ${sub.endpoint}: ${error.message}`);

      // If subscription is invalid/expired, remove it
      if (error.statusCode === 410 || error.statusCode === 404) {
        try {
          await pool.query(
            'DELETE FROM push_subscriptions WHERE endpoint = $1',
            [sub.endpoint]
          );
          console.log(`Removed expired subscription: ${sub.endpoint}`);
        } catch (deleteError) {
          console.error('Error removing expired subscription:', deleteError);
        }
      }
    }
  }

  return { success: sent > 0, sent, failed, errors: errors.length > 0 ? errors : undefined };
}

/**
 * Helper: Send notification to multiple users
 */
export async function sendNotificationToUsers(
  userIds: string[],
  payload: NotificationPayload
): Promise<{ success: boolean; sent: number; failed: number; errors?: string[] }> {
  let totalSent = 0;
  let totalFailed = 0;
  const allErrors: string[] = [];

  for (const userId of userIds) {
    const result = await sendNotificationToUser(userId, payload);
    totalSent += result.sent;
    totalFailed += result.failed;
    if (result.errors) {
      allErrors.push(...result.errors);
    }
  }

  return {
    success: totalSent > 0,
    sent: totalSent,
    failed: totalFailed,
    errors: allErrors.length > 0 ? allErrors : undefined,
  };
}

/**
 * Helper: Create notification for item events
 */
export function createItemNotification(
  type: NotificationType,
  data: ItemNotificationData
): NotificationPayload {
  let title = '';
  let body = '';

  switch (type) {
    case NotificationType.ITEM_ADDED:
      title = `New item in ${data.listName}`;
      body = `${data.actorName} added "${data.itemName}"`;
      break;
    case NotificationType.ITEM_EDITED:
      title = `Item updated in ${data.listName}`;
      body = `${data.actorName} edited "${data.itemName}"`;
      break;
    case NotificationType.ITEM_DELETED:
      title = `Item removed from ${data.listName}`;
      body = `${data.actorName} deleted "${data.itemName}"`;
      break;
    case NotificationType.ITEM_CHECKED:
      title = `Item checked in ${data.listName}`;
      body = `${data.actorName} checked off "${data.itemName}"`;
      break;
    case NotificationType.ITEM_UNCHECKED:
      title = `Item unchecked in ${data.listName}`;
      body = `${data.actorName} unchecked "${data.itemName}"`;
      break;
    default:
      title = `Update in ${data.listName}`;
      body = `${data.actorName} made changes to "${data.itemName}"`;
  }

  return {
    type,
    title,
    body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: `item-${data.itemName}`,
    data: {
      listId: data.listId,
      actorId: data.actorId,
    },
  };
}

/**
 * Helper: Create notification for list events
 */
export function createListNotification(
  type: NotificationType,
  data: ListNotificationData
): NotificationPayload {
  let title = '';
  let body = '';

  switch (type) {
    case NotificationType.LIST_SHARED:
      title = 'New shared list';
      body = `${data.actorName} shared "${data.listName}" with you`;
      break;
    case NotificationType.LIST_UPDATED:
      title = 'List updated';
      body = `${data.actorName} updated "${data.listName}"`;
      break;
    case NotificationType.PERMISSION_CHANGED:
      title = 'Permissions changed';
      body = `Your permissions for "${data.listName}" have been updated`;
      break;
    default:
      title = 'List update';
      body = `${data.actorName} made changes to "${data.listName}"`;
  }

  return {
    type,
    title,
    body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: `list-${data.listId}`,
    data: {
      listId: data.listId,
      actorId: data.actorId,
    },
    requireInteraction: type === NotificationType.LIST_SHARED,
  };
}

/**
 * Helper: Create notification for budget events
 */
export function createBudgetNotification(
  type: NotificationType,
  data: BudgetNotificationData
): NotificationPayload {
  let title = '';
  let body = '';

  switch (type) {
    case NotificationType.BUDGET_WARNING:
      title = `Budget Alert: ${data.listName}`;
      body = `You've used ${data.percentUsed}% of your budget ($${data.spent.toFixed(2)} of $${data.budget.toFixed(2)})`;
      break;
    case NotificationType.BUDGET_EXCEEDED:
      title = `Budget Exceeded: ${data.listName}`;
      body = `You're over budget! Spent $${data.spent.toFixed(2)} of $${data.budget.toFixed(2)} (${data.percentUsed}%)`;
      break;
    default:
      title = `Budget update: ${data.listName}`;
      body = `Budget status: $${data.spent.toFixed(2)} of $${data.budget.toFixed(2)}`;
  }

  return {
    type,
    title,
    body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: `budget-${data.listId}`,
    data: {
      listId: data.listId,
      budget: data.budget,
      spent: data.spent,
    },
    requireInteraction: type === NotificationType.BUDGET_EXCEEDED,
  };
}

/**
 * Helper: Create notification for sync conflicts
 */
export function createConflictNotification(
  data: ConflictNotificationData
): NotificationPayload {
  return {
    type: NotificationType.SYNC_CONFLICT,
    title: `Sync Conflict: ${data.listName}`,
    body: `There's a conflict with "${data.itemName}". Please review and resolve.`,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: `conflict-${data.itemId}`,
    data: {
      listId: data.listId,
      itemId: data.itemId,
    },
    requireInteraction: true,
  };
}

/**
 * Helper: Notify list members about an event (except the actor)
 */
export async function notifyListMembers(
  listId: string,
  payload: NotificationPayload,
  excludeUserId?: string
): Promise<{ success: boolean; sent: number; failed: number }> {
  try {
    // Get all members of the list
    const query = `
      SELECT user_id
      FROM list_members
      WHERE list_id = $1
      ${excludeUserId ? 'AND user_id != $2' : ''}
    `;

    const params = excludeUserId ? [listId, excludeUserId] : [listId];
    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return { success: false, sent: 0, failed: 0 };
    }

    const userIds = result.rows.map(row => row.user_id);
    const notificationResult = await sendNotificationToUsers(userIds, payload);

    return notificationResult;
  } catch (error) {
    console.error('Error notifying list members:', error);
    return { success: false, sent: 0, failed: 0 };
  }
}
