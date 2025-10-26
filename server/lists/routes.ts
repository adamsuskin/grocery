/**
 * Lists routes
 * API endpoints for list management and member operations
 */

import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  createList,
  getLists,
  getList,
  updateList,
  deleteList,
  addListMember,
  removeListMember,
  updateListMember,
  getListStats,
  leaveList,
  transferOwnership,
  duplicateList,
  archiveList,
  unarchiveList,
  pinList,
  unpinList,
} from './controller';
import { authenticateToken } from '../auth/middleware';
import {
  checkListOwner,
  checkListViewer,
  checkListEditor,
} from '../middleware/listPermissions';
import { validateIdParam } from '../middleware/validateRequest';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * Create lists router with all endpoints
 */
const router = Router();

/**
 * Validation middleware using express-validator
 */

const createListValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('List name is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('List name must be between 1 and 255 characters'),
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color (e.g., #4caf50)'),
  body('icon')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Icon must be 10 characters or less'),
];

const updateListValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('List name cannot be empty')
    .isLength({ min: 1, max: 255 })
    .withMessage('List name must be between 1 and 255 characters'),
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color (e.g., #4caf50)'),
  body('icon')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Icon must be 10 characters or less'),
];

const addMemberValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isUUID()
    .withMessage('User ID must be a valid UUID'),
  body('permission')
    .optional()
    .isIn(['owner', 'editor', 'viewer'])
    .withMessage('Permission must be one of: owner, editor, viewer'),
];

const updateMemberValidation = [
  body('permission')
    .notEmpty()
    .withMessage('Permission is required')
    .isIn(['owner', 'editor', 'viewer'])
    .withMessage('Permission must be one of: owner, editor, viewer'),
];

const transferOwnershipValidation = [
  body('newOwnerId')
    .notEmpty()
    .withMessage('New owner ID is required')
    .isUUID()
    .withMessage('New owner ID must be a valid UUID'),
  body('confirmation')
    .notEmpty()
    .withMessage('Confirmation is required')
    .isBoolean()
    .withMessage('Confirmation must be a boolean')
    .custom((value) => value === true)
    .withMessage('You must confirm the ownership transfer'),
];

const duplicateListValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('List name cannot be empty')
    .isLength({ min: 1, max: 255 })
    .withMessage('List name must be between 1 and 255 characters'),
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
 * @route   POST /api/lists
 * @desc    Create a new list
 * @access  Private (authenticated users)
 * @body    { name: string }
 * @returns { success: boolean, data: { list: ListResponse } }
 */
router.post(
  '/',
  authenticateToken,
  createListValidation,
  handleValidationErrors,
  asyncHandler(createList)
);

/**
 * @route   GET /api/lists
 * @desc    Get all lists for current user
 * @access  Private (authenticated users)
 * @returns { success: boolean, data: { lists: ListResponse[] } }
 */
router.get(
  '/',
  authenticateToken,
  asyncHandler(getLists)
);

/**
 * @route   GET /api/lists/:id
 * @desc    Get specific list with members
 * @access  Private (must be list member)
 * @param   id - List UUID
 * @returns { success: boolean, data: { list: ListResponse } }
 */
router.get(
  '/:id',
  authenticateToken,
  validateIdParam('id'),
  checkListViewer,
  asyncHandler(getList)
);

/**
 * @route   PUT /api/lists/:id
 * @desc    Update list name
 * @access  Private (must be list owner)
 * @param   id - List UUID
 * @body    { name: string }
 * @returns { success: boolean, data: { list: ListResponse } }
 */
router.put(
  '/:id',
  authenticateToken,
  validateIdParam('id'),
  checkListOwner,
  updateListValidation,
  handleValidationErrors,
  asyncHandler(updateList)
);

/**
 * @route   DELETE /api/lists/:id
 * @desc    Delete list
 * @access  Private (must be list owner)
 * @param   id - List UUID
 * @returns { success: boolean, message: string }
 */
router.delete(
  '/:id',
  authenticateToken,
  validateIdParam('id'),
  checkListOwner,
  asyncHandler(deleteList)
);

/**
 * @route   POST /api/lists/:id/members
 * @desc    Add member to list
 * @access  Private (must be list owner)
 * @param   id - List UUID
 * @body    { userId: string, permission?: 'owner' | 'editor' | 'viewer' }
 * @returns { success: boolean, data: { member: ListMemberWithUser } }
 */
router.post(
  '/:id/members',
  authenticateToken,
  validateIdParam('id'),
  checkListOwner,
  addMemberValidation,
  handleValidationErrors,
  asyncHandler(addListMember)
);

