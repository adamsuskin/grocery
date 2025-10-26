import { useState, FormEvent, useEffect, useRef } from 'react';
import { useQuery } from '@rocicorp/zero/react';
import { useGroceryMutations } from '../hooks/useGroceryItems';
import { CATEGORIES } from '../types';
import { getZeroInstance } from '../zero-store';
import { isValidCategory, getCategoryOrFallback } from '../utils/categoryUtils';
import { logCategoryUsed } from '../utils/categoryAnalytics';
import { formatShortcutKey } from '../utils/keyboardShortcuts';
import {
  getCategorySuggestions,
  trackItemCategory,
  isHighConfidence,
  getConfidenceLevel,
  type CategorySuggestion,
} from '../utils/categorySuggestions';
import { CustomCategoriesOnboardingTour } from './CustomCategoriesOnboardingTour';
import { useCustomCategoriesTour } from '../hooks/useCustomCategoriesTour';

interface AddItemFormProps {
  listId: string | null;
  canEdit: boolean;
}

export function AddItemForm({ listId, canEdit }: AddItemFormProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [category, setCategory] = useState<string>('Other');
  const [notes, setNotes] = useState('');
  const [price, setPrice] = useState('');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { addItem } = useGroceryMutations();

  // Refs for keyboard shortcuts
  const categorySelectRef = useRef<HTMLSelectElement>(null);

  // Query custom categories for this list
  const zero = getZeroInstance();
  const customCategoriesQuery = useQuery(
    listId
      ? zero.query.custom_categories.where('list_id', listId)
      : zero.query.custom_categories.where('id', '')  // Empty query if no listId
  );

  // Transform custom categories to proper format
  const customCategories = customCategoriesQuery.map((c: any) => ({
    id: c.id,
    name: c.name,
    listId: c.list_id,
    createdBy: c.created_by,
    color: c.color || undefined,
    icon: c.icon || undefined,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));

  // Get all available category names
  const customCategoryNames = customCategories.map(c => c.name);

  // Onboarding tour
  const {
    showTour: showAddItemTour,
    shouldShowTour,
    startTour,
    completeTour,
    skipTour,
  } = useCustomCategoriesTour();

  // Show tour when user has custom categories but hasn't seen the additem tour
  useEffect(() => {
    if (canEdit && listId && shouldShowTour('additem', customCategories.length > 0)) {
      // Small delay to let the form render
      const timer = setTimeout(() => {
        startTour('additem');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [canEdit, listId, customCategories.length, shouldShowTour, startTour]);

  // Validate selected category when custom categories change
  // Handle race condition: if selected category is deleted, fallback to 'Other'
  useEffect(() => {
    if (category && !isValidCategory(category, customCategories)) {
      const fallbackCategory = getCategoryOrFallback(category, customCategories);
      if (fallbackCategory !== category) {
        setCategory(fallbackCategory);
        console.warn(`Category "${category}" no longer exists, falling back to "${fallbackCategory}"`);
      }
    }
  }, [category, customCategories]);

  // Generate category suggestions when item name changes
  useEffect(() => {
    if (!listId || name.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const newSuggestions = getCategorySuggestions(name, listId, customCategories);
    setSuggestions(newSuggestions);

    // Show suggestions if we have any
    if (newSuggestions.length > 0) {
      setShowSuggestions(true);

      // Auto-select category if first suggestion has high confidence
      const bestSuggestion = newSuggestions[0];
      if (isHighConfidence(bestSuggestion.confidence)) {
        setCategory(bestSuggestion.category);
      }
    }
  }, [name, listId, customCategories]);

  // Keyboard shortcut handler for Ctrl+Shift+C to focus category dropdown
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+Shift+C (or Cmd+Shift+C on Mac)
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        // Focus the category dropdown
        categorySelectRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!canEdit || !listId) {
      return;
    }

    const trimmedName = name.trim();
    const qty = parseInt(quantity, 10);
    const priceValue = price.trim() ? parseFloat(price) : undefined;

    // Validation
    if (!trimmedName || qty <= 0 || isNaN(qty)) {
      return;
    }

    // Validate price if provided (must be >= 0)
    if (priceValue !== undefined && (isNaN(priceValue) || priceValue < 0)) {
      return;
    }

    // Validate category exists (handle race condition where category might have been deleted)
    const validatedCategory = isValidCategory(category, customCategories)
      ? category
      : getCategoryOrFallback(category, customCategories);

    // If category was invalid, update the form state
    if (validatedCategory !== category) {
      setCategory(validatedCategory);
      console.warn(`Category "${category}" was invalid, using "${validatedCategory}" instead`);
    }

    await addItem(trimmedName, qty, validatedCategory, notes, listId, priceValue);

    // Track category usage in analytics (only for custom categories)
    if (!CATEGORIES.includes(validatedCategory as any)) {
      logCategoryUsed(listId, validatedCategory, { itemName: trimmedName });
    }

    // Track item-category association for future suggestions
    trackItemCategory(trimmedName, validatedCategory, listId);

    // Reset form
    setName('');
    setQuantity('1');
    setCategory('Other');
    setNotes('');
    setPrice('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handlePriceBlur = () => {
    // Format price to 2 decimal places on blur if a valid number is entered
    const priceValue = parseFloat(price);
    if (!isNaN(priceValue) && priceValue >= 0) {
      setPrice(priceValue.toFixed(2));
    }
  };

  const isDisabled = !canEdit || !listId;

  return (
    <>
      {/* Onboarding Tour */}
      {showAddItemTour && (
        <CustomCategoriesOnboardingTour
          context="additem"
          onComplete={() => completeTour('additem')}
          onSkip={() => skipTour('additem')}
        />
      )}

      <form onSubmit={handleSubmit} className="add-item-form">
      {!canEdit && listId && (
        <div className="permission-notice">
          You have view-only access to this list
        </div>
      )}
      {!listId && (
        <div className="permission-notice">
          Please select a list to add items
        </div>
      )}
      <div className="form-group">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name"
          className="input"
          required
          disabled={isDisabled}
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="category-suggestions">
            <div className="suggestions-header">Suggested categories:</div>
            <div className="suggestions-list">
              {suggestions.map((suggestion, index) => {
                const confidenceLevel = getConfidenceLevel(suggestion.confidence);
                const isSelected = category === suggestion.category;
                return (
                  <button
                    key={`${suggestion.category}-${index}`}
                    type="button"
                    className={`suggestion-chip ${confidenceLevel} ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setCategory(suggestion.category);
                      setShowSuggestions(false);
                    }}
                    disabled={isDisabled}
                    title={suggestion.reason}
                  >
                    <span className="suggestion-category">{suggestion.category}</span>
                    <span className="suggestion-confidence">
                      {Math.round(suggestion.confidence * 100)}%
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="dismiss-suggestions"
              onClick={() => setShowSuggestions(false)}
              disabled={isDisabled}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
      <div className="form-group">
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min="1"
          className="input input-number"
          required
          disabled={isDisabled}
        />
      </div>
      <div className="form-group price-input-group">
        <div className="price-input-wrapper" title="Price is optional and helps track spending">
          <span className="currency-symbol">$</span>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onBlur={handlePriceBlur}
            min="0"
            step="0.01"
            placeholder="0.00"
            className="input input-price"
            disabled={isDisabled}
          />
        </div>
      </div>
      <div className="form-group category-group">
        <label htmlFor="item-category" className="sr-only">
          Category
        </label>
        <div className="category-select-wrapper">
          <select
            id="item-category"
            ref={categorySelectRef}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input select-category"
            required
            disabled={isDisabled}
            aria-label={`Category. Keyboard shortcut: ${formatShortcutKey('ctrl+shift+c')}`}
            aria-describedby="category-helper-text"
          >
            <optgroup label="Standard Categories">
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </optgroup>
            {customCategoryNames.length > 0 && (
              <optgroup label="Custom Categories">
                {customCategoryNames.map((catName) => (
                  <option key={catName} value={catName}>
                    {catName}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <span id="category-helper-text" className="sr-only">
            Choose a category for this item. Press {formatShortcutKey('ctrl+shift+c')} to quickly access this dropdown.
          </span>
          <button
            type="button"
            className="btn btn-link manage-categories-btn"
            onClick={() => setShowCategoryManager(true)}
            disabled={isDisabled}
            aria-label="Manage custom categories"
          >
            Manage
          </button>
        </div>
      </div>
      <div className="form-group">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          className="input"
          rows={3}
          disabled={isDisabled}
        />
      </div>
      <button type="submit" className="btn btn-primary" disabled={isDisabled}>
        Add Item
      </button>

      {/* Custom Category Manager Modal */}
      {showCategoryManager && (
        <div className="modal-overlay" onClick={() => setShowCategoryManager(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Manage Custom Categories</h3>
              <button
                className="btn btn-icon"
                onClick={() => setShowCategoryManager(false)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>Custom category management will be implemented here.</p>
              <p>This will allow you to:</p>
              <ul>
                <li>Create new custom categories</li>
                <li>Edit existing custom categories</li>
                <li>Delete custom categories</li>
                <li>Assign colors and icons to categories</li>
              </ul>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowCategoryManager(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
    </>
  );
}
