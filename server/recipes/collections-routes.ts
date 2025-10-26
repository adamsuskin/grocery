/**
 * Recipe collections routes
 * API endpoints for organizing recipes into collections
 */

import { Router } from 'express';
import { body } from 'express-validator';
import {
  createCollection,
  getCollections,
  getCollection,
  updateCollection,
  deleteCollection,
  addRecipe,
  removeRecipe
} from './collections-controller';
import { authenticateToken } from '../auth/middleware';
import { validateIdParam } from '../middleware/validateRequest';
import { asyncHandler } from '../middleware/errorHandler';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../types';
import { Response, NextFunction } from 'express';

/**
 * Create collections router
 */
const router = Router();

/**
 * Validation result handler
 */
function handleValidationErrors(req: AuthRequest, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      message: 'Invalid request data',
      details: errors.array()
    });
    return;
  }
  next();
}

/**
 * Validation middleware
 */

const createCollectionValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Collection name is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Collection name must be between 1 and 255 characters'),
  body('description')
    .optional()
    .trim()
];

const updateCollectionValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Collection name cannot be empty')
    .isLength({ min: 1, max: 255 })
    .withMessage('Collection name must be between 1 and 255 characters'),
  body('description')
    .optional()
    .trim()
];

/**
 * @route   POST /api/collections
 * @desc    Create a new recipe collection
 * @access  Private (authenticated users)
 * @body    { name, description? }
 */
router.post(
  '/',
  authenticateToken,
  createCollectionValidation,
  handleValidationErrors,
  asyncHandler(createCollection)
);

/**
 * @route   GET /api/collections
 * @desc    Get user's recipe collections with recipe counts
 * @access  Private (authenticated users)
 */
router.get(
  '/',
  authenticateToken,
  asyncHandler(getCollections)
);

/**
 * @route   GET /api/collections/:id
 * @desc    Get single collection with all recipes
 * @access  Private (must be collection owner)
 * @param   id - Collection UUID
 */
router.get(
  '/:id',
  authenticateToken,
  validateIdParam('id'),
  asyncHandler(getCollection)
);

/**
 * @route   PUT /api/collections/:id
 * @desc    Update collection name and/or description
 * @access  Private (must be collection owner)
 * @param   id - Collection UUID
 * @body    { name?, description? }
 */
router.put(
  '/:id',
  authenticateToken,
  validateIdParam('id'),
  updateCollectionValidation,
  handleValidationErrors,
  asyncHandler(updateCollection)
);

/**
 * @route   DELETE /api/collections/:id
 * @desc    Delete collection (recipes remain, only associations are removed)
 * @access  Private (must be collection owner)
 * @param   id - Collection UUID
 */
router.delete(
  '/:id',
  authenticateToken,
  validateIdParam('id'),
  asyncHandler(deleteCollection)
);

/**
 * @route   POST /api/collections/:id/recipes/:recipeId
 * @desc    Add recipe to collection
 * @access  Private (must be collection owner)
 * @param   id - Collection UUID
 * @param   recipeId - Recipe UUID
 */
router.post(
  '/:id/recipes/:recipeId',
  authenticateToken,
  validateIdParam('id'),
  validateIdParam('recipeId'),
  asyncHandler(addRecipe)
);

/**
 * @route   DELETE /api/collections/:id/recipes/:recipeId
 * @desc    Remove recipe from collection
 * @access  Private (must be collection owner)
 * @param   id - Collection UUID
 * @param   recipeId - Recipe UUID
 */
router.delete(
  '/:id/recipes/:recipeId',
  authenticateToken,
  validateIdParam('id'),
  validateIdParam('recipeId'),
  asyncHandler(removeRecipe)
);

export default router;