/**
 * @route   DELETE /api/lists/:id/members/:userId
 * @desc    Remove member from list
 * @access  Private (must be list owner)
 * @param   id - List UUID
 * @param   userId - User UUID to remove
 * @returns { success: boolean, message: string }
 */
router.delete(
  '/:id/members/:userId',
  authenticateToken,
  validateIdParam('id'),
  validateIdParam('userId'),
  checkListOwner,
  asyncHandler(removeListMember)
);

/**
 * @route   PUT /api/lists/:id/members/:userId
 * @desc    Update member permission
 * @access  Private (must be list owner)
 * @param   id - List UUID
 * @param   userId - User UUID to update
 * @body    { permission: 'owner' | 'editor' | 'viewer' }
 * @returns { success: boolean, data: { member: ListMemberWithUser } }
 */
router.put(
  '/:id/members/:userId',
  authenticateToken,
  validateIdParam('id'),
  validateIdParam('userId'),
  checkListOwner,
  updateMemberValidation,
  handleValidationErrors,
  asyncHandler(updateListMember)
);

/**
 * @route   POST /api/lists/:id/leave
 * @desc    Leave a list (remove yourself as a member)
 * @access  Private (must be list member, not owner)
 * @param   id - List UUID
 * @returns { success: boolean, message: string }
 */
router.post(
  '/:id/leave',
  authenticateToken,
  validateIdParam('id'),
  checkListViewer,
  asyncHandler(leaveList)
);

/**
 * @route   GET /api/lists/:id/stats
 * @desc    Get list statistics and analytics
 * @access  Private (must be list member)
 * @param   id - List UUID
 * @returns { success: boolean, data: { stats: ListStatistics } }
 */
router.get(
  '/:id/stats',
  authenticateToken,
  validateIdParam('id'),
  checkListViewer,
  asyncHandler(getListStats)
);

/**
 * @route   POST /api/lists/:id/duplicate
 * @desc    Duplicate an existing list with all items
 * @access  Private (must be list member)
 * @param   id - List UUID to duplicate
 * @body    { name?: string }
 * @returns { success: boolean, data: { list: ListResponse } }
 */
router.post(
  '/:id/duplicate',
  authenticateToken,
  validateIdParam('id'),
  checkListViewer,
  duplicateListValidation,
  handleValidationErrors,
  asyncHandler(duplicateList)
);

/**
 * @route   POST /api/lists/:id/transfer
 * @desc    Transfer list ownership to another member
 * @access  Private (must be list owner)
 * @param   id - List UUID
 * @body    { newOwnerId: string, confirmation: boolean }
 * @returns { success: boolean, message: string, data: { list: ListResponse } }
 */
router.post(
  '/:id/transfer',
  authenticateToken,
  validateIdParam('id'),
  checkListOwner,
  transferOwnershipValidation,
  handleValidationErrors,
  asyncHandler(transferOwnership)
);

/**
 * @route   POST /api/lists/:id/archive
 * @desc    Archive a list (hide it from view)
 * @access  Private (must be list owner)
 * @param   id - List UUID
 * @returns { success: boolean, message: string, data: { list: ListResponse } }
 */
router.post(
  '/:id/archive',
  authenticateToken,
  validateIdParam('id'),
  checkListOwner,
  asyncHandler(archiveList)
);

/**
 * @route   POST /api/lists/:id/unarchive
 * @desc    Unarchive a list (restore it to view)
 * @access  Private (must be list owner)
 * @param   id - List UUID
 * @returns { success: boolean, message: string, data: { list: ListResponse } }
 */
router.post(
  '/:id/unarchive',
  authenticateToken,
  validateIdParam('id'),
  checkListOwner,
  asyncHandler(unarchiveList)
);

/**
 * @route   POST /api/lists/:id/pin
 * @desc    Pin a list to favorites
 * @access  Private (must be list member)
 * @param   id - List UUID
 * @returns { success: boolean, message: string }
 */
router.post(
  '/:id/pin',
  authenticateToken,
  validateIdParam('id'),
  checkListViewer,
  asyncHandler(pinList)
);

/**
 * @route   DELETE /api/lists/:id/unpin
 * @desc    Unpin a list from favorites
 * @access  Private (must be list member)
 * @param   id - List UUID
 * @returns { success: boolean, message: string }
 */
router.delete(
  '/:id/unpin',
  authenticateToken,
  validateIdParam('id'),
  checkListViewer,
  asyncHandler(unpinList)
);

/**
 * Health check endpoint for lists service
 * @route   GET /api/lists/health
 * @desc    Check if lists service is running
 * @access  Public
 * @returns { success: boolean, message: string, timestamp: string }
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Lists service is healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;
