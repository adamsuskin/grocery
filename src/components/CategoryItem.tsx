/**
 * Performance-Optimized Category Item Component
 *
 * This component represents a single category item in the category manager.
 * It's wrapped with React.memo to prevent unnecessary re-renders.
 *
 * PERFORMANCE OPTIMIZATIONS:
 * - Memoized with React.memo to skip re-renders when props haven't changed
 * - All event handlers use useCallback to maintain referential equality
 * - Minimal inline object/array creation
 * - Conditional rendering to avoid DOM updates
 */

import { memo, useCallback, useState } from 'react';
import type { CustomCategory } from '../types';
import { ColorPicker } from './ColorPicker';
import { EmojiPicker } from './EmojiPicker';

interface CategoryItemProps {
  category: CustomCategory;
  isSelected: boolean;
  isEditing: boolean;
  canEdit: boolean;
  onToggleSelect: (categoryId: string) => void;
  onStartEdit: (categoryId: string) => void;
  onSaveEdit: (categoryId: string, name: string, color: string, icon: string) => void;
  onCancelEdit: () => void;
  onStartDelete: (categoryId: string) => void;
}

/**
 * Memoized category item component
 * Only re-renders when props change
 */
export const CategoryItem = memo(function CategoryItem({
  category,
  isSelected,
  isEditing,
  canEdit,
  onToggleSelect,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onStartDelete,
}: CategoryItemProps) {
  // Local state for editing
  const [editName, setEditName] = useState(category.name);
  const [editColor, setEditColor] = useState(category.color || '#4CAF50');
  const [editIcon, setEditIcon] = useState(category.icon || '');

  // Memoized event handlers to prevent child re-renders
  const handleToggleSelect = useCallback(() => {
    onToggleSelect(category.id);
  }, [category.id, onToggleSelect]);

  const handleStartEdit = useCallback(() => {
    setEditName(category.name);
    setEditColor(category.color || '#4CAF50');
    setEditIcon(category.icon || '');
    onStartEdit(category.id);
  }, [category.id, category.name, category.color, category.icon, onStartEdit]);

  const handleSaveEdit = useCallback(() => {
    onSaveEdit(category.id, editName, editColor, editIcon);
  }, [category.id, editName, editColor, editIcon, onSaveEdit]);

  const handleCancelEdit = useCallback(() => {
    onCancelEdit();
  }, [onCancelEdit]);

  const handleStartDelete = useCallback(() => {
    onStartDelete(category.id);
  }, [category.id, onStartDelete]);

  // Memoized input change handlers
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditName(e.target.value);
  }, []);

  const handleColorChange = useCallback((color: string) => {
    setEditColor(color);
  }, []);

  const handleIconChange = useCallback((icon: string) => {
    setEditIcon(icon);
  }, []);

  // Early return for editing state to avoid rendering view mode
  if (isEditing) {
    return (
      <div className={`category-item custom-category ${isSelected ? 'selected' : ''}`}>
        <div className="category-edit-form">
          <div className="form-group form-group-full">
            <label htmlFor={`edit-name-${category.id}`}>Category Name</label>
            <input
              id={`edit-name-${category.id}`}
              type="text"
              className="input"
              value={editName}
              onChange={handleNameChange}
              maxLength={100}
              autoFocus
            />
          </div>

          <div className="form-group">
            <EmojiPicker
              value={editIcon}
              onChange={handleIconChange}
              label="Icon"
            />
          </div>

          <div className="form-group">
            <ColorPicker
              value={editColor}
              onChange={handleColorChange}
              label="Color"
            />
          </div>

          <div className="category-actions">
            <button
              className="btn btn-small btn-primary"
              onClick={handleSaveEdit}
            >
              Save
            </button>
            <button
              className="btn btn-small btn-secondary"
              onClick={handleCancelEdit}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // View mode
  return (
    <div className={`category-item custom-category ${isSelected ? 'selected' : ''}`}>
      {canEdit && (
        <div className="category-checkbox">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleToggleSelect}
            aria-label={`Select ${category.name}`}
          />
        </div>
      )}
      <div className="category-info">
        <div className="category-visual">
          {category.icon && (
            <span className="category-icon">{category.icon}</span>
          )}
          {category.color && (
            <span
              className="category-color-preview"
              style={{ backgroundColor: category.color }}
              title={`Color: ${category.color}`}
            />
          )}
        </div>
        <span className="category-name">{category.name}</span>
      </div>

      {canEdit && (
        <div className="category-actions">
          <button
            className="btn btn-icon"
            onClick={handleStartEdit}
            title="Edit category"
            aria-label={`Edit ${category.name}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            className="btn btn-icon btn-danger"
            onClick={handleStartDelete}
            title="Delete category"
            aria-label={`Delete ${category.name}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  // Only re-render if these specific props change
  return (
    prevProps.category.id === nextProps.category.id &&
    prevProps.category.name === nextProps.category.name &&
    prevProps.category.color === nextProps.category.color &&
    prevProps.category.icon === nextProps.category.icon &&
    prevProps.category.updatedAt === nextProps.category.updatedAt &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.canEdit === nextProps.canEdit
  );
});
