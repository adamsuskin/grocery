import { useState, useEffect, useRef } from 'react';
import './ColorPicker.css';

interface ColorPickerProps {
  value?: string; // Hex color
  onChange: (color: string) => void;
  presetColors?: string[]; // Optional array of preset colors
  label?: string;
  disabled?: boolean;
}

// Default preset colors - food and category related
const DEFAULT_PRESET_COLORS = [
  '#81c784', // Produce (green)
  '#64b5f6', // Dairy (blue)
  '#e57373', // Meat (red)
  '#ffb74d', // Bakery (orange)
  '#a1887f', // Pantry (brown)
  '#4dd0e1', // Frozen (cyan)
  '#ba68c8', // Beverages (purple)
  '#90a4ae', // Other (gray)
  '#4caf50', // Primary green
  '#f44336', // Red
  '#2196f3', // Blue
  '#ff9800', // Orange
  '#9c27b0', // Purple
  '#ffc107', // Amber
  '#00bcd4', // Cyan
  '#ff5722', // Deep orange
  '#673ab7', // Deep purple
  '#3f51b5', // Indigo
  '#009688', // Teal
  '#8bc34a', // Light green
  '#cddc39', // Lime
  '#ffeb3b', // Yellow
  '#795548', // Brown
  '#607d8b', // Blue gray
];

