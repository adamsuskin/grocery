/**
 * ShareTargetHandler Component
 *
 * Handles incoming shared content from the Web Share Target API and integrates
 * it with the existing import flow. This component automatically detects shared
 * content, processes it, and allows users to preview and import items.
 *
 * Features:
 * - Automatic detection of shared content on mount
 * - Processing of text, URLs, and files
 * - Loading state during processing
 * - Preview of processed items before import
 * - Success/error notifications
 * - Integration with ImportList patterns
 * - Cleanup of shared data after processing
 *
 * @module components/ShareTargetHandler
 */

import { useState, useEffect } from 'react';
import { useWebShareTarget } from '../hooks/useWebShareTarget';
import {
  processSharedData,
  type ShareProcessResult,
} from '../utils/shareTargetHandler';
import { useListMutations } from '../zero-store';
import './ShareTargetHandler.css';

/**
 * Props for ShareTargetHandler component
 */
interface ShareTargetHandlerProps {
  /**
   * Callback invoked when import completes successfully
   * @param listId - ID of the newly created list
   */
  onImportComplete?: (listId: string) => void;

  /**
   * Callback invoked when an error occurs
   * @param error - The error that occurred
   */
  onError?: (error: Error) => void;
}

/**
 * Processing steps for the share target handler
 */
type ProcessingStep = 'detecting' | 'processing' | 'preview' | 'importing' | 'complete';

/**
 * ShareTargetHandler Component
 *
 * Handles Web Share Target data and integrates with the existing import flow.
 * Automatically detects shared content, processes it, and allows users to
 * preview and confirm import.
 *
 * @example
 * ```tsx
 * <ShareTargetHandler
 *   onImportComplete={(listId) => {
 *     console.log('List created:', listId);
 *     navigate(`/list/${listId}`);
 *   }}
 *   onError={(error) => {
 *     console.error('Import failed:', error);
 *   }}
 * />
 * ```
 */
