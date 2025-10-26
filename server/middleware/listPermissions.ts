/**
 * List Permissions Middleware
 * Middleware for checking user permissions on list operations
 * Verifies list membership and permission levels before allowing operations
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { pool } from '../config/db';

/**
 * Permission levels in the database
 * - owner: Full control over the list (can delete, modify, manage members)
 * - editor: Can add, edit, and delete items in the list
 * - viewer: Can only view items in the list
 */
export type PermissionLevel = 'owner' | 'editor' | 'viewer';

/**
 * Permission hierarchy for comparison
 * Higher values = more permissions
 */
const PERMISSION_HIERARCHY: Record<PermissionLevel, number> = {
  viewer: 1,
  editor: 2,
  owner: 3,
};

/**
 * Result of permission check query
 */
interface PermissionCheckResult {
  permission_level: PermissionLevel;
  list_id: string;
  user_id: string;
}

/**
 * Helper function to get user's permission level for a specific list
 * @param userId - User ID to check
 * @param listId - List ID to check
 * @returns Permission level or null if user is not a member
 */
export async function getUserListPermission(
  userId: string,
  listId: string
): Promise<PermissionLevel | null> {
  const result = await pool.query<PermissionCheckResult>(
    `SELECT permission_level
     FROM list_members
     WHERE list_id = $1 AND user_id = $2`,
    [listId, userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0].permission_level;
}

/**
 * Helper function to check if user is a member of a list
 * @param userId - User ID to check
 * @param listId - List ID to check
 * @returns True if user is a member, false otherwise
 */
export async function isListMember(
  userId: string,
  listId: string
): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1
     FROM list_members
     WHERE list_id = $1 AND user_id = $2`,
    [listId, userId]
  );

  return result.rows.length > 0;
}

/**
 * Helper function to check if user is the owner of a list
 * @param userId - User ID to check
 * @param listId - List ID to check
 * @returns True if user is the owner, false otherwise
 */
export async function isListOwner(
  userId: string,
  listId: string
): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1
     FROM list_members
     WHERE list_id = $1 AND user_id = $2 AND permission_level = 'owner'`,
    [listId, userId]
  );

  return result.rows.length > 0;
}

/**
 * Helper function to check if user has at least the minimum required permission
 * @param userId - User ID to check
 * @param listId - List ID to check
 * @param minPermission - Minimum required permission level
 * @returns True if user has sufficient permissions, false otherwise
 */
export async function hasMinimumPermission(
  userId: string,
  listId: string,
  minPermission: PermissionLevel
): Promise<boolean> {
  const userPermission = await getUserListPermission(userId, listId);

  if (!userPermission) {
    return false;
  }

  const userLevel = PERMISSION_HIERARCHY[userPermission];
  const requiredLevel = PERMISSION_HIERARCHY[minPermission];

  return userLevel >= requiredLevel;
}

/**
 * Middleware factory to check if user has at least the specified permission level
 * @param minPermission - Minimum required permission level
 * @returns Express middleware function
 */
export function checkListAccess(minPermission: PermissionLevel) {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to access this resource',
        });
        return;
      }

      // Get list ID from params
      const listId = req.params.id || req.params.listId;
      if (!listId) {
        res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'List ID is required',
        });
        return;
      }

      const userId = req.user.userId;

      // Check if list exists
      const listExists = await pool.query(
        'SELECT id FROM lists WHERE id = $1',
        [listId]
      );

      if (listExists.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'List not found',
        });
        return;
      }

      // Get user's permission level
      const userPermission = await getUserListPermission(userId, listId);

      // Check if user is a member
      if (!userPermission) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You do not have access to this list',
        });
        return;
      }

      // Check if user has minimum required permission
      const userLevel = PERMISSION_HIERARCHY[userPermission];
      const requiredLevel = PERMISSION_HIERARCHY[minPermission];

      if (userLevel < requiredLevel) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: `This action requires ${minPermission} permission or higher`,
        });
        return;
      }

      // Attach permission to request for use in route handlers
      req.listPermission = userPermission;

      next();
    } catch (error) {
      console.error('List permission check error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Error checking list permissions',
      });
    }
  };
}

/**
 * Middleware to check if user has viewer permission (can view the list)
 * @route Any route that requires viewing list data
 */
export const checkListViewer = checkListAccess('viewer');

/**
 * Middleware to check if user has editor permission (can modify items)
 * @route Any route that modifies list items
 */
export const checkListEditor = checkListAccess('editor');

/**
 * Middleware to check if user has owner permission (can manage list and members)
 * @route Any route that modifies list settings or members
 */
export const checkListOwner = checkListAccess('owner');

/**
 * Extend AuthRequest interface to include list permission
 */
declare module '../types' {
  interface AuthRequest {
    listPermission?: PermissionLevel;
  }
}
