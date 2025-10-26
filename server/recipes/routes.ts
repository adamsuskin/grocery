/**
 * Recipes routes
 * API endpoints for recipe management
 */

import { Router } from 'express';
import { body, query } from 'express-validator';
import {
  createRecipe,
  getRecipes,
  getPublicRecipes,
  getRecipe,
  updateRecipe,
  deleteRecipe,
  duplicateRecipe,
  togglePublic,
  searchRecipes
} from './controller';
import { authenticateToken } from '../auth/middleware';
import { validateIdParam } from '../middleware/validateRequest';
import { asyncHandler } from '../middleware/errorHandler';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../types';
import { Response, NextFunction } from 'express';

/**
 * Create recipes router
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

const createRecipeValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Recipe title is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Recipe title must be between 1 and 255 characters'),
  body('description')
    .optional()
    .trim(),
  body('instructions')
    .optional()
    .trim(),
  body('servings')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Servings must be a positive integer'),
  body('prep_time')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Prep time must be a non-negative integer'),
  body('cook_time')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Cook time must be a non-negative integer'),
  body('image_url')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  body('is_public')
    .optional()
    .isBoolean()
    .withMessage('is_public must be a boolean'),
  body('ingredients')
    .optional()
    .isArray()
    .withMessage('Ingredients must be an array'),
  body('ingredients.*.name')
    .if(body('ingredients').exists())
    .notEmpty()
    .withMessage('Ingredient name is required')
];

const updateRecipeValidation = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Recipe title cannot be empty')
    .isLength({ min: 1, max: 255 })
    .withMessage('Recipe title must be between 1 and 255 characters'),
  body('description')
    .optional()
    .trim(),
  body('instructions')
    .optional()
    .trim(),
  body('servings')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Servings must be a positive integer'),
  body('prep_time')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Prep time must be a non-negative integer'),
  body('cook_time')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Cook time must be a non-negative integer'),
  body('image_url')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  body('is_public')
    .optional()
    .isBoolean()
    .withMessage('is_public must be a boolean'),
  body('ingredients')
    .optional()
    .isArray()
    .withMessage('Ingredients must be an array'),
  body('ingredients.*.name')
    .if(body('ingredients').exists())
    .notEmpty()
    .withMessage('Ingredient name is required')
];

const duplicateRecipeValidation = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Recipe title cannot be empty')
    .isLength({ min: 1, max: 255 })
    .withMessage('Recipe title must be between 1 and 255 characters')
];

const togglePublicValidation = [
  body('is_public')
    .notEmpty()
    .withMessage('is_public is required')
    .isBoolean()
    .withMessage('is_public must be a boolean')
];

const searchValidation = [
  query('q')
    .notEmpty()
    .withMessage('Search query (q) is required')
    .isString()
    .withMessage('Search query must be a string')
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
];

/**
 * @route   POST /api/recipes
 * @desc    Create a new recipe with ingredients
 * @access  Private (authenticated users)
 * @body    { title, description?, instructions?, servings?, prep_time?, cook_time?, image_url?, is_public?, ingredients? }
 */
router.post(
  '/',
  authenticateToken,
  createRecipeValidation,
  handleValidationErrors,
  asyncHandler(createRecipe)
);

/**
 * @route   GET /api/recipes
 * @desc    Get user's recipes with optional filtering
 * @access  Private (authenticated users)
 * @query   is_public - Filter by public/private
 * @query   search - Search in title and description
 */
router.get(
  '/',
  authenticateToken,
  asyncHandler(getRecipes)
);

/**
 * @route   GET /api/recipes/public
 * @desc    Get all public recipes
 * @access  Private (authenticated users)
 * @query   search - Search in title and description
 */
router.get(
  '/public',
  authenticateToken,
  asyncHandler(getPublicRecipes)
);

/**
 * @route   GET /api/recipes/search
 * @desc    Search recipes by keywords
 * @access  Private (authenticated users)
 * @query   q - Search query (required)
 * @query   public_only - Only search public recipes
 */
router.get(
  '/search',
  authenticateToken,
  searchValidation,
  handleValidationErrors,
  asyncHandler(searchRecipes)
);

/**
 * @route   GET /api/recipes/:id
 * @desc    Get single recipe with ingredients
 * @access  Private (must be owner or recipe must be public)
 * @param   id - Recipe UUID
 */
router.get(
  '/:id',
  authenticateToken,
  validateIdParam('id'),
  asyncHandler(getRecipe)
);

/**
 * @route   PUT /api/recipes/:id
 * @desc    Update recipe and ingredients
 * @access  Private (must be recipe owner)
 * @param   id - Recipe UUID
 * @body    { title?, description?, instructions?, servings?, prep_time?, cook_time?, image_url?, is_public?, ingredients? }
 */
router.put(
  '/:id',
  authenticateToken,
  validateIdParam('id'),
  updateRecipeValidation,
  handleValidationErrors,
  asyncHandler(updateRecipe)
);

/**
 * @route   DELETE /api/recipes/:id
 * @desc    Delete recipe (cascade to ingredients)
 * @access  Private (must be recipe owner)
 * @param   id - Recipe UUID
 */
router.delete(
  '/:id',
  authenticateToken,
  validateIdParam('id'),
  asyncHandler(deleteRecipe)
);

/**
 * @route   POST /api/recipes/:id/duplicate
 * @desc    Duplicate recipe with new name
 * @access  Private (must be owner or recipe must be public)
 * @param   id - Recipe UUID
 * @body    { title? }
 */
router.post(
  '/:id/duplicate',
  authenticateToken,
  validateIdParam('id'),
  duplicateRecipeValidation,
  handleValidationErrors,
  asyncHandler(duplicateRecipe)
);

/**
 * @route   PATCH /api/recipes/:id/public
 * @desc    Toggle recipe public/private status
 * @access  Private (must be recipe owner)
 * @param   id - Recipe UUID
 * @body    { is_public: boolean }
 */
router.patch(
  '/:id/public',
  authenticateToken,
  validateIdParam('id'),
  togglePublicValidation,
  handleValidationErrors,
  asyncHandler(togglePublic)
);

export default router;
