/**
 * Notification Types
 *
 * Type definitions for push notification system
 */

/**
 * Type of notification event
 */
export enum NotificationType {
  // Item events
  ITEM_ADDED = 'item_added',
  ITEM_EDITED = 'item_edited',
  ITEM_DELETED = 'item_deleted',
  ITEM_CHECKED = 'item_checked',
  ITEM_UNCHECKED = 'item_unchecked',

  // List events
  LIST_SHARED = 'list_shared',
  LIST_UPDATED = 'list_updated',
  LIST_DELETED = 'list_deleted',

  // Collaboration events
  MEMBER_ADDED = 'member_added',
  MEMBER_REMOVED = 'member_removed',
  PERMISSION_CHANGED = 'permission_changed',

  // Budget events
  BUDGET_WARNING = 'budget_warning',
  BUDGET_EXCEEDED = 'budget_exceeded',

  // Sync events
  SYNC_CONFLICT = 'sync_conflict',

  // Category events
  CATEGORY_CREATED = 'category_created',
  CATEGORY_EDITED = 'category_edited',
  CATEGORY_DELETED = 'category_deleted',
  CATEGORY_LOCKED = 'category_locked',
  CATEGORY_UNLOCKED = 'category_unlocked',

  // Category suggestion events
  CATEGORY_SUGGESTED = 'category_suggested',
  CATEGORY_SUGGESTION_APPROVED = 'category_suggestion_approved',
  CATEGORY_SUGGESTION_REJECTED = 'category_suggestion_rejected',

  // Category discussion events
  CATEGORY_COMMENT_ADDED = 'category_comment_added',
  CATEGORY_VOTED = 'category_voted',
}

/**
 * Push subscription from the browser
 */
export interface PushSubscriptionData {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Push subscription database record
 */
export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  expiration_time: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Input for creating a push subscription
 */
export interface CreatePushSubscriptionInput {
  userId: string;
  subscription: PushSubscriptionData;
}

/**
 * Notification payload for sending push notifications
 */
export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  tag?: string;
  requireInteraction?: boolean;
}

/**
 * Input for sending a notification
 */
export interface SendNotificationInput {
  userId: string;
  payload: NotificationPayload;
}

/**
 * Input for sending notifications to multiple users
 */
export interface SendBulkNotificationInput {
  userIds: string[];
  payload: NotificationPayload;
}

/**
 * Notification data for specific event types
 */
export interface ItemNotificationData {
  listId: string;
  listName: string;
  itemName: string;
  actorName: string;
  actorId: string;
}

export interface ListNotificationData {
  listId: string;
  listName: string;
  actorName: string;
  actorId: string;
}

export interface BudgetNotificationData {
  listId: string;
  listName: string;
  budget: number;
  spent: number;
  percentUsed: number;
}

export interface ConflictNotificationData {
  listId: string;
  listName: string;
  itemId: string;
  itemName: string;
}

export interface CategoryNotificationData {
  listId: string;
  listName: string;
  categoryName: string;
  categoryId: string;
  actorName: string;
  actorId: string;
}

export interface CategorySuggestionNotificationData {
  listId: string;
  listName: string;
  suggestionId: string;
  categoryName: string;
  suggestedBy: string;
  suggesterName: string;
  reviewedBy?: string;
  reviewerName?: string;
}

export interface CategoryCommentNotificationData {
  listId: string;
  listName: string;
  categoryId: string;
  categoryName: string;
  commentText: string;
  actorName: string;
  actorId: string;
}

/**
 * Notification template helpers
 */
export interface NotificationTemplate {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  requireInteraction?: boolean;
}

/**
 * Response from notification send operation
 */
export interface NotificationSendResult {
  success: boolean;
  sent: number;
  failed: number;
  errors?: string[];
}
