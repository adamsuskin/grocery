/**
 * CustomCategoryManager with i18n Support - Integration Example
 *
 * This file demonstrates how to integrate internationalization (i18n)
 * into the CustomCategoryManager component.
 *
 * Key Changes from Original:
 * 1. Import useTranslation hook from utils/i18n
 * 2. Replace all hardcoded strings with t() function calls
 * 3. Add language selector to UI (optional)
 * 4. Handle pluralization for dynamic messages
 *
 * To use this in your application:
 * 1. Replace the content of CustomCategoryManager.tsx with this file
 * 2. Or merge the changes into your existing component
 */

import { useState, useEffect, FormEvent, useCallback } from 'react';
import { useCustomCategories, useCustomCategoryMutations } from '../hooks/useCustomCategories';
import { CATEGORIES, type PermissionLevel } from '../types';
import { validateCategoryFields } from '../utils/categoryValidation';
import {
  logCategoryCreated,
  logCategoryEdited,
  logCategoryDeleted,
} from '../utils/categoryAnalytics';
import { ColorPicker } from './ColorPicker';
import { EmojiPicker } from './EmojiPicker';
import { useTranslation } from '../utils/i18n';
import './CustomCategoryManager.css';

interface CustomCategoryManagerProps {
  listId: string;
  onClose: () => void;
  permissionLevel?: PermissionLevel | null;
}

