import { useState, useEffect, FormEvent } from 'react';
import type {
  Recipe,
  CreateRecipeInput,
  UpdateRecipeInput,
  RecipeDifficulty,
  CuisineType,
  MeasurementUnit,
  RecipeIngredient,
} from '../types';
import { CATEGORIES } from '../types';
import { useQuery } from '@rocicorp/zero/react';
import { getZeroInstance } from '../zero-store';
import './RecipeEditor.css';

/**
 * Props for RecipeEditor component
 */
export interface RecipeEditorProps {
  recipe?: Recipe;
  isOpen: boolean;
  onClose: () => void;
  onSave: (recipe: CreateRecipeInput | UpdateRecipeInput) => Promise<void>;
  listId?: string;
}

/**
 * Internal ingredient form data
 */
interface IngredientFormData extends Omit<RecipeIngredient, 'id' | 'recipeId' | 'createdAt'> {
  tempId: string; // Temporary ID for form management
}

/**
 * Form validation errors
 */
interface ValidationErrors {
  name?: string;
  servings?: string;
  instructions?: string;
  ingredients?: string;
  imageUrl?: string;
}

/**
 * Difficulty options
 */
const DIFFICULTY_OPTIONS: RecipeDifficulty[] = ['easy', 'medium', 'hard'];

/**
 * Cuisine type options
 */
const CUISINE_OPTIONS: CuisineType[] = [
  'Italian',
  'Mexican',
  'Asian',
  'American',
  'Mediterranean',
  'Indian',
  'French',
  'Thai',
  'Other',
];

/**
 * Measurement unit options
 */
const UNIT_OPTIONS: MeasurementUnit[] = [
  'cup',
  'tbsp',
  'tsp',
  'oz',
  'lb',
  'g',
  'kg',
  'ml',
  'l',
  'piece',
  'whole',
  'clove',
  'bunch',
  'package',
];

/**
 * RecipeEditor Component
 *
 * Comprehensive modal form for creating and editing recipes with:
 * - Recipe metadata (name, description, times, servings, difficulty, cuisine)
 * - Image URL with preview
 * - Public/private toggle
 * - Ingredient editor with drag-and-drop reordering
 * - Instructions textarea
 * - Full validation
 */
