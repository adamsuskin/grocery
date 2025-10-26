/**
 * Recipe collections controller
 * Handles recipe collection operations for organizing recipes
 */

import { Response } from 'express';
import { AuthRequest } from '../types';
import { pool } from '../config/db';
import { NotFoundError, AuthorizationError, ValidationError } from '../middleware/errorHandler';

/**
 * Recipe collection entity interface
 */
interface RecipeCollection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create a new recipe collection
 * @route POST /api/collections
 */
export async function createCollection(req: AuthRequest, res: Response): Promise<void> {
  const { name, description } = req.body;
  const userId = req.user!.userId;

  // Validate required fields
  if (!name || !name.trim()) {
    throw new ValidationError('Collection name is required');
  }

  if (name.length > 255) {
    throw new ValidationError('Collection name must be 255 characters or less');
  }

  // Check for duplicate collection name for this user
  const existingResult = await pool.query(
    'SELECT id FROM recipe_collections WHERE user_id = $1 AND LOWER(name) = LOWER($2)',
    [userId, name.trim()]
  );

  if (existingResult.rows.length > 0) {
    throw new ValidationError('You already have a collection with this name');
  }

  // Create collection
  const result = await pool.query<RecipeCollection>(
    `INSERT INTO recipe_collections (user_id, name, description)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, name.trim(), description]
  );

  res.status(201).json({
    success: true,
    data: {
      collection: result.rows[0]
    }
  });
}

/**
 * Get user's recipe collections
 * @route GET /api/collections
 */
export async function getCollections(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.userId;

  // Get all collections with recipe count
  const result = await pool.query(
    `SELECT rc.*,
            COUNT(rcr.recipe_id) as recipe_count
     FROM recipe_collections rc
     LEFT JOIN recipe_collection_recipes rcr ON rc.id = rcr.collection_id
     WHERE rc.user_id = $1
     GROUP BY rc.id
     ORDER BY rc.created_at DESC`,
    [userId]
  );

  res.json({
    success: true,
    data: {
      collections: result.rows
    }
  });
}

/**
 * Get single collection with recipes
 * @route GET /api/collections/:id
 */
export async function getCollection(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.userId;

  // Get collection
  const collectionResult = await pool.query<RecipeCollection>(
    'SELECT * FROM recipe_collections WHERE id = $1',
    [id]
  );

  if (collectionResult.rows.length === 0) {
    throw new NotFoundError('Collection not found');
  }

  const collection = collectionResult.rows[0];

  // Check if user owns the collection
  if (collection.user_id !== userId) {
    throw new AuthorizationError('You do not have access to this collection');
  }

  // Get recipes in this collection
  const recipesResult = await pool.query(
    `SELECT r.*,
            rcr.added_at,
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
     FROM recipe_collection_recipes rcr
     INNER JOIN recipes r ON rcr.recipe_id = r.id
     LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
     WHERE rcr.collection_id = $1
     GROUP BY r.id, rcr.added_at
     ORDER BY rcr.added_at DESC`,
    [id]
  );

  res.json({
    success: true,
    data: {
      collection: {
        ...collection,
        recipes: recipesResult.rows
      }
    }
  });
}

/**
 * Update collection
 * @route PUT /api/collections/:id
 */
export async function updateCollection(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { name, description } = req.body;
  const userId = req.user!.userId;

  // Check if collection exists and user owns it
  const collectionResult = await pool.query<RecipeCollection>(
    'SELECT * FROM recipe_collections WHERE id = $1',
    [id]
  );

  if (collectionResult.rows.length === 0) {
    throw new NotFoundError('Collection not found');
  }

  const collection = collectionResult.rows[0];

  if (collection.user_id !== userId) {
    throw new AuthorizationError('Only the collection owner can update it');
  }

  // Build dynamic update query
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (name !== undefined) {
    if (!name.trim()) {
      throw new ValidationError('Collection name cannot be empty');
    }
    if (name.length > 255) {
      throw new ValidationError('Collection name must be 255 characters or less');
    }

    // Check for duplicate name
    const existingResult = await pool.query(
      'SELECT id FROM recipe_collections WHERE user_id = $1 AND LOWER(name) = LOWER($2) AND id != $3',
      [userId, name.trim(), id]
    );

    if (existingResult.rows.length > 0) {
      throw new ValidationError('You already have a collection with this name');
    }

    updates.push(`name = $${paramCount++}`);
    values.push(name.trim());
  }

  if (description !== undefined) {
    updates.push(`description = $${paramCount++}`);
    values.push(description);
  }

  if (updates.length === 0) {
    throw new ValidationError('No fields to update');
  }

  values.push(id);

  // Update collection
  const updateResult = await pool.query<RecipeCollection>(
    `UPDATE recipe_collections
     SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount}
     RETURNING *`,
    values
  );

  res.json({
    success: true,
    data: {
      collection: updateResult.rows[0]
    }
  });
}

/**
 * Delete collection
 * @route DELETE /api/collections/:id
 */
export async function deleteCollection(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.userId;

  // Check if collection exists and user owns it
  const collectionResult = await pool.query<RecipeCollection>(
    'SELECT * FROM recipe_collections WHERE id = $1',
    [id]
  );

  if (collectionResult.rows.length === 0) {
    throw new NotFoundError('Collection not found');
  }

  const collection = collectionResult.rows[0];

  if (collection.user_id !== userId) {
    throw new AuthorizationError('Only the collection owner can delete it');
  }

  // Delete collection (CASCADE will handle recipe associations)
  await pool.query('DELETE FROM recipe_collections WHERE id = $1', [id]);

  res.json({
    success: true,
    message: 'Collection deleted successfully'
  });
}

/**
 * Add recipe to collection
 * @route POST /api/collections/:id/recipes/:recipeId
 */
export async function addRecipe(req: AuthRequest, res: Response): Promise<void> {
  const { id, recipeId } = req.params;
  const userId = req.user!.userId;

  // Check if collection exists and user owns it
  const collectionResult = await pool.query<RecipeCollection>(
    'SELECT * FROM recipe_collections WHERE id = $1',
    [id]
  );

  if (collectionResult.rows.length === 0) {
    throw new NotFoundError('Collection not found');
  }

  const collection = collectionResult.rows[0];

  if (collection.user_id !== userId) {
    throw new AuthorizationError('Only the collection owner can add recipes');
  }

  // Check if recipe exists and user has access to it
  const recipeResult = await pool.query(
    'SELECT * FROM recipes WHERE id = $1 AND (user_id = $2 OR is_public = true)',
    [recipeId, userId]
  );

  if (recipeResult.rows.length === 0) {
    throw new NotFoundError('Recipe not found or you do not have access to it');
  }

  // Check if recipe is already in collection
  const existingResult = await pool.query(
    'SELECT * FROM recipe_collection_recipes WHERE collection_id = $1 AND recipe_id = $2',
    [id, recipeId]
  );

  if (existingResult.rows.length > 0) {
    throw new ValidationError('Recipe is already in this collection');
  }

  // Add recipe to collection
  await pool.query(
    `INSERT INTO recipe_collection_recipes (collection_id, recipe_id)
     VALUES ($1, $2)`,
    [id, recipeId]
  );

  res.status(201).json({
    success: true,
    message: 'Recipe added to collection successfully'
  });
}

/**
 * Remove recipe from collection
 * @route DELETE /api/collections/:id/recipes/:recipeId
 */
export async function removeRecipe(req: AuthRequest, res: Response): Promise<void> {
  const { id, recipeId } = req.params;
  const userId = req.user!.userId;

  // Check if collection exists and user owns it
  const collectionResult = await pool.query<RecipeCollection>(
    'SELECT * FROM recipe_collections WHERE id = $1',
    [id]
  );

  if (collectionResult.rows.length === 0) {
    throw new NotFoundError('Collection not found');
  }

  const collection = collectionResult.rows[0];

  if (collection.user_id !== userId) {
    throw new AuthorizationError('Only the collection owner can remove recipes');
  }

  // Check if recipe is in collection
  const existingResult = await pool.query(
    'SELECT * FROM recipe_collection_recipes WHERE collection_id = $1 AND recipe_id = $2',
    [id, recipeId]
  );

  if (existingResult.rows.length === 0) {
    throw new NotFoundError('Recipe not found in this collection');
  }

  // Remove recipe from collection
  await pool.query(
    'DELETE FROM recipe_collection_recipes WHERE collection_id = $1 AND recipe_id = $2',
    [id, recipeId]
  );

  res.json({
    success: true,
    message: 'Recipe removed from collection successfully'
  });
}
