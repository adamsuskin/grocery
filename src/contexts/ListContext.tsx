/**
 * ListContext - Manages active grocery list state and permissions
 *
 * This context provides centralized state management for the currently active grocery list,
 * including user permissions and helper functions for permission checks.
 *
 * ## Current Implementation
 * - Creates a virtual "default list" for each authenticated user
 * - Automatically manages list state based on auth state
 * - Persists active list ID to localStorage
 * - Provides permission checking helpers
 *
 * ## Future Implementation (when list sharing is added)
 * - Query actual list data from Zero's lists and list_members tables
 * - Support multiple lists per user
 * - Handle shared lists with different permission levels
 * - Real-time sync of list membership changes
 *
 * ## Usage
 * ```tsx
 * import { useList, useCanEditList } from './contexts/ListContext';
 *
 * function MyComponent() {
 *   const { currentList, userPermission } = useList();
 *   const canEdit = useCanEditList();
 *
 *   if (canEdit) {
 *     // Show edit controls
 *   }
 * }
 * ```
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import type { ListMember as ListMemberType } from '../types';

// Storage key for persisting active list
const LIST_STORAGE_KEY = 'grocery_active_list_id';

// Permission levels for list members
export type ListPermission = 'owner' | 'editor' | 'viewer';

// Re-export ListMember from types for backwards compatibility
export type ListMember = ListMemberType;

// List interface
export interface GroceryList {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  color: string;
  icon: string;
  members: ListMember[];
  createdAt: number;
  updatedAt: number;
  budget?: number;
  currency?: string;
}

// List context state
export interface ListContextState {
  activeListId: string | null;
  currentList: GroceryList | null;
  userPermission: ListPermission | null;
  loading: boolean;
  error: string | null;
}

// List context value with methods
export interface ListContextValue extends ListContextState {
  setActiveList: (listId: string | null) => void;
  canEdit: () => boolean;
  canManage: () => boolean;
  isListMember: () => boolean;
  refreshList: () => Promise<void>;
  clearError: () => void;
}

// Storage utility functions
const storage = {
  get: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },
  set: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
};

// Create the context
const ListContext = createContext<ListContextValue | undefined>(undefined);

// Initial state
const initialState: ListContextState = {
  activeListId: null,
  currentList: null,
  userPermission: null,
  loading: true,
  error: null,
};

// Provider component
export function ListProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ListContextState>(initialState);
  const { user, isAuthenticated } = useAuth();

  // Load active list ID from storage on mount
  useEffect(() => {
    const storedListId = storage.get(LIST_STORAGE_KEY);
    if (storedListId) {
      setState(prev => ({ ...prev, activeListId: storedListId }));
    }
  }, []);

  // For now, create a virtual "default list" for each user
  // This will be replaced with actual list queries when list sharing is implemented
  // In the future, this would query the lists and list_members tables from Zero
  const currentList = useMemo<GroceryList | null>(() => {
    if (!user) return null;

    // Create a default list for the current user
    // In a future implementation with shared lists, this would query actual list data
    // and fetch user details from the Zero users table
    return {
      id: `user-list-${user.id}`,
      name: 'My Grocery List',
      ownerId: user.id,
      ownerName: user.name || user.email,
      color: '#4CAF50',
      icon: '🛒',
      members: [
        {
          id: `member-${user.id}`,
          listId: `user-list-${user.id}`,
          userId: user.id,
          userName: user.name || user.email,
          userEmail: user.email,
          permission: 'owner',
          addedAt: user.createdAt,
          addedBy: user.id,
          updatedAt: user.createdAt,
        },
      ],
      createdAt: user.createdAt,
      updatedAt: user.createdAt,
    };
  }, [user]);

  // Determine user's permission level for the current list
  const userPermission = useMemo<ListPermission | null>(() => {
    if (!user || !currentList) return null;

    // Find the current user in the list members
    const member = currentList.members.find(m => m.userId === user.id);
    return member?.permission || null;
  }, [user, currentList]);

  // Update state when list data changes
  useEffect(() => {
    if (!isAuthenticated) {
      setState({
        activeListId: null,
        currentList: null,
        userPermission: null,
        loading: false,
        error: null,
      });
      storage.remove(LIST_STORAGE_KEY);
      return;
    }

    if (currentList) {
      setState(prev => ({
        ...prev,
        activeListId: currentList.id,
        currentList,
        userPermission,
        loading: false,
        error: null,
      }));

      // Persist active list ID
      storage.set(LIST_STORAGE_KEY, currentList.id);
    } else {
      setState(prev => ({
        ...prev,
        loading: false,
      }));
    }
  }, [isAuthenticated, currentList, userPermission]);

  // Set active list
  const setActiveList = useCallback((listId: string | null) => {
    if (listId) {
      setState(prev => ({ ...prev, activeListId: listId }));
      storage.set(LIST_STORAGE_KEY, listId);
    } else {
      setState(prev => ({ ...prev, activeListId: null, currentList: null, userPermission: null }));
      storage.remove(LIST_STORAGE_KEY);
    }
  }, []);

  // Check if user can edit items in the list
  const canEdit = useCallback((): boolean => {
    if (!userPermission) return false;
    return userPermission === 'owner' || userPermission === 'editor';
  }, [userPermission]);

  // Check if user is the owner of the list (can manage members, delete list)
  const canManage = useCallback((): boolean => {
    if (!userPermission) return false;
    return userPermission === 'owner';
  }, [userPermission]);

  // Check if user is a member of the list
  const isListMember = useCallback((): boolean => {
    return userPermission !== null;
  }, [userPermission]);

  // Refresh list data
  const refreshList = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true }));

    // In a future implementation with real list tables, this would refetch list data
    // For now, it just resets the loading state

    // Simulate a brief loading state
    await new Promise(resolve => setTimeout(resolve, 100));

    setState(prev => ({ ...prev, loading: false }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const value: ListContextValue = {
    ...state,
    setActiveList,
    canEdit,
    canManage,
    isListMember,
    refreshList,
    clearError,
  };

  return <ListContext.Provider value={value}>{children}</ListContext.Provider>;
}

/**
 * Custom hook to use list context
 * @throws Error if used outside of ListProvider
 */
export function useList(): ListContextValue {
  const context = useContext(ListContext);

  if (context === undefined) {
    throw new Error('useList must be used within a ListProvider');
  }

  return context;
}

/**
 * Helper hook to get current list
 */
export function useCurrentList(): GroceryList | null {
  const { currentList } = useList();
  return currentList;
}

/**
 * Helper hook to get user's permission level for current list
 */
export function useListPermission(): ListPermission | null {
  const { userPermission } = useList();
  return userPermission;
}

/**
 * Helper hook to check if user can edit items
 */
export function useCanEditList(): boolean {
  const { canEdit } = useList();
  return canEdit();
}

/**
 * Helper hook to check if user can manage the list
 */
export function useCanManageList(): boolean {
  const { canManage } = useList();
  return canManage();
}
