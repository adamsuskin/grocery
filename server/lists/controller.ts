/**
 * Lists controller
 * Handles all list management operations including CRUD and member management
 */

import { Response } from 'express';
import { AuthRequest } from '../types';
import { pool } from '../config/db';
import {
  List,
  ListResponse,
  ListMember,
  ListMemberWithUser,
  UserResponse,
  PermissionLevel,
  User
} from '../types';
import { NotFoundError, AuthorizationError, ValidationError } from '../middleware/errorHandler';
import { logActivity } from '../activities/controller';

/**
 * Create a new list
 * @route POST /api/lists
 */
export async function createList(req: AuthRequest, res: Response): Promise<void> {
  const { name, color, icon } = req.body;
  const userId = req.user!.userId;

  // Validate color if provided
  if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
    throw new ValidationError('Invalid color format. Must be a hex color (e.g., #4caf50)');
  }

  // Validate icon if provided
  if (icon && icon.length > 10) {
    throw new ValidationError('Icon must be 10 characters or less');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create the list with optional color and icon
    const listResult = await client.query<List>(
      `INSERT INTO lists (name, owner_id, color, icon)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, userId, color || '#4caf50', icon || '📝']
    );

    const list = listResult.rows[0];

    // Owner is automatically added to list_members by database trigger
    // The ensure_list_owner_membership_trigger will handle this

    await client.query('COMMIT');

    // Log activity
    await logActivity(list.id, userId, 'list_created', { listName: name }).catch(err =>
      console.error('Failed to log activity:', err)
    );

    res.status(201).json({
      success: true,
      data: {
        list: {
          ...list,
          permission: 'owner',
        },
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get all lists for current user
 * @route GET /api/lists
 * @query includeArchived - Optional boolean to include archived lists (default: false)
 * @query pinned - Optional boolean filter: 'true' for only pinned, 'false' for only unpinned
 */
export async function getLists(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const includeArchived = req.query.includeArchived === 'true';
  const { pinned } = req.query;

  // Get all lists where user is a member with pin status
  let query = `
    SELECT
       l.*,
       lm.permission_level as permission,
       CASE WHEN lp.user_id IS NOT NULL THEN true ELSE false END as is_pinned,
       lp.pinned_at
     FROM lists l
     INNER JOIN list_members lm ON l.id = lm.list_id
     LEFT JOIN list_pins lp ON l.id = lp.list_id AND lp.user_id = $1
     WHERE lm.user_id = $1
       ${includeArchived ? '' : 'AND l.is_archived = false'}
  `;

  // Filter by pinned status if specified
  if (pinned === 'true') {
    query += ' AND lp.user_id IS NOT NULL';
  } else if (pinned === 'false') {
    query += ' AND lp.user_id IS NULL';
  }

  // Order by pinned status first, then by created date
  query += ' ORDER BY is_pinned DESC, l.created_at DESC';

  const result = await pool.query<ListResponse>(query, [userId]);

  res.json({
    success: true,
    data: {
      lists: result.rows,
    },
  });
}

/**
 * Get specific list with members
 * @route GET /api/lists/:id
 */
export async function getList(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.userId;

  // Get list details
  const listResult = await pool.query<List>(
    'SELECT * FROM lists WHERE id = $1',
    [id]
  );

  if (listResult.rows.length === 0) {
    throw new NotFoundError('List not found');
  }

  const list = listResult.rows[0];

  // Check if user is a member
  const memberResult = await pool.query<ListMember>(
    'SELECT * FROM list_members WHERE list_id = $1 AND user_id = $2',
    [id, userId]
  );

  if (memberResult.rows.length === 0) {
    throw new AuthorizationError('You do not have access to this list');
  }

  const userPermission = memberResult.rows[0].permission_level;

  // Get all members with user details
  const membersResult = await pool.query<ListMemberWithUser>(
    `SELECT
       lm.*,
       json_build_object(
         'id', u.id,
         'email', u.email,
         'name', u.name,
         'created_at', u.created_at
       ) as user
     FROM list_members lm
     INNER JOIN users u ON lm.user_id = u.id
     WHERE lm.list_id = $1
     ORDER BY lm.joined_at ASC`,
    [id]
  );

  res.json({
    success: true,
    data: {
      list: {
        ...list,
        permission: userPermission,
        members: membersResult.rows,
      },
    },
  });
}

/**
 * Update list name, color, and/or icon
 * @route PUT /api/lists/:id
 */
export async function updateList(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { name, color, icon } = req.body;
  const userId = req.user!.userId;

  // Check if list exists
  const listResult = await pool.query<List>(
    'SELECT * FROM lists WHERE id = $1',
    [id]
  );

  if (listResult.rows.length === 0) {
    throw new NotFoundError('List not found');
  }

  const list = listResult.rows[0];

  // Only owner can update list
  if (list.owner_id !== userId) {
    throw new AuthorizationError('Only the list owner can update the list');
  }

  // Build dynamic update query based on provided fields
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (name !== undefined) {
    updates.push(`name = $${paramCount++}`);
    values.push(name);
  }

  if (color !== undefined) {
    // Validate hex color format
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      throw new ValidationError('Invalid color format. Must be a hex color (e.g., #4caf50)');
    }
    updates.push(`color = $${paramCount++}`);
    values.push(color);
  }

  if (icon !== undefined) {
    // Validate icon length
    if (icon.length > 10) {
      throw new ValidationError('Icon must be 10 characters or less');
    }
    updates.push(`icon = $${paramCount++}`);
    values.push(icon);
  }

  if (updates.length === 0) {
    throw new ValidationError('No fields to update');
  }

  values.push(id);

  // Update list
  const updateResult = await pool.query<List>(
    `UPDATE lists
     SET ${updates.join(', ')}
     WHERE id = $${paramCount}
     RETURNING *`,
    values
  );

  // Log activity based on what was updated
  const activityDetails: any = {};
  if (name !== undefined) {
    activityDetails.oldName = list.name;
    activityDetails.newName = name;
  }
  if (color !== undefined) {
    activityDetails.color = color;
  }
  if (icon !== undefined) {
    activityDetails.icon = icon;
  }

  const activityAction = 'list_renamed';
  await logActivity(id, userId, activityAction, activityDetails).catch(err =>
    console.error('Failed to log activity:', err)
  );

  res.json({
    success: true,
    data: {
      list: updateResult.rows[0],
    },
  });
}

/**
 * Delete list
 * @route DELETE /api/lists/:id
 */
export async function deleteList(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.userId;

  // Check if list exists
  const listResult = await pool.query<List>(
    'SELECT * FROM lists WHERE id = $1',
    [id]
  );

  if (listResult.rows.length === 0) {
    throw new NotFoundError('List not found');
  }

  const list = listResult.rows[0];

  // Only owner can delete list
  if (list.owner_id !== userId) {
    throw new AuthorizationError('Only the list owner can delete the list');
  }

  // Log activity before deletion
  await logActivity(id, userId, 'list_deleted', {
    listName: list.name
  }).catch(err => console.error('Failed to log activity:', err));

  // Delete list (CASCADE will handle members and items)
  await pool.query('DELETE FROM lists WHERE id = $1', [id]);

  res.json({
    success: true,
    message: 'List deleted successfully',
  });
}

/**
 * Add member to list
 * @route POST /api/lists/:id/members
 */
export async function addListMember(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { userId: newMemberUserId, permission = 'editor' } = req.body;
  const userId = req.user!.userId;

  // Check if list exists
  const listResult = await pool.query<List>(
    'SELECT * FROM lists WHERE id = $1',
    [id]
  );

  if (listResult.rows.length === 0) {
    throw new NotFoundError('List not found');
  }

  const list = listResult.rows[0];

  // Only owner can add members
  if (list.owner_id !== userId) {
    throw new AuthorizationError('Only the list owner can add members');
  }

  // Check if user to add exists
  const userResult = await pool.query(
    'SELECT id, email, name, created_at FROM users WHERE id = $1',
    [newMemberUserId]
  );

  if (userResult.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  // Check if user is already a member
  const existingMember = await pool.query(
    'SELECT * FROM list_members WHERE list_id = $1 AND user_id = $2',
    [id, newMemberUserId]
  );

  if (existingMember.rows.length > 0) {
    throw new ValidationError('User is already a member of this list');
  }

  // Add member
  const memberResult = await pool.query<ListMember>(
    `INSERT INTO list_members (list_id, user_id, permission_level)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [id, newMemberUserId, permission]
  );

  const member = memberResult.rows[0];

  // Log activity
  await logActivity(id, userId, 'member_added', {
    memberName: userResult.rows[0].name,
    memberEmail: userResult.rows[0].email,
    permission
  }).catch(err => console.error('Failed to log activity:', err));

  res.status(201).json({
    success: true,
    data: {
      member: {
        ...member,
        user: userResult.rows[0],
      },
    },
  });
}

