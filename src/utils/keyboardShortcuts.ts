/**
 * Keyboard Shortcuts Utility
 *
 * Provides centralized keyboard shortcut handling for the application.
 * Prevents conflicts with browser shortcuts and provides consistent keyboard navigation.
 */

export type ShortcutKey =
  | 'ctrl+n'
  | 'ctrl+s'
  | 'ctrl+l'
  | 'escape'
  | '?'
  | 'arrowup'
  | 'arrowdown'
  | 'enter';

export interface KeyboardShortcut {
  key: ShortcutKey;
  description: string;
  category: 'List Operations' | 'Navigation' | 'General';
  handler: () => void;
  enabled?: boolean;
  // Prevent default browser behavior
  preventDefault?: boolean;
}

export interface ShortcutConfig {
  shortcuts: KeyboardShortcut[];
  enabled: boolean;
}

/**
 * Parse keyboard event to shortcut key string
 */
export function getShortcutKey(event: KeyboardEvent): ShortcutKey | null {
  const key = event.key.toLowerCase();

  // Check for modifier combinations
  if (event.ctrlKey || event.metaKey) {
    if (key === 'n') return 'ctrl+n';
    if (key === 's') return 'ctrl+s';
    if (key === 'l') return 'ctrl+l';
  }

  // Single keys
  if (key === 'escape') return 'escape';
  if (key === '?') return '?';
  if (key === 'arrowup') return 'arrowup';
  if (key === 'arrowdown') return 'arrowdown';
  if (key === 'enter') return 'enter';

  return null;
}

/**
 * Check if an element should prevent keyboard shortcuts
 * (e.g., when typing in an input field)
 */
export function shouldPreventShortcut(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement;
  const tagName = target.tagName.toLowerCase();

  // Prevent shortcuts when typing in form elements
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    // Allow Escape to work in inputs (to clear focus)
    if (event.key.toLowerCase() === 'escape') {
      return false;
    }
    return true;
  }

  // Prevent shortcuts when element is contenteditable
  if (target.isContentEditable) {
    return true;
  }

  return false;
}

/**
 * Create a keyboard shortcut handler
 */
export function createShortcutHandler(config: ShortcutConfig) {
  return (event: KeyboardEvent) => {
    if (!config.enabled) return;

    // Check if we should prevent this shortcut
    const shortcutKey = getShortcutKey(event);
    if (!shortcutKey) return;

    // Find matching shortcut
    const shortcut = config.shortcuts.find(s => s.key === shortcutKey);
    if (!shortcut) return;

    // Check if shortcut is enabled
    if (shortcut.enabled === false) return;

    // Check if we should prevent based on context
    if (shouldPreventShortcut(event)) return;

    // Prevent default browser behavior if specified
    if (shortcut.preventDefault !== false) {
      event.preventDefault();
    }

    // Execute handler
    shortcut.handler();
  };
}

/**
 * Format shortcut key for display
 */
export function formatShortcutKey(key: ShortcutKey): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const ctrlKey = isMac ? '⌘' : 'Ctrl';

  switch (key) {
    case 'ctrl+n':
      return `${ctrlKey}+N`;
    case 'ctrl+s':
      return `${ctrlKey}+S`;
    case 'ctrl+l':
      return `${ctrlKey}+L`;
    case 'escape':
      return 'Esc';
    case '?':
      return '?';
    case 'arrowup':
      return '↑';
    case 'arrowdown':
      return '↓';
    case 'enter':
      return 'Enter';
    default:
      return key;
  }
}

/**
 * Group shortcuts by category
 */
export function groupShortcutsByCategory(shortcuts: KeyboardShortcut[]): Record<string, KeyboardShortcut[]> {
  return shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);
}

/**
 * Hook for arrow key navigation in lists
 */
export interface ArrowNavigationConfig {
  items: any[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onConfirm?: () => void;
  enabled?: boolean;
}

export function createArrowNavigationHandler(config: ArrowNavigationConfig) {
  return (event: KeyboardEvent) => {
    if (config.enabled === false || config.items.length === 0) return;

    const key = event.key.toLowerCase();

    if (key === 'arrowdown') {
      event.preventDefault();
      const nextIndex = Math.min(config.selectedIndex + 1, config.items.length - 1);
      config.onSelect(nextIndex);
    } else if (key === 'arrowup') {
      event.preventDefault();
      const prevIndex = Math.max(config.selectedIndex - 1, 0);
      config.onSelect(prevIndex);
    } else if (key === 'enter' && config.onConfirm) {
      event.preventDefault();
      config.onConfirm();
    }
  };
}

/**
 * Visual tooltip component props
 */
export interface ShortcutTooltipProps {
  shortcut: ShortcutKey;
  description: string;
}

/**
 * Get shortcut description for tooltips
 */
export function getShortcutTooltip(shortcut: ShortcutKey): string {
  const formatted = formatShortcutKey(shortcut);

  switch (shortcut) {
    case 'ctrl+n':
      return `${formatted} - Create new list`;
    case 'ctrl+s':
      return `${formatted} - Share current list`;
    case 'ctrl+l':
      return `${formatted} - Open list selector`;
    case 'escape':
      return `${formatted} - Close modal`;
    case '?':
      return `${formatted} - Show keyboard shortcuts`;
    case 'arrowup':
    case 'arrowdown':
      return `${formatted} - Navigate list`;
    case 'enter':
      return `${formatted} - Select item`;
    default:
      return formatted;
  }
}

/**
 * Check if keyboard shortcuts are supported
 */
export function areShortcutsSupported(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}
