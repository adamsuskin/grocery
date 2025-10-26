import { useState, FormEvent, useEffect } from 'react';
import type { PermissionLevel } from '../types';
import type { ListMember } from '../contexts/ListContext';
import './ShareListModal.css';

/**
 * ShareListModal Props
 */
export interface ShareListModalProps {
  /** List ID to share */
  listId: string;
  /** Current list members */
  members: ListMember[];
  /** Current user ID (owner) */
  currentUserId: string;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when member is added */
  onAddMember: (email: string, permission: PermissionLevel) => Promise<void>;
  /** Callback when member is removed */
  onRemoveMember: (userId: string) => Promise<void>;
  /** Callback when member permission is updated */
  onUpdatePermission: (userId: string, permission: PermissionLevel) => Promise<void>;
}

/**
 * Validates email format
 * @param email - Email address to validate
 * @returns true if valid, false otherwise
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * ShareListModal Component
 *
 * Provides UI for sharing grocery lists with other users:
 * - Add members by email address
 * - Set permission level (editor/viewer)
 * - Display current members
 * - Remove members (owner only)
 * - Change member permissions (owner only)
 *
 * @example
 * ```tsx
 * <ShareListModal
 *   listId="list-123"
 *   members={listMembers}
 *   currentUserId="user-456"
 *   onClose={() => setShowModal(false)}
 *   onAddMember={handleAddMember}
 *   onRemoveMember={handleRemoveMember}
 *   onUpdatePermission={handleUpdatePermission}
 * />
 * ```
 */
