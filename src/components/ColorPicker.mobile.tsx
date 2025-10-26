import { useState, useEffect } from 'react';
import './ColorPicker.css';

interface ColorPickerMobileProps {
  value?: string;
  onChange: (color: string) => void;
  presetColors?: string[];
  label?: string;
  disabled?: boolean;
}

// Quick preset colors for mobile (reduced set)
const MOBILE_PRESET_COLORS = [
  '#4caf50', // Green
  '#2196f3', // Blue
  '#f44336', // Red
  '#ff9800', // Orange
  '#9c27b0', // Purple
  '#ffc107', // Amber
  '#00bcd4', // Cyan
  '#ff5722', // Deep orange
  '#795548', // Brown
  '#607d8b', // Blue gray
  '#8bc34a', // Light green
  '#e91e63', // Pink
];

/**
 * Mobile-optimized color picker using native color input
 */
export function ColorPickerMobile({
  value = '#4caf50',
  onChange,
  presetColors = MOBILE_PRESET_COLORS,
  label = 'Color',
  disabled = false,
}: ColorPickerMobileProps) {
  const [selectedColor, setSelectedColor] = useState(value);

  useEffect(() => {
    setSelectedColor(value);
  }, [value]);

  const handleColorChange = (color: string) => {
    if (disabled) return;
    setSelectedColor(color);
    onChange(color);
  };

  const handleNativePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleColorChange(e.target.value);
  };

  const handlePresetClick = (color: string) => {
    handleColorChange(color);
  };

  return (
    <div className={`color-picker color-picker-mobile ${disabled ? 'disabled' : ''}`}>
      {label && (
        <label className="color-picker-label-mobile">
          {label}
        </label>
      )}

      {/* Native color picker for mobile */}
      <div className="color-picker-native-wrapper">
        <input
          type="color"
          value={selectedColor}
          onChange={handleNativePickerChange}
          disabled={disabled}
          className="color-picker-native-input-mobile"
          aria-label={label || 'Color picker'}
        />
        <div className="color-picker-preview-mobile">
          <div
            className="color-swatch-mobile"
            style={{ backgroundColor: selectedColor }}
          />
          <span className="color-value-mobile">{selectedColor}</span>
        </div>
      </div>

      {/* Quick preset colors */}
      <div className="color-presets-mobile">
        <div className="color-presets-label">Quick colors:</div>
        <div className="color-presets-grid-mobile">
          {presetColors.map((color, index) => (
            <button
              key={`${color}-${index}`}
              type="button"
              className={`color-preset-btn-mobile ${selectedColor.toLowerCase() === color.toLowerCase() ? 'selected' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => handlePresetClick(color)}
              disabled={disabled}
              aria-label={`Select color ${color}`}
              aria-pressed={selectedColor.toLowerCase() === color.toLowerCase()}
            >
              {selectedColor.toLowerCase() === color.toLowerCase() && (
                <svg
                  className="color-check-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
