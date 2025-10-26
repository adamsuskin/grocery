/**
 * Lists middleware
 * Permission checking and validation for list operations
 */

import { Response, NextFunction } from 'express';
import { AuthRequest, PermissionLevel } from '../types';
import { pool } from '../config/db';
import { NotFoundError, AuthorizationError } from '../middleware/errorHandler';

/**
 * Check if user has access to a list (is a member)
 */
export async function checkListAccess(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Check if list exists
    const listResult = await pool.query(
      'SELECT id FROM lists WHERE id = $1',
      [id]
    );

    if (listResult.rows.length === 0) {
      throw new NotFoundError('List not found');
    }

    // Check if user is a member
    const memberResult = await pool.query(
      'SELECT permission_level FROM list_members WHERE list_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (memberResult.rows.length === 0) {
      throw new AuthorizationError('You do not have access to this list');
    }

    // Attach permission to request for later use
    req.listPermission = memberResult.rows[0].permission_level;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Check if user is the owner of a list
 */
export async function checkListOwner(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Check if list exists and user is owner
    const listResult = await pool.query(
      'SELECT owner_id FROM lists WHERE id = $1',
      [id]
    );

    if (listResult.rows.length === 0) {
      throw new NotFoundError('List not found');
    }

    if (listResult.rows[0].owner_id !== userId) {
      throw new AuthorizationError('Only the list owner can perform this action');
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Check if user has at least edit permission on a list
 */
export async function checkListEditPermission(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Check if list exists
    const listResult = await pool.query(
      'SELECT id FROM lists WHERE id = $1',
      [id]
    );

    if (listResult.rows.length === 0) {
      throw new NotFoundError('List not found');
    }

    // Check if user has edit or owner permission
    const memberResult = await pool.query(
      'SELECT permission_level FROM list_members WHERE list_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (memberResult.rows.length === 0) {
      throw new AuthorizationError('You do not have access to this list');
    }

    const permission = memberResult.rows[0].permission_level as PermissionLevel;

    if (permission !== 'editor' && permission !== 'owner') {
      throw new AuthorizationError('You need editor permission to perform this action');
    }

    // Attach permission to request for later use
    req.listPermission = permission;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Validate list member permission value
 */
export function validatePermission(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const { permission } = req.body;

  const validPermissions: PermissionLevel[] = ['owner', 'editor', 'viewer'];

  if (permission && !validPermissions.includes(permission)) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      message: `Permission must be one of: ${validPermissions.join(', ')}`,
    });
    return;
  }

  next();
}

/**
 * Extend AuthRequest to include list permission
 */
declare module '../types' {
  interface AuthRequest {
    listPermission?: PermissionLevel;
  }
}
