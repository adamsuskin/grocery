import { useState, useRef } from 'react';
import { useMobileDetection } from '../hooks/useMobileDetection';
import { useSwipeGesture, useLongPress } from '../hooks/useSwipeGesture';
import type { CustomCategory } from '../types';

interface CategoryItemMobileProps {
  category: CustomCategory;
  isEditing: boolean;
  isSelected: boolean;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSelect: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  editName: string;
  editColor: string;
  editIcon: string;
  onEditNameChange: (name: string) => void;
  onEditColorChange: (color: string) => void;
  onEditIconChange: (icon: string) => void;
}

/**
 * Mobile-optimized category item with swipe gestures
 */
export function CategoryItemMobile({
  category,
  isEditing,
  isSelected,
  canEdit,
  onEdit,
  onDelete,
  onSelect,
  onCancelEdit,
  onSaveEdit,
  editName,
  editColor,
  editIcon,
  onEditNameChange,
  onEditColorChange,
  onEditIconChange,
}: CategoryItemMobileProps) {
  const { isMobile } = useMobileDetection();
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showActions, setShowActions] = useState(false);
  const touchStartX = useRef(0);
  const itemRef = useRef<HTMLDivElement>(null);

  // Swipe gesture for revealing actions
  const swipeRef = useSwipeGesture<HTMLDivElement>({
    onSwipeLeft: () => {
      if (canEdit && !isEditing) {
        setShowActions(true);
      }
    },
    onSwipeRight: () => {
      setShowActions(false);
    },
    threshold: 50,
  });

  // Long press for context menu
  const longPressRef = useLongPress<HTMLDivElement>(() => {
    if (canEdit && !isEditing) {
      setShowActions(true);
    }
  }, 500);

  // Combine refs
  const handleRef = (element: HTMLDivElement | null) => {
    swipeRef.current = element;
    longPressRef.current = element;
    itemRef.current = element;
  };

  const handleDeleteClick = () => {
    setShowActions(false);
    onDelete();
  };

  const handleEditClick = () => {
    setShowActions(false);
    onEdit();
  };

  if (isEditing) {
    return (
      <div className="category-item custom-category editing">
        <div className="category-edit-form-mobile">
          <div className="form-group form-group-full">
            <label htmlFor={`edit-name-${category.id}`}>Category Name</label>
            <input
              id={`edit-name-${category.id}`}
              type="text"
              className="input input-mobile"
              value={editName}
              onChange={(e) => onEditNameChange(e.target.value)}
              maxLength={100}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Icon</label>
            <input
              type="text"
              className="input input-mobile"
              value={editIcon}
              onChange={(e) => onEditIconChange(e.target.value)}
              placeholder="Emoji"
              maxLength={10}
            />
          </div>

          <div className="form-group">
            <label>Color</label>
            <input
              type="color"
              className="input-color-mobile"
              value={editColor}
              onChange={(e) => onEditColorChange(e.target.value)}
            />
            <span className="color-value-mobile">{editColor}</span>
          </div>

          <div className="category-actions-mobile">
            <button
              className="btn btn-mobile btn-primary"
              onClick={onSaveEdit}
            >
              Save
            </button>
            <button
              className="btn btn-mobile btn-secondary"
              onClick={onCancelEdit}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={handleRef}
      className={`category-item custom-category ${isSelected ? 'selected' : ''} ${showActions ? 'show-actions' : ''}`}
      style={{
        transform: showActions ? 'translateX(-120px)' : 'translateX(0)',
        transition: 'transform 0.3s ease',
      }}
    >
      {canEdit && (
        <div className="category-checkbox-mobile">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            aria-label={`Select ${category.name}`}
          />
        </div>
      )}

      <div className="category-info" onClick={() => isMobile && canEdit && onSelect()}>
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

      {/* Swipe actions revealed on left swipe */}
      <div className="category-swipe-actions">
        <button
          className="btn-swipe-action btn-swipe-edit"
          onClick={handleEditClick}
          aria-label={`Edit ${category.name}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button
          className="btn-swipe-action btn-swipe-delete"
          onClick={handleDeleteClick}
          aria-label={`Delete ${category.name}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

interface MobileModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/**
 * Mobile-optimized bottom sheet modal
 */
export function MobileModalWrapper({ isOpen, onClose, title, children }: MobileModalWrapperProps) {
  const { isMobile } = useMobileDetection();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const startY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !isMobile) return;
    const currentY = e.touches[0].clientY;
    const offset = currentY - startY.current;

    // Only allow dragging down
    if (offset > 0) {
      setDragOffset(offset);
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile) return;
    setIsDragging(false);

    // Close if dragged more than 100px
    if (dragOffset > 100) {
      onClose();
    }

    setDragOffset(0);
  };

  if (!isOpen) return null;

  const modalClass = isMobile ? 'category-manager-modal mobile-bottom-sheet' : 'category-manager-modal';

  return (
    <div className="category-manager-overlay" onClick={onClose}>
      <div
        className={modalClass}
        onClick={(e) => e.stopPropagation()}
        style={isMobile ? {
          transform: `translateY(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease',
        } : undefined}
      >
        {isMobile && (
          <div
            className="modal-drag-handle"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="drag-handle-bar" />
          </div>
        )}
        <div className="category-manager-header">
          <h2>{title}</h2>
          <button
            className="btn-close btn-close-mobile"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
