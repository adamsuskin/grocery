import type { ListPermission, PermissionBadgeProps } from '../types';
import './PermissionBadge.css';

/**
 * Permission icon component
 * Returns the appropriate SVG icon for each permission level
 */
function PermissionIcon({ permission }: { permission: ListPermission }) {
  switch (permission) {
    case 'owner':
      return (
        <svg
          className="permission-badge-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2l9 4.5v7.5c0 5.25-9 9-9 9s-9-3.75-9-9V6.5L12 2z" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </svg>
      );
    case 'editor':
      return (
        <svg
          className="permission-badge-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      );
    case 'viewer':
      return (
        <svg
          className="permission-badge-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
  }
}

/**
 * Gets the display label for a permission level
 */
function getPermissionLabel(permission: ListPermission): string {
  switch (permission) {
    case 'owner':
      return 'Owner';
    case 'editor':
      return 'Editor';
    case 'viewer':
      return 'Viewer';
  }
}

/**
 * PermissionBadge Component
 *
 * Displays a color-coded badge showing a user's permission level for a list.
 * Supports three permission levels: owner (gold), editor (blue), viewer (gray).
 *
 * @example
 * ```tsx
 * <PermissionBadge permission="owner" size="medium" showIcon />
 * <PermissionBadge permission="editor" size="small" />
 * <PermissionBadge permission="viewer" />
 * ```
 */
export function PermissionBadge({
  permission,
  size = 'medium',
  showIcon = true,
  className = '',
}: PermissionBadgeProps) {
  const label = getPermissionLabel(permission);

  return (
    <span
      className={`permission-badge permission-badge-${permission} permission-badge-${size} ${className}`}
      role="status"
      aria-label={`Permission level: ${label}`}
    >
      {showIcon && <PermissionIcon permission={permission} />}
      <span className="permission-badge-text">{label}</span>
    </span>
  );
}
