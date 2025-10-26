/**
 * Recipes controller
 * Handles all recipe management operations including CRUD and sharing
 */

import { Response } from 'express';
import { AuthRequest } from '../types';
import { pool } from '../config/db';
import { NotFoundError, AuthorizationError, ValidationError } from '../middleware/errorHandler';

/**
 * Recipe entity interface
 */
interface Recipe {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  instructions?: string;
  servings?: number;
  prep_time?: number;
  cook_time?: number;
  image_url?: string;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Recipe ingredient interface
 */
interface RecipeIngredient {
  id: string;
  recipe_id: string;
  name: string;
  quantity?: string;
  unit?: string;
  category?: string;
  order_index: number;
}

/**
 * Create a new recipe with ingredients
 * @route POST /api/recipes
 */
export async function createRecipe(req: AuthRequest, res: Response): Promise<void> {
  const {
    title,
    description,
    instructions,
    servings,
    prep_time,
    cook_time,
    image_url,
    is_public = false,
    ingredients = []
  } = req.body;
  const userId = req.user!.userId;

  // Validate required fields
  if (!title || !title.trim()) {
    throw new ValidationError('Recipe title is required');
  }

  if (title.length > 255) {
    throw new ValidationError('Recipe title must be 255 characters or less');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create the recipe
    const recipeResult = await client.query<Recipe>(
      `INSERT INTO recipes (user_id, title, description, instructions, servings, prep_time, cook_time, image_url, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [userId, title.trim(), description, instructions, servings, prep_time, cook_time, image_url, is_public]
    );

    const recipe = recipeResult.rows[0];

    // Add ingredients if provided
    const createdIngredients: RecipeIngredient[] = [];
    if (ingredients.length > 0) {
      for (let i = 0; i < ingredients.length; i++) {
        const ingredient = ingredients[i];
        const ingredientResult = await client.query<RecipeIngredient>(
          `INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, category, order_index)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [recipe.id, ingredient.name, ingredient.quantity, ingredient.unit, ingredient.category, i]
        );
        createdIngredients.push(ingredientResult.rows[0]);
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: {
        recipe: {
          ...recipe,
          ingredients: createdIngredients
        }
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get user's recipes with optional filtering
 * @route GET /api/recipes
 * @query is_public - Filter by public/private (optional)
 * @query search - Search in title and description (optional)
 */
export async function getRecipes(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { is_public, search } = req.query;

  let query = `
    SELECT r.*,
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
    FROM recipes r
    LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
    WHERE r.user_id = $1
  `;

  const params: any[] = [userId];
  let paramCount = 1;

  // Filter by public/private status
  if (is_public !== undefined) {
    paramCount++;
    query += ` AND r.is_public = $${paramCount}`;
    params.push(is_public === 'true');
  }

  // Search filter
  if (search && typeof search === 'string') {
    paramCount++;
    query += ` AND (r.title ILIKE $${paramCount} OR r.description ILIKE $${paramCount})`;
    params.push(`%${search}%`);
  }

  query += `
    GROUP BY r.id
    ORDER BY r.created_at DESC
  `;

  const result = await pool.query(query, params);

  res.json({
    success: true,
    data: {
      recipes: result.rows
    }
  });
}

/**
 * Get all public recipes
 * @route GET /api/recipes/public
 * @query search - Search in title and description (optional)
 */
export async function getPublicRecipes(req: AuthRequest, res: Response): Promise<void> {
  const { search } = req.query;

  let query = `
    SELECT r.*,
           u.name as author_name,
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
    FROM recipes r
    INNER JOIN users u ON r.user_id = u.id
    LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
    WHERE r.is_public = true
  `;

  const params: any[] = [];

  // Search filter
  if (search && typeof search === 'string') {
    params.push(`%${search}%`);
    query += ` AND (r.title ILIKE $1 OR r.description ILIKE $1)`;
  }

  query += `
    GROUP BY r.id, u.name
    ORDER BY r.created_at DESC
  `;

  const result = await pool.query(query, params);

  res.json({
    success: true,
    data: {
      recipes: result.rows
    }
  });
}

/**
 * Get single recipe with ingredients
 * @route GET /api/recipes/:id
 */
export async function getRecipe(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.userId;

  // Get recipe
  const recipeResult = await pool.query<Recipe>(
    'SELECT * FROM recipes WHERE id = $1',
    [id]
  );

  if (recipeResult.rows.length === 0) {
    throw new NotFoundError('Recipe not found');
  }

  const recipe = recipeResult.rows[0];

  // Check access: must be owner or recipe must be public
  if (recipe.user_id !== userId && !recipe.is_public) {
    throw new AuthorizationError('You do not have access to this recipe');
  }

  // Get ingredients
  const ingredientsResult = await pool.query<RecipeIngredient>(
    `SELECT * FROM recipe_ingredients
     WHERE recipe_id = $1
     ORDER BY order_index`,
    [id]
  );

  res.json({
    success: true,
    data: {
      recipe: {
        ...recipe,
        ingredients: ingredientsResult.rows
      }
    }
  });
}

/**
 * Update recipe and ingredients
 * @route PUT /api/recipes/:id
 */
export async function updateRecipe(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const {
    title,
    description,
    instructions,
    servings,
    prep_time,
    cook_time,
    image_url,
    is_public,
    ingredients
  } = req.body;
  const userId = req.user!.userId;

  // Check if recipe exists and user owns it
  const recipeResult = await pool.query<Recipe>(
    'SELECT * FROM recipes WHERE id = $1',
    [id]
  );

  if (recipeResult.rows.length === 0) {
    throw new NotFoundError('Recipe not found');
  }

  const recipe = recipeResult.rows[0];

  if (recipe.user_id !== userId) {
    throw new AuthorizationError('Only the recipe owner can update it');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (title !== undefined) {
      if (!title.trim()) {
        throw new ValidationError('Recipe title cannot be empty');
      }
      updates.push(`title = $${paramCount++}`);
      values.push(title.trim());
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }

    if (instructions !== undefined) {
      updates.push(`instructions = $${paramCount++}`);
      values.push(instructions);
    }

    if (servings !== undefined) {
      updates.push(`servings = $${paramCount++}`);
      values.push(servings);
    }

    if (prep_time !== undefined) {
      updates.push(`prep_time = $${paramCount++}`);
      values.push(prep_time);
    }

    if (cook_time !== undefined) {
      updates.push(`cook_time = $${paramCount++}`);
      values.push(cook_time);
    }

    if (image_url !== undefined) {
      updates.push(`image_url = $${paramCount++}`);
      values.push(image_url);
    }

    if (is_public !== undefined) {
      updates.push(`is_public = $${paramCount++}`);
      values.push(is_public);
    }

    // Update recipe if there are changes
    let updatedRecipe = recipe;
    if (updates.length > 0) {
      values.push(id);
      const updateResult = await client.query<Recipe>(
        `UPDATE recipes
         SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );
      updatedRecipe = updateResult.rows[0];
    }

    // Update ingredients if provided
    let updatedIngredients: RecipeIngredient[] = [];
    if (ingredients !== undefined && Array.isArray(ingredients)) {
      // Delete existing ingredients
      await client.query('DELETE FROM recipe_ingredients WHERE recipe_id = $1', [id]);

      // Insert new ingredients
      for (let i = 0; i < ingredients.length; i++) {
        const ingredient = ingredients[i];
        const ingredientResult = await client.query<RecipeIngredient>(
          `INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, category, order_index)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [id, ingredient.name, ingredient.quantity, ingredient.unit, ingredient.category, i]
        );
        updatedIngredients.push(ingredientResult.rows[0]);
      }
    } else {
      // Get existing ingredients if not updated
      const ingredientsResult = await client.query<RecipeIngredient>(
        'SELECT * FROM recipe_ingredients WHERE recipe_id = $1 ORDER BY order_index',
        [id]
      );
      updatedIngredients = ingredientsResult.rows;
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        recipe: {
          ...updatedRecipe,
          ingredients: updatedIngredients
        }
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Delete recipe (cascade to ingredients)
 * @route DELETE /api/recipes/:id
 */
export async function deleteRecipe(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.userId;

  // Check if recipe exists and user owns it
  const recipeResult = await pool.query<Recipe>(
    'SELECT * FROM recipes WHERE id = $1',
    [id]
  );

  if (recipeResult.rows.length === 0) {
    throw new NotFoundError('Recipe not found');
  }

  const recipe = recipeResult.rows[0];

  if (recipe.user_id !== userId) {
    throw new AuthorizationError('Only the recipe owner can delete it');
  }

  // Delete recipe (CASCADE will handle ingredients)
  await pool.query('DELETE FROM recipes WHERE id = $1', [id]);

  res.json({
    success: true,
    message: 'Recipe deleted successfully'
  });
}

/**
 * Duplicate recipe with new name
 * @route POST /api/recipes/:id/duplicate
 */
export async function duplicateRecipe(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { title } = req.body;
  const userId = req.user!.userId;

  // Get original recipe
  const recipeResult = await pool.query<Recipe>(
    'SELECT * FROM recipes WHERE id = $1',
    [id]
  );

  if (recipeResult.rows.length === 0) {
    throw new NotFoundError('Recipe not found');
  }

  const originalRecipe = recipeResult.rows[0];

  // Check access: must be owner or recipe must be public
  if (originalRecipe.user_id !== userId && !originalRecipe.is_public) {
    throw new AuthorizationError('You do not have access to this recipe');
  }

  // Get ingredients
  const ingredientsResult = await pool.query<RecipeIngredient>(
    'SELECT * FROM recipe_ingredients WHERE recipe_id = $1 ORDER BY order_index',
    [id]
  );

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create duplicate recipe with new title or default
    const newTitle = title || `Copy of ${originalRecipe.title}`;
    const newRecipeResult = await client.query<Recipe>(
      `INSERT INTO recipes (user_id, title, description, instructions, servings, prep_time, cook_time, image_url, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        userId,
        newTitle,
        originalRecipe.description,
        originalRecipe.instructions,
        originalRecipe.servings,
        originalRecipe.prep_time,
        originalRecipe.cook_time,
        originalRecipe.image_url,
        false // Duplicates are always private by default
      ]
    );

    const newRecipe = newRecipeResult.rows[0];

    // Copy ingredients
    const newIngredients: RecipeIngredient[] = [];
    for (const ingredient of ingredientsResult.rows) {
      const ingredientResult = await client.query<RecipeIngredient>(
        `INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, category, order_index)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [newRecipe.id, ingredient.name, ingredient.quantity, ingredient.unit, ingredient.category, ingredient.order_index]
      );
      newIngredients.push(ingredientResult.rows[0]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: {
        recipe: {
          ...newRecipe,
          ingredients: newIngredients
        }
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Toggle recipe public/private status
 * @route PATCH /api/recipes/:id/public
 */
export async function togglePublic(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { is_public } = req.body;
  const userId = req.user!.userId;

  if (typeof is_public !== 'boolean') {
    throw new ValidationError('is_public must be a boolean value');
  }

  // Check if recipe exists and user owns it
  const recipeResult = await pool.query<Recipe>(
    'SELECT * FROM recipes WHERE id = $1',
    [id]
  );

  if (recipeResult.rows.length === 0) {
    throw new NotFoundError('Recipe not found');
  }

  const recipe = recipeResult.rows[0];

  if (recipe.user_id !== userId) {
    throw new AuthorizationError('Only the recipe owner can change visibility');
  }

  // Update public status
  const updateResult = await pool.query<Recipe>(
    `UPDATE recipes
     SET is_public = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [is_public, id]
  );

  res.json({
    success: true,
    data: {
      recipe: updateResult.rows[0]
    }
  });
}

/**
 * Search recipes by keywords
 * @route GET /api/recipes/search
 * @query q - Search query (required)
 * @query public_only - Only search public recipes (default: false)
 */
export async function searchRecipes(req: AuthRequest, res: Response): Promise<void> {
  const { q, public_only } = req.query;
  const userId = req.user!.userId;

  if (!q || typeof q !== 'string') {
    throw new ValidationError('Search query (q) is required');
  }

  const searchTerm = `%${q}%`;
  const publicOnly = public_only === 'true';

  let query = `
    SELECT r.*,
           u.name as author_name,
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
    FROM recipes r
    INNER JOIN users u ON r.user_id = u.id
    LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
    WHERE (r.title ILIKE $1 OR r.description ILIKE $1 OR ri.name ILIKE $1)
  `;

  const params: any[] = [searchTerm];

  if (publicOnly) {
    query += ' AND r.is_public = true';
  } else {
    params.push(userId);
    query += ' AND (r.is_public = true OR r.user_id = $2)';
  }

  query += `
    GROUP BY r.id, u.name
    ORDER BY r.created_at DESC
    LIMIT 50
  `;

  const result = await pool.query(query, params);

  res.json({
    success: true,
    data: {
      recipes: result.rows,
      query: q
    }
  });
}
