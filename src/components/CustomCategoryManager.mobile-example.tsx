/**
 * Example integration of mobile-optimized Custom Category Manager
 *
 * This file demonstrates how to integrate the mobile-optimized components
 * with the existing CustomCategoryManager component.
 */

import { useState } from 'react';
import { useMobileDetection } from '../hooks/useMobileDetection';
import { CustomCategoryManager } from './CustomCategoryManager';
import { MobileModalWrapper, CategoryItemMobile } from './CustomCategoryManager.mobile';
import { ColorPickerMobile } from './ColorPicker.mobile';
import { EmojiPickerMobile } from './EmojiPicker.mobile';
import { ColorPicker } from './ColorPicker';
import { EmojiPicker } from './EmojiPicker';
import type { PermissionLevel, CustomCategory } from '../types';

// Import mobile styles
import './CustomCategoryManager.mobile.css';
import './ColorPicker.mobile.css';
import './EmojiPicker.mobile.css';

interface MobileCategoryManagerWrapperProps {
  listId: string;
  onClose: () => void;
  permissionLevel?: PermissionLevel | null;
  onViewStatistics?: () => void;
}

/**
 * Wrapper component that automatically switches between mobile and desktop views
 */
export function MobileCategoryManagerWrapper({
  listId,
  onClose,
  permissionLevel,
  onViewStatistics,
}: MobileCategoryManagerWrapperProps) {
  const { isMobile } = useMobileDetection();

  if (isMobile) {
    return (
      <MobileModalWrapper
        isOpen={true}
        onClose={onClose}
        title="Manage Categories"
      >
        <CustomCategoryManager
          listId={listId}
          onClose={onClose}
          permissionLevel={permissionLevel}
          onViewStatistics={onViewStatistics}
        />
      </MobileModalWrapper>
    );
  }

  return (
    <CustomCategoryManager
      listId={listId}
      onClose={onClose}
      permissionLevel={permissionLevel}
      onViewStatistics={onViewStatistics}
    />
  );
}

/**
 * Example: Adaptive Color Picker
 */
export function AdaptiveColorPicker({
  value,
  onChange,
  label,
  disabled,
}: {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  disabled?: boolean;
}) {
  const { isMobile } = useMobileDetection();

  if (isMobile) {
    return (
      <ColorPickerMobile
        value={value}
        onChange={onChange}
        label={label}
        disabled={disabled}
      />
    );
  }

  return (
    <ColorPicker
      value={value}
      onChange={onChange}
      label={label}
      disabled={disabled}
    />
  );
}

/**
 * Example: Adaptive Emoji Picker
 */
export function AdaptiveEmojiPicker({
  value,
  onChange,
  label,
  disabled,
}: {
  value: string;
  onChange: (emoji: string) => void;
  label?: string;
  disabled?: boolean;
}) {
  const { isMobile } = useMobileDetection();

  if (isMobile) {
    return (
      <EmojiPickerMobile
        value={value}
        onChange={onChange}
        label={label}
        disabled={disabled}
      />
    );
  }

  return (
    <EmojiPicker
      value={value}
      onChange={onChange}
      label={label}
      disabled={disabled}
    />
  );
}

/**
 * Example: Category Form with Mobile Optimization
 */
export function CategoryFormExample() {
  const { isMobile } = useMobileDetection();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#4caf50');
  const [icon, setIcon] = useState('');

  return (
    <form className={`category-form ${isMobile ? 'mobile' : 'desktop'}`}>
      <div className="form-group">
        <label>Category Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={isMobile ? 'input-mobile' : 'input'}
          placeholder="e.g., Spices"
        />
      </div>

      <div className="form-group">
        <AdaptiveEmojiPicker
          value={icon}
          onChange={setIcon}
          label="Icon"
        />
      </div>

      <div className="form-group">
        <AdaptiveColorPicker
          value={color}
          onChange={setColor}
          label="Color"
        />
      </div>

      <button
        type="submit"
        className={isMobile ? 'btn-mobile btn-primary' : 'btn btn-primary'}
      >
        Add Category
      </button>
    </form>
  );
}

/**
 * Example: Category List with Swipe Actions
 */
