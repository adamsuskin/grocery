/**
 * Meal plans routes
 * API endpoints for meal planning and shopping list generation
 */

import { Router } from 'express';
import { body, query } from 'express-validator';
import {
  createMealPlan,
  getMealPlans,
  getMealPlan,
  updateMealPlan,
  deleteMealPlan,
  markCooked,
  generateShoppingList
} from './controller';
import { authenticateToken } from '../auth/middleware';
import { validateIdParam } from '../middleware/validateRequest';
import { asyncHandler } from '../middleware/errorHandler';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../types';
import { Response, NextFunction } from 'express';

/**
 * Create meal plans router
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

const createMealPlanValidation = [
  body('recipe_id')
    .notEmpty()
    .withMessage('Recipe ID is required')
    .isUUID()
    .withMessage('Recipe ID must be a valid UUID'),
  body('planned_date')
    .notEmpty()
    .withMessage('Planned date is required')
    .isISO8601()
    .withMessage('Planned date must be a valid ISO 8601 date'),
  body('meal_type')
    .notEmpty()
    .withMessage('Meal type is required')
    .isIn(['breakfast', 'lunch', 'dinner', 'snack'])
    .withMessage('Meal type must be one of: breakfast, lunch, dinner, snack'),
  body('servings')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Servings must be a positive integer'),
  body('notes')
    .optional()
    .trim()
];

const updateMealPlanValidation = [
  body('planned_date')
    .optional()
    .isISO8601()
    .withMessage('Planned date must be a valid ISO 8601 date'),
  body('meal_type')
    .optional()
    .isIn(['breakfast', 'lunch', 'dinner', 'snack'])
    .withMessage('Meal type must be one of: breakfast, lunch, dinner, snack'),
  body('servings')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Servings must be a positive integer'),
  body('notes')
    .optional()
    .trim(),
  body('is_cooked')
    .optional()
    .isBoolean()
    .withMessage('is_cooked must be a boolean')
];

const markCookedValidation = [
  body('is_cooked')
    .notEmpty()
    .withMessage('is_cooked is required')
    .isBoolean()
    .withMessage('is_cooked must be a boolean')
];

const generateListValidation = [
  body('start_date')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  body('end_date')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  body('list_id')
    .optional()
    .isUUID()
    .withMessage('List ID must be a valid UUID')
];

/**
 * @route   POST /api/meal-plans
 * @desc    Create a meal plan entry
 * @access  Private (authenticated users)
 * @body    { recipe_id, planned_date, meal_type, servings?, notes? }
 */
router.post(
  '/',
  authenticateToken,
  createMealPlanValidation,
  handleValidationErrors,
  asyncHandler(createMealPlan)
);

/**
 * @route   GET /api/meal-plans
 * @desc    Get user's meal plans with optional date filtering
 * @access  Private (authenticated users)
 * @query   start_date - Filter meals from this date
 * @query   end_date - Filter meals until this date
 * @query   is_cooked - Filter by cooked status
 */
router.get(
  '/',
  authenticateToken,
  asyncHandler(getMealPlans)
);

/**
 * @route   GET /api/meal-plans/:id
 * @desc    Get single meal plan with recipe details
 * @access  Private (must be meal plan owner)
 * @param   id - Meal plan UUID
 */
router.get(
  '/:id',
  authenticateToken,
  validateIdParam('id'),
  asyncHandler(getMealPlan)
);

/**
 * @route   PUT /api/meal-plans/:id
 * @desc    Update meal plan
 * @access  Private (must be meal plan owner)
 * @param   id - Meal plan UUID
 * @body    { planned_date?, meal_type?, servings?, notes?, is_cooked? }
 */
router.put(
  '/:id',
  authenticateToken,
  validateIdParam('id'),
  updateMealPlanValidation,
  handleValidationErrors,
  asyncHandler(updateMealPlan)
);

/**
 * @route   DELETE /api/meal-plans/:id
 * @desc    Delete meal plan
 * @access  Private (must be meal plan owner)
 * @param   id - Meal plan UUID
 */
router.delete(
  '/:id',
  authenticateToken,
  validateIdParam('id'),
  asyncHandler(deleteMealPlan)
);

/**
 * @route   PATCH /api/meal-plans/:id/cooked
 * @desc    Mark meal as cooked or uncooked
 * @access  Private (must be meal plan owner)
 * @param   id - Meal plan UUID
 * @body    { is_cooked: boolean }
 */
router.patch(
  '/:id/cooked',
  authenticateToken,
  validateIdParam('id'),
  markCookedValidation,
  handleValidationErrors,
  asyncHandler(markCooked)
);

/**
 * @route   POST /api/meal-plans/generate-list
 * @desc    Generate shopping list from meal plans for a date range
 * @access  Private (authenticated users)
 * @body    { start_date, end_date, list_id? }
 */
router.post(
  '/generate-list',
  authenticateToken,
  generateListValidation,
  handleValidationErrors,
  asyncHandler(generateShoppingList)
);

export default router;
