/**
 * Service Worker for Push Notifications
 *
 * Handles incoming push notifications and notification click events
 */

// Listen for push events
self.addEventListener('push', function(event) {
  console.log('Push notification received:', event);

  if (!event.data) {
    console.warn('Push event has no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('Push data:', data);

    const title = data.title || 'Grocery List';
    const options = {
      body: data.body || 'You have a new notification',
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/badge-72.png',
      tag: data.tag || 'default',
      requireInteraction: data.requireInteraction || false,
      data: data.data || {},
      vibrate: [200, 100, 200],
      actions: [
        {
          action: 'open',
          title: 'View',
          icon: '/icons/view.png'
        },
        {
          action: 'close',
          title: 'Dismiss',
          icon: '/icons/close.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('Error processing push event:', error);
  }
});

// Listen for notification click events
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'close') {
    // User clicked dismiss, just close the notification
    return;
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }

      // Otherwise, open a new window
      if (clients.openWindow) {
        const urlToOpen = event.notification.data?.url || '/';
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Listen for notification close events
self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event);

  // Optional: Track notification dismissals
  const notification = event.notification;
  const data = notification.data;

  // You could send analytics here if needed
  if (data && data.trackDismissal) {
    console.log('User dismissed notification:', data);
  }
});

// Listen for push subscription change events
self.addEventListener('pushsubscriptionchange', function(event) {
  console.log('Push subscription changed:', event);

  // Handle subscription renewal
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: self.vapidPublicKey
    }).then(function(subscription) {
      console.log('Renewed subscription:', subscription);

      // Send new subscription to backend
      return fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      });
    }).catch(function(error) {
      console.error('Failed to renew subscription:', error);
    })
  );
});

// Service worker activation
self.addEventListener('activate', function(event) {
  console.log('Service worker activated');
  event.waitUntil(self.clients.claim());
});

// Service worker installation
self.addEventListener('install', function(event) {
  console.log('Service worker installed');
  self.skipWaiting();
});

console.log('Service worker script loaded');
