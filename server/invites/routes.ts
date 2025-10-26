/**
 * Invites routes
 * API endpoints for invite link management
 */

import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  generateInviteLink,
  revokeInviteLink,
  getInviteDetails,
  acceptInvite,
} from './controller';
import { authenticateToken } from '../auth/middleware';
import { checkListOwner } from '../middleware/listPermissions';
import { validateIdParam } from '../middleware/validateRequest';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * Create invites router with all endpoints
 */
const router = Router();

/**
 * Validation middleware
 */

const generateInviteValidation = [
  body('expiresInDays')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Expiration must be between 1 and 365 days'),
];

const tokenValidation = [
  param('token')
    .notEmpty()
    .withMessage('Token is required')
    .isLength({ min: 32, max: 32 })
    .withMessage('Invalid token format'),
];

/**
 * Validation result handler
 */
import { validationResult } from 'express-validator';
import { AuthRequest } from '../types';
import { Response, NextFunction } from 'express';

function handleValidationErrors(req: AuthRequest, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      message: 'Invalid request data',
      details: errors.array(),
    });
    return;
  }
  next();
}

/**
 * @route   POST /api/lists/:id/invite
 * @desc    Generate an invite link for a list
 * @access  Private (must be list owner)
 * @param   id - List UUID
 * @body    { expiresInDays?: number } - Optional expiration (1-365 days, default 7)
 * @returns { success: boolean, data: { inviteToken: string, expiresAt: Date, inviteUrl: string } }
 */
router.post(
  '/lists/:id/invite',
  authenticateToken,
  validateIdParam('id'),
  checkListOwner,
  generateInviteValidation,
  handleValidationErrors,
  asyncHandler(generateInviteLink)
);

/**
 * @route   DELETE /api/lists/:id/invite
 * @desc    Revoke an invite link for a list
 * @access  Private (must be list owner)
 * @param   id - List UUID
 * @returns { success: boolean, message: string }
 */
router.delete(
  '/lists/:id/invite',
  authenticateToken,
  validateIdParam('id'),
  checkListOwner,
  asyncHandler(revokeInviteLink)
);

/**
 * @route   GET /api/invites/:token
 * @desc    Get invite details (public endpoint)
 * @access  Public
 * @param   token - Invite token (32 characters)
 * @returns { success: boolean, data: { listId: string, listName: string, ownerName: string, memberCount: number, expiresAt: Date } }
 */
router.get(
  '/invites/:token',
  tokenValidation,
  handleValidationErrors,
  asyncHandler(getInviteDetails)
);

/**
 * @route   POST /api/invites/:token/accept
 * @desc    Accept an invite and join a list
 * @access  Private (authenticated users)
 * @param   token - Invite token (32 characters)
 * @returns { success: boolean, data: { listId: string, listName: string }, message: string }
 */
router.post(
  '/invites/:token/accept',
  authenticateToken,
  tokenValidation,
  handleValidationErrors,
  asyncHandler(acceptInvite)
);

export default router;
