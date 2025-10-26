import { useState, useRef, useEffect } from 'react';
import type { ListWithMembers, ListTemplate } from '../types';
import { MemberAvatars } from './MemberAvatars';
import type { MemberInfo } from './MemberAvatars';
import { PermissionBadge } from './PermissionBadge';
import { TemplateSelector } from './TemplateSelector';
import { createArrowNavigationHandler } from '../utils/keyboardShortcuts';
import { ListSelectorSkeleton } from './ListSkeleton';
import './ListSelector.css';

interface ListSelectorProps {
  lists: ListWithMembers[];
  currentListId: string | null;
  onListChange: (listId: string) => void;
  onCreateList: () => void;
  onCreateFromTemplate: (template: ListTemplate) => void;
  onManageList: (listId: string) => void;
  loading?: boolean;
}

/**
 * Utility function to adjust color brightness
 */
function adjustColorBrightness(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;

  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

export function ListSelector({
  lists,
  currentListId,
  onListChange,
  onCreateList,
  onCreateFromTemplate,
  onManageList,
  loading = false,
}: ListSelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentList = lists.find((list) => list.id === currentListId);

  // Update selected index when current list changes
  useEffect(() => {
    const index = lists.findIndex((list) => list.id === currentListId);
    if (index !== -1) {
      setSelectedIndex(index);
    }
  }, [currentListId, lists]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Keyboard navigation for dropdown
  useEffect(() => {
    if (!isDropdownOpen || lists.length === 0) return;

    const handler = createArrowNavigationHandler({
      items: lists,
      selectedIndex,
      onSelect: setSelectedIndex,
      onConfirm: () => {
        if (lists[selectedIndex]) {
          handleListSelect(lists[selectedIndex].id);
        }
      },
      enabled: true,
    });

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isDropdownOpen, lists, selectedIndex]);

  const handleListSelect = (listId: string) => {
    onListChange(listId);
    setIsDropdownOpen(false);
  };

  const handleManageClick = (e: React.MouseEvent, listId: string) => {
    e.stopPropagation();
    onManageList(listId);
    setIsDropdownOpen(false);
  };

  const handleCreateClick = () => {
    onCreateList();
    setIsDropdownOpen(false);
  };

  const handleCreateFromTemplateClick = () => {
    setShowTemplateSelector(true);
    setIsDropdownOpen(false);
  };

  const handleTemplateSelect = (template: ListTemplate) => {
    onCreateFromTemplate(template);
    setShowTemplateSelector(false);
  };

  const handleTemplateClose = () => {
    setShowTemplateSelector(false);
  };

  if (loading) {
    return <ListSelectorSkeleton />;
  }

  if (lists.length === 0) {
    return (
      <>
        <div className="list-selector">
          <div className="no-lists-state">
            <p>You don't have any lists yet</p>
            <div className="no-lists-actions">
              <button onClick={onCreateList} className="btn btn-primary">
                Create Blank List
              </button>
              <button onClick={handleCreateFromTemplateClick} className="btn btn-secondary">
                Use a Template
              </button>
            </div>
          </div>
        </div>
        {showTemplateSelector && (
          <TemplateSelector
            onSelectTemplate={handleTemplateSelect}
            onClose={handleTemplateClose}
          />
        )}
      </>
    );
  }

  return (
    <div className="list-selector" ref={dropdownRef}>
      <div className="list-selector-header">
        <button
          className="list-selector-button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          aria-expanded={isDropdownOpen}
          aria-haspopup="listbox"
        >
          <div className="list-selector-current">
            <div
              className="list-icon"
              style={
                currentList
                  ? {
                      background: `linear-gradient(135deg, ${currentList.color}, ${adjustColorBrightness(currentList.color, -20)})`,
                    }
                  : undefined
              }
            >
              {currentList ? (
                <span className="list-emoji">{currentList.icon}</span>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              )}
            </div>
            <div className="list-info">
              <div className="list-name">{currentList?.name || 'Select a list'}</div>
              {currentList && (
                <div className="list-meta">
                  {currentList.memberCount} member{currentList.memberCount !== 1 ? 's' : ''}
                  {currentList.currentUserPermission && (
                    <>
                      {' • '}
                      <PermissionBadge
                        permission={currentList.currentUserPermission}
                        size="small"
                        showIcon={false}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
            {currentList?.members && currentList.members.length > 0 && (
              <MemberAvatars
                members={currentList.members as MemberInfo[]}
                maxVisible={3}
                size="small"
                onShowAll={() => onManageList(currentList.id)}
              />
            )}
          </div>
          <svg
            className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        </button>

        {currentList && (
          <button
            className="btn-manage-list"
            onClick={(e) => handleManageClick(e, currentList.id)}
            title="Manage list settings"
            aria-label="Manage list settings"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6m8.66-10l-5.2 3m-6.92 4l-5.2 3m0-12l5.2 3m6.92 4l5.2 3" />
            </svg>
          </button>
        )}
      </div>

      {isDropdownOpen && (
        <div className="list-dropdown" role="listbox">
          <div className="list-dropdown-header">
            <span className="list-dropdown-title">Your Lists</span>
            <div className="list-dropdown-actions">
              <button className="btn-create-list-dropdown" onClick={handleCreateClick}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" />
                </svg>
                New List
              </button>
              <button className="btn-template-dropdown" onClick={handleCreateFromTemplateClick}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="10" height="10" rx="2" />
                  <path d="M6 7h4M6 10h4" />
                </svg>
                Template
              </button>
            </div>
          </div>

          <div className="list-dropdown-items">
            {lists.map((list, index) => (
              <button
                key={list.id}
                className={`list-dropdown-item ${list.id === currentListId ? 'active' : ''} ${index === selectedIndex ? 'highlighted' : ''}`}
                onClick={() => handleListSelect(list.id)}
                onMouseEnter={() => setSelectedIndex(index)}
                role="option"
                aria-selected={list.id === currentListId}
              >
                <div
                  className="list-dropdown-icon"
                  style={{
                    background: `linear-gradient(135deg, ${list.color}, ${adjustColorBrightness(list.color, -20)})`,
                  }}
                >
                  <span className="list-emoji">{list.icon}</span>
                </div>
                <div className="list-dropdown-item-content">
                  <div className="list-dropdown-item-name">{list.name}</div>
                  <div className="list-dropdown-item-meta">
                    {list.members && list.members.length > 0 && (
                      <MemberAvatars
                        members={list.members as MemberInfo[]}
                        maxVisible={3}
                        size="small"
                      />
                    )}
                    <span className="member-count">
                      {list.memberCount} member{list.memberCount !== 1 ? 's' : ''}
                    </span>
                    <span className="permission-badge permission-{list.currentUserPermission}">
                      {list.currentUserPermission}
                    </span>
                  </div>
                </div>
                <button
                  className="btn-manage-dropdown"
                  onClick={(e) => handleManageClick(e, list.id)}
                  title="Manage list"
                  aria-label={`Manage ${list.name}`}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="8" cy="3" r="1.5" />
                    <circle cx="8" cy="8" r="1.5" />
                    <circle cx="8" cy="13" r="1.5" />
                  </svg>
                </button>
              </button>
            ))}
          </div>
        </div>
      )}

      {showTemplateSelector && (
        <TemplateSelector
          onSelectTemplate={handleTemplateSelect}
          onClose={handleTemplateClose}
        />
      )}
    </div>
  );
}
