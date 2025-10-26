import { useEffect } from 'react';
import { formatShortcutKey, groupShortcutsByCategory, type KeyboardShortcut } from '../utils/keyboardShortcuts';
import './KeyboardShortcutsHelp.css';

export interface KeyboardShortcutsHelpProps {
  shortcuts: KeyboardShortcut[];
  onClose: () => void;
  isOpen: boolean;
}

/**
 * KeyboardShortcutsHelp Component
 *
 * Displays a modal showing all available keyboard shortcuts
 * organized by category. Can be toggled with the "?" key.
 */
export function KeyboardShortcutsHelp({ shortcuts, onClose, isOpen }: KeyboardShortcutsHelpProps) {
  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const groupedShortcuts = groupShortcutsByCategory(shortcuts.filter(s => s.enabled !== false));

  return (
    <div className="shortcuts-overlay" onClick={onClose}>
      <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="shortcuts-header">
          <h2>Keyboard Shortcuts</h2>
          <button
            className="shortcuts-close"
            onClick={onClose}
            aria-label="Close shortcuts help"
            type="button"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="shortcuts-content">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category} className="shortcuts-category">
              <h3 className="shortcuts-category-title">{category}</h3>
              <div className="shortcuts-list">
                {categoryShortcuts.map((shortcut) => (
                  <div key={shortcut.key} className="shortcut-item">
                    <div className="shortcut-keys">
                      <kbd className="shortcut-key">{formatShortcutKey(shortcut.key)}</kbd>
                    </div>
                    <div className="shortcut-description">{shortcut.description}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="shortcuts-footer">
          <div className="shortcuts-hint">
            <span className="hint-icon">💡</span>
            <span>Press <kbd>?</kbd> anytime to show this help, <kbd>Esc</kbd> to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
