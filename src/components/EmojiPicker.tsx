import { useState } from 'react';
import './EmojiPicker.css';

interface EmojiPickerProps {
  value?: string;
  onChange: (emoji: string) => void;
  commonEmojis?: string[];
  label?: string;
  disabled?: boolean;
}

const DEFAULT_COMMON_EMOJIS = [
  '🥕', '🥦', '🍎', '🍊', '🥛', '🥩', '🍞', '🧊',
  '🥤', '🌽', '🥔', '🍇', '🍓', '🥬', '🧀', '🥚',
  '🐟', '🍗', '🥐', '🍌'
];

export function EmojiPicker({
  value = '',
  onChange,
  commonEmojis = DEFAULT_COMMON_EMOJIS,
  label = 'Icon',
  disabled = false
}: EmojiPickerProps) {
  const [textInput, setTextInput] = useState(value);

  const handleEmojiClick = (emoji: string) => {
    if (disabled) return;
    setTextInput(emoji);
    onChange(emoji);
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

  // Emoji names for better accessibility
  const getEmojiName = (emoji: string): string => {
    const emojiNames: Record<string, string> = {
      '🥕': 'Carrot', '🥦': 'Broccoli', '🍎': 'Apple', '🍊': 'Orange',
      '🥛': 'Milk', '🥩': 'Meat', '🍞': 'Bread', '🧊': 'Ice',
      '🥤': 'Beverage', '🌽': 'Corn', '🥔': 'Potato', '🍇': 'Grapes',
      '🍓': 'Strawberry', '🥬': 'Leafy green', '🧀': 'Cheese', '🥚': 'Egg',
      '🐟': 'Fish', '🍗': 'Poultry', '🥐': 'Croissant', '🍌': 'Banana'
    };
    return emojiNames[emoji] || emoji;
  };

  return (
    <div className="emoji-picker">
      {label && (
        <label className="emoji-picker-label" htmlFor="emoji-text-input">
          {label}
          <span className="emoji-picker-optional"> (optional)</span>
        </label>
      )}

      <div className="emoji-picker-content">
        {/* Emoji Preview */}
        <div
          className="emoji-preview"
          role="img"
          aria-label={value || textInput ? `Selected emoji: ${value || textInput}` : 'No emoji selected'}
        >
          {value || textInput ? (
            <span className="emoji-preview-character" aria-hidden="true">{value || textInput}</span>
          ) : (
            <span className="emoji-preview-placeholder" aria-hidden="true">?</span>
          )}
        </div>

        {/* Text Input */}
        <div className="emoji-input-wrapper">
          <input
            id="emoji-text-input"
            type="text"
            className="emoji-input"
            placeholder="Type or select emoji"
            value={textInput}
            onChange={handleTextInputChange}
            disabled={disabled}
            maxLength={10}
            aria-label="Type custom emoji or icon"
            aria-describedby="emoji-helper-text"
          />
          <span id="emoji-helper-text" className="sr-only">
            You can type an emoji or select one from the grid below
          </span>
          {(value || textInput) && !disabled && (
            <button
              type="button"
              className="emoji-clear-btn"
              onClick={handleClear}
              aria-label="Clear emoji selection"
              title="Clear emoji"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Common Emojis Grid */}
      <div
        className="emoji-grid"
        role="radiogroup"
        aria-label="Common emoji options"
        aria-describedby="emoji-grid-description"
      >
        <span id="emoji-grid-description" className="sr-only">
          Use arrow keys to navigate between emojis, Enter or Space to select
        </span>
        {commonEmojis.map((emoji, index) => {
          const isSelected = value === emoji || textInput === emoji;
          const emojiName = getEmojiName(emoji);
          return (
            <button
              key={index}
              type="button"
              className={`emoji-button ${isSelected ? 'selected' : ''}`}
              onClick={() => handleEmojiClick(emoji)}
              disabled={disabled}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${emojiName} emoji`}
              tabIndex={isSelected ? 0 : -1}
            >
              <span aria-hidden="true">{emoji}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
