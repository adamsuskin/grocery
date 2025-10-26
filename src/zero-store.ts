/**
 * Zero Store - Authentication-Integrated Data Layer
 *
 * This module manages the Zero cache instance with dynamic authentication support.
 * It provides a singleton Zero instance that can be reinitialized when users log in/out,
 * along with React hooks for querying and mutating grocery items.
 *
 * ## Architecture
 *
 * The Zero instance starts in "demo mode" with a default user, then can be upgraded
 * to use real authentication credentials. This allows the app to work without auth
 * while seamlessly transitioning to authenticated mode when available.
 *
 * ## Integration with AuthContext
 *
 * When creating an AuthContext, integrate Zero as follows:
 *
 * ```typescript
 * // src/contexts/AuthContext.tsx
 * import { initializeZeroWithAuth, logoutZero } from '../zero-store';
 *
 * const AuthContext = createContext<AuthContextType | null>(null);
 *
 * export function AuthProvider({ children }: { children: ReactNode }) {
 *   const [user, setUser] = useState<User | null>(null);
 *   const [token, setToken] = useState<string | null>(null);
 *
 *   const login = async (credentials: LoginCredentials) => {
 *     try {
 *       // Call your authentication API
 *       const response = await fetch('/api/auth/login', {
 *         method: 'POST',
 *         headers: { 'Content-Type': 'application/json' },
 *         body: JSON.stringify(credentials),
 *       });
 *
 *       const { user, token } = await response.json();
 *
 *       // Initialize Zero with authenticated credentials
 *       await initializeZeroWithAuth({ userID: user.id, token });
 *
 *       // Update auth state
 *       setUser(user);
 *       setToken(token);
 *     } catch (error) {
 *       console.error('Login failed:', error);
 *       throw error;
 *     }
 *   };
 *
 *   const logout = async () => {
 *     try {
 *       // Clean up Zero and reset to demo mode
 *       await logoutZero();
 *
 *       // Call logout API if needed
 *       await fetch('/api/auth/logout', { method: 'POST' });
 *
 *       // Clear auth state
 *       setUser(null);
 *       setToken(null);
 *     } catch (error) {
 *       console.error('Logout failed:', error);
 *     }
 *   };
 *
 *   // Optional: Handle token refresh
 *   const refreshToken = async () => {
 *     const newToken = await fetch('/api/auth/refresh').then(r => r.json());
 *     await refreshZeroAuth(newToken);
 *     setToken(newToken);
 *   };
 *
 *   return (
 *     <AuthContext.Provider value={{ user, token, login, logout }}>
 *       {children}
 *     </AuthContext.Provider>
 *   );
 * }
 * ```
 *
 * ## Usage in Components
 *
 * Components don't need to worry about authentication state - the hooks automatically
 * use the current Zero instance and filter data by the authenticated user:
 *
 * ```typescript
 * function GroceryList() {
 *   // These hooks automatically work with authenticated or demo user
 *   // Items are automatically filtered to show only the current user's data
 *   const items = useGroceryItems();
 *   const { addItem, deleteItem } = useGroceryMutations();
 *
 *   // All operations are scoped to the current user
 *   // New items are automatically associated with the authenticated user
 *   const handleAdd = async () => {
 *     await addItem('Milk', 2, 'dairy', 'Whole milk');
 *   };
 *
 *   return <div>{items.map(item => <Item key={item.id} {...item} />)}</div>;
 * }
 * ```
 *
 * ## Exported Functions
 *
 * - `initializeZeroWithAuth(config)` - Initialize Zero with authenticated user
 * - `logoutZero()` - Clean up and reset to demo mode
 * - `refreshZeroAuth(token)` - Update authentication token
 * - `isZeroAuthenticated()` - Check if Zero is in authenticated mode
 * - `getCurrentUserId()` - Get the current authenticated user's ID
 * - `getZeroInstance()` - Get current Zero instance (internal use)
 *
 * ## Exported Hooks
 *
 * ### Data Hooks
 * - `useGroceryItems(filters?, sort?)` - Query grocery items with filtering/sorting
 * - `useGroceryMutations()` - Get mutation functions for grocery items (with conflict resolution)
 * - `useGroceryLists()` - Get all lists accessible to the current user
 * - `useListMembers(listId)` - Get members of a specific list
 * - `useListMutations()` - Get mutation functions for lists
 * - `useListPermission(listId)` - Check user's permission level for a list
 *
 * ### Conflict Resolution Hooks
 * - `useConflictDetection()` - Monitor and resolve conflicts in grocery items
 * - `useAutoResolve(callbacks?)` - Automatically resolve conflicts when detected
 *
 * ### Offline Sync Hooks
 * - `useSyncStatus()` - Track connection state, pending mutations, and sync progress
 * - `useOfflineSync(config?)` - Access offline queue and sync operations
 *
 * ## Conflict Resolution
 *
 * The Zero store integrates conflict resolution capabilities for handling offline edits:
 *
 * ```typescript
 * // Use mutations with offline queueing
 * const { markItemGotten, updateItem } = useGroceryMutations();
 *
 * // Queue mutations when offline
 * await markItemGotten(itemId, true, { queueIfOffline: true });
 * await updateItem(itemId, { name: 'New Name' }, { queueIfOffline: true });
 *
 * // Monitor conflicts
 * const { conflicts, resolveConflict } = useConflictDetection();
 * conflicts.forEach(conflict => {
 *   const resolved = resolveConflict(conflict, 'prefer-gotten');
 * });
 *
 * // Track sync status
 * const { isOnline, pendingCount, isSyncing } = useSyncStatus();
 * ```
 */
import { Zero } from '@rocicorp/zero';
import { useQuery } from '@rocicorp/zero/react';
import { nanoid } from 'nanoid';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { schema, type Schema } from './zero-schema';
import type {
  GroceryItem,
  FilterState,
  SortState,
  List,
  ListMember,
  PermissionLevel,
  BudgetInfo,
  PriceStats,
  Recipe,
  RecipeIngredient,
  RecipeDifficulty,
  CuisineType,
  MealType,
  MeasurementUnit,
  MealPlan,
  RecipeCollection,
  CreateRecipeInput,
  UpdateRecipeInput,
  CreateMealPlanInput,
  UpdateMealPlanInput,
  Category,
} from './types';
import { createConflictResolver, type Conflict } from './utils/conflictResolver';
import {
  getQueueManager,
  useOfflineQueue,
  createMarkGottenMutation,
  createUpdateItemMutation,
  type OfflineQueueConfig,
} from './utils/offlineQueue';
import { ConnectionStatus, SyncState, type SyncStatus } from './types/conflicts';

/**
 * Authentication configuration for Zero
 */
export interface ZeroAuthConfig {
  userID: string;
  token: string;
}

/**
 * Singleton Zero instance that can be reinitialized with authentication
 * Initially created with demo user, but should be reinitialized after authentication
 */
let zeroInstance: Zero<any>;

/**
 * Track if Zero has been initialized with real authentication
 */
let isAuthenticated = false;

/**
 * Singleton ConflictResolver instance for conflict detection and resolution
 */
const conflictResolver = createConflictResolver();

/**
 * Track connection status
 */
let connectionStatus: ConnectionStatus = ConnectionStatus.Unknown;

/**
 * Initialize Zero with demo credentials (for unauthenticated state)
 */
function createDemoZeroInstance(): Zero<Schema> {
  return new Zero<any>({
    userID: 'demo-user',
    auth: '',
    server: import.meta.env.VITE_ZERO_SERVER || 'http://localhost:4848',
    schema,
    kvStore: 'idb', // IndexedDB persistence
  }) as Zero<Schema>;
}

/**
 * Initialize Zero with authenticated user credentials
 * @param userID - The authenticated user's unique identifier
 * @param token - JWT token for authentication
 */
function createAuthenticatedZeroInstance(userID: string, token: string): Zero<Schema> {
  return new Zero<any>({
    userID,
    auth: token,
    server: import.meta.env.VITE_ZERO_SERVER || 'http://localhost:4848',
    schema,
    kvStore: 'idb', // IndexedDB persistence
  }) as Zero<Schema>;
}

// Initialize with demo instance by default
zeroInstance = createDemoZeroInstance();

/**
 * Get the current Zero instance
 * This function should be used by all hooks and components to access Zero
 */
export function getZeroInstance(): Zero<Schema> {
  return zeroInstance;
}

/**
 * Initialize or reinitialize Zero with authenticated user credentials
 * Call this function after successful login or when auth token is refreshed
 *
 * @param config - Authentication configuration with userID and JWT token
 * @throws Error if config is invalid
 *
 * @example
 * ```typescript
 * // In your AuthContext after successful login:
 * const handleLogin = async (credentials) => {
 *   const { user, token } = await loginAPI(credentials);
 *   await initializeZeroWithAuth({ userID: user.id, token });
 *   // Now Zero is ready to use with authenticated user
 * };
 * ```
 */
export async function initializeZeroWithAuth(config: ZeroAuthConfig): Promise<void> {
  if (!config.userID || !config.token) {
    throw new Error('Invalid auth config: userID and token are required');
  }

  try {
    // Clean up existing instance if authenticated
    if (isAuthenticated && zeroInstance) {
      await cleanupZero();
    }

    // Create new authenticated instance
    zeroInstance = createAuthenticatedZeroInstance(config.userID, config.token);
    isAuthenticated = true;

    console.log('[Zero] Initialized with authenticated user:', config.userID);
  } catch (error) {
    console.error('[Zero] Failed to initialize with auth:', error);
    throw new Error('Failed to initialize Zero with authentication');
  }
}