export function ColorPicker({
  value = '#4caf50',
  onChange,
  presetColors = DEFAULT_PRESET_COLORS,
  label = 'Color',
  disabled = false,
}: ColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState(value);
  const [customColor, setCustomColor] = useState(value);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const customInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Update internal state when external value changes
  useEffect(() => {
    setSelectedColor(value);
    setCustomColor(value);
  }, [value]);

  // Get color name for accessibility
  const getColorName = (hexColor: string): string => {
    const colorNames: Record<string, string> = {
      '#81c784': 'Light Green', '#64b5f6': 'Light Blue', '#e57373': 'Light Red',
      '#ffb74d': 'Orange', '#a1887f': 'Brown', '#4dd0e1': 'Cyan',
      '#ba68c8': 'Purple', '#90a4ae': 'Gray', '#4caf50': 'Green',
      '#f44336': 'Red', '#2196f3': 'Blue', '#ff9800': 'Deep Orange',
      '#9c27b0': 'Deep Purple', '#ffc107': 'Amber', '#00bcd4': 'Light Cyan',
      '#ff5722': 'Orange Red', '#673ab7': 'Indigo', '#3f51b5': 'Blue',
      '#009688': 'Teal', '#8bc34a': 'Yellow Green', '#cddc39': 'Lime',
      '#ffeb3b': 'Yellow', '#795548': 'Deep Brown', '#607d8b': 'Blue Gray'
    };
    return colorNames[hexColor.toLowerCase()] || hexColor;
  };

  // Handle selecting a preset color
  const handlePresetColorSelect = (color: string) => {
    if (disabled) return;
    setSelectedColor(color);
    setCustomColor(color);
    onChange(color);
    setShowCustomInput(false);
  };

  // Handle color input change (HTML5 color picker)
  const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const color = e.target.value;
    setSelectedColor(color);
    setCustomColor(color);
    onChange(color);
  };

  // Handle custom hex input change
  const handleCustomHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    let hex = e.target.value.trim();

    // Add # prefix if missing
    if (hex && !hex.startsWith('#')) {
      hex = '#' + hex;
    }

    setCustomColor(hex);

    // Validate hex color format (3 or 6 digits)
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (hexRegex.test(hex)) {
      setSelectedColor(hex);
      onChange(hex);
    }
  };

  // Handle clear/reset to default
  const handleClear = () => {
    if (disabled) return;
    const defaultColor = '#4caf50';
    setSelectedColor(defaultColor);
    setCustomColor(defaultColor);
    onChange(defaultColor);
    setShowCustomInput(false);
  };

  // Toggle custom color input visibility
  const handleToggleCustomInput = () => {
    setShowCustomInput(!showCustomInput);
    // Focus the input when showing
    setTimeout(() => {
      if (!showCustomInput && customInputRef.current) {
        customInputRef.current.focus();
      }
    }, 0);
  };

  // Handle keyboard navigation for preset colors
  const handlePresetKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, color: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handlePresetColorSelect(color);
    }
  };

  // Check if a color is selected
  const isColorSelected = (color: string) => {
    return selectedColor.toLowerCase() === color.toLowerCase();
  };

  return (
    <div className={`color-picker ${disabled ? 'color-picker-disabled' : ''}`}>
      {/* Label */}
      {label && (
        <label className="color-picker-label" htmlFor="color-picker-input">
          {label}
        </label>
      )}

      {/* Preset Colors Grid */}
      <div className="color-picker-presets">
        <div
          className="color-picker-grid"
          role="radiogroup"
          aria-label="Preset colors"
          aria-describedby="color-picker-instructions"
        >
          <span id="color-picker-instructions" className="sr-only">
            Use arrow keys to navigate between colors, Enter or Space to select
          </span>
          {presetColors.map((color, index) => {
            const colorName = getColorName(color);
            const isSelected = isColorSelected(color);
            return (
              <button
                key={`${color}-${index}`}
                type="button"
                className={`color-preset ${isSelected ? 'color-preset-selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => handlePresetColorSelect(color)}
                onKeyDown={(e) => handlePresetKeyDown(e, color)}
                disabled={disabled}
                aria-label={`${colorName} ${color}`}
                aria-checked={isSelected}
                role="radio"
                tabIndex={isSelected ? 0 : -1}
              >
                {isSelected && (
                  <svg
                    className="color-preset-check"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Color Section */}
      <div className="color-picker-custom">
        <button
          type="button"
          className="color-picker-toggle-custom"
          onClick={handleToggleCustomInput}
          disabled={disabled}
          aria-expanded={showCustomInput}
          aria-controls="custom-color-input-section"
          aria-label={showCustomInput ? 'Hide custom color input' : 'Show custom color input'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
          </svg>
          {showCustomInput ? 'Hide custom color' : 'Custom color'}
        </button>

        {showCustomInput && (
          <div
            id="custom-color-input-section"
            className="color-picker-custom-input"
          >
            {/* Color Preview with HTML5 Color Input */}
            <div className="color-picker-input-wrapper">
              <div
                className="color-picker-preview"
                style={{ backgroundColor: selectedColor }}
                onClick={() => !disabled && colorInputRef.current?.click()}
                role="button"
                tabIndex={disabled ? -1 : 0}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
                    e.preventDefault();
                    colorInputRef.current?.click();
                  }
                }}
                aria-label={`Open color picker. Currently selected: ${getColorName(selectedColor)} ${selectedColor}`}
              >
                <input
                  ref={colorInputRef}
                  id="color-picker-input"
                  type="color"
                  value={selectedColor}
                  onChange={handleColorInputChange}
                  disabled={disabled}
                  className="color-picker-native-input"
                  aria-label="Visual color picker"
                />
              </div>

              {/* Hex Input */}
              <input
                ref={customInputRef}
                type="text"
                className="color-picker-hex-input"
                value={customColor}
                onChange={handleCustomHexChange}
                placeholder="#4caf50"
                disabled={disabled}
                maxLength={7}
                pattern="^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                aria-label="Hex color code"
                aria-describedby="hex-input-format"
                aria-invalid={customColor && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(customColor) ? "true" : "false"}
              />
              <span id="hex-input-format" className="sr-only">
                Enter hex color format like #FF0000 or #F00
              </span>
            </div>

            {/* Color validation feedback */}
            {customColor && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(customColor) && (
              <div className="color-picker-error" role="alert" aria-live="polite">
                Invalid hex color format. Use format like #FF0000 or #F00
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="color-picker-actions">
        <button
          type="button"
          className="color-picker-clear"
          onClick={handleClear}
          disabled={disabled}
          title="Reset to default color"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10" />
            <polyline points="23 20 23 14 17 14" />
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
          </svg>
          Reset
        </button>

        <div className="color-picker-current">
          <span className="color-picker-current-label">Selected:</span>
          <span
            className="color-picker-current-preview"
            style={{ backgroundColor: selectedColor }}
            title={selectedColor}
          />
          <span className="color-picker-current-value">{selectedColor}</span>
        </div>
      </div>
    </div>
  );
}