/**
 * Remove member from list
 * @route DELETE /api/lists/:id/members/:userId
 */
export async function removeListMember(req: AuthRequest, res: Response): Promise<void> {
  const { id, userId: memberUserId } = req.params;
  const userId = req.user!.userId;

  // Check if list exists
  const listResult = await pool.query<List>(
    'SELECT * FROM lists WHERE id = $1',
    [id]
  );

  if (listResult.rows.length === 0) {
    throw new NotFoundError('List not found');
  }

  const list = listResult.rows[0];

  // Only owner can remove members
  if (list.owner_id !== userId) {
    throw new AuthorizationError('Only the list owner can remove members');
  }

  // Cannot remove the owner
  if (memberUserId === list.owner_id) {
    throw new ValidationError('Cannot remove the list owner');
  }

  // Check if member exists
  const memberResult = await pool.query(
    'SELECT * FROM list_members WHERE list_id = $1 AND user_id = $2',
    [id, memberUserId]
  );

  if (memberResult.rows.length === 0) {
    throw new NotFoundError('Member not found in this list');
  }

  // Get user details before removal for logging
  const userResult = await pool.query(
    'SELECT name, email FROM users WHERE id = $1',
    [memberUserId]
  );

  // Remove member
  await pool.query(
    'DELETE FROM list_members WHERE list_id = $1 AND user_id = $2',
    [id, memberUserId]
  );

  // Log activity
  if (userResult.rows.length > 0) {
    await logActivity(id, userId, 'member_removed', {
      memberName: userResult.rows[0].name,
      memberEmail: userResult.rows[0].email
    }).catch(err => console.error('Failed to log activity:', err));
  }

  res.json({
    success: true,
    message: 'Member removed successfully',
  });
}

