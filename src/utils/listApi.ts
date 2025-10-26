/**
 * List API Client
 *
 * Provides comprehensive API functions for managing lists and list sharing.
 * Features:
 * - Create, read, update, and delete lists
 * - Get all lists (owned and shared)
 * - Add members to lists
 * - Remove members from lists
 * - Update member permissions
 * - Get list members
 * - Leave shared lists
 *
 * @module utils/listApi
 */

import { apiClient } from './api';
import type { PermissionLevel } from '../types';
import type { ListMember, GroceryList } from '../contexts/ListContext';

/**
 * API Response for list operations
 */
export interface ListApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * Request body for adding a member to a list
 */
export interface AddMemberRequest {
  email: string;
  permissionLevel: PermissionLevel;
}

/**
 * Request body for updating member permissions
 */
export interface UpdatePermissionRequest {
  permissionLevel: PermissionLevel;
}

/**
 * Member with user details (userEmail and userName are already in ListMember)
 */
export type MemberWithDetails = ListMember;

// =============================================================================
// LIST CRUD OPERATIONS
// =============================================================================

/**
 * Create a new list
 *
 * @param name - The name of the list to create
 * @returns The created list
 * @throws {Error} If the request fails
 *
 * @example
 * ```typescript
 * const newList = await createList('Weekly Groceries');
 * console.log('Created list:', newList);
 * ```
 */
export async function createList(name: string): Promise<GroceryList> {
  const response = await apiClient.post<ListApiResponse<{ list: GroceryList }>>(
    '/lists',
    { name }
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || response.message || 'Failed to create list');
  }

  return response.data.list;
}

/**
 * Get all lists (both owned and shared with the current user)
 *
 * @returns Array of all accessible lists
 * @throws {Error} If the request fails
 *
 * @example
 * ```typescript
 * const allLists = await getLists();
 * console.log('All accessible lists:', allLists);
 * ```
 */
export async function getLists(): Promise<GroceryList[]> {
  const [ownedLists, sharedLists] = await Promise.all([
    getUserLists(),
    getSharedLists(),
  ]);

  return [...ownedLists, ...sharedLists];
}

/**
 * Get a specific list by ID
 *
 * @param listId - The list ID to fetch
 * @returns The requested list
 * @throws {Error} If the request fails
 *
 * @example
 * ```typescript
 * const list = await getList('list-123');
 * console.log('List:', list);
 * ```
 */
export async function getList(listId: string): Promise<GroceryList> {
  const response = await apiClient.get<ListApiResponse<{ list: GroceryList }>>(
    `/lists/${listId}`
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || response.message || 'Failed to fetch list');
  }

  return response.data.list;
}

/**
 * Update a list's name
 *
 * @param listId - The list ID to update
 * @param name - The new name for the list
 * @returns The updated list
 * @throws {Error} If the request fails
 *
 * @example
 * ```typescript
 * const updatedList = await updateList('list-123', 'Monthly Groceries');
 * console.log('Updated list:', updatedList);
 * ```
 */
export async function updateList(listId: string, name: string): Promise<GroceryList> {
  const response = await apiClient.patch<ListApiResponse<{ list: GroceryList }>>(
    `/lists/${listId}`,
    { name }
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || response.message || 'Failed to update list');
  }

  return response.data.list;
}

/**
 * Delete a list
 * Only the list owner can delete a list
 *
 * @param listId - The list ID to delete
 * @throws {Error} If the request fails
 *
 * @example
 * ```typescript
 * try {
 *   await deleteList('list-123');
 *   console.log('List deleted successfully');
 * } catch (error) {
 *   console.error('Failed to delete list:', error);
 * }
 * ```
 */
export async function deleteList(listId: string): Promise<void> {
  const response = await apiClient.delete<ListApiResponse>(`/lists/${listId}`);

  if (!response.success) {
    throw new Error(response.error || response.message || 'Failed to delete list');
  }
}

// =============================================================================
// LIST FETCHING OPERATIONS
// =============================================================================

/**
 * Get all lists owned by the current user
 *
 * @returns Array of lists owned by the user
 * @throws {Error} If the request fails
 *
 * @example
 * ```typescript
 * const myLists = await getUserLists();
 * console.log('My lists:', myLists);
 * ```
 */
