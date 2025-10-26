/**
 * ShareListModal Usage Example
 *
 * This example demonstrates how to integrate the ShareListModal component
 * with your list management UI.
 */

import { useState } from 'react';
import { ShareListModal } from './ShareListModal';
import { listApi } from '../utils/listApi';
import { useList } from '../contexts/ListContext';
import type { PermissionLevel } from '../types';

/**
 * Example: Share List Button Component
 *
 * Shows a button that opens the share modal for the current list.
 */
export function ShareListButton() {
  const [showModal, setShowModal] = useState(false);
  const { currentList, refreshList } = useList();

  if (!currentList) {
    return null;
  }

  /**
   * Handle adding a new member to the list
   */
  const handleAddMember = async (email: string, permission: PermissionLevel) => {
    try {
      await listApi.addListMember(currentList.id, email, permission);
      // Refresh the list to get updated members
      await refreshList();
    } catch (error) {
      console.error('Failed to add member:', error);
      throw error; // Re-throw so modal can show error
    }
  };

  /**
   * Handle removing a member from the list
   */
  const handleRemoveMember = async (userId: string) => {
    try {
      await listApi.removeListMember(currentList.id, userId);
      // Refresh the list to get updated members
      await refreshList();
    } catch (error) {
      console.error('Failed to remove member:', error);
      throw error; // Re-throw so modal can show error
    }
  };

  /**
   * Handle updating a member's permission
   */
  const handleUpdatePermission = async (userId: string, permission: PermissionLevel) => {
    try {
      await listApi.updateMemberPermission(currentList.id, userId, permission);
      // Refresh the list to get updated members
      await refreshList();
    } catch (error) {
      console.error('Failed to update permission:', error);
      throw error; // Re-throw so modal can show error
    }
  };

  return (
    <>
      <button className="btn btn-primary" onClick={() => setShowModal(true)}>
        Share List
      </button>

      {showModal && (
        <ShareListModal
          listId={currentList.id}
          members={currentList.members}
          currentUserId={currentList.ownerId}
          onClose={() => setShowModal(false)}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
          onUpdatePermission={handleUpdatePermission}
        />
      )}
    </>
  );
}

/**
 * Example: Complete List Header with Share Button
 *
 * Shows how to integrate the share button into a list header.
 */
export function ListHeader() {
  const { currentList, userPermission } = useList();

  if (!currentList) {
    return null;
  }

  // Only list owner can share
  const canShare = userPermission === 'owner';

  return (
    <div className="list-header">
      <div className="list-title">
        <h1>{currentList.name}</h1>
        <div className="list-meta">
          <span className="member-count">
            {currentList.members.length} member{currentList.members.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {canShare && <ShareListButton />}
    </div>
  );
}

/**
 * Example: Standalone Share List Page
 *
 * Shows how to use ShareListModal as a full-page component.
 */
export function ShareListPage({ listId }: { listId: string }) {
  const [list, setList] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load list data
  const loadList = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listApi.getListWithMembers(listId);
      setList(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load list');
    } finally {
      setLoading(false);
    }
  };

  // Load on mount
  useState(() => {
    loadList();
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error || !list) {
    return <div>Error: {error || 'List not found'}</div>;
  }

  return (
    <div className="share-list-page">
      <div className="page-header">
        <h1>Share {list.name}</h1>
      </div>

      <ShareListModal
        listId={list.id}
        members={list.members}
        currentUserId={list.ownerId}
        onClose={() => window.history.back()}
        onAddMember={async (email, permission) => {
          await listApi.addListMember(list.id, email, permission);
          await loadList(); // Reload list
        }}
        onRemoveMember={async (userId) => {
          await listApi.removeListMember(list.id, userId);
          await loadList(); // Reload list
        }}
        onUpdatePermission={async (userId, permission) => {
          await listApi.updateMemberPermission(list.id, userId, permission);
          await loadList(); // Reload list
        }}
      />
    </div>
  );
}

/**
 * Example: Custom Styling
 *
 * You can customize the modal appearance by adding CSS:
 *
 * ```css
 * // Custom brand colors
 * .share-modal-content {
 *   border-top: 4px solid #your-brand-color;
 * }
 *
 * .btn-add-member {
 *   background-color: #your-brand-color;
 * }
 *
 * .permission-badge.permission-owner {
 *   background-color: #your-accent-color;
 * }
 * ```
 */

/**
 * Example: Error Handling
 *
 * The modal automatically displays error messages, but you can also
 * handle errors in your callbacks:
 *
 * ```tsx
 * const handleAddMember = async (email: string, permission: PermissionLevel) => {
 *   try {
 *     await listApi.addListMember(currentList.id, email, permission);
 *     await refreshList();
 *   } catch (error) {
 *     if (error.message.includes('already a member')) {
 *       // Handle duplicate member error
 *     } else if (error.message.includes('not found')) {
 *       // Handle user not found error
 *     } else {
 *       // Handle general error
 *     }
 *     throw error; // Re-throw so modal shows the error
 *   }
 * };
 * ```
 */

/**
 * Example: Permission Checks
 *
 * Use the ListContext hooks to check permissions:
 *
 * ```tsx
 * import { useList, useCanEditList } from '../contexts/ListContext';
 *
 * function MyComponent() {
 *   const { currentList, userPermission } = useList();
 *   const canEdit = useCanEditList();
 *
 *   // Check if user can share (only owner)
 *   const canShare = userPermission === 'owner';
 *
 *   // Check if user can edit items (owner or editor)
 *   const canModify = canEdit;
 *
 *   return (
 *     <div>
 *       {canShare && <ShareListButton />}
 *       {canModify && <AddItemForm />}
 *     </div>
 *   );
 * }
 * ```
 */