/**
 * Update member permission
 * @route PUT /api/lists/:id/members/:userId
 */
export async function updateListMember(req: AuthRequest, res: Response): Promise<void> {
  const { id, userId: memberUserId } = req.params;
  const { permission } = req.body;
  const userId = req.user!.userId;

  // Check if list exists
  const listResult = await pool.query<List>(
    'SELECT * FROM lists WHERE id = $1',
    [id]
  );

  if (listResult.rows.length === 0) {
    throw new NotFoundError('List not found');
  }

  const list = listResult.rows[0];

  // Only owner can update member permissions
  if (list.owner_id !== userId) {
    throw new AuthorizationError('Only the list owner can update member permissions');
  }

  // Cannot change owner's permission
  if (memberUserId === list.owner_id) {
    throw new ValidationError('Cannot change the list owner\'s permission');
  }

  // Check if member exists
  const memberResult = await pool.query(
    'SELECT * FROM list_members WHERE list_id = $1 AND user_id = $2',
    [id, memberUserId]
  );

  if (memberResult.rows.length === 0) {
    throw new NotFoundError('Member not found in this list');
  }

  // Update permission
  const updateResult = await pool.query<ListMember>(
    `UPDATE list_members
     SET permission_level = $1
     WHERE list_id = $2 AND user_id = $3
     RETURNING *`,
    [permission, id, memberUserId]
  );

  // Get user details
  const userResult = await pool.query<UserResponse>(
    'SELECT id, email, name, created_at FROM users WHERE id = $1',
    [memberUserId]
  );

  // Log activity
  await logActivity(id, userId, 'member_permission_changed', {
    memberName: userResult.rows[0].name,
    oldPermission: memberResult.rows[0].permission_level,
    newPermission: permission
  }).catch(err => console.error('Failed to log activity:', err));

  res.json({
    success: true,
    data: {
      member: {
        ...updateResult.rows[0],
        user: userResult.rows[0],
      },
    },
  });
}

