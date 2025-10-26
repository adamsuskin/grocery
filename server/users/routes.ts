/**
 * Users routes
 * API endpoints for user search operations
 */

import { Router } from 'express';
import { authenticateToken } from '../auth/middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { userSearchRateLimiter } from '../middleware/rateLimiter';
import { searchUsers } from '../lists/controller';

/**
 * Create users router with all endpoints
 */
const router = Router();

/**
 * @route   GET /api/users/search
 * @desc    Search users by email for list sharing
 * @access  Private (authenticated users)
 * @query   email - Email to search for (partial match)
 * @returns { success: boolean, data: { users: UserResponse[] } }
 */
router.get(
  '/search',
  authenticateToken,
  userSearchRateLimiter,
  asyncHandler(searchUsers)
);

export default router;
