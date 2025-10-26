import { useState, useEffect } from 'react';
import axios from 'axios';
import type { InviteDetails } from '../types';
import { ContentSkeleton } from './ListSkeleton';
import './InviteAccept.css';

interface InviteAcceptProps {
  token: string;
  onClose: () => void;
  onAcceptSuccess?: (listId: string) => void;
}

export function InviteAccept({ token, onClose, onAcceptSuccess }: InviteAcceptProps) {
  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const getAuthToken = () => localStorage.getItem('token');
  const isLoggedIn = !!getAuthToken();

  useEffect(() => {
    loadInviteDetails();
  }, [token]);

  const loadInviteDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/api/invites/${token}`);
      setInviteDetails(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired invite link');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!isLoggedIn) {
      setError('You need to log in to accept this invite');
      return;
    }

    setAccepting(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/invites/${token}/accept`,
        {},
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );

      // Call success callback with the list ID
      if (onAcceptSuccess) {
        onAcceptSuccess(response.data.data.listId);
      }

      // Close the modal
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to accept invite');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="invite-accept-overlay" onClick={onClose}>
        <div className="invite-accept-card" onClick={(e) => e.stopPropagation()}>
          <ContentSkeleton lines={4} />
        </div>
      </div>
    );
  }

  if (error && !inviteDetails) {
    return (
      <div className="invite-accept-overlay" onClick={onClose}>
        <div className="invite-accept-card" onClick={(e) => e.stopPropagation()}>
          <div className="invite-icon invite-icon-error">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1>Invalid Invite</h1>
          <p className="error-message">{error}</p>
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!inviteDetails) {
    return null;
  }

  return (
    <div className="invite-accept-overlay" onClick={onClose}>
      <div className="invite-accept-card" onClick={(e) => e.stopPropagation()}>
        <button className="btn-close-invite" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="invite-icon invite-icon-success">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>

        <h1>You're Invited!</h1>

        <div className="invite-details">
          <div className="invite-detail-item">
            <span className="invite-detail-label">List:</span>
            <span className="invite-detail-value">{inviteDetails.listName}</span>
          </div>
          <div className="invite-detail-item">
            <span className="invite-detail-label">Owner:</span>
            <span className="invite-detail-value">{inviteDetails.ownerName}</span>
          </div>
          <div className="invite-detail-item">
            <span className="invite-detail-label">Members:</span>
            <span className="invite-detail-value">{inviteDetails.memberCount}</span>
          </div>
          {inviteDetails.expiresAt && (
            <div className="invite-detail-item">
              <span className="invite-detail-label">Expires:</span>
              <span className="invite-detail-value">
                {new Date(inviteDetails.expiresAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>

        {!isLoggedIn && (
          <div className="invite-notice">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>You need to log in to accept this invite</span>
          </div>
        )}

        {error && (
          <div className="invite-error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="invite-actions">
          <button
            className="btn btn-primary btn-large"
            onClick={handleAcceptInvite}
            disabled={accepting || !isLoggedIn}
          >
            {accepting ? 'Joining...' : 'Accept Invite'}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
