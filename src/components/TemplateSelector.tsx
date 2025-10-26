import { useState, useMemo } from 'react';
import type { ListTemplate } from '../types';
import { LIST_TEMPLATES } from '../data/listTemplates';
import './TemplateSelector.css';

interface TemplateSelectorProps {
  onSelectTemplate: (template: ListTemplate) => void;
  onClose: () => void;
}

export function TemplateSelector({ onSelectTemplate, onClose }: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ListTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter templates based on search query
  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) {
      return LIST_TEMPLATES;
    }

    const query = searchQuery.toLowerCase();
    return LIST_TEMPLATES.filter(template =>
      template.name.toLowerCase().includes(query) ||
      template.description.toLowerCase().includes(query) ||
      template.items.some(item => item.name.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const handleTemplateClick = (template: ListTemplate) => {
    setSelectedTemplate(template);
  };

  const handleConfirm = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="template-selector-backdrop" onClick={handleBackdropClick}>
      <div className="template-selector-modal">
        <div className="template-selector-header">
          <h2>Choose a Template</h2>
          <button
            className="btn-close"
            onClick={onClose}
            aria-label="Close template selector"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="template-selector-content">
          <p className="template-selector-description">
            Start your list with pre-populated items from a template. You can add, remove, or modify items after creating the list.
          </p>

          <div className="template-search">
            <input
              type="text"
              className="template-search-input"
              placeholder="Search templates by name, description, or items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search templates"
            />
            {searchQuery && (
              <button
                className="template-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {filteredTemplates.length === 0 ? (
            <div className="template-no-results">
              <p>No templates found matching "{searchQuery}"</p>
              <button className="btn btn-secondary" onClick={() => setSearchQuery('')}>
                Clear Search
              </button>
            </div>
          ) : (
            <div className="template-grid">
              {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                onClick={() => handleTemplateClick(template)}
              >
                <div className="template-icon">{template.icon}</div>
                <h3 className="template-name">{template.name}</h3>
                <p className="template-description">{template.description}</p>
                <div className="template-item-count">
                  {template.items.length} items
                </div>
              </div>
            ))}
            </div>
          )}

          {selectedTemplate && (
            <div className="template-preview">
              <h3>Preview: {selectedTemplate.name}</h3>
              <div className="template-preview-items">
                {selectedTemplate.items.slice(0, 5).map((item, index) => (
                  <div key={index} className="template-preview-item">
                    <span className="preview-item-name">{item.name}</span>
                    <span className="preview-item-quantity">x{item.quantity}</span>
                    <span className="preview-item-category">{item.category}</span>
                  </div>
                ))}
                {selectedTemplate.items.length > 5 && (
                  <div className="template-preview-more">
                    + {selectedTemplate.items.length - 5} more items
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="template-selector-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={!selectedTemplate}
          >
            Use This Template
          </button>
        </div>
      </div>
    </div>
  );
}