export async function getUserLists(): Promise<GroceryList[]> {
  const response = await apiClient.get<ListApiResponse<{ lists: GroceryList[] }>>('/lists');

  if (!response.success || !response.data) {
    throw new Error(response.error || response.message || 'Failed to fetch lists');
  }

  return response.data.lists;
}

/**
 * Get lists shared with the current user
 *
 * @returns Array of lists the user has been invited to
 * @throws {Error} If the request fails
 *
 * @example
 * ```typescript
 * const sharedLists = await getSharedLists();
 * console.log('Lists shared with me:', sharedLists);
 * ```
 */
export async function getSharedLists(): Promise<GroceryList[]> {
  const response = await apiClient.get<ListApiResponse<{ lists: GroceryList[] }>>('/lists/shared');

  if (!response.success || !response.data) {
    throw new Error(response.error || response.message || 'Failed to fetch shared lists');
  }

  return response.data.lists;
}

/**
 * Get a specific list with its members
 *
 * @param listId - The list ID to fetch
 * @returns List with members
 * @throws {Error} If the request fails
 *
 * @example
 * ```typescript
 * const list = await getListWithMembers('list-123');
 * console.log('List members:', list.members);
 * ```
 */
export async function getListWithMembers(listId: string): Promise<GroceryList> {
  const response = await apiClient.get<ListApiResponse<{ list: GroceryList }>>(
    `/lists/${listId}`
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || response.message || 'Failed to fetch list');
  }

  return response.data.list;
}

/**
 * Get members of a specific list
 *
 * @param listId - The list ID
 * @returns Array of list members with user details
 * @throws {Error} If the request fails
 *
 * @example
 * ```typescript
 * const members = await getListMembers('list-123');
 * console.log('Members:', members);
 * ```
 */
export async function getListMembers(listId: string): Promise<ListMember[]> {
  const response = await apiClient.get<ListApiResponse<{ members: ListMember[] }>>(
    `/lists/${listId}/members`
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || response.message || 'Failed to fetch list members');
  }

  return response.data.members;
}

/**
 * Add a member to a list by email address
 *
 * @param listId - The list ID
 * @param email - The email address of the user to invite
 * @param permissionLevel - The permission level to grant (editor or viewer)
 * @returns The created member record
 * @throws {Error} If the request fails
 *
 * @example
 * ```typescript
 * try {
 *   const member = await addListMember('list-123', 'user@example.com', 'editor');
 *   console.log('Member added:', member);
 * } catch (error) {
 *   console.error('Failed to add member:', error);
 * }
 * ```
 */
export async function addListMember(
  listId: string,
  email: string,
  permissionLevel: PermissionLevel
): Promise<ListMember> {
  const requestBody: AddMemberRequest = {
    email,
    permissionLevel,
  };

  const response = await apiClient.post<ListApiResponse<{ member: ListMember }>>(
    `/lists/${listId}/members`,
    requestBody
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || response.message || 'Failed to add member');
  }

  return response.data.member;
}

/**
 * Remove a member from a list
 * Only the list owner can remove members
 *
 * @param listId - The list ID
 * @param userId - The user ID to remove
 * @throws {Error} If the request fails
 *
 * @example
 * ```typescript
 * try {
 *   await removeListMember('list-123', 'user-456');
 *   console.log('Member removed successfully');
 * } catch (error) {
 *   console.error('Failed to remove member:', error);
 * }
 * ```
 */
export async function removeListMember(listId: string, userId: string): Promise<void> {
  const response = await apiClient.delete<ListApiResponse>(
    `/lists/${listId}/members/${userId}`
  );

  if (!response.success) {
    throw new Error(response.error || response.message || 'Failed to remove member');
  }
}

/**
 * Update a member's permission level
 * Only the list owner can update permissions
 *
 * @param listId - The list ID
 * @param userId - The user ID whose permission to update
 * @param permissionLevel - The new permission level
 * @returns The updated member record
 * @throws {Error} If the request fails
 *
 * @example
 * ```typescript
 * try {
 *   const updatedMember = await updateMemberPermission(
 *     'list-123',
 *     'user-456',
 *     'viewer'
 *   );
 *   console.log('Permission updated:', updatedMember);
 * } catch (error) {
 *   console.error('Failed to update permission:', error);
 * }
 * ```
 */
