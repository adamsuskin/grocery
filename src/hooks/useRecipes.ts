import { useState, useEffect } from 'react';
import type { Recipe } from '../types';

/**
 * Mock hook for fetching recipes for a user
 * TODO: Replace with actual Zero store integration when backend is ready
 */
export function useRecipes(userId: string): Recipe[] {
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    // Mock recipe data for demonstration
    const mockRecipes: Recipe[] = [
      {
        id: 'recipe_1',
        name: 'Scrambled Eggs',
        description: 'Classic breakfast scrambled eggs',
        instructions: '1. Beat eggs\n2. Cook in pan\n3. Season to taste',
        prepTime: 5,
        cookTime: 10,
        servings: 2,
        difficulty: 'easy',
        cuisineType: 'American',
        userId,
        isPublic: false,
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now() - 86400000,
      },
      {
        id: 'recipe_2',
        name: 'Spaghetti Carbonara',
        description: 'Classic Italian pasta dish',
        instructions: '1. Cook pasta\n2. Prepare sauce\n3. Mix together',
        prepTime: 10,
        cookTime: 20,
        servings: 4,
        difficulty: 'medium',
        cuisineType: 'Italian',
        userId,
        isPublic: false,
        createdAt: Date.now() - 172800000,
        updatedAt: Date.now() - 172800000,
      },
      {
        id: 'recipe_3',
        name: 'Chicken Tacos',
        description: 'Quick and easy chicken tacos',
        instructions: '1. Cook chicken\n2. Prepare toppings\n3. Assemble tacos',
        prepTime: 15,
        cookTime: 25,
        servings: 4,
        difficulty: 'easy',
        cuisineType: 'Mexican',
        userId,
        isPublic: false,
        createdAt: Date.now() - 259200000,
        updatedAt: Date.now() - 259200000,
      },
      {
        id: 'recipe_4',
        name: 'Greek Salad',
        description: 'Fresh Mediterranean salad',
        instructions: '1. Chop vegetables\n2. Add feta\n3. Dress with olive oil',
        prepTime: 15,
        cookTime: 0,
        servings: 4,
        difficulty: 'easy',
        cuisineType: 'Mediterranean',
        userId,
        isPublic: false,
        createdAt: Date.now() - 345600000,
        updatedAt: Date.now() - 345600000,
      },
      {
        id: 'recipe_5',
        name: 'Trail Mix',
        description: 'Healthy snack mix',
        instructions: '1. Mix nuts and dried fruit\n2. Store in container',
        prepTime: 5,
        cookTime: 0,
        servings: 8,
        difficulty: 'easy',
        cuisineType: 'American',
        userId,
        isPublic: false,
        createdAt: Date.now() - 432000000,
        updatedAt: Date.now() - 432000000,
      },
    ];

    setRecipes(mockRecipes);
  }, [userId]);

  return recipes;
}

/**
 * Mock hook for recipe mutations
 * TODO: Replace with actual Zero store mutations when backend is ready
 */
export function useRecipeMutations() {
  const createRecipe = async (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<Recipe> => {
    console.log('Creating recipe:', recipe);
    return {
      ...recipe,
      id: `recipe_${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  };

  const updateRecipe = async (id: string, updates: Partial<Recipe>): Promise<Recipe> => {
    console.log('Updating recipe:', id, updates);
    return { ...updates, id } as Recipe;
  };

  const deleteRecipe = async (id: string): Promise<void> => {
    console.log('Deleting recipe:', id);
  };

  return {
    createRecipe,
    updateRecipe,
    deleteRecipe,
  };
}
