/**
 * Activities controller
 * Handles activity logging and retrieval for list actions
 */

import { Response } from 'express';
import { AuthRequest } from '../types';
import { pool } from '../config/db';
import { NotFoundError } from '../middleware/errorHandler';

/**
 * Activity types
 */
export type ActivityAction =
  | 'list_created'
  | 'list_renamed'
  | 'list_deleted'
  | 'list_archived'
  | 'list_unarchived'
  | 'list_shared'
  | 'member_added'
  | 'member_removed'
  | 'member_permission_changed'
  | 'ownership_transferred'
  | 'item_added'
  | 'item_updated'
  | 'item_deleted'
  | 'item_checked'
  | 'item_unchecked'
  | 'items_cleared'
  | 'items_bulk_deleted'
  | 'category_created'
  | 'category_updated'
  | 'category_archived'
  | 'category_restored'
  | 'category_deleted'
  | 'category_merged';

/**
 * Activity entity
 */
export interface Activity {
  id: string;
  list_id: string;
  user_id: string;
  action: ActivityAction;
  details: Record<string, any> | null;
  created_at: Date;
}

/**
 * Activity with user details
 */
export interface ActivityWithUser extends Activity {
  user: {
    id: string;
    email: string;
    name: string;
  };
  list_name: string;
}

/**
 * Get activities for a specific list
 * @route GET /api/lists/:id/activities
 */
export async function getListActivities(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.userId;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  // Check if list exists
  const listResult = await pool.query(
    'SELECT * FROM lists WHERE id = $1',
    [id]
  );

  if (listResult.rows.length === 0) {
    throw new NotFoundError('List not found');
  }

  // Check if user has access to the list
  const memberResult = await pool.query(
    'SELECT * FROM list_members WHERE list_id = $1 AND user_id = $2',
    [id, userId]
  );

  if (memberResult.rows.length === 0) {
    throw new NotFoundError('You do not have access to this list');
  }

  // Get activities for the list
  const result = await pool.query<ActivityWithUser>(
    `SELECT
       la.id,
       la.list_id,
       la.user_id,
       la.action,
       la.details,
       la.created_at,
       json_build_object(
         'id', u.id,
         'email', u.email,
         'name', u.name
       ) as user,
       l.name as list_name
     FROM list_activities la
     JOIN users u ON la.user_id = u.id
     JOIN lists l ON la.list_id = l.id
     WHERE la.list_id = $1
     ORDER BY la.created_at DESC
     LIMIT $2 OFFSET $3`,
    [id, limit, offset]
  );

  // Get total count
  const countResult = await pool.query(
    'SELECT COUNT(*) FROM list_activities WHERE list_id = $1',
    [id]
  );

  const total = parseInt(countResult.rows[0].count);

  res.json({
    success: true,
    data: {
      activities: result.rows,
      total,
      limit,
      offset,
    },
  });
}

/**
 * Log an activity for a list
 * This is a helper function used by other controllers
 */
export async function logActivity(
  listId: string,
  userId: string,
  action: ActivityAction,
  details?: Record<string, any>
): Promise<string> {
  const result = await pool.query<{ id: string }>(
    `INSERT INTO list_activities (list_id, user_id, action, details)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [listId, userId, action, details ? JSON.stringify(details) : null]
  );

  return result.rows[0].id;
}

/**
 * Create a new activity entry
 * @route POST /api/lists/:id/activities
 */
export async function createActivity(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.userId;
  const { action, details } = req.body;

  // Validate action
  const validActions: ActivityAction[] = [
    'list_created',
    'list_renamed',
    'list_deleted',
    'list_archived',
    'list_unarchived',
    'list_shared',
    'member_added',
    'member_removed',
    'member_permission_changed',
    'ownership_transferred',
    'item_added',
    'item_updated',
    'item_deleted',
    'item_checked',
    'item_unchecked',
    'items_cleared',
    'items_bulk_deleted',
    'category_created',
    'category_updated',
    'category_archived',
    'category_restored',
    'category_deleted',
    'category_merged',
  ];

  if (!action || !validActions.includes(action)) {
    res.status(400).json({
      success: false,
      message: 'Invalid activity action',
    });
    return;
  }

  // Check if list exists
  const listResult = await pool.query(
    'SELECT * FROM lists WHERE id = $1',
    [id]
  );

  if (listResult.rows.length === 0) {
    throw new NotFoundError('List not found');
  }

  // Check if user has access to the list
  const memberResult = await pool.query(
    'SELECT * FROM list_members WHERE list_id = $1 AND user_id = $2',
    [id, userId]
  );

  if (memberResult.rows.length === 0) {
    throw new NotFoundError('You do not have access to this list');
  }

  // Log the activity
  const activityId = await logActivity(id, userId, action, details);

  res.status(201).json({
    success: true,
    data: {
      id: activityId,
    },
  });
}

/**
 * Format activity message for display
 * This creates human-readable messages for activities
 */
export function formatActivityMessage(activity: ActivityWithUser): string {
  const userName = activity.user.name;

  switch (activity.action) {
    case 'list_created':
      return `${userName} created the list`;

    case 'list_renamed':
      return `${userName} renamed the list to "${activity.details?.newName}"`;

    case 'list_deleted':
      return `${userName} deleted the list`;

    case 'list_shared':
      return `${userName} shared the list`;

    case 'member_added':
      return `${userName} added ${activity.details?.memberName} to the list`;

    case 'member_removed':
      return `${userName} removed ${activity.details?.memberName} from the list`;

    case 'member_permission_changed':
      return `${userName} changed ${activity.details?.memberName}'s permission to ${activity.details?.newPermission}`;

    case 'ownership_transferred':
      return `${userName} transferred ownership to ${activity.details?.newOwnerName}`;

    case 'item_added':
      return `${userName} added "${activity.details?.itemName}"`;

    case 'item_updated':
      return `${userName} updated "${activity.details?.itemName}"`;

    case 'item_deleted':
      return `${userName} deleted "${activity.details?.itemName}"`;

    case 'item_checked':
      return `${userName} marked "${activity.details?.itemName}" as gotten`;

    case 'item_unchecked':
      return `${userName} marked "${activity.details?.itemName}" as not gotten`;

    case 'items_cleared':
      return `${userName} cleared ${activity.details?.count} completed items`;

    case 'items_bulk_deleted':
      return `${userName} deleted ${activity.details?.count} items`;

    case 'category_created':
      return `${userName} created category "${activity.details?.category_name}"`;

    case 'category_updated':
      if (activity.details?.changes && Array.isArray(activity.details.changes)) {
        const changeFields = activity.details.changes.map((c: any) => c.field).join(', ');
        return `${userName} updated category "${activity.details?.category_name}" (${changeFields})`;
      }
      return `${userName} updated category "${activity.details?.category_name}"`;

    case 'category_archived':
      return `${userName} archived category "${activity.details?.category_name}"`;

    case 'category_restored':
      return `${userName} restored category "${activity.details?.category_name}"`;

    case 'category_deleted':
      return `${userName} deleted category "${activity.details?.category_name}"`;

    case 'category_merged':
      const sourceCount = activity.details?.source_categories?.length || 0;
      return `${userName} merged ${sourceCount} categories into "${activity.details?.category_name}"`;

    default:
      return `${userName} performed an action`;
  }
}
