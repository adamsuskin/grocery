import { useState } from 'react';
import type { GroceryListData } from '../types';
import './ListCustomizer.css';

interface ListCustomizerProps {
  list: GroceryListData;
  onUpdate: (updates: { color?: string; icon?: string }) => Promise<void>;
  isOwner: boolean;
}

// Preset color palette for list customization
const PRESET_COLORS = [
  { name: 'Green', value: '#4caf50' },
  { name: 'Blue', value: '#2196f3' },
  { name: 'Purple', value: '#9c27b0' },
  { name: 'Orange', value: '#ff9800' },
  { name: 'Red', value: '#f44336' },
  { name: 'Pink', value: '#e91e63' },
  { name: 'Teal', value: '#009688' },
  { name: 'Indigo', value: '#3f51b5' },
  { name: 'Yellow', value: '#ffc107' },
  { name: 'Cyan', value: '#00bcd4' },
];

// Preset emoji icons for lists
const PRESET_ICONS = [
  '📝', '📋', '🛒', '🛍️', '📦', '🎯',
  '⭐', '💼', '🏠', '🎨', '🎉', '💡',
  '📌', '🔖', '📍', '🎁', '🍎', '🥗',
  '🍕', '☕', '🎂', '📚', '🎵', '✈️',
];

export function ListCustomizer({ list, onUpdate, isOwner }: ListCustomizerProps) {
  const [selectedColor, setSelectedColor] = useState(list.color);
  const [selectedIcon, setSelectedIcon] = useState(list.icon);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    setHasChanges(true);
  };

  const handleIconChange = (icon: string) => {
    setSelectedIcon(icon);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!hasChanges || !isOwner) return;

    setIsSaving(true);
    try {
      await onUpdate({
        color: selectedColor !== list.color ? selectedColor : undefined,
        icon: selectedIcon !== list.icon ? selectedIcon : undefined,
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to update list customization:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedColor(list.color);
    setSelectedIcon(list.icon);
    setHasChanges(false);
  };

  if (!isOwner) {
    return (
      <div className="list-customizer">
        <div className="customizer-disabled">
          <p>Only the list owner can customize the appearance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="list-customizer">
      <div className="customizer-header">
        <h3>Customize List Appearance</h3>
        <p className="customizer-description">
          Choose a color and icon to help distinguish this list
        </p>
      </div>

      {/* Preview */}
      <div className="customizer-preview">
        <div className="preview-label">Preview</div>
        <div className="preview-list-item">
          <div
            className="preview-icon"
            style={{
              background: `linear-gradient(135deg, ${selectedColor}, ${adjustColorBrightness(selectedColor, -20)})`,
            }}
          >
            {selectedIcon}
          </div>
          <div className="preview-name">{list.name}</div>
        </div>
      </div>

      {/* Color Picker */}
      <div className="customizer-section">
        <label className="section-label">Color</label>
        <div className="color-picker">
          {PRESET_COLORS.map((color) => (
            <button
              key={color.value}
              className={`color-option ${selectedColor === color.value ? 'selected' : ''}`}
              style={{ backgroundColor: color.value }}
              onClick={() => handleColorChange(color.value)}
              title={color.name}
              aria-label={`Select ${color.name} color`}
            >
              {selectedColor === color.value && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
                  <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Icon Picker */}
      <div className="customizer-section">
        <label className="section-label">Icon</label>
        <div className="icon-picker">
          {PRESET_ICONS.map((icon) => (
            <button
              key={icon}
              className={`icon-option ${selectedIcon === icon ? 'selected' : ''}`}
              onClick={() => handleIconChange(icon)}
              aria-label={`Select ${icon} icon`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      {hasChanges && (
        <div className="customizer-actions">
          <button
            className="btn btn-secondary"
            onClick={handleReset}
            disabled={isSaving}
          >
            Reset
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Utility function to adjust color brightness
 * @param color - Hex color string
 * @param percent - Percentage to adjust (-100 to 100)
 */
function adjustColorBrightness(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;

  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}
