import { useState, useMemo } from 'react';
import { useGroceryLists, useListMembers, useGroceryItems, useListMutations } from '../zero-store';
import { useAuth } from '../contexts/AuthContext';
import { ImportList } from './ImportList';
import { ListActions } from './ListActions';
import { apiClient } from '../utils/api';
import { ListDashboardSkeleton } from './ListSkeleton';
import './ListDashboard.css';

interface ListDashboardProps {
  onSelectList: (listId: string) => void;
}

export function ListDashboard({ onSelectList }: ListDashboardProps) {
  const { user } = useAuth();
  const lists = useGroceryLists();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [pinnedListIds, setPinnedListIds] = useState<Set<string>>(new Set());
  const { createList } = useListMutations();

  // Separate lists into pinned and unpinned
  const { pinnedLists, unpinnedLists } = useMemo(() => {
    const pinned = lists.filter(list => pinnedListIds.has(list.id));
    const unpinned = lists.filter(list => !pinnedListIds.has(list.id));
    return { pinnedLists: pinned, unpinnedLists: unpinned };
  }, [lists, pinnedListIds]);

  // Loading state - this will be empty array initially while Zero loads
  const isLoading = lists.length === 0;

  const handleCreateList = async () => {
    if (!newListName.trim()) return;

    setIsCreating(true);
    try {
      const listId = await createList(newListName.trim());
      setNewListName('');
      // Optionally navigate to the new list
      onSelectList(listId);
    } catch (error) {
      console.error('Failed to create list:', error);
      alert('Failed to create list. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateList();
    }
  };

  const handleImportComplete = (listId: string) => {
    setShowImport(false);
    onSelectList(listId);
  };

  // List action handlers
  const handleExportList = (listId: string) => {
    const list = lists.find(l => l.id === listId);
    if (!list) return;

    // TODO: Implement full export functionality
    alert(`Export feature for "${list.name}" will be implemented soon!`);
  };

  const handleShareList = (listId: string) => {
    // Navigate to list view where ShareListModal can be opened
    onSelectList(listId);
  };

  const handleDuplicateList = async (listId: string) => {
    const list = lists.find(l => l.id === listId);
    if (!list) return;

    try {
      // TODO: Implement duplicate functionality by fetching items from the list
      // For now, just create an empty copy
      const newListName = `${list.name} (Copy)`;
      await createList(newListName, list.color, list.icon);
      alert(`Successfully duplicated "${list.name}" (without items for now)`);
    } catch (error) {
      console.error('Failed to duplicate list:', error);
      alert('Failed to duplicate list. Please try again.');
    }
  };

  const handleArchiveList = (listId: string) => {
    // TODO: Implement archive functionality
    const list = lists.find(l => l.id === listId);
    if (list) {
      alert(`Archive feature for "${list.name}" will be implemented soon!`);
    }
  };

  const handlePinList = async (listId: string, isPinned: boolean) => {
    try {
      if (isPinned) {
        // Unpin the list
        await apiClient.delete(`/lists/${listId}/unpin`);
        setPinnedListIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(listId);
          return newSet;
        });
      } else {
        // Pin the list
        await apiClient.post(`/lists/${listId}/pin`);
        setPinnedListIds(prev => new Set(prev).add(listId));
      }
    } catch (error) {
      console.error('Failed to toggle pin:', error);
      alert('Failed to update pin status. Please try again.');
    }
  };

  const handleManageCategories = (listId: string) => {
    // Navigate to list view where CustomCategoryManager modal can be opened
    // For now, just show a placeholder alert
    alert('Manage Categories feature will open the CustomCategoryManager modal. This requires integration with the list view.');
  };

  return (
    <div className="list-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title-section">
          <h2 className="dashboard-title">My Lists</h2>
          <p className="dashboard-subtitle">
            {lists.length === 0
              ? 'Create your first list to get started'
              : `You have ${lists.length} list${lists.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="dashboard-controls">
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
              aria-label="Grid view"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
              aria-label="List view"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <rect x="3" y="4" width="3" height="4" rx="1" fill="currentColor" />
                <rect x="3" y="10" width="3" height="4" rx="1" fill="currentColor" />
                <rect x="3" y="16" width="3" height="4" rx="1" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Create New List Section */}
      <div className="create-list-section">
        <input
          type="text"
          className="input create-list-input"
          placeholder="Enter list name..."
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isCreating}
        />
        <button
          className="btn btn-primary create-list-btn"
          onClick={handleCreateList}
          disabled={!newListName.trim() || isCreating}
        >
          {isCreating ? (
            <>
              <span className="btn-spinner"></span>
              Creating...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create List
            </>
          )}
        </button>
        <button
          className="btn btn-secondary import-list-btn"
          onClick={() => setShowImport(true)}
          title="Import list from file"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
          Import
        </button>
      </div>

      {/* Loading State */}
      {isLoading && lists.length === 0 && (
        <ListDashboardSkeleton count={6} viewMode={viewMode} />
      )}

      {/* Empty State */}
      {!isLoading && lists.length === 0 && (
        <div className="dashboard-empty">
          <div className="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              <line x1="12" y1="12" x2="12" y2="16" />
              <line x1="10" y1="14" x2="14" y2="14" />
            </svg>
          </div>
          <h3 className="empty-title">No lists yet</h3>
          <p className="empty-message">
            Create your first grocery list to start organizing your shopping.
          </p>
        </div>
      )}

      {/* Pinned Lists Section */}
      {!isLoading && pinnedLists.length > 0 && (
        <div className="lists-section">
          <h3 className="lists-section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
              <path d="M16 12V4H17V2H7V4H8V12L6 14V16H11.2V22H12.8V16H18V14L16 12Z" />
            </svg>
            Pinned Lists
          </h3>
          <div className={`lists-container ${viewMode}-view`}>
            {pinnedLists.map((list) => (
              <ListCard
                key={list.id}
                list={list}
                currentUserId={user?.id || ''}
                isPinned={true}
                onSelect={() => onSelectList(list.id)}
                onExport={handleExportList}
                onShare={handleShareList}
                onDuplicate={handleDuplicateList}
                onArchive={handleArchiveList}
                onPin={handlePinList}
                onManageCategories={handleManageCategories}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Lists Section */}
      {!isLoading && unpinnedLists.length > 0 && (
        <div className="lists-section">
          {pinnedLists.length > 0 && (
            <h3 className="lists-section-title">All Lists</h3>
          )}
          <div className={`lists-container ${viewMode}-view`}>
            {unpinnedLists.map((list) => (
              <ListCard
                key={list.id}
                list={list}
                currentUserId={user?.id || ''}
                isPinned={false}
                onSelect={() => onSelectList(list.id)}
                onExport={handleExportList}
                onShare={handleShareList}
                onDuplicate={handleDuplicateList}
                onArchive={handleArchiveList}
                onPin={handlePinList}
                onManageCategories={handleManageCategories}
              />
            ))}
          </div>
        </div>
      )}

      {/* Import List Modal */}
      {showImport && (
        <ImportList
          onClose={() => setShowImport(false)}
          onImportComplete={handleImportComplete}
        />
      )}
    </div>
  );
}

interface ListCardProps {
  list: {
    id: string;
    name: string;
    ownerId: string;
    color?: string;
    icon?: string;
    createdAt: number;
    updatedAt: number;
    isArchived?: boolean;
    archivedAt?: number;
  };
  currentUserId: string;
  isPinned: boolean;
  onSelect: () => void;
  onExport?: (listId: string) => void;
  onShare?: (listId: string) => void;
  onDuplicate?: (listId: string) => void;
  onArchive?: (listId: string) => void;
  onPin?: (listId: string, isPinned: boolean) => void;
  onManageCategories?: (listId: string) => void;
}

function ListCard({ list, currentUserId, isPinned, onSelect, onExport, onShare, onDuplicate, onArchive, onPin, onManageCategories }: ListCardProps) {
  // Ensure list has required properties for ListActions
  const normalizedList = {
    ...list,
    color: list.color || '#4CAF50',
    icon: list.icon || '🛒',
    isArchived: list.isArchived || false,
  };
  // Get members for this list
  const members = useListMembers(list.id);

  // Get items for this list to show count
  const items = useGroceryItems(list.id);

  // Determine current user's permission
  const currentMember = members.find(m => m.userId === currentUserId);
  const permission = currentMember?.permission || (list.ownerId === currentUserId ? 'owner' : 'viewer');

  const isOwner = list.ownerId === currentUserId;
  const itemCount = items.length;
  const memberCount = members.length;

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className={`list-card ${isPinned ? 'pinned' : ''}`} onClick={onSelect}>
      <div className="list-card-header">
        <div className="list-card-icon">
          {isPinned && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--primary-color)" className="pin-indicator">
              <path d="M16 12V4H17V2H7V4H8V12L6 14V16H11.2V22H12.8V16H18V14L16 12Z" />
            </svg>
          )}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <div className="list-card-badge-group">
          {isOwner && (
            <span className="owner-badge" title="You own this list">
              Owner
            </span>
          )}
          {!isOwner && (
            <span className={`permission-badge permission-${permission}`} title={`You are a ${permission}`}>
              {permission}
            </span>
          )}
        </div>
        <ListActions
          list={normalizedList}
          currentUserId={currentUserId}
          permission={permission}
          isPinned={isPinned}
          onExport={onExport}
          onShare={onShare}
          onDuplicate={onDuplicate}
          onArchive={onArchive}
          onPin={onPin}
          onManageCategories={onManageCategories}
        />
      </div>

      <div className="list-card-body">
        <h3 className="list-card-name">{list.name}</h3>

        <div className="list-card-stats">
          <div className="list-stat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 11V7a4 4 0 00-8 0v4M5 13h14l1 8H4l1-8z" />
            </svg>
            <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
          </div>

          <div className="list-stat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
            <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="list-card-footer">
          <span className="list-card-date">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Updated {formatDate(list.updatedAt)}
          </span>
        </div>
      </div>

      <div className="list-card-action">
        <span className="list-card-arrow">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </span>
      </div>
    </div>
  );
}
