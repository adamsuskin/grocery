/**
 * Meal plans controller
 * Handles all meal planning operations including CRUD and shopping list generation
 */

import { Response } from 'express';
import { AuthRequest } from '../types';
import { pool } from '../config/db';
import { NotFoundError, AuthorizationError, ValidationError } from '../middleware/errorHandler';

/**
 * Meal plan entity interface
 */
interface MealPlan {
  id: string;
  user_id: string;
  recipe_id: string;
  planned_date: Date;
  meal_type: string;
  servings?: number;
  notes?: string;
  is_cooked: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create a meal plan entry
 * @route POST /api/meal-plans
 */
export async function createMealPlan(req: AuthRequest, res: Response): Promise<void> {
  const {
    recipe_id,
    planned_date,
    meal_type,
    servings,
    notes
  } = req.body;
  const userId = req.user!.userId;

  // Validate required fields
  if (!recipe_id || !planned_date || !meal_type) {
    throw new ValidationError('recipe_id, planned_date, and meal_type are required');
  }

  // Validate meal_type
  const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  if (!validMealTypes.includes(meal_type.toLowerCase())) {
    throw new ValidationError('meal_type must be one of: breakfast, lunch, dinner, snack');
  }

  // Validate date format
  const date = new Date(planned_date);
  if (isNaN(date.getTime())) {
    throw new ValidationError('Invalid date format for planned_date');
  }

  // Check if recipe exists and user has access
  const recipeResult = await pool.query(
    'SELECT * FROM recipes WHERE id = $1 AND (user_id = $2 OR is_public = true)',
    [recipe_id, userId]
  );

  if (recipeResult.rows.length === 0) {
    throw new NotFoundError('Recipe not found or you do not have access to it');
  }

  // Create meal plan
  const result = await pool.query<MealPlan>(
    `INSERT INTO meal_plans (user_id, recipe_id, planned_date, meal_type, servings, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, recipe_id, date, meal_type.toLowerCase(), servings, notes]
  );

  res.status(201).json({
    success: true,
    data: {
      mealPlan: result.rows[0]
    }
  });
}

/**
 * Get user's meal plans with optional date filtering
 * @route GET /api/meal-plans
 * @query start_date - Filter meals from this date (optional)
 * @query end_date - Filter meals until this date (optional)
 * @query is_cooked - Filter by cooked status (optional)
 */
export async function getMealPlans(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { start_date, end_date, is_cooked } = req.query;

  let query = `
    SELECT mp.*,
           r.title as recipe_title,
           r.image_url as recipe_image_url,
           r.prep_time,
           r.cook_time,
           json_agg(
             json_build_object(
               'id', ri.id,
               'name', ri.name,
               'quantity', ri.quantity,
               'unit', ri.unit,
               'category', ri.category
             ) ORDER BY ri.order_index
           ) FILTER (WHERE ri.id IS NOT NULL) as ingredients
    FROM meal_plans mp
    INNER JOIN recipes r ON mp.recipe_id = r.id
    LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
    WHERE mp.user_id = $1
  `;

  const params: any[] = [userId];
  let paramCount = 1;

  // Date range filtering
  if (start_date && typeof start_date === 'string') {
    paramCount++;
    query += ` AND mp.planned_date >= $${paramCount}`;
    params.push(new Date(start_date));
  }

  if (end_date && typeof end_date === 'string') {
    paramCount++;
    query += ` AND mp.planned_date <= $${paramCount}`;
    params.push(new Date(end_date));
  }

  // Cooked status filter
  if (is_cooked !== undefined) {
    paramCount++;
    query += ` AND mp.is_cooked = $${paramCount}`;
    params.push(is_cooked === 'true');
  }

  query += `
    GROUP BY mp.id, r.title, r.image_url, r.prep_time, r.cook_time
    ORDER BY mp.planned_date ASC, mp.meal_type ASC
  `;

  const result = await pool.query(query, params);

  res.json({
    success: true,
    data: {
      mealPlans: result.rows
    }
  });
}

/**
 * Get single meal plan
 * @route GET /api/meal-plans/:id
 */
export async function getMealPlan(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.userId;

  const result = await pool.query(
    `SELECT mp.*,
            r.title as recipe_title,
            r.description as recipe_description,
            r.instructions as recipe_instructions,
            r.image_url as recipe_image_url,
            r.prep_time,
            r.cook_time,
            json_agg(
              json_build_object(
                'id', ri.id,
                'name', ri.name,
                'quantity', ri.quantity,
                'unit', ri.unit,
                'category', ri.category,
                'order_index', ri.order_index
              ) ORDER BY ri.order_index
            ) FILTER (WHERE ri.id IS NOT NULL) as ingredients
     FROM meal_plans mp
     INNER JOIN recipes r ON mp.recipe_id = r.id
     LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
     WHERE mp.id = $1 AND mp.user_id = $2
     GROUP BY mp.id, r.title, r.description, r.instructions, r.image_url, r.prep_time, r.cook_time`,
    [id, userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Meal plan not found');
  }

  res.json({
    success: true,
    data: {
      mealPlan: result.rows[0]
    }
  });
}

/**
 * Update meal plan
 * @route PUT /api/meal-plans/:id
 */
export async function updateMealPlan(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const {
    planned_date,
    meal_type,
    servings,
    notes,
    is_cooked
  } = req.body;
  const userId = req.user!.userId;

  // Check if meal plan exists and user owns it
  const mealPlanResult = await pool.query<MealPlan>(
    'SELECT * FROM meal_plans WHERE id = $1',
    [id]
  );

  if (mealPlanResult.rows.length === 0) {
    throw new NotFoundError('Meal plan not found');
  }

  const mealPlan = mealPlanResult.rows[0];

  if (mealPlan.user_id !== userId) {
    throw new AuthorizationError('Only the meal plan owner can update it');
  }

  // Build dynamic update query
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (planned_date !== undefined) {
    const date = new Date(planned_date);
    if (isNaN(date.getTime())) {
      throw new ValidationError('Invalid date format for planned_date');
    }
    updates.push(`planned_date = $${paramCount++}`);
    values.push(date);
  }

  if (meal_type !== undefined) {
    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    if (!validMealTypes.includes(meal_type.toLowerCase())) {
      throw new ValidationError('meal_type must be one of: breakfast, lunch, dinner, snack');
    }
    updates.push(`meal_type = $${paramCount++}`);
    values.push(meal_type.toLowerCase());
  }

  if (servings !== undefined) {
    updates.push(`servings = $${paramCount++}`);
    values.push(servings);
  }

  if (notes !== undefined) {
    updates.push(`notes = $${paramCount++}`);
    values.push(notes);
  }

  if (is_cooked !== undefined) {
    updates.push(`is_cooked = $${paramCount++}`);
    values.push(is_cooked);
  }

  if (updates.length === 0) {
    throw new ValidationError('No fields to update');
  }

  values.push(id);

  // Update meal plan
  const updateResult = await pool.query<MealPlan>(
    `UPDATE meal_plans
     SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount}
     RETURNING *`,
    values
  );

  res.json({
    success: true,
    data: {
      mealPlan: updateResult.rows[0]
    }
  });
}

/**
 * Delete meal plan
 * @route DELETE /api/meal-plans/:id
 */
export async function deleteMealPlan(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.userId;

  // Check if meal plan exists and user owns it
  const mealPlanResult = await pool.query<MealPlan>(
    'SELECT * FROM meal_plans WHERE id = $1',
    [id]
  );

  if (mealPlanResult.rows.length === 0) {
    throw new NotFoundError('Meal plan not found');
  }

  const mealPlan = mealPlanResult.rows[0];

  if (mealPlan.user_id !== userId) {
    throw new AuthorizationError('Only the meal plan owner can delete it');
  }

  // Delete meal plan
  await pool.query('DELETE FROM meal_plans WHERE id = $1', [id]);

  res.json({
    success: true,
    message: 'Meal plan deleted successfully'
  });
}

/**
 * Mark meal as cooked
 * @route PATCH /api/meal-plans/:id/cooked
 */
export async function markCooked(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { is_cooked } = req.body;
  const userId = req.user!.userId;

  if (typeof is_cooked !== 'boolean') {
    throw new ValidationError('is_cooked must be a boolean value');
  }

  // Check if meal plan exists and user owns it
  const mealPlanResult = await pool.query<MealPlan>(
    'SELECT * FROM meal_plans WHERE id = $1',
    [id]
  );

  if (mealPlanResult.rows.length === 0) {
    throw new NotFoundError('Meal plan not found');
  }

  const mealPlan = mealPlanResult.rows[0];

  if (mealPlan.user_id !== userId) {
    throw new AuthorizationError('Only the meal plan owner can update it');
  }

  // Update cooked status
  const updateResult = await pool.query<MealPlan>(
    `UPDATE meal_plans
     SET is_cooked = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [is_cooked, id]
  );