/**
 * Leave a list
 * @route POST /api/lists/:id/leave
 */
export async function leaveList(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.userId;

  // Check if list exists
  const listResult = await pool.query<List>(
    'SELECT * FROM lists WHERE id = $1',
    [id]
  );

  if (listResult.rows.length === 0) {
    throw new NotFoundError('List not found');
  }

  const list = listResult.rows[0];

  // Cannot leave if you're the owner
  if (list.owner_id === userId) {
    throw new ValidationError('List owner cannot leave. You must delete the list or transfer ownership.');
  }

  // Check if user is a member
  const memberResult = await pool.query<ListMember>(
    'SELECT * FROM list_members WHERE list_id = $1 AND user_id = $2',
    [id, userId]
  );

  if (memberResult.rows.length === 0) {
    throw new NotFoundError('You are not a member of this list');
  }

  // Get user details before removal for logging
  const userResult = await pool.query(
    'SELECT name, email FROM users WHERE id = $1',
    [userId]
  );

  // Remove user from list
  await pool.query(
    'DELETE FROM list_members WHERE list_id = $1 AND user_id = $2',
    [id, userId]
  );

  // Log activity
  if (userResult.rows.length > 0) {
    await logActivity(id, userId, 'member_removed', {
      memberName: userResult.rows[0].name,
      memberEmail: userResult.rows[0].email,
      leftVoluntarily: true
    }).catch(err => console.error('Failed to log activity:', err));
  }

  res.json({
    success: true,
    message: 'You have left the list successfully',
  });
}

/**
 * Search users by email
 * @route GET /api/users/search?email=...
 */
export async function searchUsers(req: AuthRequest, res: Response): Promise<void> {
  const { email } = req.query;
  const currentUserId = req.user!.userId;

  // Validate email query parameter
  if (!email || typeof email !== 'string') {
    throw new ValidationError('Email query parameter is required');
  }

  // Validate email format (basic check)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }

  // Search for users by email (partial match, case-insensitive)
  // Exclude current user from results
  // Limit to 10 results
  const result = await pool.query<UserResponse>(
    `SELECT id, email, name, created_at
     FROM users
     WHERE LOWER(email) LIKE LOWER($1)
       AND id != $2
     ORDER BY email
     LIMIT 10`,
    [`%${email}%`, currentUserId]
  );

  res.json({
    success: true,
    data: {
      users: result.rows,
    },
  });
}

/**
 * Transfer list ownership to another member
 * @route POST /api/lists/:id/transfer
 */
