import { useState, FormEvent, useEffect } from 'react';
import type { PermissionLevel } from '../types';
import './ShareRecipeModal.css';

/**
 * Recipe member/collaborator information
 */
export interface RecipeMember {
  userId: string;
  userEmail: string;
  userName: string;
  permission: PermissionLevel;
  addedAt: number;
}

/**
 * ShareRecipeModal Props
 */
export interface ShareRecipeModalProps {
  /** Recipe ID to share */
  recipeId: string;
  /** Recipe name for display */
  recipeName: string;
  /** Current recipe members */
  members: RecipeMember[];
  /** Current user ID (owner) */
  currentUserId: string;
  /** Whether recipe is currently public */
  isPublic: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when member is added */
  onAddMember: (email: string, permission: PermissionLevel) => Promise<void>;
  /** Callback when member is removed */
  onRemoveMember: (userId: string) => Promise<void>;
  /** Callback when member permission is updated */
  onUpdatePermission: (userId: string, permission: PermissionLevel) => Promise<void>;
  /** Callback when public/private status changes */
  onTogglePublic: (isPublic: boolean) => Promise<void>;
  /** Callback to generate shareable link */
  onGenerateLink?: () => Promise<string>;
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
 * ShareRecipeModal Component
 *
 * Provides UI for sharing recipes with other users:
 * - Add collaborators by email address
 * - Set permission level (editor/viewer)
 * - Toggle public/private visibility
 * - Display current collaborators
 * - Remove collaborators (owner only)
 * - Change collaborator permissions (owner only)
 * - Copy shareable link
 *
 * @example
 * ```tsx
 * <ShareRecipeModal
 *   recipeId="recipe-123"
 *   recipeName="Chocolate Chip Cookies"
 *   members={recipeMembers}
 *   currentUserId="user-456"
 *   isPublic={false}
 *   onClose={() => setShowModal(false)}
 *   onAddMember={handleAddMember}
 *   onRemoveMember={handleRemoveMember}
 *   onUpdatePermission={handleUpdatePermission}
 *   onTogglePublic={handleTogglePublic}
 *   onGenerateLink={handleGenerateLink}
 * />
 * ```
 */
export function ShareRecipeModal({
  recipeId: _recipeId,
  recipeName,
  members,
  currentUserId,
  isPublic,
  onClose,
  onAddMember,
  onRemoveMember,
  onUpdatePermission,
  onTogglePublic,
  onGenerateLink,
}: ShareRecipeModalProps) {
  // Form state
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<PermissionLevel>('viewer');
  const [publicStatus, setPublicStatus] = useState(isPublic);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [shareableLink, setShareableLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Action loading states
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [togglingPublic, setTogglingPublic] = useState(false);

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

    // Check if user is already a collaborator
    const existingMember = members.find(
      m => m.userEmail.toLowerCase() === value.toLowerCase()
    );

    if (existingMember) {
      setEmailError('This user is already a collaborator on this recipe');
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
   * Handles form submission to add a new collaborator
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
      setPermission('viewer');
      setSuccess(`Successfully invited ${email} as ${permission}`);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add collaborator';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles removing a collaborator from the recipe
   */
  const handleRemoveMember = async (userId: string) => {
    clearMessages();
    setRemovingUserId(userId);

    try {
      await onRemoveMember(userId);
      setSuccess('Collaborator removed successfully');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove collaborator';
      setError(errorMessage);
    } finally {
      setRemovingUserId(null);
    }
  };

  /**
   * Handles updating a collaborator's permission level
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
   * Handles toggling public/private status
   */
  const handleTogglePublic = async () => {
    clearMessages();
    setTogglingPublic(true);

    const newStatus = !publicStatus;

    try {
      await onTogglePublic(newStatus);
      setPublicStatus(newStatus);
      setSuccess(`Recipe is now ${newStatus ? 'public' : 'private'}`);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update visibility';
      setError(errorMessage);
    } finally {
      setTogglingPublic(false);
    }
  };

  /**
   * Generates and displays shareable link
   */
  const handleGenerateLink = async () => {
    if (!onGenerateLink) return;

    clearMessages();
    setLoading(true);

    try {
      const link = await onGenerateLink();
      setShareableLink(link);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate link';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Copies shareable link to clipboard
   */
  const handleCopyLink = async () => {
    if (!shareableLink) return;

    try {
      await navigator.clipboard.writeText(shareableLink);
      setLinkCopied(true);
      setSuccess('Link copied to clipboard!');

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setLinkCopied(false);
        setSuccess(null);
      }, 2000);
    } catch (err) {
      setError('Failed to copy link to clipboard');
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
  const getMemberDisplayName = (member: RecipeMember) => {
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
    <div className="share-recipe-modal-overlay" onClick={handleOverlayClick}>
      <div className="share-recipe-modal-content" role="dialog" aria-labelledby="share-recipe-modal-title">
        {/* Header */}
        <div className="share-recipe-modal-header">
          <div>
            <h2 id="share-recipe-modal-title">Share Recipe</h2>
            <p className="recipe-name-subtitle">{recipeName}</p>
          </div>
          <button
            className="share-recipe-modal-close"
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="share-recipe-message share-recipe-message-success" role="status">
            <span className="message-icon">✓</span>
            <span className="message-text">{success}</span>
          </div>
        )}

        {error && (
          <div className="share-recipe-message share-recipe-message-error" role="alert">
            <span className="message-icon">⚠</span>
            <span className="message-text">{error}</span>
          </div>
        )}

        {/* Visibility Toggle Section */}
        <div className="share-recipe-visibility-section">
          <div className="visibility-header">
            <h3>Recipe Visibility</h3>
            <p className="visibility-description">
              {publicStatus
                ? 'Anyone with the link can view this recipe'
                : 'Only you and invited collaborators can view this recipe'}
            </p>
          </div>

          <div className="visibility-toggle-container">
            <div className="visibility-status">
              <span className={`visibility-icon ${publicStatus ? 'public' : 'private'}`}>
                {publicStatus ? '🌐' : '🔒'}
              </span>
              <div className="visibility-info">
                <span className="visibility-label">
                  {publicStatus ? 'Public' : 'Private'}
                </span>
                <span className="visibility-sublabel">
                  {publicStatus ? 'Visible to everyone' : 'Private to collaborators'}
                </span>
              </div>
            </div>

            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={publicStatus}
                onChange={handleTogglePublic}
                disabled={togglingPublic}
                aria-label="Toggle recipe visibility"
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Shareable Link Section */}
        {onGenerateLink && (
          <div className="share-recipe-link-section">
            <h3>Shareable Link</h3>
            {shareableLink ? (
              <div className="link-container">
                <input
                  type="text"
                  className="share-link-input"
                  value={shareableLink}
                  readOnly
                  aria-label="Shareable link"
                />
                <button
                  className={`btn-copy-link ${linkCopied ? 'copied' : ''}`}
                  onClick={handleCopyLink}
                  disabled={linkCopied}
                >
                  {linkCopied ? (
                    <>
                      <span className="btn-icon">✓</span>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">📋</span>
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                className="btn btn-secondary btn-generate-link"
                onClick={handleGenerateLink}
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate Link'}
              </button>
            )}
          </div>
        )}

        {/* Add Collaborator Form */}
        <form className="share-recipe-form" onSubmit={handleSubmit}>
          <div className="share-recipe-form-header">
            <h3>Invite Collaborator</h3>
            <p className="share-recipe-form-description">
              Enter an email address to invite someone to collaborate on this recipe.
            </p>
          </div>

          <div className="share-recipe-form-fields">
            <div className="share-recipe-form-group">
              <label htmlFor="member-email" className="share-recipe-form-label">
                Email Address
              </label>
              <input
                id="member-email"
                type="email"
                className={`share-recipe-input ${emailError ? 'input-error' : ''}`}
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

            <div className="share-recipe-form-group">
              <label htmlFor="member-permission" className="share-recipe-form-label">
                Permission Level
              </label>
              <select
                id="member-permission"
                className="share-recipe-select"
                value={permission}
                onChange={(e) => setPermission(e.target.value as PermissionLevel)}
                disabled={loading}
              >
                <option value="editor">Editor - Can modify and share recipe</option>
                <option value="viewer">Viewer - Can only view recipe</option>
              </select>
              <span className="field-help">
                Editors can modify recipe details and ingredients. Viewers can only see the recipe.
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-add-collaborator"
            disabled={loading || !email}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                <span>Adding...</span>
              </>
            ) : (
              <>
                <span>Add Collaborator</span>
              </>
            )}
          </button>
        </form>

        {/* Collaborators List */}
        <div className="share-recipe-members-section">
          <h3>Collaborators ({members.length})</h3>

          {members.length === 0 ? (
            <p className="share-recipe-empty-state">No collaborators yet. Invite someone to get started!</p>
          ) : (
            <ul className="share-recipe-members-list">
              {members.map((member) => {
                const memberIsOwner = isOwner(member.userId);
                const displayName = getMemberDisplayName(member);
                const isRemoving = removingUserId === member.userId;
                const isUpdating = updatingUserId === member.userId;

                return (
                  <li key={member.userId} className="share-recipe-member-item">
                    <div className="share-recipe-member-info">
                      <div className="share-recipe-member-avatar">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="share-recipe-member-details">
                        <div className="share-recipe-member-name">
                          {displayName}
                          {memberIsOwner && (
                            <span className="share-recipe-member-badge owner-badge">Owner</span>
                          )}
                        </div>
                        <div className="share-recipe-member-email">{member.userEmail}</div>
                      </div>
                    </div>

                    <div className="share-recipe-member-actions">
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
        <div className="share-recipe-modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
