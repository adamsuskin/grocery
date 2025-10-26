/**
 * ImportList Component
 *
 * Provides a user interface for importing grocery lists from files.
 * Supports JSON, CSV, and plain text formats with preview and validation.
 */

import { useState, useRef } from 'react';
import { importList, type ImportResult } from '../utils/listImport';
import { useListMutations } from '../zero-store';
import './ImportList.css';

interface ImportListProps {
  onClose: () => void;
  onImportComplete?: (listId: string) => void;
}

type ImportStep = 'select' | 'preview' | 'importing' | 'complete';

export function ImportList({ onClose, onImportComplete }: ImportListProps) {
  const [step, setStep] = useState<ImportStep>('select');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [listName, setListName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createListFromTemplate } = useListMutations();

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);

    try {
      // Parse and validate the file
      const result = await importList(file);
      setImportResult(result);

      if (result.success) {
        setListName(result.listName);
        setStep('preview');
      } else {
        setImportError(result.errors.join('\n'));
        setStep('select');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to read file';
      setImportError(message);
      setStep('select');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle drag and drop
  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    // Simulate file input change
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    if (fileInputRef.current) {
      fileInputRef.current.files = dataTransfer.files;
      handleFileSelect({ target: fileInputRef.current } as any);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  // Handle import confirmation
  const handleImport = async () => {
    if (!importResult || !listName.trim()) return;

    setStep('importing');
    setImportError(null);

    try {
      // Create the list with imported items
      const listId = await createListFromTemplate(
        listName.trim(),
        importResult.items,
        undefined, // Use default color
        undefined  // Use default icon
      );

      setStep('complete');

      // Call callback after a short delay to show success message
      setTimeout(() => {
        onImportComplete?.(listId);
      }, 1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create list';
      setImportError(message);
      setStep('preview');
    }
  };

  // Reset and start over
  const handleStartOver = () => {
    setStep('select');
    setImportResult(null);
    setListName('');
    setImportError(null);
  };

  // Render file selection step
  const renderSelectStep = () => (
    <div className="import-step import-select">
      <div className="import-header">
        <h2>Import List</h2>
        <button className="btn-close" onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="import-body">
        <div
          className="file-drop-zone"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="drop-zone-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
          </div>
          <h3>Drop a file here or click to browse</h3>
          <p className="file-format-info">
            Supported formats: JSON, CSV, TXT (max 5MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv,.txt"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        {importError && (
          <div className="import-error">
            <div className="error-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="error-content">
              <h4>Import Error</h4>
              <pre>{importError}</pre>
            </div>
          </div>
        )}

        <div className="format-guide">
          <h4>Format Guide</h4>
          <div className="format-examples">
            <div className="format-example">
              <h5>JSON Format</h5>
              <pre>{`{
  "name": "Weekly Groceries",
  "items": [
    {
      "name": "Milk",
      "quantity": 2,
      "category": "Dairy",
      "notes": "Whole milk"
    }
  ]
}`}</pre>
            </div>

            <div className="format-example">
              <h5>CSV Format</h5>
              <pre>{`name,quantity,category,notes
Milk,2,Dairy,Whole milk
Apples,6,Produce,`}</pre>
            </div>

            <div className="format-example">
              <h5>Plain Text Format</h5>
              <pre>{`Milk
2 Apples
3x Bananas`}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render preview step
  const renderPreviewStep = () => {
    if (!importResult) return null;

    return (
      <div className="import-step import-preview">
        <div className="import-header">
          <h2>Preview Import</h2>
          <button className="btn-close" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="import-body">
          <div className="preview-summary">
            <div className="summary-card">
              <div className="summary-icon success">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="summary-content">
                <h4>{importResult.items.length} Items Ready</h4>
                <p>Review and import your list</p>
              </div>
            </div>
          </div>

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
            />
          </div>

          {importResult.warnings.length > 0 && (
            <div className="import-warnings">
              <div className="warning-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="warning-content">
                <h4>Warnings</h4>
                <ul>
                  {importResult.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {importResult.errors.length > 0 && (
            <div className="import-errors">
              <div className="error-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className="error-content">
                <h4>Some items could not be imported</h4>
                <ul>
                  {importResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="preview-items">
            <h4>Items ({importResult.items.length})</h4>
            <div className="preview-items-list">
              {importResult.items.map((item, index) => (
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

        <div className="import-footer">
          <button className="btn btn-secondary" onClick={handleStartOver}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleImport}
            disabled={!listName.trim()}
          >
            Import List
          </button>
        </div>
      </div>
    );
  };

  // Render importing step
  const renderImportingStep = () => (
    <div className="import-step import-importing">
      <div className="import-header">
        <h2>Importing List</h2>
      </div>

      <div className="import-body">
        <div className="importing-spinner">
          <div className="loading-spinner-large"></div>
          <h3>Creating your list...</h3>
          <p>Please wait while we import your items</p>
        </div>
      </div>
    </div>
  );

  // Render complete step
  const renderCompleteStep = () => (
    <div className="import-step import-complete">
      <div className="import-header">
        <h2>Import Complete</h2>
      </div>

      <div className="import-body">
        <div className="complete-message">
          <div className="complete-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h3>List Imported Successfully!</h3>
          <p>Your list has been created with {importResult?.items.length || 0} items</p>
        </div>
      </div>

      <div className="import-footer">
        <button className="btn btn-primary" onClick={onClose}>
          View List
        </button>
      </div>
    </div>
  );

  // Render current step
  const renderStep = () => {
    switch (step) {
      case 'select':
        return renderSelectStep();
      case 'preview':
        return renderPreviewStep();
      case 'importing':
        return renderImportingStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return renderSelectStep();
    }
  };

  return (
    <div className="import-list-overlay">
      <div className="import-list-modal">
        {renderStep()}
      </div>
    </div>
  );
}
