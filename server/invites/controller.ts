/**
 * Invites controller
 * Handles invite link generation, revocation, and acceptance
 */

import { Response } from 'express';
import { AuthRequest } from '../types';
import { pool } from '../config/db';
import { List, ListMember, ListResponse } from '../types';
import { NotFoundError, AuthorizationError, ValidationError } from '../middleware/errorHandler';
import { nanoid } from 'nanoid';

/**
 * Generate an invite link for a list
 * @route POST /api/lists/:id/invite
 */
export async function generateInviteLink(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.userId;
  const { expiresInDays = 7 } = req.body; // Default 7 days expiration

  // Validate expiration days
  if (expiresInDays < 1 || expiresInDays > 365) {
    throw new ValidationError('Expiration must be between 1 and 365 days');
  }

  // Check if list exists and user is owner
  const listResult = await pool.query<List>(
    'SELECT * FROM lists WHERE id = $1',
    [id]
  );

  if (listResult.rows.length === 0) {
    throw new NotFoundError('List not found');
  }

  const list = listResult.rows[0];

  // Only owner can generate invite links
  if (list.owner_id !== userId) {
    throw new AuthorizationError('Only the list owner can generate invite links');
  }

  // Generate unique token
  const inviteToken = nanoid(32);

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  // Update list with invite token
  await pool.query(
    `UPDATE lists
     SET invite_token = $1, invite_expires_at = $2
     WHERE id = $3`,
    [inviteToken, expiresAt, id]
  );

  res.status(201).json({
    success: true,
    data: {
      inviteToken,
      expiresAt,
      inviteUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/invite/${inviteToken}`,
    },
  });
}

/**
 * Revoke an invite link for a list
 * @route DELETE /api/lists/:id/invite
 */
export async function revokeInviteLink(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.userId;

  // Check if list exists and user is owner
  const listResult = await pool.query<List>(
    'SELECT * FROM lists WHERE id = $1',
    [id]
  );

  if (listResult.rows.length === 0) {
    throw new NotFoundError('List not found');
  }

  const list = listResult.rows[0];

  // Only owner can revoke invite links
  if (list.owner_id !== userId) {
    throw new AuthorizationError('Only the list owner can revoke invite links');
  }

  // Remove invite token
  await pool.query(
    `UPDATE lists
     SET invite_token = NULL, invite_expires_at = NULL
     WHERE id = $1`,
    [id]
  );

  res.json({
    success: true,
    message: 'Invite link revoked successfully',
  });
}

/**
 * Get invite details (public endpoint, no auth required)
 * @route GET /api/invites/:token
 */
export async function getInviteDetails(req: AuthRequest, res: Response): Promise<void> {
  const { token } = req.params;

  // Find list by invite token
  const listResult = await pool.query<List>(
    `SELECT id, name, owner_id, created_at, invite_expires_at
     FROM lists
     WHERE invite_token = $1`,
    [token]
  );

  if (listResult.rows.length === 0) {
    throw new NotFoundError('Invalid or expired invite link');
  }

  const list = listResult.rows[0];

  // Check if invite has expired
  if (list.invite_expires_at && new Date(list.invite_expires_at) < new Date()) {
    throw new ValidationError('This invite link has expired');
  }

  // Get owner information
  const ownerResult = await pool.query(
    'SELECT name, email FROM users WHERE id = $1',
    [list.owner_id]
  );

  const owner = ownerResult.rows[0];

  // Get member count
  const memberCountResult = await pool.query(
    'SELECT COUNT(*) as count FROM list_members WHERE list_id = $1',
    [list.id]
  );

  res.json({
    success: true,
    data: {
      listId: list.id,
      listName: list.name,
      ownerName: owner.name,
      memberCount: parseInt(memberCountResult.rows[0].count),
      expiresAt: list.invite_expires_at,
    },
  });
}

/**
 * Accept an invite and join a list
 * @route POST /api/invites/:token/accept
 */
export async function acceptInvite(req: AuthRequest, res: Response): Promise<void> {
  const { token } = req.params;
  const userId = req.user!.userId;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Find list by invite token
    const listResult = await client.query<List>(
      `SELECT id, name, owner_id, invite_expires_at
       FROM lists
       WHERE invite_token = $1`,
      [token]
    );

    if (listResult.rows.length === 0) {
      throw new NotFoundError('Invalid or expired invite link');
    }

    const list = listResult.rows[0];

    // Check if invite has expired
    if (list.invite_expires_at && new Date(list.invite_expires_at) < new Date()) {
      throw new ValidationError('This invite link has expired');
    }

    // Check if user is already a member
    const existingMember = await client.query(
      'SELECT * FROM list_members WHERE list_id = $1 AND user_id = $2',
      [list.id, userId]
    );

    if (existingMember.rows.length > 0) {
      throw new ValidationError('You are already a member of this list');
    }

    // Add user as editor by default
    await client.query(
      `INSERT INTO list_members (list_id, user_id, permission_level, invited_by)
       VALUES ($1, $2, 'editor', $3)`,
      [list.id, userId, list.owner_id]
    );

    // Log activity
    await client.query(
      `INSERT INTO list_activities (list_id, user_id, action, details)
       VALUES ($1, $2, 'member_added', $3)`,
      [
        list.id,
        userId,
        JSON.stringify({
          method: 'invite_link',
          addedBy: list.owner_id,
        }),
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        listId: list.id,
        listName: list.name,
      },
      message: `Successfully joined "${list.name}"`,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