  res.json({
    success: true,
    data: {
      mealPlan: updateResult.rows[0]
    }
  });
}

/**
 * Generate shopping list from meal plans
 * @route POST /api/meal-plans/generate-list
 * @body { start_date, end_date, list_id? }
 */
export async function generateShoppingList(req: AuthRequest, res: Response): Promise<void> {
  const { start_date, end_date, list_id } = req.body;
  const userId = req.user!.userId;

  // Validate required fields
  if (!start_date || !end_date) {
    throw new ValidationError('start_date and end_date are required');
  }

  // Validate dates
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new ValidationError('Invalid date format');
  }

  if (startDate > endDate) {
    throw new ValidationError('start_date must be before or equal to end_date');
  }

  // Get meal plans for the date range
  const mealPlansResult = await pool.query(
    `SELECT mp.*, mp.servings as planned_servings, r.servings as recipe_servings
     FROM meal_plans mp
     INNER JOIN recipes r ON mp.recipe_id = r.id
     WHERE mp.user_id = $1
       AND mp.planned_date >= $2
       AND mp.planned_date <= $3
       AND mp.is_cooked = false`,
    [userId, startDate, endDate]
  );

  if (mealPlansResult.rows.length === 0) {
    res.json({
      success: true,
      data: {
        ingredients: [],
        message: 'No meal plans found for the specified date range'
      }
    });
    return;
  }

  // Get all ingredients for these recipes
  const recipeIds = mealPlansResult.rows.map(mp => mp.recipe_id);
  const ingredientsResult = await pool.query(
    `SELECT ri.*, mp.servings as planned_servings, r.servings as recipe_servings
     FROM recipe_ingredients ri
     INNER JOIN recipes r ON ri.recipe_id = r.id
     INNER JOIN meal_plans mp ON r.id = mp.recipe_id
     WHERE ri.recipe_id = ANY($1)
       AND mp.user_id = $2
       AND mp.planned_date >= $3
       AND mp.planned_date <= $4
       AND mp.is_cooked = false
     ORDER BY ri.category, ri.name`,
    [recipeIds, userId, startDate, endDate]
  );

  // Aggregate ingredients by name and category
  const aggregatedIngredients = new Map<string, any>();

  for (const ingredient of ingredientsResult.rows) {
    const key = `${ingredient.name.toLowerCase()}_${ingredient.category || 'other'}`;

    if (aggregatedIngredients.has(key)) {
      const existing = aggregatedIngredients.get(key);
      // For now, just concatenate quantities
      // In a production app, you'd want to properly handle unit conversions
      if (ingredient.quantity) {
        existing.quantity = existing.quantity
          ? `${existing.quantity} + ${ingredient.quantity}`
          : ingredient.quantity;
      }
      existing.count += 1;
    } else {
      aggregatedIngredients.set(key, {
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        category: ingredient.category || 'other',
        count: 1
      });
    }
  }

  const ingredients = Array.from(aggregatedIngredients.values());

  // If list_id is provided, add ingredients to that list
  if (list_id) {
    // Check if user has access to the list
    const listResult = await pool.query(
      `SELECT l.* FROM lists l
       INNER JOIN list_members lm ON l.id = lm.list_id
       WHERE l.id = $1 AND lm.user_id = $2`,
      [list_id, userId]
    );

    if (listResult.rows.length === 0) {
      throw new NotFoundError('List not found or you do not have access to it');
    }

    // Add ingredients to the list
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const ingredient of ingredients) {
        const quantityText = ingredient.quantity && ingredient.unit
          ? `${ingredient.quantity} ${ingredient.unit}`
          : ingredient.quantity || '';

        await client.query(
          `INSERT INTO grocery_items (list_id, user_id, name, quantity, category, notes)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            list_id,
            userId,
            ingredient.name,
            quantityText,
            ingredient.category,
            `From meal plans (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`
          ]
        );
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        data: {
          ingredients,
          addedToList: true,
          listId: list_id,
          message: `${ingredients.length} ingredients added to shopping list`
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } else {
    // Just return the aggregated ingredients
    res.json({
      success: true,
      data: {
        ingredients,
        addedToList: false,
        message: `${ingredients.length} ingredients compiled from meal plans`
      }
    });
  }
}
