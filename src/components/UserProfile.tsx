import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { resetOnboardingTour } from '../hooks/useOnboardingTour';
import './UserProfile.css';

export interface UserProfileProps {
  onShowTour?: () => void;
}

export function UserProfile({ onShowTour }: UserProfileProps = {}) {
  const { user, logout } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <div className="user-profile">
        <button
          className="user-profile-button"
          onClick={() => setShowProfileModal(true)}
          aria-label="Open user profile"
        >
          <div className="user-avatar">
            {getInitials(user.name)}
          </div>
          <div className="user-info-compact">
            <span className="user-name-compact">{user.name}</span>
            <span className="user-email-compact">{user.email}</span>
          </div>
        </button>

        <button
          onClick={handleLogout}
          className="btn-logout-compact"
          disabled={isLoggingOut}
          aria-label="Logout"
        >
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>

      {showProfileModal && (
        <div className="profile-modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h2>User Profile</h2>
              <button
                className="profile-modal-close"
                onClick={() => setShowProfileModal(false)}
                aria-label="Close profile"
              >
                ×
              </button>
            </div>

            <div className="profile-modal-body">
              <div className="profile-avatar-large">
                {getInitials(user.name)}
              </div>

              <div className="profile-info-section">
                <div className="profile-info-item">
                  <label className="profile-info-label">Name</label>
                  <div className="profile-info-value">{user.name}</div>
                </div>

                <div className="profile-info-item">
                  <label className="profile-info-label">Email</label>
                  <div className="profile-info-value">{user.email}</div>
                </div>

                <div className="profile-info-item">
                  <label className="profile-info-label">Account Created</label>
                  <div className="profile-info-value">{formatDate(user.createdAt)}</div>
                </div>

                <div className="profile-info-item">
                  <label className="profile-info-label">User ID</label>
                  <div className="profile-info-value profile-id">{user.id}</div>
                </div>
              </div>

              <div className="profile-actions">
                <button
                  className="btn-profile-action btn-profile-edit"
                  onClick={() => {
                    // TODO: Implement edit functionality
                    alert('Edit profile functionality coming soon!');
                  }}
                >
                  Edit Profile
                </button>
                {onShowTour && (
                  <button
                    className="btn-profile-action btn-profile-tour"
                    onClick={() => {
                      resetOnboardingTour();
                      setShowProfileModal(false);
                      onShowTour();
                    }}
                  >
                    Show Onboarding Tour
                  </button>
                )}
                <button
                  className="btn-profile-action btn-profile-logout"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
