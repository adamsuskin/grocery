/**
 * Activities routes
 * API endpoints for list activity retrieval and creation
 */

import { Router } from 'express';
import { getListActivities, createActivity } from './controller';
import { authenticateToken } from '../auth/middleware';
import { checkListViewer, checkListEditor } from '../middleware/listPermissions';
import { validateIdParam } from '../middleware/validateRequest';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * Create activities router with all endpoints
 */
const router = Router();

/**
 * @route   GET /api/lists/:id/activities
 * @desc    Get activities for a specific list
 * @access  Private (must be list member)
 * @param   id - List UUID
 * @query   limit - Number of activities to return (default: 50)
 * @query   offset - Offset for pagination (default: 0)
 * @returns { success: boolean, data: { activities: ActivityWithUser[], total: number, limit: number, offset: number } }
 */
router.get(
  '/:id/activities',
  authenticateToken,
  validateIdParam('id'),
  checkListViewer,
  asyncHandler(getListActivities)
);

/**
 * @route   POST /api/lists/:id/activities
 * @desc    Create a new activity for a list
 * @access  Private (must be list editor or owner)
 * @param   id - List UUID
 * @body    { action: ActivityAction, details?: Record<string, any> }
 * @returns { success: boolean, data: { id: string } }
 */
router.post(
  '/:id/activities',
  authenticateToken,
  validateIdParam('id'),
  checkListEditor,
  asyncHandler(createActivity)
);

export default router;