export function CustomCategoryManager({ listId, onClose, permissionLevel }: CustomCategoryManagerProps) {
  // Initialize translation hook
  const { t, language, setLanguage, availableLanguages } = useTranslation();

  const canEdit = permissionLevel === 'owner' || permissionLevel === 'editor';

  const categories = useCustomCategories(listId);
  const {
    addCustomCategory,
    updateCustomCategory,
    deleteCustomCategory,
    deleteMultipleCategories,
    updateMultipleCategories,
    mergeCategories,
    exportCategories,
  } = useCustomCategoryMutations();

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#4CAF50');
  const [newCategoryIcon, setNewCategoryIcon] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editIcon, setEditIcon] = useState('');

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>('');
  const [showBulkColorPicker, setShowBulkColorPicker] = useState(false);
  const [bulkColor, setBulkColor] = useState('#4CAF50');
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState<string>('');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !deletingId && !showBulkDeleteConfirm && !showMergeDialog) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, deletingId, showBulkDeleteConfirm, showMergeDialog]);

  const validateCategory = useCallback((
    name: string,
    color?: string,
    icon?: string,
    excludeId?: string
  ): string | null => {
    const validationErrors = validateCategoryFields(
      { name, color, icon },
      categories,
      excludeId
    );
    // Translate validation errors
    const firstError = validationErrors.name || validationErrors.color || validationErrors.icon;
    return firstError ? t(firstError as any) : null;
  }, [categories, t]);

  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateCategory(newCategoryName, newCategoryColor, newCategoryIcon);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsAdding(true);

    try {
      await addCustomCategory(
        {
          name: newCategoryName.trim(),
          listId,
          color: newCategoryColor || undefined,
          icon: newCategoryIcon.trim() || undefined,
        },
        categories
      );

      logCategoryCreated(listId, newCategoryName.trim(), {
        color: newCategoryColor || undefined,
        icon: newCategoryIcon.trim() || undefined,
      });

      setSuccessMessage(t('categories.messages.categoryAdded'));
      setNewCategoryName('');
      setNewCategoryColor('#4CAF50');
      setNewCategoryIcon('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('categories.errors.failedToAdd'));
    } finally {
      setIsAdding(false);
    }
  };

  const handleStartEdit = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      setEditingId(categoryId);
      setEditName(category.name);
      setEditColor(category.color || '#4CAF50');
      setEditIcon(category.icon || '');
      setError(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditColor('');
    setEditIcon('');
    setError(null);
  };

  const handleSaveEdit = async (categoryId: string) => {
    setError(null);

    const validationError = validateCategory(editName, editColor, editIcon, categoryId);

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const oldCategory = categories.find(c => c.id === categoryId);

      await updateCustomCategory(
        {
          id: categoryId,
          name: editName.trim(),
          color: editColor || undefined,
          icon: editIcon.trim() || undefined,
        },
        categories
      );

      if (oldCategory) {
        logCategoryEdited(listId, editName.trim(), {
          oldName: oldCategory.name !== editName.trim() ? oldCategory.name : undefined,
          newName: oldCategory.name !== editName.trim() ? editName.trim() : undefined,
          colorChanged: oldCategory.color !== editColor,
          iconChanged: oldCategory.icon !== editIcon.trim(),
        });
      }

      setSuccessMessage(t('categories.messages.categoryUpdated'));
      handleCancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('categories.errors.failedToUpdate'));
    }
  };

  const handleStartDelete = (categoryId: string) => {
    setDeletingId(categoryId);
    setError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;

    const categoryToDelete = categories.find(c => c.id === deletingId);

    setIsDeleting(true);
    setError(null);

    try {
      await deleteCustomCategory(deletingId);

      if (categoryToDelete) {
        logCategoryDeleted(listId, categoryToDelete.name);
      }

      setSuccessMessage(t('categories.messages.categoryDeleted'));
      setDeletingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('categories.errors.failedToDelete'));
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeletingId(null);
  };

  const handleToggleSelect = (categoryId: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId);
    } else {
      newSelected.add(categoryId);
    }
    setSelectedCategories(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedCategories.size === categories.length) {
      setSelectedCategories(new Set());
    } else {
      setSelectedCategories(new Set(categories.map(c => c.id)));
    }
  };

  const handleBulkAction = async () => {
    if (selectedCategories.size === 0) {
      setError(t('categories.errors.selectAtLeastOne'));
      return;
    }

    switch (bulkAction) {
      case 'delete':
        setShowBulkDeleteConfirm(true);
        break;
      case 'changeColor':
        setShowBulkColorPicker(true);
        break;
      case 'export':
        await handleExportCategories();
        break;
      case 'merge':
        setShowMergeDialog(true);
        break;
      default:
        setError(t('categories.errors.selectBulkAction'));
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true);
    setError(null);

    try {
      const categoryIds = Array.from(selectedCategories);
      await deleteMultipleCategories(categoryIds);

      const count = categoryIds.length;
      const categories = count === 1 ? 'category' : 'categories';
      setSuccessMessage(t('categories.messages.bulkDeleted', { count, categories }));
      setSelectedCategories(new Set());
      setShowBulkDeleteConfirm(false);
      setBulkAction('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('categories.errors.failedToDelete'));
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkColorChange = async () => {
    setIsBulkProcessing(true);
    setError(null);

    try {
      const updates = Array.from(selectedCategories).map(id => ({
        id,
        changes: { color: bulkColor }
      }));

      await updateMultipleCategories(updates);

      const count = updates.length;
      const categories = count === 1 ? 'category' : 'categories';
      setSuccessMessage(t('categories.messages.bulkUpdated', { count, categories }));
      setSelectedCategories(new Set());
      setShowBulkColorPicker(false);
      setBulkAction('');
      setBulkColor('#4CAF50');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('categories.errors.failedToUpdate'));
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleExportCategories = async () => {
    setError(null);

    try {
      const categoryIds = Array.from(selectedCategories);
      const json = await exportCategories(categoryIds);

      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `custom-categories-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const count = categoryIds.length;
      const categories = count === 1 ? 'category' : 'categories';
      setSuccessMessage(t('categories.messages.bulkExported', { count, categories }));
      setSelectedCategories(new Set());
      setBulkAction('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('categories.errors.failedToAdd'));
    }
  };

  const handleMergeCategories = async () => {
    if (!mergeTargetId) {
      setError(t('categories.errors.selectTargetCategory'));
      return;
    }

    if (selectedCategories.has(mergeTargetId)) {
      setError(t('categories.errors.targetCannotBeSelected'));
      return;
    }

    setIsBulkProcessing(true);
    setError(null);

    try {
      const sourceIds = Array.from(selectedCategories);
      await mergeCategories(sourceIds, mergeTargetId);

      const count = sourceIds.length;
      const categories = count === 1 ? 'category' : 'categories';
      setSuccessMessage(t('categories.messages.bulkMerged', { count, categories }));
      setSelectedCategories(new Set());
      setShowMergeDialog(false);
      setBulkAction('');
      setMergeTargetId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('categories.errors.failedToUpdate'));
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const deletingCategory = deletingId ? categories.find(c => c.id === deletingId) : null;
  const availableTargets = categories.filter(c => !selectedCategories.has(c.id));

  return (
    <div className="category-manager-overlay" onClick={onClose}>
      <div className="category-manager-modal" onClick={(e) => e.stopPropagation()}>
        <div className="category-manager-header">
          <h2>{t('categories.ui.manageCustomCategories')}</h2>
          {/* Optional: Language Selector */}
          <div className="language-selector">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="language-select"
            >
              {availableLanguages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName}
                </option>
              ))}
            </select>
          </div>
          <button className="btn-close" onClick={onClose} aria-label={t('categories.ui.close')}>
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
        {successMessage && (
          <div className="message message-success">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {successMessage}
          </div>
        )}

        <div className="category-manager-body">
          {!canEdit && (
            <div className="permission-notice">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{t('categories.ui.viewOnlyDescription')}</span>
            </div>
          )}

          {canEdit && (
            <section className="category-section">
              <h3>{t('categories.ui.addNewCategory')}</h3>
              <form onSubmit={handleAddCategory} className="category-form">
                <div className="form-group form-group-full">
                  <label htmlFor="category-name">
                    {t('categories.ui.categoryName')} *
                  </label>
                  <input
                    id="category-name"
                    type="text"
                    className="input"
                    placeholder={t('categories.help.categoryNameHelp')}
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    disabled={isAdding}
                    maxLength={100}
                    required
                  />
                </div>

                <div className="form-group">
                  <EmojiPicker
                    value={newCategoryIcon}
                    onChange={setNewCategoryIcon}
                    label={t('categories.ui.icon')}
                    disabled={isAdding}
                  />
                </div>

                <div className="form-group">
                  <ColorPicker
                    value={newCategoryColor}
                    onChange={setNewCategoryColor}
                    label={`${t('categories.ui.color')} (${t('categories.ui.optional')})`}
                    disabled={isAdding}
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={isAdding}>
                  {isAdding ? t('categories.ui.adding') : t('categories.ui.addCategory')}
                </button>
              </form>
            </section>
          )}

          <section className="category-section">
            <h3>{t('categories.ui.predefinedCategories')}</h3>
            <p className="section-description">
              {t('categories.ui.predefinedDescription')}
            </p>
            <div className="predefined-categories">
              {CATEGORIES.map((category) => (
                <div key={category} className="category-item predefined-category">
                  <div className="category-info">
                    <span className="category-name">{t(`categories.predefined.${category}` as any)}</span>
                    <span className="category-badge">{t('categories.ui.builtIn')}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="category-section">
            <div className="category-section-header">
              <h3>{t('categories.ui.yourCustomCategories')}</h3>
              {canEdit && categories.length > 0 && (
                <div className="bulk-operations-toolbar">
                  <label className="select-all-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedCategories.size === categories.length && categories.length > 0}
                      onChange={handleSelectAll}
                    />
                    <span>{t('categories.ui.selectAll')} ({selectedCategories.size})</span>
                  </label>
                  {selectedCategories.size > 0 && (
                    <div className="bulk-actions">
                      <select
                        className="bulk-action-select"
                        value={bulkAction}
                        onChange={(e) => setBulkAction(e.target.value)}
                      >
                        <option value="">{t('categories.ui.chooseAction')}</option>
                        <option value="delete">{t('categories.ui.deleteSelected')}</option>
                        <option value="changeColor">{t('categories.ui.changeColor')}</option>
                        <option value="export">{t('categories.ui.exportSelected')}</option>
                        {selectedCategories.size > 1 && (
                          <option value="merge">{t('categories.ui.mergeCategories')}</option>
                        )}
                      </select>
                      <button
                        className="btn btn-small btn-primary"
                        onClick={handleBulkAction}
                        disabled={!bulkAction}
                      >
                        {t('categories.ui.apply')}
                      </button>
                    </div>
                  )}
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
                <p>{t('categories.ui.noCategoriesYet')}</p>
                {canEdit ? (
                  <p className="empty-hint">{t('categories.ui.createFirstCategory')}</p>
                ) : (
                  <p className="empty-hint">{t('categories.ui.noCategoriesYet')}</p>
                )}
              </div>
            ) : (
              <div className="custom-categories">
                {categories.map((category) => {
                  const isEditing = editingId === category.id;
                  const isSelected = selectedCategories.has(category.id);

                  return (
                    <div key={category.id} className={`category-item custom-category ${isSelected ? 'selected' : ''}`}>
                      {isEditing ? (
                        <div className="category-edit-form">
                          <div className="form-group form-group-full">
                            <label htmlFor={`edit-name-${category.id}`}>
                              {t('categories.ui.categoryName')}
                            </label>
                            <input
                              id={`edit-name-${category.id}`}
                              type="text"
                              className="input"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              maxLength={100}
                              autoFocus
                            />
                          </div>

                          <div className="form-group">
                            <EmojiPicker
                              value={editIcon}
                              onChange={setEditIcon}
                              label={t('categories.ui.icon')}
                            />
                          </div>

                          <div className="form-group">
                            <ColorPicker
                              value={editColor}
                              onChange={setEditColor}
                              label={t('categories.ui.color')}
                            />
                          </div>

                          <div className="category-actions">
                            <button
                              className="btn btn-small btn-primary"
                              onClick={() => handleSaveEdit(category.id)}
                            >
                              {t('categories.ui.save')}
                            </button>
                            <button
                              className="btn btn-small btn-secondary"
                              onClick={handleCancelEdit}
                            >
                              {t('categories.ui.cancel')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {canEdit && (
                            <div className="category-checkbox">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelect(category.id)}
                                aria-label={`${t('categories.ui.selectAll')} ${category.name}`}
                              />
                            </div>
                          )}
                          <div className="category-info">
                            <div className="category-visual">
                              {category.icon && (
                                <span className="category-icon">{category.icon}</span>
                              )}
                              {category.color && (
                                <span
                                  className="category-color-preview"
                                  style={{ backgroundColor: category.color }}
                                  title={`${t('categories.ui.color')}: ${category.color}`}
                                />
                              )}
                            </div>
                            <span className="category-name">{category.name}</span>
                          </div>

                          {canEdit && (
                            <div className="category-actions">
                              <button
                                className="btn btn-icon"
                                onClick={() => handleStartEdit(category.id)}
                                title={t('categories.ui.editCategory')}
                                aria-label={`${t('categories.ui.edit')} ${category.name}`}
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button
                                className="btn btn-icon btn-danger"
                                onClick={() => handleStartDelete(category.id)}
                                title={t('categories.ui.deleteCategory')}
                                aria-label={`${t('categories.ui.delete')} ${category.name}`}
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  <line x1="10" y1="11" x2="10" y2="17" />
                                  <line x1="14" y1="11" x2="14" y2="17" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deletingCategory && (
        <div className="confirmation-overlay" onClick={handleCancelDelete}>
          <div className="confirmation-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>{t('categories.confirmations.deleteTitle')}</h3>
            <div className="confirmation-content">
              <p className="confirmation-message">
                {t('categories.confirmations.deleteMessage', { name: deletingCategory.name })}
              </p>
              <p className="confirmation-warning">
                {t('categories.confirmations.deleteWarning')}
              </p>
            </div>
            <div className="confirmation-actions">
              <button
                className="btn btn-secondary"
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                {t('categories.ui.cancel')}
              </button>
              <button
                className="btn btn-danger"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? t('categories.ui.deleting') : t('categories.ui.deleteCategory')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation */}
      {showBulkDeleteConfirm && (
        <div className="confirmation-overlay" onClick={() => setShowBulkDeleteConfirm(false)}>
          <div className="confirmation-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>{t('categories.confirmations.bulkDeleteTitle')}</h3>
            <div className="confirmation-content">
              <p className="confirmation-message">
                {t('categories.confirmations.bulkDeleteMessage', {
                  count: selectedCategories.size,
                  categories: selectedCategories.size === 1 ? 'category' : 'categories'
                })}
              </p>
              <p className="confirmation-warning">
                {t('categories.confirmations.bulkDeleteWarning')}
              </p>
            </div>
            <div className="confirmation-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowBulkDeleteConfirm(false)}
                disabled={isBulkProcessing}
              >
                {t('categories.ui.cancel')}
              </button>
              <button
                className="btn btn-danger"
                onClick={handleBulkDelete}
                disabled={isBulkProcessing}
              >
                {isBulkProcessing ? t('categories.ui.deleting') : t('categories.ui.deleteSelected')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Color Picker */}
      {showBulkColorPicker && (
        <div className="confirmation-overlay" onClick={() => setShowBulkColorPicker(false)}>
          <div className="confirmation-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>{t('categories.confirmations.changeColorTitle')}</h3>
            <div className="confirmation-content">
              <p className="confirmation-message">
                {t('categories.confirmations.changeColorMessage', {
                  count: selectedCategories.size,
                  categories: selectedCategories.size === 1 ? 'category' : 'categories'
                })}
              </p>
              <div className="bulk-color-picker">
                <ColorPicker
                  value={bulkColor}
                  onChange={setBulkColor}
                  label={t('categories.ui.color')}
                />
              </div>
            </div>
            <div className="confirmation-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowBulkColorPicker(false)}
                disabled={isBulkProcessing}
              >
                {t('categories.ui.cancel')}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleBulkColorChange}
                disabled={isBulkProcessing}
              >
                {isBulkProcessing ? t('categories.ui.adding') : t('categories.ui.changeColor')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merge Dialog */}
      {showMergeDialog && (
        <div className="confirmation-overlay" onClick={() => setShowMergeDialog(false)}>
          <div className="confirmation-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>{t('categories.confirmations.mergeTitle')}</h3>
            <div className="confirmation-content">
              <p className="confirmation-message">
                {t('categories.confirmations.mergeMessage', {
                  count: selectedCategories.size,
                  categories: selectedCategories.size === 1 ? 'category' : 'categories'
                })}
              </p>
              <p className="confirmation-warning">
                {t('categories.confirmations.mergeWarning')}
              </p>
              <div className="merge-target-select">
                <label htmlFor="merge-target">{t('categories.ui.categoryName')} *</label>
                <select
                  id="merge-target"
                  className="input"
                  value={mergeTargetId}
                  onChange={(e) => setMergeTargetId(e.target.value)}
                >
                  <option value="">{t('categories.ui.chooseAction')}</option>
                  {availableTargets.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon && `${cat.icon} `}{cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="confirmation-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowMergeDialog(false)}
                disabled={isBulkProcessing}
              >
                {t('categories.ui.cancel')}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleMergeCategories}
                disabled={isBulkProcessing || !mergeTargetId}
              >
                {isBulkProcessing ? t('categories.ui.adding') : t('categories.ui.mergeCategories')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
