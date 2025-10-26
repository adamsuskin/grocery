import { useState, memo } from 'react';
import { Avatar } from './Avatar';
import { PermissionBadge } from './PermissionBadge';
import type { AvatarSize } from './Avatar';
import type { ListPermission } from '../types';
import './MemberAvatars.css';

export interface MemberInfo {
  userId: string;
  userName: string;
  userEmail: string;
  permission?: ListPermission;
}

export interface MemberAvatarsProps {
  /** Array of members to display */
  members: MemberInfo[];
  /** Maximum number of avatars to show before "+N more" */
  maxVisible?: number;
  /** Size of the avatars */
  size?: AvatarSize;
  /** Optional click handler to show all members */
  onShowAll?: () => void;
  /** Optional custom class name */
  className?: string;
}

/**
 * MemberAvatars Component
 *
 * Displays a horizontally stacked list of member avatars.
 * Shows up to maxVisible avatars, then displays a "+N more" indicator.
 * Can trigger a callback to show all members when the overflow indicator is clicked.
 *
 * @example
 * ```tsx
 * <MemberAvatars
 *   members={listMembers}
 *   maxVisible={3}
 *   size="small"
 *   onShowAll={() => setShowMemberModal(true)}
 * />
 * ```
 */
export const MemberAvatars = memo(function MemberAvatars({
  members,
  maxVisible = 3,
  size = 'small',
  onShowAll,
  className = '',
}: MemberAvatarsProps) {
  const [showAllTooltip, setShowAllTooltip] = useState(false);

  if (members.length === 0) {
    return null;
  }

  const visibleMembers = members.slice(0, maxVisible);
  const remainingCount = members.length - maxVisible;
  const hasOverflow = remainingCount > 0;

  const handleOverflowClick = () => {
    if (onShowAll) {
      onShowAll();
    }
  };

  const handleOverflowKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOverflowClick();
    }
  };

  return (
    <div className={`member-avatars member-avatars-${size} ${className}`}>
      <div className="member-avatars-list">
        {visibleMembers.map((member, index) => (
          <div
            key={member.userId}
            className="member-avatar-wrapper"
            style={{ zIndex: visibleMembers.length - index }}
          >
            <div className="member-avatar-tooltip-container">
              <Avatar
                name={member.userName}
                email={member.userEmail}
                size={size}
              />
              {member.permission && (
                <div className="member-avatar-tooltip">
                  <div className="member-avatar-tooltip-content">
                    <div className="member-avatar-tooltip-name">{member.userName}</div>
                    <div className="member-avatar-tooltip-email">{member.userEmail}</div>
                    <div className="member-avatar-tooltip-permission">
                      <PermissionBadge
                        permission={member.permission}
                        size="small"
                        showIcon
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {hasOverflow && (
          <div
            className={`member-avatar-overflow ${onShowAll ? 'clickable' : ''}`}
            style={{ zIndex: 0 }}
            onClick={onShowAll ? handleOverflowClick : undefined}
            onKeyDown={onShowAll ? handleOverflowKeyDown : undefined}
            role={onShowAll ? 'button' : undefined}
            tabIndex={onShowAll ? 0 : undefined}
            title={
              showAllTooltip
                ? `${remainingCount} more member${remainingCount !== 1 ? 's' : ''}`
                : undefined
            }
            onMouseEnter={() => setShowAllTooltip(true)}
            onMouseLeave={() => setShowAllTooltip(false)}
            aria-label={`${remainingCount} more member${remainingCount !== 1 ? 's' : ''}`}
          >
            <span className="overflow-text">+{remainingCount}</span>
          </div>
        )}
      </div>
    </div>
  );
});