export async function transferOwnership(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { newOwnerId, confirmation } = req.body;
  const userId = req.user!.userId;

  // Validate confirmation
  if (!confirmation) {
    throw new ValidationError('You must confirm the ownership transfer');
  }

  // Check if list exists
  const listResult = await pool.query<List>(
    'SELECT * FROM lists WHERE id = $1',
    [id]
  );

  if (listResult.rows.length === 0) {
    throw new NotFoundError('List not found');
  }

  const list = listResult.rows[0];

  // Only owner can transfer ownership
  if (list.owner_id !== userId) {
    throw new AuthorizationError('Only the list owner can transfer ownership');
  }

  // Cannot transfer to yourself
  if (newOwnerId === userId) {
    throw new ValidationError('You are already the owner of this list');
  }

  // Check if new owner is a member of the list
  const newOwnerMemberResult = await pool.query<ListMember>(
    'SELECT * FROM list_members WHERE list_id = $1 AND user_id = $2',
    [id, newOwnerId]
  );

  if (newOwnerMemberResult.rows.length === 0) {
    throw new ValidationError('The new owner must be a member of this list');
  }

  // Get user details for both users
  const newOwnerResult = await pool.query<User>(
    'SELECT id, email, name, created_at FROM users WHERE id = $1',
    [newOwnerId]
  );

  const currentOwnerResult = await pool.query<User>(
    'SELECT id, email, name, created_at FROM users WHERE id = $1',
    [userId]
  );

  if (newOwnerResult.rows.length === 0) {
    throw new NotFoundError('New owner user not found');
  }

  const newOwner = newOwnerResult.rows[0];
  const currentOwner = currentOwnerResult.rows[0];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update owner_id in lists table
    await client.query(
      'UPDATE lists SET owner_id = $1 WHERE id = $2',
      [newOwnerId, id]
    );

    // Update original owner to editor in list_members
    await client.query(
      'UPDATE list_members SET permission_level = $1 WHERE list_id = $2 AND user_id = $3',
      ['editor', id, userId]
    );

    // Update new owner to owner in list_members
    await client.query(
      'UPDATE list_members SET permission_level = $1 WHERE list_id = $2 AND user_id = $3',
      ['owner', id, newOwnerId]
    );

    await client.query('COMMIT');

    // Log activity
    await logActivity(id, userId, 'ownership_transferred', {
      listName: list.name,
      previousOwnerName: currentOwner.name,
      previousOwnerEmail: currentOwner.email,
      newOwnerName: newOwner.name,
      newOwnerEmail: newOwner.email,
    }).catch(err => console.error('Failed to log activity:', err));

    res.json({
      success: true,
      message: `Ownership transferred successfully to ${newOwner.name}`,
      data: {
        list: {
          ...list,
          owner_id: newOwnerId,
        },
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Duplicate an existing list
 * @route POST /api/lists/:id/duplicate
 */
export async function duplicateList(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { name } = req.body;
  const userId = req.user!.userId;

  // Check if list exists and user has access
  const listResult = await pool.query<List>(
    'SELECT * FROM lists WHERE id = $1',
    [id]
  );

  if (listResult.rows.length === 0) {
    throw new NotFoundError('List not found');
  }

  // Check if user is a member
  const memberResult = await pool.query<ListMember>(
    'SELECT * FROM list_members WHERE list_id = $1 AND user_id = $2',
    [id, userId]
  );

  if (memberResult.rows.length === 0) {
    throw new AuthorizationError('You do not have access to this list');
  }

  const originalList = listResult.rows[0];

  // Use provided name or default to "Copy of [original name]"
  const newListName = name || `Copy of ${originalList.name}`;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create the new list with the requester as owner
    const newListResult = await client.query<List>(
      `INSERT INTO lists (name, owner_id, color, icon)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [newListName, userId, originalList.color, originalList.icon]
    );

    const newList = newListResult.rows[0];

    // Copy all items from the original list, resetting gotten status
    await client.query(
      `INSERT INTO grocery_items (name, quantity, category, notes, user_id, list_id, gotten)
       SELECT name, quantity, category, notes, $1, $2, false
       FROM grocery_items
       WHERE list_id = $3`,
      [userId, newList.id, id]
    );

    await client.query('COMMIT');

    // Log activity
    await logActivity(newList.id, userId, 'list_created', {
      listName: newListName,
      duplicatedFrom: originalList.name,
      originalListId: id
    }).catch(err => console.error('Failed to log activity:', err));

    res.status(201).json({
      success: true,
      data: {
        list: {
          ...newList,
          permission: 'owner',
        },
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get list statistics
 * @route GET /api/lists/:id/stats
 */
export async function getListStats(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.userId;

  // Check if list exists and user has access
  const listResult = await pool.query<List>(
    'SELECT * FROM lists WHERE id = $1',
    [id]
  );

  if (listResult.rows.length === 0) {
    throw new NotFoundError('List not found');
  }

  // Check if user is a member
  const memberResult = await pool.query<ListMember>(
    'SELECT * FROM list_members WHERE list_id = $1 AND user_id = $2',
    [id, userId]
  );

  if (memberResult.rows.length === 0) {
    throw new AuthorizationError('You do not have access to this list');
  }

  // Calculate week boundaries (7 days ago)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Get total items count
  const totalItemsResult = await pool.query(
    'SELECT COUNT(*) as count FROM grocery_items WHERE list_id = $1',
    [id]
  );
  const totalItems = parseInt(totalItemsResult.rows[0].count) || 0;

  // Get items gotten count
  const itemsGottenResult = await pool.query(
    'SELECT COUNT(*) as count FROM grocery_items WHERE list_id = $1 AND gotten = true',
    [id]
  );
  const itemsGotten = parseInt(itemsGottenResult.rows[0].count) || 0;

  // Calculate items remaining and percentage
  const itemsRemaining = totalItems - itemsGotten;
  const percentageComplete = totalItems > 0 ? Math.round((itemsGotten / totalItems) * 100) : 0;

  // Get items added this week
  const itemsAddedThisWeekResult = await pool.query(
    'SELECT COUNT(*) as count FROM grocery_items WHERE list_id = $1 AND created_at >= $2',
    [id, oneWeekAgo]
  );
  const itemsAddedThisWeek = parseInt(itemsAddedThisWeekResult.rows[0].count) || 0;

  // Get items gotten this week (using activity log)
  const itemsGottenThisWeekResult = await pool.query(
    `SELECT COUNT(*) as count
     FROM list_activities
     WHERE list_id = $1
       AND action IN ('item_checked', 'item_updated')
       AND created_at >= $2`,
    [id, oneWeekAgo]
  );
  const itemsGottenThisWeek = parseInt(itemsGottenThisWeekResult.rows[0].count) || 0;

  // Get most active members (by activity count)
  const mostActiveMembersResult = await pool.query(
    `SELECT
       u.id as "userId",
       u.name as "userName",
       u.email as "userEmail",
       COUNT(la.id) as "activityCount"
     FROM list_members lm
     JOIN users u ON lm.user_id = u.id
     LEFT JOIN list_activities la ON la.list_id = $1 AND la.user_id = u.id
     WHERE lm.list_id = $1
     GROUP BY u.id, u.name, u.email
     ORDER BY "activityCount" DESC
     LIMIT 5`,
    [id]
  );

  const mostActiveMembers = mostActiveMembersResult.rows.map(row => ({
    userId: row.userId,
    userName: row.userName,
    userEmail: row.userEmail,
    activityCount: parseInt(row.activityCount) || 0,
  }));

  // Get recent activities (last 10)
  const recentActivitiesResult = await pool.query(
    `SELECT
       la.id,
       la.action,
       la.details,
       la.created_at as timestamp,
       u.name as "userName"
     FROM list_activities la
     JOIN users u ON la.user_id = u.id
     WHERE la.list_id = $1
     ORDER BY la.created_at DESC
     LIMIT 10`,
    [id]
  );

  const recentActivities = recentActivitiesResult.rows.map(row => ({
    id: row.id,
    action: row.action,
    userName: row.userName,
    details: row.details,
    timestamp: new Date(row.timestamp).getTime(),
  }));

  // Get category breakdown
  const categoryBreakdownResult = await pool.query(
    `SELECT
       category,
       COUNT(*) as count
     FROM grocery_items
     WHERE list_id = $1
     GROUP BY category
     ORDER BY count DESC`,
    [id]
  );

  const categoryBreakdown = categoryBreakdownResult.rows.map(row => ({
    category: row.category,
    count: parseInt(row.count) || 0,
    percentage: totalItems > 0 ? Math.round((parseInt(row.count) / totalItems) * 100) : 0,
  }));

  // Get activity trend (last 7 days)
  const activityTrendResult = await pool.query(
    `SELECT
       DATE(created_at) as date,
       COUNT(*) as count
     FROM list_activities
     WHERE list_id = $1
       AND created_at >= $2
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
    [id, oneWeekAgo]
  );

  const activityTrend = activityTrendResult.rows.map(row => ({
    date: new Date(row.date).toISOString().split('T')[0],
    count: parseInt(row.count) || 0,
  }));

  // Return statistics
  res.json({
    success: true,
    data: {
      stats: {
        totalItems,
        itemsGotten,
        itemsRemaining,
        percentageComplete,
        itemsAddedThisWeek,
        itemsGottenThisWeek,
        mostActiveMembers,
        recentActivities,
        categoryBreakdown,
        activityTrend,
      },
    },
  });
}

/**
 * Pin a list
 * @route POST /api/lists/:id/pin
 */
export async function pinList(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.userId;

  // Check if list exists
  const listResult = await pool.query<List>(
    'SELECT * FROM lists WHERE id = $1',
    [id]
  );

  if (listResult.rows.length === 0) {
    throw new NotFoundError('List not found');
  }

  // Check if user is a member
  const memberResult = await pool.query<ListMember>(
    'SELECT * FROM list_members WHERE list_id = $1 AND user_id = $2',
    [id, userId]
  );

  if (memberResult.rows.length === 0) {
    throw new AuthorizationError('You do not have access to this list');
  }

  // Check if already pinned
  const existingPin = await pool.query(
    'SELECT * FROM list_pins WHERE list_id = $1 AND user_id = $2',
    [id, userId]
  );

  if (existingPin.rows.length > 0) {
    throw new ValidationError('List is already pinned');
  }

  // Pin the list
  await pool.query(
    'INSERT INTO list_pins (user_id, list_id) VALUES ($1, $2)',
    [userId, id]
  );

  res.json({
    success: true,
    message: 'List pinned successfully',
  });
}

/**
 * Unpin a list
 * @route DELETE /api/lists/:id/unpin
 */
export async function unpinList(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.userId;

  // Check if list exists
  const listResult = await pool.query<List>(
    'SELECT * FROM lists WHERE id = $1',
    [id]
  );

  if (listResult.rows.length === 0) {
    throw new NotFoundError('List not found');
  }

  // Check if user is a member
  const memberResult = await pool.query<ListMember>(
    'SELECT * FROM list_members WHERE list_id = $1 AND user_id = $2',
    [id, userId]
  );

  if (memberResult.rows.length === 0) {
    throw new AuthorizationError('You do not have access to this list');
  }

  // Check if actually pinned
  const existingPin = await pool.query(
    'SELECT * FROM list_pins WHERE list_id = $1 AND user_id = $2',
    [id, userId]
  );

  if (existingPin.rows.length === 0) {
    throw new ValidationError('List is not pinned');
  }

  // Unpin the list
  await pool.query(
    'DELETE FROM list_pins WHERE list_id = $1 AND user_id = $2',
    [id, userId]
  );

  res.json({
    success: true,
    message: 'List unpinned successfully',
  });
}

/**
 * Archive a list
 * @route POST /api/lists/:id/archive
 */
export async function archiveList(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.userId;

  // Check if list exists
  const listResult = await pool.query<List>(
    'SELECT * FROM lists WHERE id = $1',
    [id]
  );

  if (listResult.rows.length === 0) {
    throw new NotFoundError('List not found');
  }

  const list = listResult.rows[0];

  // Only owner can archive list
  if (list.owner_id !== userId) {
    throw new AuthorizationError('Only the list owner can archive the list');
  }

  // Check if already archived
  if (list.is_archived) {
    throw new ValidationError('List is already archived');
  }

  // Archive the list
  const updateResult = await pool.query<List>(
    `UPDATE lists
     SET is_archived = true, archived_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [id]
  );

  // Log activity
  await logActivity(id, userId, 'list_archived', {
    listName: list.name
  }).catch(err => console.error('Failed to log activity:', err));

  res.json({
    success: true,
    message: 'List archived successfully',
    data: {
      list: updateResult.rows[0],
    },
  });
}

/**
 * Unarchive a list
 * @route POST /api/lists/:id/unarchive
 */
export async function unarchiveList(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.userId;

  // Check if list exists
  const listResult = await pool.query<List>(
    'SELECT * FROM lists WHERE id = $1',
    [id]
  );

  if (listResult.rows.length === 0) {
    throw new NotFoundError('List not found');
  }

  const list = listResult.rows[0];

  // Only owner can unarchive list
  if (list.owner_id !== userId) {
    throw new AuthorizationError('Only the list owner can unarchive the list');
  }

  // Check if already active
  if (!list.is_archived) {
    throw new ValidationError('List is not archived');
  }

  // Unarchive the list
  const updateResult = await pool.query<List>(
    `UPDATE lists
     SET is_archived = false, archived_at = NULL
     WHERE id = $1
     RETURNING *`,
    [id]
  );

  // Log activity
  await logActivity(id, userId, 'list_unarchived', {
    listName: list.name
  }).catch(err => console.error('Failed to log activity:', err));

  res.json({
    success: true,
    message: 'List unarchived successfully',
    data: {
      list: updateResult.rows[0],
    },
  });
}