export function CategoryListExample({
  categories,
  onEdit,
  onDelete,
  canEdit,
}: {
  categories: CustomCategory[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
}) {
  const { isMobile } = useMobileDetection();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (isMobile) {
    return (
      <div className="category-list-mobile">
        {categories.map((category) => (
          <CategoryItemMobile
            key={category.id}
            category={category}
            isEditing={editingId === category.id}
            isSelected={selectedIds.has(category.id)}
            canEdit={canEdit}
            onEdit={() => setEditingId(category.id)}
            onDelete={() => onDelete(category.id)}
            onSelect={() => {
              const newSelected = new Set(selectedIds);
              if (newSelected.has(category.id)) {
                newSelected.delete(category.id);
              } else {
                newSelected.add(category.id);
              }
              setSelectedIds(newSelected);
            }}
            onCancelEdit={() => setEditingId(null)}
            onSaveEdit={() => {
              onEdit(category.id);
              setEditingId(null);
            }}
            editName={category.name}
            editColor={category.color || '#4caf50'}
            editIcon={category.icon || ''}
            onEditNameChange={() => {}}
            onEditColorChange={() => {}}
            onEditIconChange={() => {}}
          />
        ))}
      </div>
    );
  }

  // Desktop view
  return (
    <div className="category-list-desktop">
      {categories.map((category) => (
        <div key={category.id} className="category-item">
          <span>{category.icon}</span>
          <span>{category.name}</span>
          {canEdit && (
            <>
              <button onClick={() => onEdit(category.id)}>Edit</button>
              <button onClick={() => onDelete(category.id)}>Delete</button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Example: Full App Integration
 */
export function AppExample() {
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const { isMobile, isTouch, screenSize } = useMobileDetection();

  return (
    <div className="app">
      <header className={isMobile ? 'header-mobile' : 'header-desktop'}>
        <h1>Grocery List</h1>
        <button
          onClick={() => setShowCategoryManager(true)}
          className={isMobile ? 'btn-mobile' : 'btn'}
        >
          Manage Categories
        </button>
      </header>

      {/* Show device info for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info">
          <p>Mobile: {isMobile ? 'Yes' : 'No'}</p>
          <p>Touch: {isTouch ? 'Yes' : 'No'}</p>
          <p>Screen: {screenSize}</p>
        </div>
      )}

      {showCategoryManager && (
        <MobileCategoryManagerWrapper
          listId="example-list-id"
          onClose={() => setShowCategoryManager(false)}
          permissionLevel="owner"
        />
      )}
    </div>
  );
}

/**
 * Example: Testing Different Screen Sizes
 */
export function ResponsiveTestExample() {
  const { screenSize, isMobile, isTablet } = useMobileDetection();
  const [testColor, setTestColor] = useState('#4caf50');
  const [testEmoji, setTestEmoji] = useState('🥕');

  return (
    <div className="responsive-test">
      <div className="test-info">
        <h2>Current Screen: {screenSize}</h2>
        <p>Mobile: {isMobile ? '✓' : '✗'}</p>
        <p>Tablet: {isTablet ? '✓' : '✗'}</p>
      </div>

      <div className="test-section">
        <h3>Color Picker Test</h3>
        <AdaptiveColorPicker
          value={testColor}
          onChange={setTestColor}
          label="Test Color"
        />
        <p>Selected: {testColor}</p>
      </div>

      <div className="test-section">
        <h3>Emoji Picker Test</h3>
        <AdaptiveEmojiPicker
          value={testEmoji}
          onChange={setTestEmoji}
          label="Test Emoji"
        />
        <p>Selected: {testEmoji}</p>
      </div>
    </div>
  );
}

/**
 * Example: Custom Gesture Handling
 */
export function CustomGestureExample() {
  const { isMobile } = useMobileDetection();
  const [swipeCount, setSwipeCount] = useState(0);
  const [longPressCount, setLongPressCount] = useState(0);

  if (!isMobile) {
    return <p>This example only works on mobile devices</p>;
  }

  return (
    <div className="gesture-test">
      <h2>Gesture Testing</h2>

      <div className="swipe-area">
        <p>Swipe left or right on this area</p>
        <p>Swipes: {swipeCount}</p>
      </div>

      <div className="long-press-area">
        <p>Long press (500ms) on this area</p>
        <p>Long presses: {longPressCount}</p>
      </div>
    </div>
  );
}

// Export all examples for easy testing
export const Examples = {
  MobileCategoryManagerWrapper,
  AdaptiveColorPicker,
  AdaptiveEmojiPicker,
  CategoryFormExample,
  CategoryListExample,
  AppExample,
  ResponsiveTestExample,
  CustomGestureExample,
};
