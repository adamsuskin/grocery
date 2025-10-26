/**
 * NotificationContext - Manages notifications for list sharing events
 *
 * This context provides centralized notification management for list sharing activities.
 * It integrates with Zero to listen for real-time list membership changes and displays
 * toast-style notifications to users when they are shared with a list, permission changes,
 * or removed from a list.
 *
 * ## Features
 * - Real-time notification triggers via Zero queries
 * - Toast-style notifications that auto-dismiss after 5 seconds
 * - Support for multiple notifications (stacking)
 * - Notification types: list_shared, permission_changed, list_removed
 *
 * ## Usage
 * ```tsx
 * import { useNotification } from './contexts/NotificationContext';
 *
 * function MyComponent() {
 *   const { notify } = useNotification();
 *
 *   const handleShare = async () => {
 *     // Share list...
 *     notify({
 *       type: 'list_shared',
 *       message: 'User shared "Grocery List" with you',
 *       listId: 'list-123',
 *       listName: 'Grocery List',
 *       actorName: 'John Doe',
 *       actorId: 'user-123'
 *     });
 *   };
 * }
 * ```
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { getZeroInstance } from '../zero-store';
import { useQuery } from '@rocicorp/zero/react';
import type { Notification, CreateNotificationInput } from '../types';
import { nanoid } from 'nanoid';

// Notification context state
export interface NotificationContextState {
  notifications: Notification[];
  unreadCount: number;
}

// Notification context value with methods
export interface NotificationContextValue extends NotificationContextState {
  notify: (input: CreateNotificationInput) => void;
  dismissNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

// Create the context
const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

// Provider component
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user, isAuthenticated } = useAuth();
  const zero = getZeroInstance();

  // Track previous list memberships to detect changes
  const previousMembershipsRef = useRef<Map<string, string>>(new Map());

  // Query list memberships for the current user
  // This allows us to detect when user is added/removed from lists or permissions change
  const membershipQuery = useQuery(
    user ? zero.query.list_members.where('user_id', user.id) : zero.query.list_members.where('id', 'never-match')
  );

  // Query all lists to get list names for notifications
  const listsQuery = useQuery(
    zero.query.lists
  );

  // Create a map of list IDs to list names for quick lookup
  const listNamesMap = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    listNamesMap.current.clear();
    listsQuery.forEach(list => {
      listNamesMap.current.set(list.id, list.name);
    });
  }, [listsQuery]);

  // Monitor list membership changes for real-time notifications
  useEffect(() => {
    if (!user || !isAuthenticated) {
      // Clear notifications when logged out
      setNotifications([]);
      previousMembershipsRef.current.clear();
      return;
    }

    // Create a map of current memberships: listId -> permission
    const currentMemberships = new Map<string, { permission: string; addedBy: string }>();
    membershipQuery.forEach(membership => {
      currentMemberships.set(membership.list_id, {
        permission: membership.permission,
        addedBy: membership.added_by,
      });
    });

    // Check for new memberships (user was added to a list)
    currentMemberships.forEach((data, listId) => {
      const previousData = previousMembershipsRef.current.get(listId);

      if (!previousData) {
        // New membership - user was added to a list
        const listName = listNamesMap.current.get(listId) || 'Unknown List';

        // Only notify if the user wasn't the one who added themselves (i.e., not the list creator)
        if (data.addedBy !== user.id) {
          notify({
            type: 'list_shared',
            message: `You have been added to "${listName}"`,
            listId,
            listName,
            actorName: 'Someone', // In a real app, fetch actor name from users table
            actorId: data.addedBy,
          });
        }
      } else if (previousData !== data.permission) {
        // Permission changed
        const listName = listNamesMap.current.get(listId) || 'Unknown List';
        notify({
          type: 'permission_changed',
          message: `Your permission for "${listName}" changed to ${data.permission}`,
          listId,
          listName,
          actorName: 'Someone',
          actorId: data.addedBy,
        });
      }
    });

    // Check for removed memberships (user was removed from a list)
    previousMembershipsRef.current.forEach((_permission, listId) => {
      if (!currentMemberships.has(listId)) {
        // User was removed from the list
        const listName = listNamesMap.current.get(listId) || 'Unknown List';
        notify({
          type: 'list_removed',
          message: `You have been removed from "${listName}"`,
          listId,
          listName,
          actorName: 'Someone',
          actorId: 'unknown',
        });
      }
    });

    // Update previous memberships for next comparison
    previousMembershipsRef.current.clear();
    currentMemberships.forEach((data, listId) => {
      previousMembershipsRef.current.set(listId, data.permission);
    });
  }, [membershipQuery, user, isAuthenticated]);

  // Add a new notification
  const notify = useCallback((input: CreateNotificationInput) => {
    const notification: Notification = {
      id: nanoid(),
      type: input.type,
      message: input.message,
      listId: input.listId,
      listName: input.listName,
      actorName: input.actorName,
      actorId: input.actorId,
      timestamp: Date.now(),
      read: false,
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      dismissNotification(notification.id);
    }, 5000);
  }, []);

  // Dismiss a notification (remove from list)
  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Mark a notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  const value: NotificationContextValue = {
    notifications,
    unreadCount,
    notify,
    dismissNotification,
    markAsRead,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Custom hook to use notification context
 * @throws Error if used outside of NotificationProvider
 */
export function useNotification(): NotificationContextValue {
  const context = useContext(NotificationContext);

  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }

  return context;
}
