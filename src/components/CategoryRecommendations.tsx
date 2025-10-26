import { useState, useEffect } from 'react';
import type { GroceryItem, CustomCategory } from '../types';
import {
  getCategoryRecommendations,
  dismissRecommendation,
  recordRecommendationFeedback,
  getConfidenceLabel,
  getConfidenceColor,
  type CategoryRecommendation,
  type RecommendationType,
} from '../utils/categoryRecommendations';
import './CategoryRecommendations.css';

interface CategoryRecommendationsProps {
  items: GroceryItem[];
  categories: CustomCategory[];
  onCreateCategory?: (name: string, color?: string, icon?: string, itemsToMove?: string[]) => Promise<void>;
  onMergeCategories?: (sourceIds: string[], targetId: string) => Promise<void>;
  onArchiveCategory?: (categoryId: string) => Promise<void>;
}

export function CategoryRecommendations({
  items,
  categories,
  onCreateCategory,
  onMergeCategories,
  onArchiveCategory,
}: CategoryRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<CategoryRecommendation[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load recommendations
  useEffect(() => {
    const recs = getCategoryRecommendations(items, categories);
    setRecommendations(recs);
  }, [items, categories]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleAccept = async (rec: CategoryRecommendation) => {
    setProcessingId(rec.id);
    setError(null);

    try {
      switch (rec.type) {
        case 'create':
          if (onCreateCategory && rec.data.suggestedName) {
            await onCreateCategory(
              rec.data.suggestedName,
              rec.data.suggestedColor,
              rec.data.suggestedIcon,
              rec.data.affectedItems
            );
            recordRecommendationFeedback(rec.id, rec.type, true, {
              categoryName: rec.data.suggestedName,
              itemCount: rec.data.affectedItems?.length || 0,
            });
          }
          break;

        case 'merge':
          if (onMergeCategories && rec.data.sourceCategories && rec.data.targetCategory) {
            await onMergeCategories(rec.data.sourceCategories, rec.data.targetCategory);
            recordRecommendationFeedback(rec.id, rec.type, true, {
              sourceCount: rec.data.sourceCategories.length,
              itemCount: rec.data.itemCount,
            });
          }
          break;

        case 'archive':
          if (onArchiveCategory && rec.data.categoryId) {
            await onArchiveCategory(rec.data.categoryId);
            recordRecommendationFeedback(rec.id, rec.type, true, {
              categoryName: rec.data.categoryName,
              daysSinceLastUse: rec.data.daysSinceLastUse,
            });
          }
          break;

        case 'learn':
          // For learning suggestions, just mark as acknowledged
          recordRecommendationFeedback(rec.id, rec.type, true);
          break;
      }

      // Remove this recommendation from the list
      setRecommendations(prev => prev.filter(r => r.id !== rec.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply recommendation');
      console.error('[CategoryRecommendations] Error accepting recommendation:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDismiss = (rec: CategoryRecommendation) => {
    dismissRecommendation(rec.id);
    recordRecommendationFeedback(rec.id, rec.type, false);
    setRecommendations(prev => prev.filter(r => r.id !== rec.id));
  };

  const toggleExpanded = (recId: string) => {
    setExpandedId(prev => prev === recId ? null : recId);
  };

  const getTypeIcon = (type: RecommendationType): string => {
    switch (type) {
      case 'create': return '✨';
      case 'merge': return '🔗';
      case 'archive': return '📦';
      case 'learn': return '💡';
      default: return '📌';
    }
  };

  const getTypeLabel = (type: RecommendationType): string => {
    switch (type) {
      case 'create': return 'Create';
      case 'merge': return 'Merge';
      case 'archive': return 'Archive';
      case 'learn': return 'Tip';
      default: return 'Suggestion';
    }
  };

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="category-recommendations">
      <div className="recommendations-header">
        <h4>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          Smart Recommendations
        </h4>
        <span className="recommendations-count">{recommendations.length}</span>
      </div>

      {error && (
        <div className="recommendation-error" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      <div className="recommendations-list">
        {recommendations.map(rec => {
          const isExpanded = expandedId === rec.id;
          const isProcessing = processingId === rec.id;
          const confidenceColor = getConfidenceColor(rec.confidence);

          return (
            <div
              key={rec.id}
              className={`recommendation-card ${rec.type} ${isExpanded ? 'expanded' : ''}`}
            >
              <div className="recommendation-header" onClick={() => toggleExpanded(rec.id)}>
                <div className="recommendation-icon">{getTypeIcon(rec.type)}</div>
                <div className="recommendation-content">
                  <div className="recommendation-title-row">
                    <span className="recommendation-title">{rec.title}</span>
                    <div className="recommendation-badges">
                      <span className="recommendation-type-badge">{getTypeLabel(rec.type)}</span>
                      <span
                        className="recommendation-confidence-badge"
                        style={{ backgroundColor: confidenceColor }}
                      >
                        {getConfidenceLabel(rec.confidence)}
                      </span>
                    </div>
                  </div>
                  <p className="recommendation-description">{rec.description}</p>
                </div>
                <button
                  className="recommendation-expand-btn"
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(rec.id);
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>

              {isExpanded && (
                <div className="recommendation-details">
                  <div className="recommendation-action">
                    <strong>Action:</strong> {rec.suggestedAction}
                  </div>

                  {/* Show type-specific details */}
                  {rec.type === 'create' && rec.data.affectedItems && (
                    <div className="recommendation-affected-items">
                      <strong>Example items:</strong>
                      <ul>
                        {rec.data.affectedItems.slice(0, 5).map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                        {rec.data.affectedItems.length > 5 && (
                          <li className="more-items">
                            ... and {rec.data.affectedItems.length - 5} more
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {rec.type === 'merge' && rec.data.categoryNames && (
                    <div className="recommendation-merge-info">
                      <strong>Categories to merge:</strong>
                      <div className="merge-categories">
                        {rec.data.categoryNames.map((name, idx) => (
                          <span key={idx} className="merge-category-name">
                            {name}
                          </span>
                        ))}
                      </div>
                      <div className="merge-total">
                        Total items: {rec.data.itemCount || 0}
                      </div>
                    </div>
                  )}

                  {rec.type === 'archive' && rec.data.daysSinceLastUse !== undefined && (
                    <div className="recommendation-archive-info">
                      <strong>Last used:</strong>{' '}
                      {rec.data.daysSinceLastUse === 0
                        ? 'Never'
                        : `${rec.data.daysSinceLastUse} days ago`}
                    </div>
                  )}

                  {rec.type === 'learn' && rec.data.examples && (
                    <div className="recommendation-learn-info">
                      <strong>Examples:</strong>
                      <ul>
                        {rec.data.examples.map((example, idx) => (
                          <li key={idx}>{example}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="recommendation-actions">
                    <button
                      className="btn btn-primary btn-small"
                      onClick={() => handleAccept(rec)}
                      disabled={isProcessing || !canAccept(rec)}
                      title={!canAccept(rec) ? 'Action handler not available' : ''}
                    >
                      {isProcessing ? (
                        <>
                          <span className="spinner-small"></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Accept
                        </>
                      )}
                    </button>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => handleDismiss(rec)}
                      disabled={isProcessing}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="recommendations-footer">
        <p className="recommendations-note">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          All analysis is done locally on your device. No data is sent to external servers.
        </p>
      </div>
    </div>
  );

  // Helper function to check if a recommendation can be accepted
  function canAccept(rec: CategoryRecommendation): boolean {
    switch (rec.type) {
      case 'create':
        return !!onCreateCategory;
      case 'merge':
        return !!onMergeCategories;
      case 'archive':
        return !!onArchiveCategory;
      case 'learn':
        return true; // Learning tips can always be acknowledged
      default:
        return false;
    }
  }
}
