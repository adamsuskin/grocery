import { useState, useEffect } from 'react';
import './EmojiPicker.css';

interface EmojiPickerMobileProps {
  value?: string;
  onChange: (emoji: string) => void;
  commonEmojis?: string[];
  label?: string;
  disabled?: boolean;
}

// Mobile-optimized emoji set (fewer options, larger targets)
const MOBILE_EMOJIS = [
  '🥕', '🥦', '🍎', '🍊', '🥛', '🥩',
  '🍞', '🧊', '🥤', '🌽', '🥔', '🍇',
  '🍓', '🥬', '🧀', '🥚', '🐟', '🍗',
];

/**
 * Mobile-optimized emoji picker with larger touch targets
 */
export function EmojiPickerMobile({
  value = '',
  onChange,
  commonEmojis = MOBILE_EMOJIS,
  label = 'Icon',
  disabled = false,
}: EmojiPickerMobileProps) {
  const [textInput, setTextInput] = useState(value);
  const [showGrid, setShowGrid] = useState(false);

  useEffect(() => {
    setTextInput(value);
  }, [value]);

  const handleEmojiClick = (emoji: string) => {
    if (disabled) return;
    setTextInput(emoji);
    onChange(emoji);
    setShowGrid(false);
  };

  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setTextInput(newValue);
    onChange(newValue);
  };

  const handleClear = () => {
    if (disabled) return;
    setTextInput('');
    onChange('');
  };

  const handleToggleGrid = () => {
    setShowGrid(!showGrid);
  };

  return (
    <div className="emoji-picker emoji-picker-mobile">
      {label && (
        <label className="emoji-picker-label-mobile">
          {label}
          <span className="optional-text"> (optional)</span>
        </label>
      )}

      <div className="emoji-picker-input-row-mobile">
        {/* Emoji preview */}
        <div className="emoji-preview-mobile">
          {value || textInput ? (
            <span className="emoji-character-mobile">{value || textInput}</span>
          ) : (
            <span className="emoji-placeholder-mobile">?</span>
          )}
        </div>

        {/* Text input */}
        <div className="emoji-input-wrapper-mobile">
          <input
            type="text"
            className="emoji-input-mobile"
            placeholder="Type emoji"
            value={textInput}
            onChange={handleTextInputChange}
            disabled={disabled}
            maxLength={10}
            onClick={() => setShowGrid(false)}
          />
          {(value || textInput) && !disabled && (
            <button
              type="button"
              className="emoji-clear-btn-mobile"
              onClick={handleClear}
              aria-label="Clear emoji"
            >
              ×
            </button>
          )}
        </div>

        {/* Toggle grid button */}
        <button
          type="button"
          className="emoji-toggle-btn-mobile"
          onClick={handleToggleGrid}
          disabled={disabled}
          aria-label={showGrid ? 'Hide emoji picker' : 'Show emoji picker'}
          aria-expanded={showGrid}
        >
          {showGrid ? '▲' : '▼'}
        </button>
      </div>

      {/* Emoji grid (collapsible on mobile) */}
      {showGrid && (
        <div className="emoji-grid-mobile">
          {commonEmojis.map((emoji, index) => (
            <button
              key={index}
              type="button"
              className={`emoji-btn-mobile ${value === emoji || textInput === emoji ? 'selected' : ''}`}
              onClick={() => handleEmojiClick(emoji)}
              disabled={disabled}
              aria-label={`Select ${emoji} emoji`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
