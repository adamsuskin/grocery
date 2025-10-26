/**
 * Push Notifications Utility
 *
 * Handles push notification subscriptions and messaging for real-time collaboration.
 * Uses the Web Push API and VAPID authentication.
 *
 * Features:
 * - Subscribe to push notifications
 * - Unsubscribe from push notifications
 * - Request notification permissions with user-friendly UI
 * - Send notifications via backend
 *
 * ## Usage
 * ```typescript
 * import { requestNotificationPermission, subscribeToPushNotifications } from './pushNotifications';
 *
 * // Request permission and subscribe
 * const permission = await requestNotificationPermission();
 * if (permission === 'granted') {
 *   await subscribeToPushNotifications();
 * }
 * ```
 */

// VAPID public key (placeholder - replace with your actual key)
// Generate using: npx web-push generate-vapid-keys
export const VAPID_PUBLIC_KEY =
  process.env.VITE_VAPID_PUBLIC_KEY ||
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

/**
 * Convert VAPID public key from base64 string to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if push notifications are supported in the browser
 */
export function isPushNotificationSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Get the current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isPushNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Check if user has already granted notification permission
 */
export function hasNotificationPermission(): boolean {
  return getNotificationPermission() === 'granted';
}

/**
 * Request notification permission from the user
 * Returns the permission status: 'granted', 'denied', or 'default'
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) {
    console.warn('Push notifications are not supported in this browser');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    console.warn('Notification permission was previously denied');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Register service worker for push notifications
 * Returns the service worker registration
 */
async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported in this browser');
  }

  try {
    // Register the service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service worker registered successfully:', registration);

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    throw error;
  }
}

/**
 * Subscribe to push notifications
 * This creates a push subscription and sends it to the backend
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) {
    throw new Error('Push notifications are not supported in this browser');
  }

  if (!hasNotificationPermission()) {
    throw new Error('Notification permission not granted. Request permission first.');
  }

  try {
    // Get or register the service worker
    const registration = await registerServiceWorker();

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      console.log('Already subscribed to push notifications');
      // Send existing subscription to backend to ensure it's saved
      await sendSubscriptionToBackend(subscription);
      return subscription;
    }

    // Create new subscription
    const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey as BufferSource,
    });

    console.log('Push subscription created:', subscription);

    // Send subscription to backend
    await sendSubscriptionToBackend(subscription);

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    throw error;
  }
}

/**
 * Unsubscribe from push notifications
 * This removes the push subscription and notifies the backend
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!isPushNotificationSupported()) {
    console.warn('Push notifications are not supported in this browser');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      console.log('No active push subscription found');
      return true;
    }

    // Unsubscribe from push manager
    const successful = await subscription.unsubscribe();

    if (successful) {
      console.log('Successfully unsubscribed from push notifications');

      // Notify backend to remove subscription
      await removeSubscriptionFromBackend(subscription);
    }

    return successful;
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
    return false;
  }
}

/**
 * Get the current push subscription if it exists
 */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch (error) {
    console.error('Failed to get current subscription:', error);
    return null;
  }
}

/**
 * Check if user is currently subscribed to push notifications
 */
export async function isSubscribedToPushNotifications(): Promise<boolean> {
  const subscription = await getCurrentSubscription();
  return subscription !== null;
}

/**
 * Send push subscription to backend
 * The backend stores this subscription to send push notifications later
 */
async function sendSubscriptionToBackend(subscription: PushSubscription): Promise<void> {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('User is not authenticated');
  }

  try {
    const response = await fetch(`${apiUrl}/api/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save subscription');
    }

    console.log('Subscription saved to backend');
  } catch (error) {
    console.error('Failed to send subscription to backend:', error);
    throw error;
  }
}

/**
 * Remove push subscription from backend
 */
async function removeSubscriptionFromBackend(subscription: PushSubscription): Promise<void> {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const token = localStorage.getItem('token');

  if (!token) {
    console.warn('User is not authenticated, skipping backend cleanup');
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/api/notifications/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
      }),
    });

    if (!response.ok) {
      console.warn('Failed to remove subscription from backend');
    }
  } catch (error) {
    console.error('Failed to remove subscription from backend:', error);
  }
}

/**
 * Test notification to verify setup
 * Sends a test notification from the backend
 */
export async function sendTestNotification(): Promise<boolean> {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('User is not authenticated');
  }

  try {
    const response = await fetch(`${apiUrl}/api/notifications/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send test notification');
    }

    return true;
  } catch (error) {
    console.error('Failed to send test notification:', error);
    throw error;
  }
}

/**
 * Show a local notification (doesn't require backend)
 * Useful for testing or immediate feedback
 */
export async function showLocalNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (!isPushNotificationSupported()) {
    console.warn('Notifications are not supported in this browser');
    return;
  }

  if (!hasNotificationPermission()) {
    console.warn('Notification permission not granted');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      ...options,
    });
  } catch (error) {
    console.error('Failed to show local notification:', error);
  }
}

/**
 * Notification event types for the application
 */
export enum NotificationEventType {
  ITEM_ADDED = 'item_added',
  ITEM_EDITED = 'item_edited',
  ITEM_DELETED = 'item_deleted',
  ITEM_CHECKED = 'item_checked',
  LIST_SHARED = 'list_shared',
  BUDGET_WARNING = 'budget_warning',
  BUDGET_EXCEEDED = 'budget_exceeded',
  SYNC_CONFLICT = 'sync_conflict',
  PERMISSION_CHANGED = 'permission_changed',
}

/**
 * Helper to get user-friendly notification settings status
 */
export interface NotificationStatus {
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
  canEnable: boolean;
}

/**
 * Get comprehensive notification status
 */
export async function getNotificationStatus(): Promise<NotificationStatus> {
  const supported = isPushNotificationSupported();
  const permission = getNotificationPermission();
  const subscribed = await isSubscribedToPushNotifications();
  const canEnable = supported && (permission === 'default' || permission === 'granted');

  return {
    supported,
    permission,
    subscribed,
    canEnable,
  };
}