export function ShareListModal({
  members,
  currentUserId,
  onClose,
  onAddMember,
  onRemoveMember,
  onUpdatePermission,
}: ShareListModalProps) {
  // Form state
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<PermissionLevel>('editor');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Action loading states
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  /**
   * Validates email field
   */
  const validateEmail = (value: string): boolean => {
    if (!value.trim()) {
      setEmailError('Email address is required');
      return false;
    }

    if (!isValidEmail(value)) {
      setEmailError('Please enter a valid email address');
      return false;
    }

    // Check if user is already a member
    const existingMember = members.find(
      m => m.userEmail.toLowerCase() === value.toLowerCase()
    );

    if (existingMember) {
      setEmailError('This user is already a member of this list');
      return false;
    }

    setEmailError(null);
    return true;
  };

  /**
   * Handles email input change with validation
   */
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError) {
      setEmailError(null);
    }
  };

  /**
   * Clears all messages
   */
  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  /**
   * Handles form submission to add a new member
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearMessages();

    // Validate email
    if (!validateEmail(email)) {
      return;
    }

    setLoading(true);

    try {
      await onAddMember(email, permission);

      // Success - clear form and show message
      setEmail('');
      setPermission('editor');
      setSuccess(`Successfully invited ${email} as ${permission}`);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add member';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles removing a member from the list
   */
  const handleRemoveMember = async (userId: string) => {
    clearMessages();
    setRemovingUserId(userId);

    try {
      await onRemoveMember(userId);
      setSuccess('Member removed successfully');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove member';
      setError(errorMessage);
    } finally {
      setRemovingUserId(null);
    }
  };

  /**
   * Handles updating a member's permission level
   */
  const handleUpdatePermission = async (userId: string, newPermission: PermissionLevel) => {
    clearMessages();
    setUpdatingUserId(userId);

    try {
      await onUpdatePermission(userId, newPermission);
      setSuccess('Permission updated successfully');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update permission';
      setError(errorMessage);
    } finally {
      setUpdatingUserId(null);
    }
  };

  /**
   * Handles clicking outside modal to close
   */
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  /**
   * Determines if current user is the owner
   */
  const isOwner = (userId: string) => userId === currentUserId;

  /**
   * Gets member display name
   */
  const getMemberDisplayName = (member: ListMember) => {
    return member.userName || member.userEmail || 'Unknown User';
  };

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="share-modal-overlay" onClick={handleOverlayClick}>
      <div className="share-modal-content" role="dialog" aria-labelledby="share-modal-title">
        {/* Header */}
        <div className="share-modal-header">
          <h2 id="share-modal-title">Share List</h2>
          <button
            className="share-modal-close"
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="share-message share-message-success" role="status">
            <span className="message-icon">✓</span>
            <span className="message-text">{success}</span>
          </div>
        )}

        {error && (
          <div className="share-message share-message-error" role="alert">
            <span className="message-icon">⚠</span>
            <span className="message-text">{error}</span>
          </div>
        )}

        {/* Add Member Form */}
        <form className="share-form" onSubmit={handleSubmit}>
          <div className="share-form-header">
            <h3>Invite New Member</h3>
            <p className="share-form-description">
              Enter an email address to invite someone to collaborate on this list.
            </p>
          </div>

          <div className="share-form-fields">
            <div className="share-form-group">
              <label htmlFor="member-email" className="share-form-label">
                Email Address
              </label>
              <input
                id="member-email"
                type="email"
                className={`share-input ${emailError ? 'input-error' : ''}`}
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                onBlur={() => email && validateEmail(email)}
                placeholder="user@example.com"
                disabled={loading}
                autoComplete="email"
                aria-invalid={!!emailError}
                aria-describedby={emailError ? 'email-error' : undefined}
              />
              {emailError && (
                <span id="email-error" className="field-error" role="alert">
                  {emailError}
                </span>
              )}
            </div>

            <div className="share-form-group">
              <label htmlFor="member-permission" className="share-form-label">
                Permission Level
              </label>
              <select
                id="member-permission"
                className="share-select"
                value={permission}
                onChange={(e) => setPermission(e.target.value as PermissionLevel)}
                disabled={loading}
              >
                <option value="editor">Editor - Can add and modify items</option>
                <option value="viewer">Viewer - Can only view items</option>
              </select>
              <span className="field-help">
                Editors can add, edit, and delete items. Viewers can only see the list.
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-add-member"
            disabled={loading || !email}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                <span>Adding...</span>
              </>
            ) : (
              <>
                <span>Add Member</span>
              </>
            )}
          </button>
        </form>

        {/* Members List */}
        <div className="share-members-section">
          <h3>Current Members ({members.length})</h3>

          {members.length === 0 ? (
            <p className="share-empty-state">No members yet. Invite someone to get started!</p>
          ) : (
            <ul className="share-members-list">
              {members.map((member) => {
                const memberIsOwner = isOwner(member.userId);
                const displayName = getMemberDisplayName(member);
                const isRemoving = removingUserId === member.userId;
                const isUpdating = updatingUserId === member.userId;

                return (
                  <li key={member.userId} className="share-member-item">
                    <div className="share-member-info">
                      <div className="share-member-avatar">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="share-member-details">
                        <div className="share-member-name">
                          {displayName}
                          {memberIsOwner && (
                            <span className="share-member-badge owner-badge">Owner</span>
                          )}
                        </div>
                        <div className="share-member-email">{member.userEmail}</div>
                      </div>
                    </div>

                    <div className="share-member-actions">
                      {memberIsOwner ? (
                        <span className="permission-badge permission-owner">Owner</span>
                      ) : (
                        <>
                          {/* Permission Selector */}
                          <select
                            className="permission-select"
                            value={member.permission}
                            onChange={(e) =>
                              handleUpdatePermission(
                                member.userId,
                                e.target.value as PermissionLevel
                              )
                            }
                            disabled={isUpdating || isRemoving}
                            aria-label={`Change permission for ${displayName}`}
                          >
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>

                          {/* Remove Button */}
                          <button
                            className="btn-remove-member"
                            onClick={() => handleRemoveMember(member.userId)}
                            disabled={isRemoving || isUpdating}
                            aria-label={`Remove ${displayName}`}
                            type="button"
                          >
                            {isRemoving ? (
                              <span className="spinner-small"></span>
                            ) : (
                              '✕'
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="share-modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