export async function updateMemberPermission(
  listId: string,
  userId: string,
  permissionLevel: PermissionLevel
): Promise<ListMember> {
  const requestBody: UpdatePermissionRequest = {
    permissionLevel,
  };

  const response = await apiClient.patch<ListApiResponse<{ member: ListMember }>>(
    `/lists/${listId}/members/${userId}`,
    requestBody
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || response.message || 'Failed to update permission');
  }

  return response.data.member;
}

/**
 * Leave a shared list
 * Allows a user to remove themselves from a list they were invited to
 *
 * @param listId - The list ID to leave
 * @throws {Error} If the request fails
 *
 * @example
 * ```typescript
 * try {
 *   await leaveList('list-123');
 *   console.log('Left list successfully');
 * } catch (error) {
 *   console.error('Failed to leave list:', error);
 * }
 * ```
 */
export async function leaveList(listId: string): Promise<void> {
  const response = await apiClient.post<ListApiResponse>(`/lists/${listId}/leave`);

  if (!response.success) {
    throw new Error(response.error || response.message || 'Failed to leave list');
  }
}

/**
 * Duplicate an existing list
 * Creates a copy of a list with all items (gotten status reset)
 * The requester becomes the owner of the new list
 * Members are not copied
 *
 * @param listId - The list ID to duplicate
 * @param name - Optional new name for the duplicated list (defaults to "Copy of [original name]")
 * @returns The newly created list
 * @throws {Error} If the request fails
 *
 * @example
 * ```typescript
 * try {
 *   const newList = await duplicateList('list-123', 'Weekly Groceries');
 *   console.log('List duplicated:', newList);
 * } catch (error) {
 *   console.error('Failed to duplicate list:', error);
 * }
 * ```
 */
export async function duplicateList(listId: string, name?: string): Promise<GroceryList> {
  const response = await apiClient.post<ListApiResponse<{ list: GroceryList }>>(
    `/lists/${listId}/duplicate`,
    name ? { name } : {}
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || response.message || 'Failed to duplicate list');
  }

  return response.data.list;
}

/**
 * Archive a list
 * Hides the list from the default view but keeps it accessible via archived lists
 * Only the list owner can archive a list
 *
 * @param listId - The list ID to archive
 * @returns The updated list
 * @throws {Error} If the request fails
 *
 * @example
 * ```typescript
 * try {
 *   const archivedList = await archiveList('list-123');
 *   console.log('List archived:', archivedList);
 * } catch (error) {
 *   console.error('Failed to archive list:', error);
 * }
 * ```
 */
export async function archiveList(listId: string): Promise<GroceryList> {
  const response = await apiClient.post<ListApiResponse<{ list: GroceryList }>>(
    `/lists/${listId}/archive`
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || response.message || 'Failed to archive list');
  }

  return response.data.list;
}

/**
 * Unarchive a list
 * Restores an archived list to the default view
 * Only the list owner can unarchive a list
 *
 * @param listId - The list ID to unarchive
 * @returns The updated list
 * @throws {Error} If the request fails
 *
 * @example
 * ```typescript
 * try {
 *   const unarchivedList = await unarchiveList('list-123');
 *   console.log('List unarchived:', unarchivedList);
 * } catch (error) {
 *   console.error('Failed to unarchive list:', error);
 * }
 * ```
 */
export async function unarchiveList(listId: string): Promise<GroceryList> {
  const response = await apiClient.post<ListApiResponse<{ list: GroceryList }>>(
    `/lists/${listId}/unarchive`
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || response.message || 'Failed to unarchive list');
  }

  return response.data.list;
}

/**
 * List API client with all list operations
 */
export const listApi = {
  // CRUD operations
  createList,
  getLists,
  getList,
  updateList,
  deleteList,
  duplicateList,
  archiveList,
  unarchiveList,

  // List fetching
  getUserLists,
  getSharedLists,
  getListWithMembers,

  // Member management
  getListMembers,
  addListMember,
  removeListMember,
  updateMemberPermission,
  leaveList,
};

/**
 * Default export for convenience
 */
export default listApi;
