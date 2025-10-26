import { useMemo } from 'react';
import { useQuery } from '@rocicorp/zero/react';
import { getZeroInstance } from '../zero-store';
import type { PermissionLevel } from '../types';

/**
 * Hook to check user permissions for a specific list
 * Returns the permission level and convenience flags
 */
export function useListPermissions(listId: string | null, userId: string | null) {
  const zero = getZeroInstance();

  // Query list membership
  const memberQuery = useQuery(
    listId && userId
      ? (zero.query.list_members
          .where('list_id', listId)
          .where('user_id', userId) as any)
      : ([] as any)
  );

  // Query list to check ownership
  const listQuery = useQuery(
    listId ? (zero.query.lists.where('id', listId) as any) : ([] as any)
  );

  const permissions = useMemo(() => {
    // If no listId or userId, return no permissions
    if (!listId || !userId) {
      return {
        permissionLevel: null,
        canView: false,
        canEdit: false,
        isOwner: false,
        loading: false,
      };
    }

    const list = listQuery[0];
    const member = memberQuery[0];

    // Check if user is the owner
    const isOwner = list?.owner_id === userId;

    // Get permission level
    let permissionLevel: PermissionLevel | null = null;
    if (isOwner) {
      permissionLevel = 'owner';
    } else if (member) {
      permissionLevel = member.permission as PermissionLevel;
    }

    // Determine capabilities
    const canView = permissionLevel !== null;
    const canEdit = permissionLevel === 'owner' || permissionLevel === 'editor';

    return {
      permissionLevel,
      canView,
      canEdit,
      isOwner,
      loading: false,
    };
  }, [listQuery, memberQuery, listId, userId]);

  return permissions;
}

/**
 * Simple hook to just check if user can edit a list
 */
export function useCanEditList(listId: string | null, userId: string | null): boolean {
  const { canEdit } = useListPermissions(listId, userId);
  return canEdit;
}

/**
 * Simple hook to just check if user can view a list
 */
export function useCanViewList(listId: string | null, userId: string | null): boolean {
  const { canView } = useListPermissions(listId, userId);
  return canView;
}
