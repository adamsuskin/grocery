import { useEffect, useRef, useCallback } from 'react';
import type { CustomCategory, PermissionLevel } from '../types';
import './CategoryContextMenu.css';

export type CategoryAction =
  | 'edit'
  | 'changeColor'
  | 'changeIcon'
  | 'duplicate'
  | 'archive'
  | 'delete'
  | 'viewItems'
  | 'exportItems';

interface CategoryContextMenuProps {
  category: CustomCategory;
  position: { x: number; y: number };
  onClose: () => void;
  onAction: (action: CategoryAction) => void;
  userPermission: PermissionLevel;
}

interface MenuItem {
  action: CategoryAction;
  label: string;
  icon: JSX.Element;
  shortcut?: string;
  dangerous?: boolean;
  requiresEdit?: boolean;
}

/**
 * Context menu for category quick actions
 * Appears on right-click or long-press on categories
 */
export function CategoryContextMenu({
  category,
  position,
  onClose,
  onAction,
  userPermission,
}: CategoryContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const canEdit = userPermission === 'owner' || userPermission === 'editor';

  // Menu items configuration
  const menuItems: MenuItem[] = [
    {
      action: 'edit',
      label: 'Edit Category',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
      shortcut: 'E',
      requiresEdit: true,
    },
    {
      action: 'changeColor',
      label: 'Change Color',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
      ),
      shortcut: 'C',
      requiresEdit: true,
    },
    {
      action: 'changeIcon',
      label: 'Change Icon',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      ),
      shortcut: 'I',
      requiresEdit: true,
    },
    {
      action: 'duplicate',
      label: 'Duplicate Category',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      ),
      shortcut: 'D',
      requiresEdit: true,
    },
    {
      action: 'archive',
      label: category.isArchived ? 'Unarchive Category' : 'Archive Category',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="21 8 21 21 3 21 3 8" />
          <rect x="1" y="3" width="22" height="5" />
          <line x1="10" y1="12" x2="14" y2="12" />
        </svg>
      ),
      shortcut: 'A',
      requiresEdit: true,
    },
    {
      action: 'viewItems',
      label: 'View Items in Category',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
      shortcut: 'V',
    },
    {
      action: 'exportItems',
      label: 'Export Items in Category',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      ),
      shortcut: 'X',
    },
    {
      action: 'delete',
      label: 'Delete Category',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      ),
      shortcut: 'Del',
      dangerous: true,
      requiresEdit: true,
    },
  ];

  // Filter menu items based on permissions
  const visibleItems = menuItems.filter(item => {
    if (item.requiresEdit && !canEdit) {
      return false;
    }
    return true;
  });

  // Handle clicking on a menu item
  const handleItemClick = useCallback((action: CategoryAction) => {
    onAction(action);
    onClose();
  }, [onAction, onClose]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on Escape
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Find matching shortcut
      const item = visibleItems.find(item => {
        if (!item.shortcut) return false;

        // Handle special keys
        if (item.shortcut === 'Del') {
          return e.key === 'Delete';
        }

        // Handle letter shortcuts
        return e.key.toLowerCase() === item.shortcut.toLowerCase();
      });

      if (item) {
        e.preventDefault();
        handleItemClick(item.action);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleItemClick, visibleItems]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Add a small delay to prevent immediate close from the same click that opened the menu
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Adjust menu position to keep it within viewport
  useEffect(() => {
    if (!menuRef.current) return;

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = position.x;
    let adjustedY = position.y;

    // Adjust horizontal position if menu goes off-screen
    if (rect.right > viewportWidth) {
      adjustedX = viewportWidth - rect.width - 10;
    }

    // Adjust vertical position if menu goes off-screen
    if (rect.bottom > viewportHeight) {
      adjustedY = viewportHeight - rect.height - 10;
    }

    // Ensure menu doesn't go off the left or top edge
    adjustedX = Math.max(10, adjustedX);
    adjustedY = Math.max(10, adjustedY);

    menu.style.left = `${adjustedX}px`;
    menu.style.top = `${adjustedY}px`;
  }, [position]);

  return (
    <div
      ref={menuRef}
      className="category-context-menu"
      style={{
        left: position.x,
        top: position.y,
      }}
      role="menu"
      aria-label={`Actions for ${category.name}`}
    >
      <div className="context-menu-header">
        <div className="context-menu-category-preview">
          {category.icon && <span className="context-menu-icon">{category.icon}</span>}
          {category.color && (
            <span
              className="context-menu-color"
              style={{ backgroundColor: category.color }}
              aria-label={`Color: ${category.color}`}
            />
          )}
        </div>
        <span className="context-menu-title">{category.name}</span>
      </div>

      <div className="context-menu-divider" />

      <div className="context-menu-items">
        {visibleItems.map((item) => (
          <button
            key={item.action}
            className={`context-menu-item ${item.dangerous ? 'dangerous' : ''}`}
            onClick={() => handleItemClick(item.action)}
            role="menuitem"
            aria-label={`${item.label}${item.shortcut ? ` (${item.shortcut})` : ''}`}
          >
            <span className="context-menu-item-icon">{item.icon}</span>
            <span className="context-menu-item-label">{item.label}</span>
            {item.shortcut && (
              <span className="context-menu-item-shortcut">{item.shortcut}</span>
            )}
          </button>
        ))}
      </div>

      {!canEdit && (
        <>
          <div className="context-menu-divider" />
          <div className="context-menu-footer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>View-only access</span>
          </div>
        </>
      )}
    </div>
  );
}
