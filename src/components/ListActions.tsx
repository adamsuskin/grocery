import { useState, useRef, useEffect } from 'react';
import { useListMutations, useListPermission } from '../zero-store';
import type { List, PermissionLevel } from '../types';
import './ListActions.css';

export interface ListActionsProps {
  list: List;
  currentUserId: string;
  permission: PermissionLevel;
  isPinned?: boolean;
  onExport?: (listId: string) => void;
  onShare?: (listId: string) => void;
  onDuplicate?: (listId: string) => void;
  onArchive?: (listId: string) => void;
  onPin?: (listId: string, isPinned: boolean) => void;
}

/**
 * ListActions Component
 *
 * Provides a dropdown menu with quick actions for managing lists.
 * Actions are shown based on user permissions:
 * - Owner: All actions available
 * - Editor: Limited actions (pin, export, share)
 * - Viewer: Read-only actions (pin, export)
 *
 * Actions:
 * - Pin/Unpin: Quick access to frequently used lists
 * - Duplicate: Create a copy of the list
 * - Archive: Hide list from main view
 * - Export: Export list to various formats
 * - Share: Manage list sharing and permissions
 * - Delete: Permanently remove list (owner only)
 */
export function ListActions({
  list,
  currentUserId: _currentUserId,
  permission: _permission,
  isPinned: isPinnedProp = false,
  onExport,
  onShare,
  onDuplicate,
  onArchive,
  onPin,
}: ListActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { deleteList } = useListMutations();
  const { isOwner, canEdit, canDelete } = useListPermission(list.id);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleAction = async (
    action: () => void | Promise<void>,
    closeAfter = true
  ) => {
    setLoading(true);
    try {
      await action();
      if (closeAfter) {
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Action failed:', error);
      alert('Action failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPin) {
      handleAction(() => onPin(list.id, isPinnedProp), false);
    }
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDuplicate) {
      handleAction(() => onDuplicate(list.id));
    }
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onArchive) {
      const confirmed = window.confirm(
        `Archive "${list.name}"? You can restore it later.`
      );
      if (confirmed) {
        handleAction(() => onArchive(list.id));
      }
    }
  };

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onExport) {
      handleAction(() => onExport(list.id));
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) {
      handleAction(() => onShare(list.id));
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canDelete) {
      alert('You do not have permission to delete this list.');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${list.name}"? This action cannot be undone.`
    );

    if (confirmed) {
      await handleAction(async () => {
        await deleteList(list.id);
      });
    }
  };

  return (
    <div className="list-actions" onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        className={`list-actions-btn ${isOpen ? 'active' : ''}`}
        onClick={toggleDropdown}
        aria-label="List actions"
        aria-expanded={isOpen}
        aria-haspopup="true"
        disabled={loading}
        title="More actions"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="1" fill="currentColor" />
          <circle cx="19" cy="12" r="1" fill="currentColor" />
          <circle cx="5" cy="12" r="1" fill="currentColor" />
        </svg>
      </button>

      {isOpen && (
        <div ref={dropdownRef} className="list-actions-dropdown" role="menu">
          {/* Pin/Unpin - All users */}
          <button
            className="list-action-item"
            onClick={handlePin}
            role="menuitem"
            disabled={loading}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {isPinnedProp ? (
                <path d="M21 10c0-7-9-7-9-7s-9 0-9 7v5l-3 3v1h24v-1l-3-3v-5z" />
              ) : (
                <path d="M16 4v8l2 2v2H6v-2l2-2V4l8 0zM12 18v4" />
              )}
            </svg>
            <span>{isPinnedProp ? 'Unpin List' : 'Pin List'}</span>
          </button>

          {/* Export - All users */}
          <button
            className="list-action-item"
            onClick={handleExport}
            role="menuitem"
            disabled={loading || !onExport}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            <span>Export List</span>
          </button>

          {/* Share - Editor and Owner */}
          {(canEdit || isOwner) && (
            <button
              className="list-action-item"
              onClick={handleShare}
              role="menuitem"
              disabled={loading || !onShare}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
              <span>Share List</span>
            </button>
          )}

          <div className="list-action-divider" />

          {/* Duplicate - Editor and Owner */}
          {(canEdit || isOwner) && (
            <button
              className="list-action-item"
              onClick={handleDuplicate}
              role="menuitem"
              disabled={loading || !onDuplicate}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              <span>Duplicate List</span>
            </button>
          )}

          {/* Archive - Owner only */}
          {isOwner && (
            <button
              className="list-action-item"
              onClick={handleArchive}
              role="menuitem"
              disabled={loading || !onArchive}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="21 8 21 21 3 21 3 8" />
                <rect x="1" y="3" width="22" height="5" />
                <line x1="10" y1="12" x2="14" y2="12" />
              </svg>
              <span>Archive List</span>
            </button>
          )}

          {/* Delete - Owner only */}
          {canDelete && (
            <>
              <div className="list-action-divider" />
              <button
                className="list-action-item list-action-danger"
                onClick={handleDelete}
                role="menuitem"
                disabled={loading}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
                <span>Delete List</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
