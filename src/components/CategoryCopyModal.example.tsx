/**
 * CategoryCopyModal Usage Example
 *
 * This example demonstrates how to integrate the CategoryCopyModal
 * into your Custom Category Manager or other components.
 */

import { useState } from 'react';
import { CategoryCopyModal } from './CategoryCopyModal';

/**
 * Example 1: Basic Integration in Custom Category Manager
 */
export function BasicUsageExample() {
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const currentListId = 'list-123'; // Your current list ID

  const handleCopySuccess = (count: number) => {
    setSuccessMessage(`Successfully imported ${count} categor${count === 1 ? 'y' : 'ies'}!`);
    setShowCopyModal(false);

    // Optional: Trigger a refetch or refresh of categories
    // The useCustomCategories hook will automatically update
  };

  return (
    <div>
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      <button
        className="btn btn-secondary"
        onClick={() => setShowCopyModal(true)}
      >
        Import Categories from Another List
      </button>

      {showCopyModal && (
        <CategoryCopyModal
          currentListId={currentListId}
          onClose={() => setShowCopyModal(false)}
          onSuccess={handleCopySuccess}
        />
      )}
    </div>
  );
}

/**
 * Example 2: With Additional Actions
 */
export function AdvancedUsageExample() {
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const currentListId = 'list-456';

  const handleCopySuccess = (count: number) => {
    setImporting(false);
    setShowCopyModal(false);

    // Show custom notification
    showNotification({
      type: 'success',
      message: `${count} categories imported successfully`,
      duration: 3000,
    });

    // Optional: Log analytics event
    logAnalyticsEvent('categories_imported', {
      count,
      listId: currentListId,
      timestamp: Date.now(),
    });

    // Optional: Trigger onboarding for new users
    if (count > 0) {
      highlightNewCategories();
    }
  };

  const handleCopyStart = () => {
    setImporting(true);
  };

  const handleCopyClose = () => {
    if (!importing) {
      setShowCopyModal(false);
    }
  };

  return (
    <div>
      <button
        className="btn btn-primary"
        onClick={() => {
          setShowCopyModal(true);
          handleCopyStart();
        }}
        disabled={importing}
      >
        {importing ? 'Importing...' : 'Import Categories'}
      </button>

      {showCopyModal && (
        <CategoryCopyModal
          currentListId={currentListId}
          onClose={handleCopyClose}
          onSuccess={handleCopySuccess}
        />
      )}
    </div>
  );
}

/**
 * Example 3: With Keyboard Shortcut
 */
export function KeyboardShortcutExample() {
  const [showCopyModal, setShowCopyModal] = useState(false);
  const currentListId = 'list-789';

  // Keyboard shortcut: Ctrl/Cmd + I
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'i') {
        event.preventDefault();
        setShowCopyModal(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div>
      <div className="keyboard-hint">
        Press <kbd>Ctrl/Cmd + I</kbd> to import categories
      </div>

      {showCopyModal && (
        <CategoryCopyModal
          currentListId={currentListId}
          onClose={() => setShowCopyModal(false)}
          onSuccess={(count) => console.log(`Imported ${count} categories`)}
        />
      )}
    </div>
  );
}

/**
 * Example 4: With Permission Check
 */
export function PermissionAwareExample() {
  const [showCopyModal, setShowCopyModal] = useState(false);
  const currentListId = 'list-abc';
  const userPermission = 'editor'; // or 'owner', 'viewer'

  const canEdit = userPermission === 'owner' || userPermission === 'editor';

  return (
    <div>
      {canEdit ? (
        <>
          <button
            className="btn btn-secondary"
            onClick={() => setShowCopyModal(true)}
          >
            Import Categories
          </button>

          {showCopyModal && (
            <CategoryCopyModal
              currentListId={currentListId}
              onClose={() => setShowCopyModal(false)}
              onSuccess={(count) => {
                console.log(`Imported ${count} categories`);
                setShowCopyModal(false);
              }}
            />
          )}
        </>
      ) : (
        <div className="permission-notice">
          Only owners and editors can import categories
        </div>
      )}
    </div>
  );
}

/**
 * Example 5: As Part of Onboarding Flow
 */
export function OnboardingExample() {
  const [step, setStep] = useState(1);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const currentListId = 'new-list-123';

  const handleSkip = () => {
    setStep(step + 1);
    // Continue to next onboarding step
  };

  const handleImportSuccess = (count: number) => {
    setShowCopyModal(false);
    setStep(step + 1);
    // Continue to next onboarding step with imported categories
  };

  return (
    <div className="onboarding-flow">
      {step === 2 && (
        <div className="onboarding-step">
          <h2>Setup Your Categories</h2>
          <p>
            You can import categories from your other lists to get started quickly,
            or skip this step and create categories from scratch.
          </p>

          <div className="onboarding-actions">
            <button
              className="btn btn-primary"
              onClick={() => setShowCopyModal(true)}
            >
              Import from Existing List
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleSkip}
            >
              Skip for Now
            </button>
          </div>

          {showCopyModal && (
            <CategoryCopyModal
              currentListId={currentListId}
              onClose={() => setShowCopyModal(false)}
              onSuccess={handleImportSuccess}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Placeholder functions for examples
function showNotification(_options: any) {
  // Implementation
}

function logAnalyticsEvent(_event: string, _data: any) {
  // Implementation
}

function highlightNewCategories() {
  // Implementation
}

function useEffect(_callback: () => void | (() => void), _deps: any[]) {
  // React.useEffect
}