/**
 * Clean up Zero instance and reset to demo mode
 * Call this function on logout to clear user data and reset to unauthenticated state
 *
 * @example
 * ```typescript
 * // In your AuthContext logout handler:
 * const handleLogout = async () => {
 *   await logoutZero();
 *   await logoutAPI();
 *   // Zero is now reset to demo mode
 * };
 * ```
 */
export async function logoutZero(): Promise<void> {
  try {
    await cleanupZero();

    // Reset to demo instance
    zeroInstance = createDemoZeroInstance();
    isAuthenticated = false;

    console.log('[Zero] Reset to demo mode');
  } catch (error) {
    console.error('[Zero] Error during logout:', error);
    // Still reset to demo mode even if cleanup fails
    zeroInstance = createDemoZeroInstance();
    isAuthenticated = false;
  }
}

/**
 * Internal helper to clean up Zero instance
 * Closes connections and clears local data
 */
async function cleanupZero(): Promise<void> {
  if (!zeroInstance) return;

  try {
    // Close the Zero instance to clean up connections
    // Note: Zero SDK should provide a close/dispose method
    // If not available, this is a placeholder for cleanup logic
    if (typeof (zeroInstance as any).close === 'function') {
      await (zeroInstance as any).close();
    }
  } catch (error) {
    console.error('[Zero] Error cleaning up instance:', error);
  }
}

/**
 * Check if Zero is currently authenticated
 * Useful for conditional rendering or logic based on auth state
 */
export function isZeroAuthenticated(): boolean {
  return isAuthenticated;
}

/**
 * Get the current user ID from the Zero instance
 * Returns the authenticated user's ID or 'demo-user' if not authenticated
 *
 * @returns Current user ID
 */
export function getCurrentUserId(): string {
  const zero = getZeroInstance();
  return (zero as any).userID || 'demo-user';
}

/**
 * Refresh Zero authentication token
 * Call this when the JWT token is refreshed to keep Zero in sync
 *
 * @param token - New JWT token
 *
 * @example
 * ```typescript
 * // In your token refresh logic:
 * const newToken = await refreshTokenAPI();
 * await refreshZeroAuth(newToken);
 * ```
 */
export async function refreshZeroAuth(token: string): Promise<void> {
  if (!isAuthenticated) {
    console.warn('[Zero] Cannot refresh auth: not authenticated');
    return;
  }

  // Get current userID from the instance
  // Note: This assumes Zero exposes the userID somehow
  // You might need to store userID separately if not available
  const currentUserID = (zeroInstance as any).userID;

  if (!currentUserID) {
    throw new Error('Cannot refresh auth: userID not available');
  }

  await initializeZeroWithAuth({ userID: currentUserID, token });
}

/**
 * Detect and resolve conflicts before applying a mutation
 *
 * NOTE: This function is currently not used but kept for future implementation
 * of custom conflict detection logic.
 *
 * @param itemId - ID of the item being updated
 * @param localVersion - The local version of the item with proposed changes
 * @param onConflict - Optional callback when conflict is detected
 * @returns Resolved item or null if conflict cannot be resolved
 */
// async function detectAndResolveConflict(
//   itemId: string,
//   localVersion: GroceryItem,
//   onConflict?: (conflict: Conflict) => void
// ): Promise<GroceryItem | null> {
//   try {
//     const zero = getZeroInstance();
//
//     // Query the current remote version
//     // Note: In a real implementation, you'd fetch the current state from Zero
//     // For now, we'll rely on Zero's built-in conflict resolution
//     // This is a placeholder for custom conflict detection logic
//
//     return localVersion;
//   } catch (error) {
//     console.error('[Zero] Error detecting conflict:', error);
//     return null;
//   }
// }

/**
 * Resolve a conflict and apply the resolved version
 *
 * NOTE: This function is currently not used but kept for future implementation
 * of manual conflict resolution.
 *
 * @param conflict - The conflict to resolve
 * @param strategy - Optional resolution strategy (defaults to auto-resolve)
 * @returns Resolved item
 */
// function resolveAndApply(
//   conflict: Conflict,
//   strategy?: 'last-write-wins' | 'field-level-merge' | 'prefer-local' | 'prefer-remote' | 'prefer-gotten'
// ): GroceryItem {
//   // Try auto-resolve first if no strategy specified
//   if (!strategy) {
//     const autoResolved = conflictResolver.autoResolve(conflict);
//     if (autoResolved) {
//       return autoResolved;
//     }
//     // Fall back to last-write-wins
//     strategy = 'last-write-wins';
//   }
//
//   return conflictResolver.resolveConflict(conflict, strategy);
// }

/**
 * Update connection status and notify listeners
 */
function updateConnectionStatus(status: ConnectionStatus): void {
  connectionStatus = status;
  // In a real implementation, you'd notify listeners here
  console.log('[Zero] Connection status:', status);
}

/**
 * Initialize connection monitoring
 */
function initializeConnectionMonitoring(): void {
  if (typeof window !== 'undefined') {
    // Monitor online/offline events
    window.addEventListener('online', () => {
      updateConnectionStatus(ConnectionStatus.Online);
      // Process offline queue when coming back online
      const queueManager = getQueueManager();
      queueManager.processQueue().catch(error => {
        console.error('[Zero] Error processing queue after reconnection:', error);
      });
    });

    window.addEventListener('offline', () => {
      updateConnectionStatus(ConnectionStatus.Offline);
    });

    // Set initial status
    updateConnectionStatus(
      navigator.onLine ? ConnectionStatus.Online : ConnectionStatus.Offline
    );
  }
}

// Initialize connection monitoring
initializeConnectionMonitoring();

/**
 * React hook to get all grocery items with optional filtering and sorting
 * Automatically works with the current Zero instance (authenticated or demo)
 * Items are automatically filtered to the current authenticated user
 *
 * @param listId - Optional list ID to filter items by specific list
 * @param filters - Optional filter configuration for search and categories
 * @param sort - Optional sort configuration
 * @returns Filtered and sorted grocery items for the current user
 *
 * @example
 * ```typescript
 * // In a component:
 * const items = useGroceryItems(
 *   'list-123',
 *   { showGotten: false, searchText: 'milk', categories: ['dairy'] },
 *   { field: 'name', direction: 'asc' }
 * );
 * ```
 */
export function useGroceryItems(listId?: string, filters?: FilterState, sort?: SortState) {
  // Always use the current Zero instance (will update when auth changes)
  const zero = getZeroInstance();

  // Get current user ID from the Zero instance
  // Zero is initialized with the userID, so we can access it directly
  const currentUserId = (zero as any).userID || 'demo-user';

  // Query all grocery items and filter by current user and optionally by list
  // Note: Zero's query system will handle user filtering at the database level
  // when proper permissions are configured. For now, we filter client-side.
  let baseQuery = zero.query.grocery_items.where('user_id', currentUserId);

  // Filter by list if listId is provided
  if (listId) {
    baseQuery = baseQuery.where('list_id', listId);
  }

  const query = useQuery(baseQuery as any);

  // Map to application types (no initial sorting)
  const allItems: GroceryItem[] = (query as any[]).map((item: any) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    gotten: item.gotten,
    category: item.category as GroceryItem['category'],
    notes: item.notes,
    price: item.price,
    userId: item.user_id,
    listId: item.list_id,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt || item.createdAt,
  }));

  // Apply filters and sorting with memoization for performance
  const processedItems = useMemo(() => {
    let items = allItems;

    // Apply filters
    if (filters) {
      // Filter by gotten status
      if (!filters.showGotten) {
        items = items.filter(item => !item.gotten);
      }

      // Filter by search text
      if (filters.searchText.trim() !== '') {
        const searchLower = filters.searchText.toLowerCase();
        items = items.filter(item =>
          item.name.toLowerCase().includes(searchLower)
        );
      }

      // Filter by categories with advanced modes
      if (filters.categories && filters.categories.length > 0) {
        const categoryMode = filters.categoryMode || 'include';

        if (categoryMode === 'include') {
          // Include only items in selected categories
          items = items.filter(item => filters.categories.includes(item.category));
        } else if (categoryMode === 'exclude') {
          // Exclude items in selected categories
          items = items.filter(item => !filters.categories.includes(item.category));
        }
      }
    }

    // Apply sorting
    if (sort) {
      items = [...items].sort((a, b) => {
        let comparison = 0;

        switch (sort.field) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'quantity':
            comparison = a.quantity - b.quantity;
            break;
          case 'date':
            comparison = a.createdAt - b.createdAt;
            break;
          case 'category':
            comparison = a.category.localeCompare(b.category);
            break;
        }

        return sort.direction === 'asc' ? comparison : -comparison;
      });
    } else {
      // Default sort: newest first
      items = [...items].sort((a, b) => b.createdAt - a.createdAt);
    }

    return items;
  }, [allItems, filters, sort]);

  return processedItems;
}

/**
 * React hook for grocery mutations
 * Automatically works with the current Zero instance (authenticated or demo)
 * All mutations are scoped to the current user's data
 *
 * @returns Object with mutation functions for grocery items
 *
 * @example
 * ```typescript
 * // In a component:
 * const { addItem, markItemGotten, deleteItem } = useGroceryMutations();
 *
 * const handleAddItem = async () => {
 *   const id = await addItem('Milk', 2, 'dairy', 'Whole milk');
 *   console.log('Added item with ID:', id);
 * };
 * ```
 */