export function ShareTargetHandler({
  onImportComplete,
  onError,
}: ShareTargetHandlerProps) {
  // Web Share Target hook
  const { sharedData, error: shareError, clearSharedData } = useWebShareTarget();

  // Component state
  const [step, setStep] = useState<ProcessingStep>('detecting');
  const [processResult, setProcessResult] = useState<ShareProcessResult | null>(null);
  const [listName, setListName] = useState('');
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Zero store mutations
  const { createListFromTemplate } = useListMutations();

  /**
   * Process shared data when it becomes available
   */
  useEffect(() => {
    if (!sharedData) return;

    console.log('[ShareTargetHandler] Shared data detected:', sharedData);
    setIsVisible(true);
    setStep('processing');
    setProcessingError(null);

    // Process the shared data
    const process = async () => {
      try {
        // Convert ProcessedShareData to SharedData format
        const sharedContent = {
          title: sharedData.title || undefined,
          text: sharedData.text || undefined,
          url: sharedData.url || undefined,
          files: undefined, // Files are already processed in ProcessedShareData
        };

        const result = await processSharedData(sharedContent);

        console.log('[ShareTargetHandler] Processing result:', result);

        if (result.success && result.items.length > 0) {
          setProcessResult(result);
          setListName(result.listName);
          setStep('preview');
        } else {
          const errorMsg = result.errors.length > 0
            ? result.errors.join('\n')
            : 'No items could be extracted from shared content';
          setProcessingError(errorMsg);

          // Notify error callback
          if (onError) {
            onError(new Error(errorMsg));
          }

          // Auto-close after showing error
          setTimeout(() => {
            handleClose();
          }, 5000);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to process shared content';
        console.error('[ShareTargetHandler] Processing error:', error);
        setProcessingError(errorMsg);

        // Notify error callback
        if (onError) {
          onError(error instanceof Error ? error : new Error(errorMsg));
        }

        // Auto-close after showing error
        setTimeout(() => {
          handleClose();
        }, 5000);
      }
    };

    process();
  }, [sharedData, onError]);

  /**
   * Handle share target errors
   */
  useEffect(() => {
    if (shareError) {
      console.error('[ShareTargetHandler] Share target error:', shareError);
      setProcessingError(shareError.message);
      setIsVisible(true);

      // Notify error callback
      if (onError) {
        onError(shareError);
      }

      // Auto-close after showing error
      setTimeout(() => {
        handleClose();
      }, 5000);
    }
  }, [shareError, onError]);

  /**
   * Handle import confirmation
   */
  const handleImport = async () => {
    if (!processResult || !listName.trim()) return;

    setStep('importing');
    setProcessingError(null);

    try {
      console.log('[ShareTargetHandler] Creating list with items:', processResult.items);

      // Create the list with imported items
      const listId = await createListFromTemplate(
        listName.trim(),
        processResult.items,
        undefined, // Use default color
        undefined  // Use default icon
      );

      console.log('[ShareTargetHandler] List created successfully:', listId);
      setStep('complete');

      // Clean up shared data
      clearSharedData();

      // Call callback after a short delay to show success message
      setTimeout(() => {
        if (onImportComplete) {
          onImportComplete(listId);
        }
        handleClose();
      }, 1500);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to create list';
      console.error('[ShareTargetHandler] Import error:', error);
      setProcessingError(errorMsg);
      setStep('preview');

      // Notify error callback
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMsg));
      }
    }
  };

  /**
   * Handle cancel/close
   */
  const handleClose = () => {
    clearSharedData();
    setIsVisible(false);
    setStep('detecting');
    setProcessResult(null);
    setListName('');
    setProcessingError(null);
  };

  /**
   * Render detecting/processing state
   */
  const renderProcessingState = () => {
    return (
      <div className="share-step share-processing">
        <div className="share-body">
          <div className="processing-spinner">
            <div className="loading-spinner-large"></div>
            <h3>
              {step === 'detecting' ? 'Detecting shared content...' : 'Processing shared items...'}
            </h3>
            <p>Please wait while we prepare your list</p>
          </div>

          {processingError && (
            <div className="share-error">
              <div className="error-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className="error-content">
                <h4>Processing Error</h4>
                <pre>{processingError}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * Render preview state
   */
  const renderPreviewState = () => {
    if (!processResult) return null;

    return (
      <div className="share-step share-preview">
        <div className="share-header">
          <h2>Shared Items</h2>
          <button className="btn-close" onClick={handleClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="share-body">
          <div className="preview-summary">
            <div className="summary-card">
              <div className="summary-icon success">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="summary-content">
                <h4>{processResult.items.length} Items Received</h4>
                <p>Review and create your list</p>
              </div>
            </div>
          </div>

          {processResult.metadata && (
            <div className="share-metadata">
              {processResult.metadata.originalUrl && (
                <div className="metadata-item">
                  <span className="metadata-label">Source URL:</span>
                  <span className="metadata-value">{processResult.metadata.originalUrl}</span>
                </div>
              )}
              {processResult.metadata.fileName && (
                <div className="metadata-item">
                  <span className="metadata-label">File:</span>
                  <span className="metadata-value">{processResult.metadata.fileName}</span>
                </div>
              )}
            </div>
          )}

          <div className="list-name-input">
            <label htmlFor="list-name">List Name</label>
            <input
              id="list-name"
              type="text"
              className="input"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="Enter list name..."
              maxLength={100}
              autoFocus
            />
          </div>

          {processResult.warnings.length > 0 && (
            <div className="share-warnings">
              <div className="warning-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="warning-content">
                <h4>Notice</h4>
                <ul>
                  {processResult.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {processResult.errors.length > 0 && (
            <div className="share-errors">
              <div className="error-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className="error-content">
                <h4>Some issues occurred</h4>
                <ul>
                  {processResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="preview-items">
            <h4>Items ({processResult.items.length})</h4>
            <div className="preview-items-list">
              {processResult.items.map((item, index) => (
                <div key={index} className="preview-item">
                  <div className="preview-item-info">
                    <span className="preview-item-name">{item.name}</span>
                    {item.notes && <span className="preview-item-notes">{item.notes}</span>}
                  </div>
                  <div className="preview-item-meta">
                    <span className="preview-item-quantity">Qty: {item.quantity}</span>
                    <span className={`preview-item-category category-${item.category.toLowerCase()}`}>
                      {item.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="share-footer">
          <button className="btn btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleImport}
            disabled={!listName.trim()}
          >
            Create List
          </button>
        </div>
      </div>
    );
  };

  /**
   * Render importing state
   */
  const renderImportingState = () => (
    <div className="share-step share-importing">
      <div className="share-body">
        <div className="importing-spinner">
          <div className="loading-spinner-large"></div>
          <h3>Creating your list...</h3>
          <p>Please wait while we save your items</p>
        </div>
      </div>
    </div>
  );

  /**
   * Render complete state
   */
  const renderCompleteState = () => (
    <div className="share-step share-complete">
      <div className="share-body">
        <div className="complete-message">
          <div className="complete-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h3>List Created Successfully!</h3>
          <p>Your shared items have been imported</p>
        </div>
      </div>
    </div>
  );

  /**
   * Render current step
   */
  const renderStep = () => {
    switch (step) {
      case 'detecting':
      case 'processing':
        return renderProcessingState();
      case 'preview':
        return renderPreviewState();
      case 'importing':
        return renderImportingState();
      case 'complete':
        return renderCompleteState();
      default:
        return null;
    }
  };

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div className="share-target-overlay">
      <div className="share-target-modal">
        {renderStep()}
      </div>
    </div>
  );
}