export function RecipeEditor({ recipe, isOpen, onClose, onSave, listId }: RecipeEditorProps) {
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [prepTime, setPrepTime] = useState<number | ''>('');
  const [cookTime, setCookTime] = useState<number | ''>('');
  const [servings, setServings] = useState<number | ''>(4);
  const [difficulty, setDifficulty] = useState<RecipeDifficulty>('medium');
  const [cuisineType, setCuisineType] = useState<CuisineType>('Other');
  const [imageUrl, setImageUrl] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [ingredients, setIngredients] = useState<IngredientFormData[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Query custom categories for the list
  const zero = getZeroInstance();
  const customCategoriesQuery = useQuery(
    listId
      ? zero.query.custom_categories.where('list_id', listId)
      : zero.query.custom_categories.where('id', '')
  );

  const customCategories = customCategoriesQuery.map((c: any) => ({
    id: c.id,
    name: c.name,
  }));

  const customCategoryNames = customCategories.map(c => c.name);

  // Initialize form when recipe changes
  useEffect(() => {
    if (recipe) {
      setName(recipe.name);
      setDescription(recipe.description || '');
      setInstructions(recipe.instructions);
      setPrepTime(recipe.prepTime || '');
      setCookTime(recipe.cookTime || '');
      setServings(recipe.servings);
      setDifficulty(recipe.difficulty || 'medium');
      setCuisineType(recipe.cuisineType || 'Other');
      setImageUrl(recipe.imageUrl || '');
      setIsPublic(recipe.isPublic);

      // Convert recipe ingredients to form data
      if (recipe.ingredients) {
        const formIngredients: IngredientFormData[] = recipe.ingredients.map((ing) => ({
          tempId: ing.id,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes,
          category: ing.category,
          orderIndex: ing.orderIndex,
        }));
        setIngredients(formIngredients);
      } else {
        setIngredients([createEmptyIngredient()]);
      }
    } else {
      // Reset form for new recipe
      resetForm();
    }

    // Clear errors when opening
    setErrors({});
  }, [recipe, isOpen]);

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    setName('');
    setDescription('');
    setInstructions('');
    setPrepTime('');
    setCookTime('');
    setServings(4);
    setDifficulty('medium');
    setCuisineType('Other');
    setImageUrl('');
    setIsPublic(false);
    setIngredients([createEmptyIngredient()]);
    setErrors({});
  };

  /**
   * Create empty ingredient
   */
  const createEmptyIngredient = (orderIndex = 0): IngredientFormData => ({
    tempId: `temp-${Date.now()}-${Math.random()}`,
    name: '',
    quantity: 1,
    unit: 'cup',
    notes: '',
    category: 'Other',
    orderIndex,
  });

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Name is required
    if (!name.trim()) {
      newErrors.name = 'Recipe name is required';
    }

    // Servings must be positive
    if (!servings || servings <= 0) {
      newErrors.servings = 'Servings must be at least 1';
    }

    // Instructions are required
    if (!instructions.trim()) {
      newErrors.instructions = 'Instructions are required';
    }

    // At least one valid ingredient required
    const validIngredients = ingredients.filter(ing => ing.name.trim());
    if (validIngredients.length === 0) {
      newErrors.ingredients = 'At least one ingredient is required';
    }

    // Validate image URL if provided
    if (imageUrl.trim()) {
      try {
        new URL(imageUrl);
      } catch {
        newErrors.imageUrl = 'Please enter a valid URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Filter out empty ingredients and reindex
      const validIngredients = ingredients
        .filter(ing => ing.name.trim())
        .map((ing, index) => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes,
          category: ing.category,
          orderIndex: index,
        }));

      const recipeData: CreateRecipeInput | UpdateRecipeInput = {
        ...(recipe ? { id: recipe.id } : {}),
        name: name.trim(),
        description: description.trim() || undefined,
        instructions: instructions.trim(),
        prepTime: prepTime || undefined,
        cookTime: cookTime || undefined,
        servings: servings as number,
        difficulty,
        cuisineType,
        imageUrl: imageUrl.trim() || undefined,
        listId,
        isPublic,
        ingredients: validIngredients,
      };

      await onSave(recipeData);
      onClose();
    } catch (err) {
      console.error('Failed to save recipe:', err);
      setErrors({ name: err instanceof Error ? err.message : 'Failed to save recipe' });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle ingredient change
   */
  const handleIngredientChange = (
    index: number,
    field: keyof IngredientFormData,
    value: any
  ) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setIngredients(newIngredients);

    // Clear ingredient error when user starts typing
    if (errors.ingredients) {
      setErrors({ ...errors, ingredients: undefined });
    }
  };

  /**
   * Add ingredient row
   */
  const addIngredient = () => {
    setIngredients([...ingredients, createEmptyIngredient(ingredients.length)]);
  };

  /**
   * Remove ingredient row
   */
  const removeIngredient = (index: number) => {
    if (ingredients.length === 1) {
      // Keep at least one row, just clear it
      setIngredients([createEmptyIngredient()]);
    } else {
      const newIngredients = ingredients.filter((_, i) => i !== index);
      // Reindex
      newIngredients.forEach((ing, i) => {
        ing.orderIndex = i;
      });
      setIngredients(newIngredients);
    }
  };

  /**
   * Handle drag start
   */
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  /**
   * Handle drag over
   */
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === index) {
      return;
    }

    const newIngredients = [...ingredients];
    const draggedItem = newIngredients[draggedIndex];
    newIngredients.splice(draggedIndex, 1);
    newIngredients.splice(index, 0, draggedItem);

    // Reindex
    newIngredients.forEach((ing, i) => {
      ing.orderIndex = i;
    });

    setIngredients(newIngredients);
    setDraggedIndex(index);
  };

  /**
   * Handle drag end
   */
  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  /**
   * Handle modal overlay click
   */
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="recipe-editor-overlay" onClick={handleOverlayClick}>
      <div className="recipe-editor-content" role="dialog" aria-labelledby="recipe-editor-title">
        {/* Header */}
        <div className="recipe-editor-header">
          <h2 id="recipe-editor-title">{recipe ? 'Edit Recipe' : 'Create Recipe'}</h2>
          <button
            className="recipe-editor-close"
            onClick={onClose}
            aria-label="Close modal"
            type="button"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form className="recipe-editor-form" onSubmit={handleSubmit}>
          <div className="recipe-editor-body">
            {/* Basic Information Section */}
            <section className="recipe-section">
              <h3 className="recipe-section-title">Basic Information</h3>

              {/* Recipe Name */}
              <div className="recipe-form-group">
                <label htmlFor="recipe-name" className="recipe-form-label required">
                  Recipe Name
                </label>
                <input
                  id="recipe-name"
                  type="text"
                  className={`recipe-input ${errors.name ? 'input-error' : ''}`}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                  placeholder="e.g., Spaghetti Carbonara"
                  disabled={loading}
                  autoComplete="off"
                  required
                />
                {errors.name && (
                  <span className="recipe-field-error" role="alert">
                    {errors.name}
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="recipe-form-group">
                <label htmlFor="recipe-description" className="recipe-form-label">
                  Description
                </label>
                <textarea
                  id="recipe-description"
                  className="recipe-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of your recipe (optional)"
                  rows={3}
                  disabled={loading}
                />
              </div>

              {/* Recipe Details Grid */}
              <div className="recipe-details-grid">
                {/* Prep Time */}
                <div className="recipe-form-group">
                  <label htmlFor="recipe-prep-time" className="recipe-form-label">
                    Prep Time (min)
                  </label>
                  <input
                    id="recipe-prep-time"
                    type="number"
                    className="recipe-input"
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="15"
                    min="0"
                    disabled={loading}
                  />
                </div>

                {/* Cook Time */}
                <div className="recipe-form-group">
                  <label htmlFor="recipe-cook-time" className="recipe-form-label">
                    Cook Time (min)
                  </label>
                  <input
                    id="recipe-cook-time"
                    type="number"
                    className="recipe-input"
                    value={cookTime}
                    onChange={(e) => setCookTime(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="30"
                    min="0"
                    disabled={loading}
                  />
                </div>

                {/* Servings */}
                <div className="recipe-form-group">
                  <label htmlFor="recipe-servings" className="recipe-form-label required">
                    Servings
                  </label>
                  <input
                    id="recipe-servings"
                    type="number"
                    className={`recipe-input ${errors.servings ? 'input-error' : ''}`}
                    value={servings}
                    onChange={(e) => {
                      setServings(e.target.value ? parseInt(e.target.value) : '');
                      if (errors.servings) setErrors({ ...errors, servings: undefined });
                    }}
                    placeholder="4"
                    min="1"
                    disabled={loading}
                    required
                  />
                  {errors.servings && (
                    <span className="recipe-field-error" role="alert">
                      {errors.servings}
                    </span>
                  )}
                </div>

                {/* Difficulty */}
                <div className="recipe-form-group">
                  <label htmlFor="recipe-difficulty" className="recipe-form-label">
                    Difficulty
                  </label>
                  <select
                    id="recipe-difficulty"
                    className="recipe-select"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as RecipeDifficulty)}
                    disabled={loading}
                  >
                    {DIFFICULTY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cuisine Type */}
                <div className="recipe-form-group">
                  <label htmlFor="recipe-cuisine" className="recipe-form-label">
                    Cuisine Type
                  </label>
                  <select
                    id="recipe-cuisine"
                    className="recipe-select"
                    value={cuisineType}
                    onChange={(e) => setCuisineType(e.target.value as CuisineType)}
                    disabled={loading}
                  >
                    {CUISINE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Public/Private Toggle */}
                <div className="recipe-form-group recipe-checkbox-group">
                  <label className="recipe-checkbox-label">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      disabled={loading}
                    />
                    <span>Make recipe public</span>
                  </label>
                </div>
              </div>

              {/* Image URL */}
              <div className="recipe-form-group">
                <label htmlFor="recipe-image" className="recipe-form-label">
                  Image URL
                </label>
                <input
                  id="recipe-image"
                  type="url"
                  className={`recipe-input ${errors.imageUrl ? 'input-error' : ''}`}
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    if (errors.imageUrl) setErrors({ ...errors, imageUrl: undefined });
                  }}
                  placeholder="https://example.com/image.jpg"
                  disabled={loading}
                />
                {errors.imageUrl && (
                  <span className="recipe-field-error" role="alert">
                    {errors.imageUrl}
                  </span>
                )}
                {imageUrl && !errors.imageUrl && (
                  <div className="recipe-image-preview">
                    <img
                      src={imageUrl}
                      alt="Recipe preview"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        setErrors({ ...errors, imageUrl: 'Failed to load image' });
                      }}
                    />
                  </div>
                )}
              </div>
            </section>

            {/* Ingredients Section */}
            <section className="recipe-section">
              <div className="recipe-section-header">
                <h3 className="recipe-section-title">Ingredients</h3>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={addIngredient}
                  disabled={loading}
                >
                  + Add Ingredient
                </button>
              </div>

              {errors.ingredients && (
                <div className="recipe-field-error" role="alert">
                  {errors.ingredients}
                </div>
              )}

              <div className="recipe-ingredients-list">
                {ingredients.map((ingredient, index) => (
                  <IngredientRow
                    key={ingredient.tempId}
                    ingredient={ingredient}
                    index={index}
                    onChange={handleIngredientChange}
                    onRemove={removeIngredient}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    disabled={loading}
                    isDragging={draggedIndex === index}
                    categories={[...CATEGORIES, ...customCategoryNames]}
                  />
                ))}
              </div>
            </section>

            {/* Instructions Section */}
            <section className="recipe-section">
              <h3 className="recipe-section-title">Instructions</h3>
              <div className="recipe-form-group">
                <label htmlFor="recipe-instructions" className="recipe-form-label required">
                  Cooking Instructions
                </label>
                <textarea
                  id="recipe-instructions"
                  className={`recipe-textarea recipe-textarea-large ${errors.instructions ? 'input-error' : ''}`}
                  value={instructions}
                  onChange={(e) => {
                    setInstructions(e.target.value);
                    if (errors.instructions) setErrors({ ...errors, instructions: undefined });
                  }}
                  placeholder="Enter step-by-step instructions..."
                  rows={10}
                  disabled={loading}
                  required
                />
                {errors.instructions && (
                  <span className="recipe-field-error" role="alert">
                    {errors.instructions}
                  </span>
                )}
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="recipe-editor-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="recipe-spinner"></span>
                  <span>Saving...</span>
                </>
              ) : (
                <span>{recipe ? 'Update Recipe' : 'Create Recipe'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Props for IngredientRow component
 */
interface IngredientRowProps {
  ingredient: IngredientFormData;
  index: number;
  onChange: (index: number, field: keyof IngredientFormData, value: any) => void;
  onRemove: (index: number) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  disabled: boolean;
  isDragging: boolean;
  categories: string[];
}

/**
 * IngredientRow Component
 *
 * Represents a single ingredient row with:
 * - Drag handle for reordering
 * - Name input
 * - Quantity input
 * - Unit dropdown
 * - Category selector
 * - Notes field
 * - Remove button
 */
function IngredientRow({
  ingredient,
  index,
  onChange,
  onRemove,
  onDragStart,
  onDragOver,
  onDragEnd,
  disabled,
  isDragging,
  categories,
}: IngredientRowProps) {
  return (
    <div
      className={`ingredient-row ${isDragging ? 'dragging' : ''}`}
      draggable={!disabled}
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
    >
      {/* Drag Handle */}
      <div className="ingredient-drag-handle" title="Drag to reorder">
        ⋮⋮
      </div>

      {/* Ingredient Name */}
      <div className="ingredient-field ingredient-name">
        <input
          type="text"
          className="recipe-input"
          value={ingredient.name}
          onChange={(e) => onChange(index, 'name', e.target.value)}
          placeholder="Ingredient name"
          disabled={disabled}
        />
      </div>

      {/* Quantity */}
      <div className="ingredient-field ingredient-quantity">
        <input
          type="number"
          className="recipe-input"
          value={ingredient.quantity}
          onChange={(e) => onChange(index, 'quantity', parseFloat(e.target.value) || 0)}
          placeholder="1"
          min="0"
          step="0.01"
          disabled={disabled}
        />
      </div>

      {/* Unit */}
      <div className="ingredient-field ingredient-unit">
        <select
          className="recipe-select"
          value={ingredient.unit}
          onChange={(e) => onChange(index, 'unit', e.target.value)}
          disabled={disabled}
        >
          {UNIT_OPTIONS.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div className="ingredient-field ingredient-category">
        <select
          className="recipe-select"
          value={ingredient.category}
          onChange={(e) => onChange(index, 'category', e.target.value)}
          disabled={disabled}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div className="ingredient-field ingredient-notes">
        <input
          type="text"
          className="recipe-input"
          value={ingredient.notes || ''}
          onChange={(e) => onChange(index, 'notes', e.target.value)}
          placeholder="Notes (optional)"
          disabled={disabled}
        />
      </div>

      {/* Remove Button */}
      <button
        type="button"
        className="ingredient-remove-btn"
        onClick={() => onRemove(index)}
        disabled={disabled}
        aria-label="Remove ingredient"
        title="Remove ingredient"
      >
        ✕
      </button>
    </div>
  );
}