export function useGroceryMutations() {
  // Get the current Zero instance
  const zero = getZeroInstance();

  // Get current user ID from the Zero instance
  // This ensures all mutations are associated with the authenticated user
  const currentUserId = (zero as any).userID || 'demo-user';

  /**
   * Add a new grocery item
   * Automatically associates the item with the current authenticated user
   * @param listId - Optional list ID to associate the item with a specific list
   * @param price - Optional price per unit
   */
  const addItem = async (name: string, quantity: number, category: string, notes: string, listId?: string, price?: number): Promise<string> => {
    const id = nanoid();
    const now = Date.now();
    await zero.mutate.grocery_items.create({
      id,
      name,
      quantity,
      gotten: false,
      category,
      notes,
      price: price || 0,
      user_id: currentUserId, // Associate item with current user
      list_id: listId || '', // Default to empty string if no list specified
      createdAt: now,
      updatedAt: now,
    });
    return id;
  };

  /**
   * Mark an item as gotten or not gotten
   * Only updates items owned by the current user (enforced by Zero permissions)
   * Supports conflict detection and offline queueing
   *
   * @param id - Item ID to update
   * @param gotten - Whether item is gotten
   * @param options - Optional conflict handling options
   */
  const markItemGotten = async (
    id: string,
    gotten: boolean,
    options?: {
      onConflict?: (conflict: Conflict) => void;
      queueIfOffline?: boolean;
    }
  ): Promise<void> => {
    // Check if offline and queueing is enabled
    if (options?.queueIfOffline && connectionStatus === ConnectionStatus.Offline) {
      const queueManager = getQueueManager();
      const mutation = createMarkGottenMutation(id, gotten);
      queueManager.addToQueue({
        ...mutation,
        id: nanoid(),
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      });
      console.log('[Zero] Queued markItemGotten mutation for offline processing');
      return;
    }

    try {
      // Apply mutation directly - Zero handles conflict resolution internally
      await zero.mutate.grocery_items.update({
        id,
        gotten,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('[Zero] Error marking item gotten:', error);

      // If update fails and offline queueing is enabled, queue it
      if (options?.queueIfOffline) {
        const queueManager = getQueueManager();
        const mutation = createMarkGottenMutation(id, gotten);
        queueManager.addToQueue({
          ...mutation,
          id: nanoid(),
          timestamp: Date.now(),
          retryCount: 0,
          status: 'pending',
        });
        console.log('[Zero] Queued failed markItemGotten mutation');
      } else {
        throw error;
      }
    }
  };

  /**
   * Update a grocery item with conflict detection
   *
   * @param id - Item ID to update
   * @param updates - Fields to update
   * @param options - Optional conflict handling options
   */
  const updateItem = async (
    id: string,
    updates: Partial<Omit<GroceryItem, 'id' | 'userId' | 'createdAt'>>,
    options?: {
      onConflict?: (conflict: Conflict) => void;
      queueIfOffline?: boolean;
    }
  ): Promise<void> => {
    // Check if offline and queueing is enabled
    if (options?.queueIfOffline && connectionStatus === ConnectionStatus.Offline) {
      const queueManager = getQueueManager();
      const mutation = createUpdateItemMutation(id, updates);
      queueManager.addToQueue({
        ...mutation,
        id: nanoid(),
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      });
      console.log('[Zero] Queued updateItem mutation for offline processing');
      return;
    }

    try {
      // Apply mutation directly - Zero handles conflict resolution internally
      await zero.mutate.grocery_items.update({
        id,
        ...updates,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('[Zero] Error updating item:', error);

      // If update fails and offline queueing is enabled, queue it
      if (options?.queueIfOffline) {
        const queueManager = getQueueManager();
        const mutation = createUpdateItemMutation(id, updates);
        queueManager.addToQueue({
          ...mutation,
          id: nanoid(),
          timestamp: Date.now(),
          retryCount: 0,
          status: 'pending',
        });
        console.log('[Zero] Queued failed updateItem mutation');
      } else {
        throw error;
      }
    }
  };

  /**
   * Delete a grocery item
   * Only deletes items owned by the current user (enforced by Zero permissions)
   */
  const deleteItem = async (id: string): Promise<void> => {
    await zero.mutate.grocery_items.delete({ id });
  };

  /**
   * Mark all provided items as gotten
   * Only updates items owned by the current user
   */
  const markAllGotten = async (items: GroceryItem[]): Promise<void> => {
    // Update all items that aren't already marked as gotten
    // Items are already filtered by user in the query, so this is safe
    const now = Date.now();
    const updatePromises = items
      .filter(item => !item.gotten)
      .map(item => zero.mutate.grocery_items.update({
        id: item.id,
        gotten: true,
        updatedAt: now,
      }));

    await Promise.all(updatePromises);
  };

  /**
   * Delete all items marked as gotten
   * Only deletes items owned by the current user
   */
  const deleteAllGotten = async (items: GroceryItem[]): Promise<void> => {
    // Delete all items that are marked as gotten
    // Items are already filtered by user in the query, so this is safe
    const deletePromises = items
      .filter(item => item.gotten)
      .map(item => zero.mutate.grocery_items.delete({ id: item.id }));

    await Promise.all(deletePromises);
  };

  return {
    addItem,
    updateItem,
    markItemGotten,
    deleteItem,
    markAllGotten,
    deleteAllGotten,
  };
}

/**
 * React hook to get all lists accessible by the current user
 * Returns lists owned by the user or lists they are a member of
 *
 * @returns List of grocery lists accessible to the current user
 *
 * @example
 * ```typescript
 * const lists = useGroceryLists();
 * ```
 */
export function useGroceryLists() {
  const zero = getZeroInstance();
  const currentUserId = (zero as any).userID || 'demo-user';

  // Query lists owned by the current user
  const ownedListsQuery = useQuery(
    zero.query.lists.where('owner_id', currentUserId)
  );

  // Query list memberships for the current user
  const membershipQuery = useQuery(
    zero.query.list_members.where('user_id', currentUserId)
  );

  // Get unique list IDs from memberships
  const memberListIds = useMemo(
    () => membershipQuery.map(m => m.list_id),
    [membershipQuery]
  );

  // Query lists where user is a member (but not owner)
  const sharedListsQuery = useQuery(
    zero.query.lists.where('id', 'IN', memberListIds)
  );

  // Combine and deduplicate lists
  const allLists = useMemo(() => {
    const listsMap = new Map<string, List>();

    // Add owned lists
    ownedListsQuery.forEach(list => {
      listsMap.set(list.id, {
        id: list.id,
        name: list.name,
        ownerId: list.owner_id,
        color: list.color || '#4CAF50',
        icon: list.icon || '🛒',
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
        isArchived: list.is_archived || false,
        archivedAt: list.archived_at,
        budget: list.budget,
        currency: list.currency,
      });
    });

    // Add shared lists
    sharedListsQuery.forEach(list => {
      if (!listsMap.has(list.id)) {
        listsMap.set(list.id, {
          id: list.id,
          name: list.name,
          ownerId: list.owner_id,
          color: list.color || '#4CAF50',
          icon: list.icon || '🛒',
          createdAt: list.createdAt,
          updatedAt: list.updatedAt,
          isArchived: list.is_archived || false,
          archivedAt: list.archived_at,
          budget: list.budget,
          currency: list.currency,
        });
      }
    });

    return Array.from(listsMap.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [ownedListsQuery, sharedListsQuery]);

  return allLists;
}

/**
 * React hook to get list members for a specific list
 *
 * @param listId - The ID of the list to get members for
 * @returns List members with their permissions
 *
 * @example
 * ```typescript
 * const members = useListMembers('list-123');
 * ```
 */
export function useListMembers(listId: string) {
  const zero = getZeroInstance();

  const membersQuery = useQuery(
    zero.query.list_members.where('list_id', listId)
  );

  const members: ListMember[] = useMemo(
    () => membersQuery.map(member => ({
      id: member.id,
      listId: member.list_id,
      userId: member.user_id,
      userEmail: member.user_email,
      userName: member.user_name,
      permission: member.permission as PermissionLevel,
      addedAt: member.added_at,
      addedBy: member.added_by,
      updatedAt: member.updated_at || member.added_at,
    })),
    [membersQuery]
  );

  return members;
}

/**
 * React hook to get custom categories for a specific list
 *
 * @param listId - The ID of the list to get custom categories for
 * @returns Array of custom category names for the list
 *
 * @example
 * ```typescript
 * const customCategories = useCustomCategories('list-123');
 * ```
 */
export function useCustomCategories(listId: string | null) {
  const zero = getZeroInstance();

  // Return empty array if no listId provided
  const query = listId
    ? zero.query.custom_categories.where('list_id', listId)
    : null;

  const categoriesQuery = useQuery(query as any);

  // Map to category names sorted by creation date
  const customCategories: string[] = useMemo(() => {
    if (!listId || !categoriesQuery) return [];

    return (categoriesQuery as any[])
      .sort((a, b) => a.createdAt - b.createdAt)
      .map(cat => cat.name);
  }, [listId, categoriesQuery]);

  return customCategories;
}

/**
 * React hook for list mutations
 * Provides functions for creating, updating, and deleting lists
 *
 * @returns Object with mutation functions for lists
 *
 * @example
 * ```typescript
 * const { createList, updateListName, deleteList } = useListMutations();
 * const listId = await createList('Grocery Shopping');
 * ```
 */
export function useListMutations() {
  const zero = getZeroInstance();
  const currentUserId = (zero as any).userID || 'demo-user';

  /**
   * Create a new list
   * Automatically sets the current user as the owner
   */
  const createList = async (name: string, color?: string, icon?: string, budget?: number, currency?: string): Promise<string> => {
    const id = nanoid();
    const now = Date.now();

    await zero.mutate.lists.create({
      id,
      name,
      owner_id: currentUserId,
      color: color || '#4CAF50',
      icon: icon || '🛒',
      budget: budget || 0,
      currency: currency || 'USD',
      createdAt: now,
      updatedAt: now,
      is_archived: false,
      archived_at: 0,
    });

    // Add owner as a member with owner permission
    await zero.mutate.list_members.create({
      id: nanoid(),
      list_id: id,
      user_id: currentUserId,
      permission: 'owner',
      added_at: now,
      added_by: currentUserId,
      user_email: '', // Will be populated by the database
      user_name: '', // Will be populated by the database
      updated_at: now,
    });

    return id;
  };

  /**
   * Create a new list from a template with pre-populated items
   * @param name - Name for the new list
   * @param items - Array of items to add to the list
   * @param color - Optional color for the list
   * @param icon - Optional icon for the list
   * @param customCategories - Optional array of custom categories to create for this list
   * @returns The ID of the newly created list
   */
  const createListFromTemplate = async (
    name: string,
    items: Array<{ name: string; quantity: number; category: string; notes?: string }>,
    color?: string,
    icon?: string,
    customCategories?: Array<{ name: string; color?: string; icon?: string }>
  ): Promise<string> => {
    // Create the list
    const listId = await createList(name, color, icon);

    // Create custom categories if provided
    if (customCategories && customCategories.length > 0) {
      const now = Date.now();
      const categoryPromises = customCategories.map((category, index) =>
        zero.mutate.custom_categories.create({
          id: nanoid(),
          name: category.name,
          list_id: listId,
          created_by: currentUserId,
          color: category.color || '',
          icon: category.icon || '',
          display_order: index,
          is_archived: false,
          archived_at: 0,
          is_locked: false,
          last_edited_by: currentUserId,
          createdAt: now + index,
          updatedAt: now + index,
        })
      );

      try {
        await Promise.all(categoryPromises);
      } catch (error) {
        console.error('[createListFromTemplate] Error creating custom categories:', error);
        // Continue even if custom category creation fails
      }
    }

    // Add all items to the list
    const now = Date.now();
    const itemPromises = items.map((item, index) =>
      zero.mutate.grocery_items.create({
        id: nanoid(),
        name: item.name,
        quantity: item.quantity,
        gotten: false,
        category: item.category,
        notes: item.notes || '',
        price: 0,
        user_id: currentUserId,
        list_id: listId,
        createdAt: now + index, // Slight offset to maintain order
        updatedAt: now + index,
      })
    );

    await Promise.all(itemPromises);

    return listId;
  };

  /**
   * Get lists owned by or shared with the current user
   * Note: Use useGroceryLists hook for reactive list queries
   */
  const getMyLists = (): List[] => {
    // This is handled by the useGroceryLists hook
    // For mutations, permission checks should be done inline
    return [];
  };

  /**
   * Get a specific list by ID
   * Note: For reactive queries, use useGroceryLists and filter client-side
   */
  const getListById = (_listId: string): List | null => {
    // List queries should be done with useGroceryLists hook
    // This is a placeholder for API consistency
    return null;
  };

  /**
   * Update a list's name
   * Only the owner or editors can update the list
   * Note: Permission checking should be done at the UI level before calling
   */
  const updateListName = async (listId: string, name: string): Promise<void> => {
    await zero.mutate.lists.update({
      id: listId,
      name,
      updatedAt: Date.now(),
    });
  };

  /**
   * Update a list's budget
   * Only the owner or editors can update the list
   * @param listId - ID of the list to update
   * @param budget - Budget amount (optional, set to 0 to remove budget)
   * @param currency - Currency code (optional, defaults to 'USD')
   */
  const updateListBudget = async (listId: string, budget?: number, currency?: string): Promise<void> => {
    await zero.mutate.lists.update({
      id: listId,
      budget: budget || 0,
      currency: currency || 'USD',
      updatedAt: Date.now(),
    });
  };

  /**
   * Delete a list
   * Only the owner can delete the list
   * Note: Permission checking and cascading deletes should be handled by database triggers
   */
  const deleteList = async (listId: string): Promise<void> => {
    // Database should handle cascading deletes via foreign key constraints
    await zero.mutate.lists.delete({ id: listId });
  };

  /**
   * Add a member to a list with a specific permission level
   * Only the owner can add members
   * Note: Permission checking should be done at the UI level
   */
  const addListMember = async (
    listId: string,
    userId: string,
    permission: PermissionLevel
  ): Promise<void> => {
    const now = Date.now();
    await zero.mutate.list_members.create({
      id: nanoid(),
      list_id: listId,
      user_id: userId,
      permission,
      added_at: now,
      added_by: currentUserId,
      user_email: '', // Will be populated by the database
      user_name: '', // Will be populated by the database
      updated_at: now,
    });
  };

  /**
   * Remove a member from a list
   * Only the owner can remove members
   * Note: Permission checking should be done at the UI level
   * @param memberId - The member record ID to delete
   */
  const removeListMember = async (memberId: string): Promise<void> => {
    await zero.mutate.list_members.delete({ id: memberId });
  };

  /**
   * Update a member's permission level
   * Only the owner can update permissions
   * Note: Permission checking should be done at the UI level
   * @param memberId - The member record ID to update
   */
  const updateMemberPermission = async (
    memberId: string,
    permission: PermissionLevel
  ): Promise<void> => {
    await zero.mutate.list_members.update({
      id: memberId,
      permission,
    });
  };

  return {
    createList,
    createListFromTemplate,
    getMyLists,
    getListById,
    updateListName,
    updateListBudget,
    deleteList,
    addListMember,
    removeListMember,
    updateMemberPermission,
  };
}

/**
 * Helper hook to check user's permission level for a list
 * Use this in components to determine what actions the user can perform
 *
 * @param listId - The list ID to check permissions for
 * @returns Object with permission checking functions
 *
 * @example
 * ```typescript
 * const { canEdit, canDelete, isOwner } = useListPermission('list-123');
 * ```
 */
export function useListPermission(listId: string) {
  const zero = getZeroInstance();
  const currentUserId = (zero as any).userID || 'demo-user';

  // Query the list to check ownership
  const listQuery = useQuery(zero.query.lists.where('id', listId) as any);
  const list = listQuery.length > 0 ? listQuery[0] : null;

  // Query user's membership
  const membershipQuery = useQuery(
    zero.query.list_members
      .where('list_id', listId)
      .where('user_id', currentUserId) as any
  );
  const membership = membershipQuery.length > 0 ? membershipQuery[0] : null;

  const isOwner = list?.owner_id === currentUserId;
  const permission = membership?.permission as PermissionLevel | null;

  return useMemo(() => ({
    isOwner,
    permission,
    canView: isOwner || ['owner', 'editor', 'viewer'].includes(permission || ''),
    canEdit: isOwner || ['owner', 'editor'].includes(permission || ''),
    canDelete: isOwner,
    canManageMembers: isOwner,
  }), [isOwner, permission]);
}

// =============================================================================
// Conflict Resolution and Offline Sync Hooks
// =============================================================================

/**
 * React hook for conflict detection
 * Monitors for conflicts in grocery items and provides conflict resolution capabilities
 *
 * @returns Object with conflict detection state and methods
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { conflicts, resolveConflict } = useConflictDetection();
 *
 *   return (
 *     <div>
 *       {conflicts.length > 0 && (
 *         <div>
 *           <p>Conflicts detected: {conflicts.length}</p>
 *           {conflicts.map(conflict => (
 *             <ConflictCard
 *               key={conflict.id}
 *               conflict={conflict}
 *               onResolve={(strategy) => resolveConflict(conflict, strategy)}
 *             />
 *           ))}
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useConflictDetection() {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  /**
   * Manually detect conflict between local and remote versions
   */
  const detectConflict = useCallback((local: GroceryItem, remote: GroceryItem): Conflict | null => {
    return conflictResolver.detectConflict(local, remote);
  }, []);

  /**
   * Resolve a conflict using a specific strategy
   */
  const resolveConflict = useCallback((
    conflict: Conflict,
    strategy: 'last-write-wins' | 'field-level-merge' | 'prefer-local' | 'prefer-remote' | 'prefer-gotten'
  ): GroceryItem => {
    const resolved = conflictResolver.resolveConflict(conflict, strategy);

    // Remove conflict from list
    setConflicts(prev => prev.filter(c => c.id !== conflict.id));

    return resolved;
  }, []);

  /**
   * Attempt to auto-resolve a conflict
   */
  const autoResolve = useCallback((conflict: Conflict): GroceryItem | null => {
    const resolved = conflictResolver.autoResolve(conflict);

    if (resolved) {
      // Remove conflict from list
      setConflicts(prev => prev.filter(c => c.id !== conflict.id));
    }

    return resolved;
  }, []);

  /**
   * Add a conflict to the list
   */
  const addConflict = useCallback((conflict: Conflict) => {
    setConflicts(prev => [...prev, conflict]);
  }, []);

  /**
   * Clear all conflicts
   */
  const clearConflicts = useCallback(() => {
    setConflicts([]);
  }, []);

  return {
    conflicts,
    hasConflicts: conflicts.length > 0,
    conflictCount: conflicts.length,
    detectConflict,
    resolveConflict,
    autoResolve,
    addConflict,
    clearConflicts,
  };
}

/**
 * React hook for automatic conflict resolution
 * Automatically attempts to resolve conflicts as they're detected
 *
 * @param onConflict - Optional callback when conflict is detected
 * @param onResolved - Optional callback when conflict is auto-resolved
 * @param onManualRequired - Optional callback when manual resolution is required
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   useAutoResolve({
 *     onConflict: (conflict) => {
 *       console.log('Conflict detected:', conflict);
 *     },
 *     onResolved: (conflict, resolved) => {
 *       console.log('Auto-resolved:', resolved);
 *     },
 *     onManualRequired: (conflict) => {
 *       showConflictDialog(conflict);
 *     }
 *   });
 *
 *   return <div>App content</div>;
 * }
 * ```
 */
export function useAutoResolve(callbacks?: {
  onConflict?: (conflict: Conflict) => void;
  onResolved?: (conflict: Conflict, resolved: GroceryItem) => void;
  onManualRequired?: (conflict: Conflict) => void;
}) {
  const [autoResolveEnabled, setAutoResolveEnabled] = useState(true);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [manualCount, setManualCount] = useState(0);

  /**
   * Attempt to auto-resolve a conflict
   */
  const tryAutoResolve = useCallback((conflict: Conflict): GroceryItem | null => {
    if (!autoResolveEnabled) {
      return null;
    }

    callbacks?.onConflict?.(conflict);

    const resolved = conflictResolver.autoResolve(conflict);

    if (resolved) {
      setResolvedCount(prev => prev + 1);
      callbacks?.onResolved?.(conflict, resolved);
      return resolved;
    } else {
      setManualCount(prev => prev + 1);
      callbacks?.onManualRequired?.(conflict);
      return null;
    }
  }, [autoResolveEnabled, callbacks]);

  return {
    autoResolveEnabled,
    setAutoResolveEnabled,
    tryAutoResolve,
    resolvedCount,
    manualCount,
  };
}

/**
 * React hook for sync status tracking
 * Provides information about connection state, pending mutations, and sync progress
 *
 * @returns Sync status information
 *
 * @example
 * ```typescript
 * function SyncIndicator() {
 *   const { isOnline, pendingCount, syncState } = useSyncStatus();
 *
 *   return (
 *     <div>
 *       <div>Status: {isOnline ? 'Online' : 'Offline'}</div>
 *       {pendingCount > 0 && <div>Pending: {pendingCount}</div>}
 *       <div>Sync: {syncState}</div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSyncStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [syncState, setSyncState] = useState<SyncState>(SyncState.Idle);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  // Use the offline queue hook to get pending mutations count
  const { pendingCount, isProcessing } = useOfflineQueue();

  // Monitor online/offline status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      setSyncState(SyncState.Syncing);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncState(SyncState.Idle);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update sync state based on processing status
  useEffect(() => {
    if (isProcessing) {
      setSyncState(SyncState.Syncing);
    } else if (pendingCount === 0) {
      setSyncState(SyncState.Synced);
      setLastSyncedAt(Date.now());
    } else {
      setSyncState(SyncState.Idle);
    }
  }, [isProcessing, pendingCount]);

  const syncStatus: SyncStatus = {
    connectionStatus: isOnline ? ConnectionStatus.Online : ConnectionStatus.Offline,
    syncState,
    lastSyncedAt,
    lastSyncAttempt: null,
    pendingChanges: pendingCount,
    unresolvedConflicts: 0,
    syncProgress: isProcessing ? 50 : (pendingCount === 0 ? 100 : 0),
    autoSyncEnabled: true,
  };

  return {
    ...syncStatus,
    isOnline,
    isOffline: !isOnline,
    isSyncing: syncState === SyncState.Syncing,
    isSynced: syncState === SyncState.Synced,
    hasPendingChanges: pendingCount > 0,
  };
}

/**
 * React hook for offline sync integration
 * Provides access to the offline queue and sync operations
 *
 * @param config - Optional queue configuration
 * @returns Offline queue state and operations
 *
 * @example
 * ```typescript
 * function OfflineStatus() {
 *   const {
 *     pendingCount,
 *     failedCount,
 *     retryFailed,
 *     processQueue,
 *     isProcessing
 *   } = useOfflineSync();
 *
 *   return (
 *     <div>
 *       <p>Pending: {pendingCount}</p>
 *       <p>Failed: {failedCount}</p>
 *       {isProcessing && <p>Syncing...</p>}
 *       {failedCount > 0 && (
 *         <button onClick={retryFailed}>Retry Failed</button>
 *       )}
 *       <button onClick={processQueue}>Sync Now</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useOfflineSync(config?: OfflineQueueConfig) {
  // Use the existing useOfflineQueue hook from offlineQueue.ts
  const queueHook = useOfflineQueue(config);

  return {
    ...queueHook,
    // Alias for clarity
    sync: queueHook.processQueue,
    hasPendingMutations: queueHook.pendingCount > 0,
    hasFailedMutations: queueHook.failedCount > 0,
  };
}

// =============================================================================
// Phase 26: Recipe Integration Hooks
// =============================================================================

/**
 * React hook to get all recipes for a user
 *
 * @param userId - User ID to filter recipes
 * @returns Array of recipes owned by the user
 *
 * @example
 * ```typescript
 * const recipes = useRecipes(currentUserId);
 * ```
 */
export function useRecipes(userId: string) {
  const zero = getZeroInstance();

  const recipesQuery = useQuery(
    zero.query.recipes.where('userId', userId)
  );

  const recipes: Recipe[] = useMemo(
    () => recipesQuery.map((recipe: any) => ({
      id: recipe.id,
      name: recipe.name,
      description: recipe.description,
      instructions: recipe.instructions,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      difficulty: recipe.difficulty as RecipeDifficulty | undefined,
      cuisineType: recipe.cuisineType as CuisineType | undefined,
      imageUrl: recipe.imageUrl,
      userId: recipe.userId,
      listId: recipe.listId,
      isPublic: recipe.isPublic,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
    })),
    [recipesQuery]
  );

  return recipes;
}

/**
 * React hook to get all public recipes
 *
 * @returns Array of public recipes from all users
 *
 * @example
 * ```typescript
 * const publicRecipes = usePublicRecipes();
 * ```
 */
export function usePublicRecipes() {
  const zero = getZeroInstance();

  const publicRecipesQuery = useQuery(
    zero.query.recipes.where('isPublic', true)
  );

  const recipes: Recipe[] = useMemo(
    () => publicRecipesQuery.map((recipe: any) => ({
      id: recipe.id,
      name: recipe.name,
      description: recipe.description,
      instructions: recipe.instructions,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      difficulty: recipe.difficulty as RecipeDifficulty | undefined,
      cuisineType: recipe.cuisineType as CuisineType | undefined,
      imageUrl: recipe.imageUrl,
      userId: recipe.userId,
      listId: recipe.listId,
      isPublic: recipe.isPublic,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
    })),
    [publicRecipesQuery]
  );

  return recipes;
}

/**
 * React hook to get a single recipe with its ingredients
 *
 * @param recipeId - Recipe ID to fetch
 * @returns Recipe with ingredients populated, or null if not found
 *
 * @example
 * ```typescript
 * const recipe = useRecipe('recipe-123');
 * ```
 */
export function useRecipe(recipeId: string) {
  const zero = getZeroInstance();

  const recipeQuery = useQuery(
    zero.query.recipes.where('id', recipeId)
  );

  const ingredientsQuery = useQuery(
    zero.query.recipe_ingredients.where('recipeId', recipeId)
  );

  const recipe: Recipe | null = useMemo(() => {
    if (recipeQuery.length === 0) return null;

    const recipeData = recipeQuery[0];
    const ingredients: RecipeIngredient[] = ingredientsQuery
      .map((ing: any) => ({
        id: ing.id,
        recipeId: ing.recipeId,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit as MeasurementUnit,
        notes: ing.notes,
        category: ing.category,
        orderIndex: ing.orderIndex,
        createdAt: ing.createdAt,
      }))
      .sort((a, b) => a.orderIndex - b.orderIndex);

    return {
      id: recipeData.id,
      name: recipeData.name,
      description: recipeData.description,
      instructions: recipeData.instructions,
      prepTime: recipeData.prepTime,
      cookTime: recipeData.cookTime,
      servings: recipeData.servings,
      difficulty: recipeData.difficulty as RecipeDifficulty | undefined,
      cuisineType: recipeData.cuisineType as CuisineType | undefined,
      imageUrl: recipeData.imageUrl,
      userId: recipeData.userId,
      listId: recipeData.listId,
      isPublic: recipeData.isPublic,
      createdAt: recipeData.createdAt,
      updatedAt: recipeData.updatedAt,
      ingredients,
    };
  }, [recipeQuery, ingredientsQuery]);

  return recipe;
}

/**
 * React hook to get ingredients for a recipe
 *
 * @param recipeId - Recipe ID to get ingredients for
 * @returns Array of recipe ingredients sorted by order index
 *
 * @example
 * ```typescript
 * const ingredients = useRecipeIngredients('recipe-123');
 * ```
 */
export function useRecipeIngredients(recipeId: string) {
  const zero = getZeroInstance();

  const ingredientsQuery = useQuery(
    zero.query.recipe_ingredients.where('recipeId', recipeId)
  );

  const ingredients: RecipeIngredient[] = useMemo(
    () => ingredientsQuery
      .map((ing: any) => ({
        id: ing.id,
        recipeId: ing.recipeId,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit as MeasurementUnit,
        notes: ing.notes,
        category: ing.category,
        orderIndex: ing.orderIndex,
        createdAt: ing.createdAt,
      }))
      .sort((a, b) => a.orderIndex - b.orderIndex),
    [ingredientsQuery]
  );

  return ingredients;
}

/**
 * React hook to get meal plans for a user with optional date filtering
 *
 * @param userId - User ID to filter meal plans
 * @param startDate - Optional start date (unix timestamp)
 * @param endDate - Optional end date (unix timestamp)
 * @returns Array of meal plans
 *
 * @example
 * ```typescript
 * const mealPlans = useMealPlans(userId, startOfWeek, endOfWeek);
 * ```
 */
export function useMealPlans(userId: string, startDate?: number, endDate?: number) {
  const zero = getZeroInstance();

  let query = zero.query.meal_plans.where('userId', userId);

  const mealPlansQuery = useQuery(query);

  const mealPlans: MealPlan[] = useMemo(() => {
    let plans = mealPlansQuery.map((plan: any) => ({
      id: plan.id,
      userId: plan.userId,
      listId: plan.listId,
      recipeId: plan.recipeId,
      plannedDate: plan.plannedDate,
      mealType: plan.mealType as MealType,
      servings: plan.servings,
      notes: plan.notes,
      isCooked: plan.isCooked,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    }));

    // Apply date filtering client-side
    if (startDate !== undefined) {
      plans = plans.filter(p => p.plannedDate >= startDate);
    }
    if (endDate !== undefined) {
      plans = plans.filter(p => p.plannedDate <= endDate);
    }

    // Sort by planned date
    return plans.sort((a, b) => a.plannedDate - b.plannedDate);
  }, [mealPlansQuery, startDate, endDate]);

  return mealPlans;
}

/**
 * React hook to get meal plans for a specific date
 *
 * @param userId - User ID to filter meal plans
 * @param date - Date timestamp (unix timestamp)
 * @returns Array of meal plans for that date
 *
 * @example
 * ```typescript
 * const todayMeals = useMealPlansByDate(userId, Date.now());
 * ```
 */
export function useMealPlansByDate(userId: string, date: number) {
  const zero = getZeroInstance();

  const mealPlansQuery = useQuery(
    zero.query.meal_plans.where('userId', userId)
  );

  const mealPlans: MealPlan[] = useMemo(() => {
    // Normalize date to start of day
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const startOfDay = targetDate.getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

    return mealPlansQuery
      .filter((plan: any) => plan.plannedDate >= startOfDay && plan.plannedDate <= endOfDay)
      .map((plan: any) => ({
        id: plan.id,
        userId: plan.userId,
        listId: plan.listId,
        recipeId: plan.recipeId,
        plannedDate: plan.plannedDate,
        mealType: plan.mealType as MealType,
        servings: plan.servings,
        notes: plan.notes,
        isCooked: plan.isCooked,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      }))
      .sort((a, b) => {
        // Sort by meal type order: breakfast, lunch, dinner, snack
        const mealOrder: Record<MealType, number> = {
          breakfast: 0,
          lunch: 1,
          dinner: 2,
          snack: 3,
        };
        return mealOrder[a.mealType] - mealOrder[b.mealType];
      });
  }, [mealPlansQuery, date]);

  return mealPlans;
}

/**
 * React hook to get recipe collections for a user
 *
 * @param userId - User ID to filter collections
 * @returns Array of recipe collections
 *
 * @example
 * ```typescript
 * const collections = useRecipeCollections(userId);
 * ```
 */
export function useRecipeCollections(userId: string) {
  const zero = getZeroInstance();

  const collectionsQuery = useQuery(
    zero.query.recipe_collections.where('userId', userId)
  );

  const collections: RecipeCollection[] = useMemo(
    () => collectionsQuery.map((collection: any) => ({
      id: collection.id,
      userId: collection.userId,
      name: collection.name,
      description: collection.description,
      isPublic: collection.isPublic,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    })).sort((a, b) => b.updatedAt - a.updatedAt),
    [collectionsQuery]
  );

  return collections;
}

/**
 * React hook to get a single collection with its recipes
 *
 * @param collectionId - Collection ID to fetch
 * @returns Collection with recipes populated, or null if not found
 *
 * @example
 * ```typescript
 * const collection = useRecipeCollection('collection-123');
 * ```
 */
export function useRecipeCollection(collectionId: string) {
  const zero = getZeroInstance();

  const collectionQuery = useQuery(
    zero.query.recipe_collections.where('id', collectionId)
  );

  const collectionItemsQuery = useQuery(
    zero.query.recipe_collection_items.where('collectionId', collectionId)
  );

  // Get recipe IDs from collection items
  const recipeIds = useMemo(
    () => collectionItemsQuery.map((item: any) => item.recipeId),
    [collectionItemsQuery]
  );

  // Fetch recipes for the collection
  const recipesQuery = useQuery(
    recipeIds.length > 0 ? zero.query.recipes.where('id', 'IN', recipeIds) : [] as any
  );

  const collection: RecipeCollection | null = useMemo(() => {
    if (collectionQuery.length === 0) return null;

    const collectionData = collectionQuery[0];
    const recipes: Recipe[] = recipesQuery.map((recipe: any) => ({
      id: recipe.id,
      name: recipe.name,
      description: recipe.description,
      instructions: recipe.instructions,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      difficulty: recipe.difficulty as RecipeDifficulty | undefined,
      cuisineType: recipe.cuisineType as CuisineType | undefined,
      imageUrl: recipe.imageUrl,
      userId: recipe.userId,
      listId: recipe.listId,
      isPublic: recipe.isPublic,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
    }));

    return {
      id: collectionData.id,
      userId: collectionData.userId,
      name: collectionData.name,
      description: collectionData.description,
      isPublic: collectionData.isPublic,
      createdAt: collectionData.createdAt,
      updatedAt: collectionData.updatedAt,
      recipes,
      recipeCount: recipes.length,
    };
  }, [collectionQuery, recipesQuery]);

  return collection;
}

/**
 * React hook for recipe mutations
 * Provides functions for creating, updating, and deleting recipes
 *
 * @returns Object with recipe mutation functions
 *
 * @example
 * ```typescript
 * const { createRecipe, updateRecipe, deleteRecipe } = useRecipeMutations();
 * ```
 */
export function useRecipeMutations() {
  const zero = getZeroInstance();
  const currentUserId = (zero as any).userID || 'demo-user';

  /**
   * Create a new recipe with ingredients
   */
  const createRecipe = async (input: CreateRecipeInput): Promise<Recipe> => {
    const recipeId = nanoid();
    const now = Date.now();

    // Create recipe
    await zero.mutate.recipes.create({
      id: recipeId,
      name: input.name,
      description: input.description || '',
      instructions: input.instructions,
      prepTime: input.prepTime || 0,
      cookTime: input.cookTime || 0,
      servings: input.servings,
      difficulty: input.difficulty || '',
      cuisineType: input.cuisineType || '',
      imageUrl: input.imageUrl || '',
      userId: currentUserId,
      listId: input.listId || '',
      isPublic: input.isPublic || false,
      createdAt: now,
      updatedAt: now,
    });

    // Create ingredients
    const ingredientPromises = input.ingredients.map((ingredient, index) =>
      zero.mutate.recipe_ingredients.create({
        id: nanoid(),
        recipeId,
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        notes: ingredient.notes || '',
        category: ingredient.category || '',
        orderIndex: ingredient.orderIndex !== undefined ? ingredient.orderIndex : index,
        createdAt: now,
      })
    );

    await Promise.all(ingredientPromises);

    return {
      id: recipeId,
      name: input.name,
      description: input.description,
      instructions: input.instructions,
      prepTime: input.prepTime,
      cookTime: input.cookTime,
      servings: input.servings,
      difficulty: input.difficulty,
      cuisineType: input.cuisineType,
      imageUrl: input.imageUrl,
      userId: currentUserId,
      listId: input.listId,
      isPublic: input.isPublic || false,
      createdAt: now,
      updatedAt: now,
    };
  };

  /**
   * Update an existing recipe
   */
  const updateRecipe = async (input: UpdateRecipeInput): Promise<Recipe> => {
    const now = Date.now();
    const updates: any = {
      id: input.id,
      updatedAt: now,
    };

    if (input.name !== undefined) updates.name = input.name;
    if (input.description !== undefined) updates.description = input.description;
    if (input.instructions !== undefined) updates.instructions = input.instructions;
    if (input.prepTime !== undefined) updates.prepTime = input.prepTime;
    if (input.cookTime !== undefined) updates.cookTime = input.cookTime;
    if (input.servings !== undefined) updates.servings = input.servings;
    if (input.difficulty !== undefined) updates.difficulty = input.difficulty;
    if (input.cuisineType !== undefined) updates.cuisineType = input.cuisineType;
    if (input.imageUrl !== undefined) updates.imageUrl = input.imageUrl;
    if (input.listId !== undefined) updates.listId = input.listId;
    if (input.isPublic !== undefined) updates.isPublic = input.isPublic;

    await zero.mutate.recipes.update(updates);

    // If ingredients are updated, delete old ones and create new ones
    if (input.ingredients) {
      // Delete existing ingredients
      const existingIngredients = await (zero.query.recipe_ingredients
        .where('recipeId', input.id) as any).run();

      const deletePromises = existingIngredients.map((ing: any) =>
        zero.mutate.recipe_ingredients.delete({ id: ing.id })
      );
      await Promise.all(deletePromises);

      // Create new ingredients
      const ingredientPromises = input.ingredients.map((ingredient, index) =>
        zero.mutate.recipe_ingredients.create({
          id: nanoid(),
          recipeId: input.id,
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          notes: ingredient.notes || '',
          category: ingredient.category || '',
          orderIndex: ingredient.orderIndex !== undefined ? ingredient.orderIndex : index,
          createdAt: now,
        })
      );
      await Promise.all(ingredientPromises);
    }

    // Return updated recipe (simplified, real implementation would query)
    return {
      id: input.id,
      name: input.name || '',
      description: input.description,
      instructions: input.instructions || '',
      prepTime: input.prepTime,
      cookTime: input.cookTime,
      servings: input.servings || 1,
      difficulty: input.difficulty,
      cuisineType: input.cuisineType,
      imageUrl: input.imageUrl,
      userId: currentUserId,
      listId: input.listId,
      isPublic: input.isPublic || false,
      createdAt: 0,
      updatedAt: now,
    };
  };

  /**
   * Delete a recipe and its ingredients
   */
  const deleteRecipe = async (recipeId: string): Promise<void> => {
    // Delete ingredients first
    const ingredients = await (zero.query.recipe_ingredients.where('recipeId', recipeId) as any).run();
    const deleteIngredientPromises = ingredients.map((ing: any) =>
      zero.mutate.recipe_ingredients.delete({ id: ing.id })
    );
    await Promise.all(deleteIngredientPromises);

    // Delete recipe
    await zero.mutate.recipes.delete({ id: recipeId });
  };

  /**
   * Duplicate a recipe with a new name
   */
  const duplicateRecipe = async (recipeId: string, newName?: string): Promise<Recipe> => {
    // Fetch original recipe
    const originalRecipe = await (zero.query.recipes.where('id', recipeId) as any).run();
    if (originalRecipe.length === 0) {
      throw new Error('Recipe not found');
    }

    const recipe = originalRecipe[0];
    const ingredients = await (zero.query.recipe_ingredients.where('recipeId', recipeId) as any).run();

    // Create duplicate
    const newRecipeId = nanoid();
    const now = Date.now();

    await zero.mutate.recipes.create({
      id: newRecipeId,
      name: newName || `${recipe.name} (Copy)`,
      description: recipe.description,
      instructions: recipe.instructions,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      cuisineType: recipe.cuisineType,
      imageUrl: recipe.imageUrl,
      userId: currentUserId,
      listId: recipe.listId,
      isPublic: false, // Duplicates are private by default
      createdAt: now,
      updatedAt: now,
    });

    // Duplicate ingredients
    const ingredientPromises = ingredients.map((ing: any) =>
      zero.mutate.recipe_ingredients.create({
        id: nanoid(),
        recipeId: newRecipeId,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        notes: ing.notes,
        category: ing.category,
        orderIndex: ing.orderIndex,
        createdAt: now,
      })
    );
    await Promise.all(ingredientPromises);

    return {
      id: newRecipeId,
      name: newName || `${recipe.name} (Copy)`,
      description: recipe.description,
      instructions: recipe.instructions,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      cuisineType: recipe.cuisineType,
      imageUrl: recipe.imageUrl,
      userId: currentUserId,
      listId: recipe.listId,
      isPublic: false,
      createdAt: now,
      updatedAt: now,
    };
  };

  /**
   * Toggle recipe public/private status
   */
  const toggleRecipePublic = async (recipeId: string): Promise<Recipe> => {
    const recipe = await (zero.query.recipes.where('id', recipeId) as any).run();
    if (recipe.length === 0) {
      throw new Error('Recipe not found');
    }

    const currentRecipe = recipe[0];
    const newPublicStatus = !currentRecipe.isPublic;
    const now = Date.now();

    await zero.mutate.recipes.update({
      id: recipeId,
      isPublic: newPublicStatus,
      updatedAt: now,
    });

    return {
      ...currentRecipe,
      isPublic: newPublicStatus,
      updatedAt: now,
    };
  };

  return {
    createRecipe,
    updateRecipe,
    deleteRecipe,
    duplicateRecipe,
    toggleRecipePublic,
  };
}

/**
 * React hook for meal plan mutations
 * Provides functions for creating, updating, and deleting meal plans
 *
 * @returns Object with meal plan mutation functions
 *
 * @example
 * ```typescript
 * const { createMealPlan, updateMealPlan, deleteMealPlan } = useMealPlanMutations();
 * ```
 */
export function useMealPlanMutations() {
  const zero = getZeroInstance();
  const currentUserId = (zero as any).userID || 'demo-user';

  /**
   * Create a new meal plan
   */
  const createMealPlan = async (input: CreateMealPlanInput): Promise<MealPlan> => {
    const id = nanoid();
    const now = Date.now();

    await zero.mutate.meal_plans.create({
      id,
      userId: currentUserId,
      listId: input.listId || '',
      recipeId: input.recipeId,
      plannedDate: input.plannedDate,
      mealType: input.mealType,
      servings: input.servings || 1,
      notes: input.notes || '',
      isCooked: false,
      createdAt: now,
      updatedAt: now,
    });

    return {
      id,
      userId: currentUserId,
      listId: input.listId,
      recipeId: input.recipeId,
      plannedDate: input.plannedDate,
      mealType: input.mealType,
      servings: input.servings || 1,
      notes: input.notes,
      isCooked: false,
      createdAt: now,
      updatedAt: now,
    };
  };

  /**
   * Update an existing meal plan
   */
  const updateMealPlan = async (input: UpdateMealPlanInput): Promise<MealPlan> => {
    const now = Date.now();
    const updates: any = {
      id: input.id,
      updatedAt: now,
    };

    if (input.listId !== undefined) updates.listId = input.listId;
    if (input.recipeId !== undefined) updates.recipeId = input.recipeId;
    if (input.plannedDate !== undefined) updates.plannedDate = input.plannedDate;
    if (input.mealType !== undefined) updates.mealType = input.mealType;
    if (input.servings !== undefined) updates.servings = input.servings;
    if (input.notes !== undefined) updates.notes = input.notes;
    if (input.isCooked !== undefined) updates.isCooked = input.isCooked;

    await zero.mutate.meal_plans.update(updates);

    // Return updated meal plan (simplified)
    return {
      id: input.id,
      userId: currentUserId,
      listId: input.listId,
      recipeId: input.recipeId || '',
      plannedDate: input.plannedDate || Date.now(),
      mealType: input.mealType || 'dinner',
      servings: input.servings || 1,
      notes: input.notes,
      isCooked: input.isCooked || false,
      createdAt: 0,
      updatedAt: now,
    };
  };

  /**
   * Delete a meal plan
   */
  const deleteMealPlan = async (mealPlanId: string): Promise<void> => {
    await zero.mutate.meal_plans.delete({ id: mealPlanId });
  };

  /**
   * Mark a meal as cooked
   */
  const markMealCooked = async (mealPlanId: string): Promise<MealPlan> => {
    const now = Date.now();

    await zero.mutate.meal_plans.update({
      id: mealPlanId,
      isCooked: true,
      updatedAt: now,
    });

    // Fetch and return updated meal plan
    const mealPlans = await (zero.query.meal_plans.where('id', mealPlanId) as any).run();
    if (mealPlans.length === 0) {
      throw new Error('Meal plan not found');
    }

    const mealPlan = mealPlans[0];
    return {
      id: mealPlan.id,
      userId: mealPlan.userId,
      listId: mealPlan.listId,
      recipeId: mealPlan.recipeId,
      plannedDate: mealPlan.plannedDate,
      mealType: mealPlan.mealType,
      servings: mealPlan.servings,
      notes: mealPlan.notes,
      isCooked: true,
      createdAt: mealPlan.createdAt,
      updatedAt: now,
    };
  };

  /**
   * Generate a shopping list from meal plans
   * Creates a new list with grocery items for the selected meal plans
   */
  const generateShoppingList = async (mealPlanIds: string[]): Promise<string> => {
    // Fetch meal plans
    const mealPlans = await (zero.query.meal_plans.where('id', 'IN', mealPlanIds) as any).run();

    // Get unique recipe IDs
    const recipeIds: string[] = [...new Set(mealPlans.map((mp: any) => mp.recipeId))] as string[];

    // Fetch recipes and ingredients
    const recipes = await (zero.query.recipes.where('id', 'IN', recipeIds) as any).run();
    const allIngredients = await (zero.query.recipe_ingredients.where('recipeId', 'IN', recipeIds) as any).run();

    // Create new list
    const listId = nanoid();
    const now = Date.now();

    await zero.mutate.lists.create({
      id: listId,
      name: `Meal Plan - ${new Date().toLocaleDateString()}`,
      owner_id: currentUserId,
      color: '#4CAF50',
      icon: '🍽️',
      budget: 0,
      currency: 'USD',
      createdAt: now,
      updatedAt: now,
      is_archived: false,
      archived_at: 0,
    });

    // Add owner as member
    await zero.mutate.list_members.create({
      id: nanoid(),
      list_id: listId,
      user_id: currentUserId,
      permission: 'owner',
      added_at: now,
      added_by: currentUserId,
      user_email: '',
      user_name: '',
      updated_at: now,
    });

    // Group ingredients by name and sum quantities
    const ingredientMap = new Map<string, {
      name: string;
      quantity: number;
      unit: string;
      category: string;
      notes: string;
    }>();

    mealPlans.forEach((mealPlan: any) => {
      const planIngredients = allIngredients.filter((ing: any) => ing.recipeId === mealPlan.recipeId);
      const servingsMultiplier = mealPlan.servings / (recipes.find((r: any) => r.id === mealPlan.recipeId)?.servings || 1);

      planIngredients.forEach((ing: any) => {
        const key = `${ing.name}-${ing.unit}`;
        const existing = ingredientMap.get(key);

        if (existing) {
          existing.quantity += ing.quantity * servingsMultiplier;
        } else {
          ingredientMap.set(key, {
            name: ing.name,
            quantity: ing.quantity * servingsMultiplier,
            unit: ing.unit,
            category: ing.category || 'Other',
            notes: ing.notes || '',
          });
        }
      });
    });

    // Create grocery items
    const itemPromises = Array.from(ingredientMap.values()).map((item, index) =>
      zero.mutate.grocery_items.create({
        id: nanoid(),
        name: item.name,
        quantity: Math.ceil(item.quantity), // Round up
        gotten: false,
        category: item.category,
        notes: item.notes,
        price: 0,
        user_id: currentUserId,
        list_id: listId,
        createdAt: now + index,
        updatedAt: now + index,
      })
    );

    await Promise.all(itemPromises);

    return listId;
  };

  return {
    createMealPlan,
    updateMealPlan,
    deleteMealPlan,
    markMealCooked,
    generateShoppingList,
  };
}

/**
 * React hook for recipe collection mutations
 * Provides functions for managing recipe collections
 *
 * @returns Object with collection mutation functions
 *
 * @example
 * ```typescript
 * const { createCollection, addRecipeToCollection } = useRecipeCollectionMutations();
 * ```
 */
export function useRecipeCollectionMutations() {
  const zero = getZeroInstance();
  const currentUserId = (zero as any).userID || 'demo-user';

  /**
   * Create a new recipe collection
   */
  const createCollection = async (name: string, description?: string): Promise<RecipeCollection> => {
    const id = nanoid();
    const now = Date.now();

    await zero.mutate.recipe_collections.create({
      id,
      userId: currentUserId,
      name,
      description: description || '',
      isPublic: false,
      createdAt: now,
      updatedAt: now,
    });

    return {
      id,
      userId: currentUserId,
      name,
      description,
      isPublic: false,
      createdAt: now,
      updatedAt: now,
    };
  };

  /**
   * Update a recipe collection
   */
  const updateCollection = async (
    id: string,
    name: string,
    description?: string
  ): Promise<RecipeCollection> => {
    const now = Date.now();

    await zero.mutate.recipe_collections.update({
      id,
      name,
      description: description || '',
      updatedAt: now,
    });

    return {
      id,
      userId: currentUserId,
      name,
      description,
      isPublic: false,
      createdAt: 0,
      updatedAt: now,
    };
  };

  /**
   * Delete a recipe collection
   */
  const deleteCollection = async (collectionId: string): Promise<void> => {
    // Delete collection items first
    const items = await (zero.query.recipe_collection_items.where('collectionId', collectionId) as any).run();
    const deleteItemPromises = items.map((item: any) =>
      zero.mutate.recipe_collection_items.delete({
        collectionId: item.collectionId,
        recipeId: item.recipeId,
      })
    );
    await Promise.all(deleteItemPromises);

    // Delete collection
    await zero.mutate.recipe_collections.delete({ id: collectionId });
  };

  /**
   * Add a recipe to a collection
   */
  const addRecipeToCollection = async (collectionId: string, recipeId: string): Promise<void> => {
    const now = Date.now();

    await zero.mutate.recipe_collection_items.create({
      collectionId,
      recipeId,
      addedAt: now,
    });

    // Update collection's updatedAt
    await zero.mutate.recipe_collections.update({
      id: collectionId,
      updatedAt: now,
    });
  };

  /**
   * Remove a recipe from a collection
   */
  const removeRecipeFromCollection = async (collectionId: string, recipeId: string): Promise<void> => {
    await zero.mutate.recipe_collection_items.delete({
      collectionId,
      recipeId,
    });

    // Update collection's updatedAt
    await zero.mutate.recipe_collections.update({
      id: collectionId,
      updatedAt: Date.now(),
    });
  };

  return {
    createCollection,
    updateCollection,
    deleteCollection,
    addRecipeToCollection,
    removeRecipeFromCollection,
  };
}

/**
 * Utility function to convert a recipe to grocery items
 * Useful for adding recipe ingredients to a shopping list
 *
 * @param recipe - Recipe with ingredients
 * @param servings - Optional servings adjustment (defaults to recipe servings)
 * @returns Array of grocery items ready to be added to a list
 *
 * @example
 * ```typescript
 * const recipe = useRecipe('recipe-123');
 * const items = await recipeToGroceryItems(recipe, 4);
 * ```
 */
export async function recipeToGroceryItems(
  recipe: Recipe,
  servings?: number
): Promise<GroceryItem[]> {
  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    return [];
  }

  const targetServings = servings || recipe.servings;
  const multiplier = targetServings / recipe.servings;
  const now = Date.now();

  return recipe.ingredients.map((ingredient, index) => ({
    id: nanoid(),
    name: `${ingredient.name} (${Math.ceil(ingredient.quantity * multiplier)} ${ingredient.unit})`,
    quantity: Math.ceil(ingredient.quantity * multiplier),
    gotten: false,
    category: (ingredient.category || 'Other') as Category,
    notes: ingredient.notes || `From recipe: ${recipe.name}`,
    userId: recipe.userId,
    listId: recipe.listId || '',
    createdAt: now + index,
    updatedAt: now + index,
  }));
}

// =============================================================================
// Budget and Price Helper Functions
// =============================================================================

/**
 * Calculate the total price of all items in a list
 * Only includes items with price set
 *
 * @param items - Array of grocery items
 * @returns Total cost of all items (quantity * price)
 *
 * @example
 * ```typescript
 * const items = useGroceryItems(listId);
 * const total = calculateListTotal(items);
 * console.log(`Total: $${total.toFixed(2)}`);
 * ```
 */
export function calculateListTotal(items: GroceryItem[]): number {
  return items.reduce((total, item) => {
    const itemPrice = item.price || 0;
    return total + (itemPrice * item.quantity);
  }, 0);
}

/**
 * Calculate budget information for a list
 * Compares total spending against the budget
 *
 * @param items - Array of grocery items
 * @param budget - Optional budget amount (if not provided, returns info without comparison)
 * @returns Budget information including total, spent, remaining, and percent used
 *
 * @example
 * ```typescript
 * const items = useGroceryItems(listId);
 * const lists = useGroceryLists();
 * const currentList = lists.find(l => l.id === listId);
 * const budgetInfo = calculateBudgetInfo(items, currentList?.budget);
 *
 * console.log(`Spent: $${budgetInfo.spent.toFixed(2)}`);
 * console.log(`Remaining: $${budgetInfo.remaining.toFixed(2)}`);
 * console.log(`Percent Used: ${budgetInfo.percentUsed.toFixed(1)}%`);
 * ```
 */
export function calculateBudgetInfo(items: GroceryItem[], budget?: number): BudgetInfo {
  const spent = calculateListTotal(items);
  const totalBudget = budget || 0;
  const remaining = totalBudget - spent;
  const percentUsed = totalBudget > 0 ? (spent / totalBudget) * 100 : 0;

  return {
    total: totalBudget,
    spent,
    remaining,
    percentUsed: Math.min(percentUsed, 100), // Cap at 100%
  };
}

/**
 * Calculate price statistics for items in a list
 * Provides insights about pricing across all items
 *
 * @param items - Array of grocery items
 * @returns Statistics including count, average, min, and max prices
 *
 * @example
 * ```typescript
 * const items = useGroceryItems(listId);
 * const stats = calculatePriceStats(items);
 *
 * console.log(`Items with prices: ${stats.itemsWithPrice}/${stats.totalItems}`);
 * console.log(`Average price: $${stats.averagePrice.toFixed(2)}`);
 * console.log(`Price range: $${stats.minPrice.toFixed(2)} - $${stats.maxPrice.toFixed(2)}`);
 * ```
 */
export function calculatePriceStats(items: GroceryItem[]): PriceStats {
  const totalItems = items.length;
  const itemsWithPrice = items.filter(item => item.price && item.price > 0);
  const itemsWithPriceCount = itemsWithPrice.length;

  if (itemsWithPriceCount === 0) {
    return {
      totalItems,
      itemsWithPrice: 0,
      averagePrice: 0,
      minPrice: 0,
      maxPrice: 0,
    };
  }

  const prices = itemsWithPrice.map(item => item.price!);
  const sum = prices.reduce((acc, price) => acc + price, 0);
  const averagePrice = sum / itemsWithPriceCount;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return {
    totalItems,
    itemsWithPrice: itemsWithPriceCount,
    averagePrice,
    minPrice,
    maxPrice,
  };
}
