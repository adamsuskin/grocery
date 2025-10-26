import { useState, useEffect, useMemo } from 'react';
import { useCustomCategories, useCustomCategoryMutations } from '../hooks/useCustomCategories';
import { useGroceryLists } from '../zero-store';
import type { CustomCategory } from '../types';
import './CategoryCopyModal.css';

interface CategoryCopyModalProps {
  currentListId: string;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

type ConflictResolution = 'skip' | 'rename' | 'overwrite';

interface CategoryToCopy extends CustomCategory {
  selected: boolean;
  hasConflict: boolean;
  conflictResolution?: ConflictResolution;
  newName?: string;
}

export function CategoryCopyModal({ currentListId, onClose, onSuccess }: CategoryCopyModalProps) {
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryToCopy[]>([]);
  const [isCopying, setIsCopying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictResolution, setConflictResolution] = useState<ConflictResolution>('skip');

  // Get all lists except the current one
  const allLists = useGroceryLists();
  const availableLists = useMemo(
    () => allLists.filter(list => list.id !== currentListId && !list.isArchived),
    [allLists, currentListId]
  );

  // Get categories from selected list
  const sourceCategories = useCustomCategories(selectedListId || undefined);

  // Get categories from current list to check for conflicts
  const currentCategories = useCustomCategories(currentListId);
  const currentCategoryNames = useMemo(
    () => new Set(currentCategories.map(cat => cat.name.toLowerCase())),
    [currentCategories]
  );

  const { addCustomCategory } = useCustomCategoryMutations();

  // Update categories when source changes
  useEffect(() => {
    if (sourceCategories.length > 0) {
      const categoriesWithConflicts: CategoryToCopy[] = sourceCategories.map(cat => {
        const hasConflict = currentCategoryNames.has(cat.name.toLowerCase());
        return {
          ...cat,
          selected: false,
          hasConflict,
          conflictResolution: hasConflict ? conflictResolution : undefined,
          newName: hasConflict ? `${cat.name} (Copy)` : undefined,
        };
      });
      setCategories(categoriesWithConflicts);
    } else {
      setCategories([]);
    }
  }, [sourceCategories, currentCategoryNames, conflictResolution]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const selectedCount = categories.filter(cat => cat.selected).length;
  const conflictCount = categories.filter(cat => cat.selected && cat.hasConflict).length;

  const handleToggleCategory = (categoryId: string) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId ? { ...cat, selected: !cat.selected } : cat
      )
    );
  };

  const handleToggleAll = () => {
    const allSelected = categories.every(cat => cat.selected);
    setCategories(prev =>
      prev.map(cat => ({ ...cat, selected: !allSelected }))
    );
  };

  const handleConflictResolutionChange = (resolution: ConflictResolution) => {
    setConflictResolution(resolution);
    setCategories(prev =>
      prev.map(cat => {
        if (cat.hasConflict) {
          return {
            ...cat,
            conflictResolution: resolution,
            newName: resolution === 'rename' ? `${cat.name} (Copy)` : cat.name,
          };
        }
        return cat;
      })
    );
  };

  const handleUpdateNewName = (categoryId: string, newName: string) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId ? { ...cat, newName } : cat
      )
    );
  };

  const handleCopy = async () => {
    const selectedCategories = categories.filter(cat => cat.selected);

    if (selectedCategories.length === 0) {
      setError('Please select at least one category to copy');
      return;
    }

    setIsCopying(true);
    setError(null);

    let copiedCount = 0;
    let skippedCount = 0;

    try {
      for (const category of selectedCategories) {
        // Handle conflicts based on resolution strategy
        if (category.hasConflict) {
          if (category.conflictResolution === 'skip') {
            skippedCount++;
            continue;
          } else if (category.conflictResolution === 'rename') {
            const finalName = category.newName || `${category.name} (Copy)`;

            // Check if the renamed category also conflicts
            if (currentCategoryNames.has(finalName.toLowerCase())) {
              setError(`Category "${finalName}" already exists. Please choose a different name.`);
              setIsCopying(false);
              return;
            }

            await addCustomCategory(
              {
                name: finalName,
                listId: currentListId,
                color: category.color,
                icon: category.icon,
              },
              currentCategories
            );
            copiedCount++;
          } else if (category.conflictResolution === 'overwrite') {
            // Find and update the existing category
            const existingCategory = currentCategories.find(
              cat => cat.name.toLowerCase() === category.name.toLowerCase()
            );

            if (existingCategory) {
              // For now, we skip overwriting as it requires an update mutation
              // This can be enhanced later to actually update the existing category
              skippedCount++;
              continue;
            }
          }
        } else {
          // No conflict, copy directly
          await addCustomCategory(
            {
              name: category.name,
              listId: currentListId,
              color: category.color,
              icon: category.icon,
            },
            currentCategories
          );
          copiedCount++;
        }
      }

      if (copiedCount > 0) {
        onSuccess(copiedCount);
      } else {
        setError(`No categories were copied. ${skippedCount} categor${skippedCount === 1 ? 'y was' : 'ies were'} skipped due to conflicts.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to copy categories. Please try again.');
    } finally {
      setIsCopying(false);
    }
  };

  const selectedList = availableLists.find(list => list.id === selectedListId);

  return (
    <div className="category-copy-overlay" onClick={onClose}>
      <div className="category-copy-modal" onClick={(e) => e.stopPropagation()}>
        <div className="category-copy-header">
          <h3>Import Categories from Another List</h3>
          <button className="btn-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

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

        <div className="category-copy-body">
          {!selectedListId ? (
            <div className="list-selection">
              <p className="section-description">
                Select a list to copy categories from:
              </p>

              {availableLists.length === 0 ? (
                <div className="empty-lists">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3h7v7H3z" />
                    <path d="M14 3h7v7h-7z" />
                    <path d="M14 14h7v7h-7z" />
                    <path d="M3 14h7v7H3z" />
                  </svg>
                  <p>No other lists available</p>
                  <p className="empty-hint">Create another list with custom categories to import from.</p>
                </div>
              ) : (
                <div className="list-grid">
                  {availableLists.map(list => (
                    <button
                      key={list.id}
                      className="list-card"
                      onClick={() => setSelectedListId(list.id)}
                    >
                      <div className="list-icon" style={{ backgroundColor: list.color }}>
                        {list.icon}
                      </div>
                      <div className="list-info">
                        <div className="list-name">{list.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="category-selection">
              <div className="selected-list-header">
                <button
                  className="btn btn-small btn-secondary"
                  onClick={() => {
                    setSelectedListId(null);
                    setCategories([]);
                  }}
                >
                  ← Back to Lists
                </button>
                {selectedList && (
                  <div className="selected-list-info">
                    <span className="list-icon-small" style={{ backgroundColor: selectedList.color }}>
                      {selectedList.icon}
                    </span>
                    <span className="list-name-small">{selectedList.name}</span>
                  </div>
                )}
              </div>

              {categories.length === 0 ? (
                <div className="empty-categories">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3h7v7H3z" />
                    <path d="M14 3h7v7h-7z" />
                    <path d="M14 14h7v7h-7z" />
                    <path d="M3 14h7v7H3z" />
                  </svg>
                  <p>No custom categories in this list</p>
                  <p className="empty-hint">This list does not have any custom categories to import.</p>
                </div>
              ) : (
                <>
                  <div className="category-toolbar">
                    <label className="select-all-checkbox">
                      <input
                        type="checkbox"
                        checked={categories.length > 0 && categories.every(cat => cat.selected)}
                        onChange={handleToggleAll}
                      />
                      <span>Select All ({selectedCount} selected)</span>
                    </label>
                  </div>

                  {conflictCount > 0 && (
                    <div className="conflict-resolution-section">
                      <div className="conflict-warning">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <span>{conflictCount} selected categor{conflictCount === 1 ? 'y' : 'ies'} already exist{conflictCount === 1 ? 's' : ''} in the current list</span>
                      </div>

                      <div className="conflict-options">
                        <label className="conflict-option">
                          <input
                            type="radio"
                            name="conflictResolution"
                            value="skip"
                            checked={conflictResolution === 'skip'}
                            onChange={() => handleConflictResolutionChange('skip')}
                          />
                          <span>Skip conflicting categories</span>
                        </label>
                        <label className="conflict-option">
                          <input
                            type="radio"
                            name="conflictResolution"
                            value="rename"
                            checked={conflictResolution === 'rename'}
                            onChange={() => handleConflictResolutionChange('rename')}
                          />
                          <span>Rename conflicting categories</span>
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="categories-to-copy">
                    {categories.map(category => (
                      <div
                        key={category.id}
                        className={`category-copy-item ${category.selected ? 'selected' : ''} ${category.hasConflict ? 'has-conflict' : ''}`}
                      >
                        <div className="category-copy-main">
                          <input
                            type="checkbox"
                            checked={category.selected}
                            onChange={() => handleToggleCategory(category.id)}
                            aria-label={`Select ${category.name}`}
                          />

                          <div className="category-visual">
                            {category.icon && (
                              <span className="category-icon">{category.icon}</span>
                            )}
                            {category.color && (
                              <span
                                className="category-color-preview"
                                style={{ backgroundColor: category.color }}
                                title={`Color: ${category.color}`}
                              />
                            )}
                          </div>

                          <div className="category-copy-info">
                            <div className="category-name-row">
                              <span className="category-name">{category.name}</span>
                              {category.hasConflict && (
                                <span className="conflict-badge">Conflict</span>
                              )}
                            </div>

                            {category.selected && category.hasConflict && conflictResolution === 'rename' && (
                              <div className="rename-input-row">
                                <label htmlFor={`rename-${category.id}`}>New name:</label>
                                <input
                                  id={`rename-${category.id}`}
                                  type="text"
                                  className="input input-small"
                                  value={category.newName || ''}
                                  onChange={(e) => handleUpdateNewName(category.id, e.target.value)}
                                  placeholder="Enter new name"
                                  maxLength={100}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="category-copy-footer">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isCopying}
          >
            Cancel
          </button>
          {selectedListId && categories.length > 0 && (
            <button
              className="btn btn-primary"
              onClick={handleCopy}
              disabled={isCopying || selectedCount === 0}
            >
              {isCopying
                ? 'Copying...'
                : `Copy ${selectedCount} Categor${selectedCount === 1 ? 'y' : 'ies'}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
