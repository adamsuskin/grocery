import { useState, useEffect, FormEvent } from 'react';
import type { ListWithMembers, ListPermission, InviteLink } from '../types';
import { ListStats } from './ListStats';
import { PermissionBadge } from './PermissionBadge';
import './ListManagement.css';
import axios from 'axios';
import { exportToJSON, exportToCSV, exportToText, exportToPrint } from '../utils/listExport';

interface ListManagementProps {
  list: ListWithMembers;
  onClose: () => void;
  onRenameList?: (listId: string, newName: string) => Promise<void>;
  onShareList?: (listId: string, userEmail: string, permission: ListPermission) => Promise<void>;
  onUpdateMemberPermission?: (listId: string, memberId: string, permission: ListPermission) => Promise<void>;
  onRemoveMember?: (listId: string, memberId: string) => Promise<void>;
  onDeleteList?: (listId: string) => Promise<void>;
  onLeaveList?: (listId: string) => Promise<void>;
  onTransferOwnership?: (listId: string, newOwnerId: string) => Promise<void>;
  onDuplicateList?: (listId: string, newName?: string) => Promise<string>;
  currentUserId: string;
}

type TabType = 'general' | 'members' | 'statistics' | 'danger';

export function ListManagement({
  list,
  onClose,
  onRenameList,
  onShareList,
  onUpdateMemberPermission,
  onRemoveMember,
  onDeleteList,
  onLeaveList,
  onTransferOwnership,
  onDuplicateList,
  currentUserId,
}: ListManagementProps) {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [listName, setListName] = useState(list.name);
  const [isRenaming, setIsRenaming] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState<ListPermission>('editor');
  const [isSharing, setIsSharing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  const [transferMemberId, setTransferMemberId] = useState<string | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateName, setDuplicateName] = useState('');
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<InviteLink | null>(null);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [isRevokingInvite, setIsRevokingInvite] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const isOwner = list.currentUserPermission === 'owner';
  const canEdit = isOwner || list.currentUserPermission === 'editor';

  // Get API base URL from environment
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const getAuthToken = () => localStorage.getItem('token');

  // Clear messages after a few seconds
  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  const handleRename = async (e: FormEvent) => {
    e.preventDefault();
    if (!onRenameList || !canEdit) return;

    const trimmedName = listName.trim();
    if (trimmedName === list.name) {
      setError('Name is unchanged');
      return;
    }

    if (trimmedName.length < 1) {
      setError('List name cannot be empty');
      return;
    }

    setIsRenaming(true);
    setError(null);

    try {
      await onRenameList(list.id, trimmedName);
      setSuccessMessage('List renamed successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename list');
      setListName(list.name); // Reset to original name
    } finally {
      setIsRenaming(false);
    }
  };

  const handleShare = async (e: FormEvent) => {
    e.preventDefault();
    if (!onShareList || !isOwner) return;

    const trimmedEmail = shareEmail.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Please enter an email address');
      return;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSharing(true);
    setError(null);

    try {
      await onShareList(list.id, trimmedEmail, sharePermission);
      setSuccessMessage(`Invitation sent to ${trimmedEmail}`);
      setShareEmail('');
      setSharePermission('editor');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share list');
    } finally {
      setIsSharing(false);
    }
  };

  const handleUpdatePermission = async (memberId: string, newPermission: ListPermission) => {
    if (!onUpdateMemberPermission || !isOwner) return;

    setError(null);
    try {
      await onUpdateMemberPermission(list.id, memberId, newPermission);
      setSuccessMessage('Permission updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update permission');
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!onRemoveMember || !isOwner) return;

    if (!confirm(`Remove ${memberName} from this list?`)) {
      return;
    }

    setError(null);
    try {
      await onRemoveMember(list.id, memberId);
      setSuccessMessage('Member removed successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const handleTransferOwnership = async () => {
    if (!onTransferOwnership || !isOwner || !transferMemberId) return;

    setIsTransferring(true);
    setError(null);

    try {
      await onTransferOwnership(list.id, transferMemberId);
      setSuccessMessage('Ownership transferred successfully');
      setShowTransferConfirm(false);
      setTransferMemberId(null);
      // Close modal after successful transfer since user is no longer owner
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transfer ownership');
      setIsTransferring(false);
      setShowTransferConfirm(false);
      setTransferMemberId(null);
    }
  };

  const handleTransferClick = (memberId: string) => {
    setTransferMemberId(memberId);
    setShowTransferConfirm(true);
  };

  const handleDeleteList = async () => {
    if (!onDeleteList || !isOwner) return;

    setIsDeleting(true);
    setError(null);

    try {
      await onDeleteList(list.id);
      // Don't need to show success message as the component will be closed
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete list');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleLeaveList = async () => {
    if (!onLeaveList || isOwner) return;

    setIsLeaving(true);
    setError(null);

    try {
      await onLeaveList(list.id);
      // Close modal and redirect after leaving
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave list');
      setIsLeaving(false);
      setShowLeaveConfirm(false);
    }
  };

  const handleGenerateInvite = async () => {
    if (!isOwner) return;

    setIsGeneratingInvite(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/lists/${list.id}/invite`,
        { expiresInDays: 7 },
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );

      setInviteLink(response.data.data);
      setSuccessMessage('Invite link generated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate invite link');
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const handleRevokeInvite = async () => {
    if (!isOwner) return;

    setIsRevokingInvite(true);
    setError(null);

    try {
      await axios.delete(`${API_BASE_URL}/api/lists/${list.id}/invite`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      setInviteLink(null);
      setSuccessMessage('Invite link revoked successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to revoke invite link');
    } finally {
      setIsRevokingInvite(false);
    }
  };

  const handleCopyInviteLink = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink.inviteUrl);
      setSuccessMessage('Invite link copied to clipboard');
    } catch (err) {
      setError('Failed to copy invite link');
    }
  };

  const handleDuplicateList = async () => {
    if (!onDuplicateList) return;

    setIsDuplicating(true);
    setError(null);

    try {
      const newListId = await onDuplicateList(list.id, duplicateName.trim() || undefined);
      setSuccessMessage('List duplicated successfully');
      setShowDuplicateDialog(false);
      setDuplicateName('');

      // Redirect to new list after a short delay
      setTimeout(() => {
        window.location.href = `/?list=${newListId}`;
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate list');
    } finally {
      setIsDuplicating(false);
    }
  };

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !showDeleteConfirm && !showLeaveConfirm) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showDeleteConfirm, showLeaveConfirm]);

  const handleExport = async (format: 'json' | 'csv' | 'text' | 'print') => {
    setIsExporting(true);
    setError(null);

    try {
      switch (format) {
        case 'json':
          await exportToJSON(list.id);
          setSuccessMessage('List exported to JSON successfully');
          break;
        case 'csv':
          await exportToCSV(list.id, { includeMetadata: true });
          setSuccessMessage('List exported to CSV successfully');
          break;
        case 'text':
          await exportToText(list.id, { groupByCategory: true, includeNotes: true });
          setSuccessMessage('List exported to text successfully');
          break;
        case 'print':
          await exportToPrint(list.id, { groupByCategory: true, includeNotes: true, showCheckboxes: true });
          setSuccessMessage('Print view opened successfully');
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to export to ${format.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="list-management-overlay" onClick={onClose}>
      <div className="list-management-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="list-management-header">
          <h2>Manage List</h2>
          <button className="btn-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="list-management-tabs">
          <button
            className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            className={`tab-button ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            Members ({list.memberCount})
          </button>
          <button
            className={`tab-button ${activeTab === 'statistics' ? 'active' : ''}`}
            onClick={() => setActiveTab('statistics')}
          >
            Statistics
          </button>
          <button
            className={`tab-button ${activeTab === 'danger' ? 'active' : ''}`}
            onClick={() => setActiveTab('danger')}
          >
            {isOwner ? 'Danger Zone' : 'Leave List'}
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="message message-error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}
        {successMessage && (
          <div className="message message-success">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {successMessage}
          </div>
        )}

        {/* Tab Content */}
        <div className="list-management-body">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="tab-content">
              <section className="settings-section">
                <h3>List Information</h3>
                <form onSubmit={handleRename} className="rename-form">
                  <div className="form-group">
                    <label htmlFor="list-name">List Name</label>
                    <div className="input-with-button">
                      <input
                        id="list-name"
                        type="text"
                        className="input"
                        value={listName}
                        onChange={(e) => setListName(e.target.value)}
                        disabled={!canEdit || isRenaming}
                        maxLength={100}
                      />
                      {canEdit && (
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={isRenaming || listName.trim() === list.name}
                        >
                          {isRenaming ? 'Saving...' : 'Rename'}
                        </button>
                      )}
                    </div>
                  </div>
                </form>

                <div className="info-grid">
                  <div className="info-item">
                    <label>Created</label>
                    <div className="info-value">
                      {new Date(list.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                  <div className="info-item">
                    <label>Your Role</label>
                    <div className="info-value">
                      {list.currentUserPermission && (
                        <PermissionBadge
                          permission={list.currentUserPermission}
                          size="medium"
                          showIcon
                        />
                      )}
                    </div>
                  </div>
                  <div className="info-item">
                    <label>Total Members</label>
                    <div className="info-value">{list.memberCount}</div>
                  </div>
                  <div className="info-item">
                    <label>Last Updated</label>
                    <div className="info-value">
                      {new Date(list.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
              </section>

              <section className="settings-section">
                <h3>Export List</h3>
                <p className="section-description">
                  Download or print your list in various formats for backup, sharing, or offline use.
                </p>

                <div className="export-buttons">
                  <button
                    className="btn btn-export"
                    onClick={() => handleExport('json')}
                    disabled={isExporting}
                    title="Export as JSON file (full data with metadata)"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    JSON
                  </button>

                  <button
                    className="btn btn-export"
                    onClick={() => handleExport('csv')}
                    disabled={isExporting}
                    title="Export as CSV file (spreadsheet compatible)"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    CSV
                  </button>

                  <button
                    className="btn btn-export"
                    onClick={() => handleExport('text')}
                    disabled={isExporting}
                    title="Export as plain text file (simple readable format)"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Text
                  </button>

                  <button
                    className="btn btn-export btn-export-print"
                    onClick={() => handleExport('print')}
                    disabled={isExporting}
                    title="Open printer-friendly view"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 6 2 18 2 18 9" />
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                      <rect x="6" y="14" width="12" height="8" />
                    </svg>
                    Print
                  </button>
                </div>

                {isExporting && (
                  <div className="export-loading">
                    <span>Preparing export...</span>
                  </div>
                )}
              </section>

              <section className="settings-section">
                <h3>Duplicate List</h3>
                <p className="section-description">
                  Create a copy of this list with all items. Useful for recurring shopping trips.
                </p>

                {!showDuplicateDialog ? (
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowDuplicateDialog(true);
                      setDuplicateName(`Copy of ${list.name}`);
                    }}
                    disabled={isDuplicating}
                  >
                    Duplicate List
                  </button>
                ) : (
                  <div className="duplicate-dialog">
                    <div className="form-group">
                      <label htmlFor="duplicate-name">New List Name</label>
                      <input
                        id="duplicate-name"
                        type="text"
                        className="input"
                        value={duplicateName}
                        onChange={(e) => setDuplicateName(e.target.value)}
                        placeholder={`Copy of ${list.name}`}
                        disabled={isDuplicating}
                        maxLength={100}
                        autoFocus
                      />
                    </div>
                    <div className="duplicate-actions">
                      <button
                        className="btn btn-primary"
                        onClick={handleDuplicateList}
                        disabled={isDuplicating}
                      >
                        {isDuplicating ? 'Duplicating...' : 'Create Copy'}
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowDuplicateDialog(false);
                          setDuplicateName('');
                        }}
                        disabled={isDuplicating}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {!canEdit && (
                <div className="permission-notice">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>You have view-only access to this list</span>
                </div>
              )}
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="tab-content">
              {isOwner && (
                <section className="settings-section">
                  <h3>Invite Link</h3>
                  <p className="section-description">Generate a shareable link that anyone can use to join this list.</p>

                  {!inviteLink ? (
                    <button
                      className="btn btn-primary"
                      onClick={handleGenerateInvite}
                      disabled={isGeneratingInvite}
                    >
                      {isGeneratingInvite ? 'Generating...' : 'Generate Invite Link'}
                    </button>
                  ) : (
                    <div className="invite-link-container">
                      <div className="invite-link-info">
                        <div className="invite-link-url">
                          <input
                            type="text"
                            value={inviteLink.inviteUrl}
                            readOnly
                            className="input invite-link-input"
                          />
                          <button
                            className="btn btn-secondary"
                            onClick={handleCopyInviteLink}
                            title="Copy to clipboard"
                          >
                            Copy
                          </button>
                        </div>
                        <div className="invite-link-expiry">
                          Expires: {new Date(inviteLink.expiresAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                      <button
                        className="btn btn-danger"
                        onClick={handleRevokeInvite}
                        disabled={isRevokingInvite}
                      >
                        {isRevokingInvite ? 'Revoking...' : 'Revoke Link'}
                      </button>
                    </div>
                  )}
                </section>
              )}

              {isOwner && (
                <section className="settings-section">
                  <h3>Share by Email</h3>
                  <form onSubmit={handleShare} className="share-form">
                    <div className="form-group">
                      <label htmlFor="share-email">Invite by Email</label>
                      <input
                        id="share-email"
                        type="email"
                        className="input"
                        placeholder="email@example.com"
                        value={shareEmail}
                        onChange={(e) => setShareEmail(e.target.value)}
                        disabled={isSharing}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="share-permission">Permission Level</label>
                      <select
                        id="share-permission"
                        className="input select-category"
                        value={sharePermission}
                        onChange={(e) => setSharePermission(e.target.value as ListPermission)}
                        disabled={isSharing}
                      >
                        <option value="editor">Editor - Can add and modify items</option>
                        <option value="viewer">Viewer - Can only view items</option>
                      </select>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={isSharing || !shareEmail.trim()}>
                      {isSharing ? 'Sending...' : 'Send Invitation'}
                    </button>
                  </form>
                </section>
              )}

              <section className="settings-section">
                <h3>List Members</h3>
                {list.members && list.members.length > 0 ? (
                  <div className="members-list">
                    {list.members.map((member) => {
                      const isCurrentUser = member.userId === currentUserId;
                      const canModifyMember = isOwner && !isCurrentUser && member.permission !== 'owner';

                      return (
                        <div key={member.id} className="member-item">
                          <div className="member-avatar">
                            {member.userName.charAt(0).toUpperCase()}
                          </div>
                          <div className="member-info">
                            <div className="member-name">
                              {member.userName}
                              {isCurrentUser && <span className="member-badge-you">(You)</span>}
                            </div>
                            <div className="member-email">{member.userEmail}</div>
                          </div>
                          <div className="member-actions">
                            {canModifyMember ? (
                              <select
                                className="permission-select"
                                value={member.permission}
                                onChange={(e) =>
                                  handleUpdatePermission(member.id, e.target.value as ListPermission)
                                }
                              >
                                <option value="editor">Editor</option>
                                <option value="viewer">Viewer</option>
                              </select>
                            ) : (
                              <PermissionBadge
                                permission={member.permission}
                                size="small"
                                showIcon
                              />
                            )}
                            {canModifyMember && onTransferOwnership && (
                              <button
                                className="btn-transfer-owner"
                                onClick={() => handleTransferClick(member.userId)}
                                title="Transfer ownership to this member"
                                aria-label={`Transfer ownership to ${member.userName}`}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                  <circle cx="12" cy="7" r="4" />
                                  <path d="M17 11l2 2-2 2" />
                                </svg>
                              </button>
                            )}
                            {canModifyMember && (
                              <button
                                className="btn-remove-member"
                                onClick={() => handleRemoveMember(member.id, member.userName)}
                                title="Remove member"
                                aria-label={`Remove ${member.userName}`}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-members">
                    <p>No members yet. Share this list to collaborate!</p>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'statistics' && (
            <div className="tab-content">
              <section className="settings-section">
                <h3>List Analytics</h3>
                <p className="section-description">
                  View detailed statistics and insights about this list's activity, items, and member contributions.
                </p>
                <button className="btn btn-primary" onClick={() => setShowStats(true)}>
                  View Statistics
                </button>
              </section>
            </div>
          )}

          {/* Danger Zone Tab */}
          {activeTab === 'danger' && (
            <div className="tab-content">
              {isOwner ? (
                <section className="settings-section danger-section">
                  <h3>Danger Zone</h3>
                  <p className="danger-description">
                    Deleting this list is permanent and cannot be undone. All items in this list will be deleted, and
                    all members will lose access.
                  </p>

                  {!showDeleteConfirm ? (
                    <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>
                      Delete List
                    </button>
                  ) : (
                    <div className="delete-confirm">
                      <p className="delete-confirm-text">
                        Are you sure? This action cannot be undone. Type <strong>"{list.name}"</strong> to confirm.
                      </p>
                      <div className="delete-confirm-actions">
                        <button
                          className="btn btn-danger"
                          onClick={handleDeleteList}
                          disabled={isDeleting}
                        >
                          {isDeleting ? 'Deleting...' : 'Yes, Delete Permanently'}
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setShowDeleteConfirm(false)}
                          disabled={isDeleting}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              ) : (
                <section className="settings-section danger-section">
                  <h3>Leave List</h3>
                  <p className="danger-description">
                    Leaving this list will remove you as a member. You will lose access to all items and will need
                    to be re-invited to regain access.
                  </p>

                  {!showLeaveConfirm ? (
                    <button className="btn btn-danger" onClick={() => setShowLeaveConfirm(true)}>
                      Leave List
                    </button>
                  ) : (
                    <div className="delete-confirm">
                      <p className="delete-confirm-text">
                        Are you sure you want to leave this list? You will need to be re-invited to regain access.
                      </p>
                      <div className="delete-confirm-actions">
                        <button
                          className="btn btn-danger"
                          onClick={handleLeaveList}
                          disabled={isLeaving}
                        >
                          {isLeaving ? 'Leaving...' : 'Yes, Leave List'}
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setShowLeaveConfirm(false)}
                          disabled={isLeaving}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Statistics Modal */}
      {showStats && (
        <ListStats listId={list.id} onClose={() => setShowStats(false)} />
      )}

      {/* Transfer Ownership Confirmation Dialog */}
      {showTransferConfirm && transferMemberId && (
        <div className="confirmation-overlay" onClick={() => !isTransferring && setShowTransferConfirm(false)}>
          <div className="confirmation-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Transfer List Ownership</h3>
            <div className="confirmation-content">
              <div className="warning-banner">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <p>This is a permanent action that cannot be undone!</p>
              </div>
              <p className="confirmation-message">
                You are about to transfer ownership of <strong>"{list.name}"</strong> to{' '}
                <strong>{list.members?.find((m) => m.userId === transferMemberId)?.userName}</strong>.
              </p>
              <div className="implications-list">
                <p><strong>What will happen:</strong></p>
                <ul>
                  <li>The new owner will have full control over the list</li>
                  <li>They will be able to manage all members, including removing you</li>
                  <li>They can delete the list or transfer ownership to someone else</li>
                  <li>Your permission will be changed to "Editor"</li>
                  <li>You will lose owner privileges immediately</li>
                </ul>
              </div>
              <p className="confirmation-question">Are you absolutely sure you want to proceed?</p>
            </div>
            <div className="confirmation-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowTransferConfirm(false);
                  setTransferMemberId(null);
                }}
                disabled={isTransferring}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleTransferOwnership}
                disabled={isTransferring}
              >
                {isTransferring ? 'Transferring...' : 'Yes, Transfer Ownership'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
