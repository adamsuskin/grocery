import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import { useList } from './contexts/ListContext';
import { useSyncStatus, useConflicts } from './contexts/SyncContext';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { AddItemForm } from './components/AddItemForm';
import { GroceryList } from './components/GroceryList';
import { UserProfile } from './components/UserProfile';
import { ListSelector } from './components/ListSelector';
import { Notifications } from './components/Notifications';
import { SyncStatus } from './components/SyncStatus';
import { ConflictNotifications } from './components/ConflictNotification';
import { ConflictResolutionModal } from './components/ConflictResolutionModal';
import type { ConflictData } from './components/ConflictResolutionModal';
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp';
import ServiceWorkerUpdate from './components/ServiceWorkerUpdate';
import { NotificationPrompt } from './components/NotificationPrompt';
import { ListManagement } from './components/ListManagement';
import { ShareListModal } from './components/ShareListModal';
import { OnboardingTour } from './components/OnboardingTour';
import { ListErrorBoundary } from './components/ListErrorBoundary';
import { BudgetTracker } from './components/BudgetTracker';
import { useListMutations, useGroceryItems } from './zero-store';
import { useOnboardingTour } from './hooks/useOnboardingTour';
import type { FilterState, SortState, ListTemplate, PermissionLevel, ConflictResolution, GroceryItem } from './types';
import { CATEGORIES } from './types';
import { createShortcutHandler, type KeyboardShortcut } from './utils/keyboardShortcuts';
import './App.css';

type AuthView = 'login' | 'register';

function App() {
  const { isAuthenticated, loading, user } = useAuth();
  const { activeListId, currentList, loading: listLoading, error: listError, canEdit, userPermission } = useList();
  const {
    createList,
    createListFromTemplate,
    updateListName,
    updateListBudget,
    addListMember,
    updateMemberPermission,
    removeListMember,
    deleteList
  } = useListMutations();
  const { showTour, startTour, completeTour, skipTour } = useOnboardingTour();
  const groceryItems = useGroceryItems(activeListId || '');

  // Sync status and conflicts
  const syncStatus = useSyncStatus();
  const { conflicts, resolveConflict, dismissConflict } = useConflicts();

  const [authView, setAuthView] = useState<AuthView>('login');
  const [currentConflict, setCurrentConflict] = useState<ConflictData | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    searchText: '',
    showGotten: true,
    categories: [...CATEGORIES], // Show all categories by default
  });

  const [sort, setSort] = useState<SortState>({
    field: 'date',
    direction: 'desc',
  });

  // Modal states
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showListManagement, setShowListManagement] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showListSelector, setShowListSelector] = useState(false);
  const listSelectorRef = useRef<HTMLDivElement>(null);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleSortChange = (newSort: SortState) => {
    setSort(newSort);
  };

  // Placeholder handlers for list management
  const handleListChange = (listId: string) => {
    console.log('List changed to:', listId);
    // In future: setActiveList(listId) from useList()
  };

  const handleCreateList = async () => {
    try {
      const listName = prompt('Enter list name:');
      if (!listName) return;

      await createList(listName);
      console.log('List created successfully');
    } catch (error) {
      console.error('Failed to create list:', error);
      alert('Failed to create list. Please try again.');
    }
  };

  const handleCreateFromTemplate = async (template: ListTemplate) => {
    try {
      await createListFromTemplate(
        template.name,
        template.items,
        undefined, // Use default color
        template.icon
      );
      console.log('List created from template successfully');
    } catch (error) {
      console.error('Failed to create list from template:', error);
      alert('Failed to create list from template. Please try again.');
    }
  };

  const handleManageList = useCallback((listId: string) => {
    console.log('Manage list:', listId);
    setShowListManagement(true);
  }, []);

  const handleOpenShareModal = useCallback(() => {
    if (currentList && userPermission === 'owner') {
      setShowShareModal(true);
    }
  }, [currentList, userPermission]);

  const handleOpenListSelector = useCallback(() => {
    setShowListSelector(true);
    // Focus the list selector dropdown
    setTimeout(() => {
      listSelectorRef.current?.querySelector('button')?.click();
    }, 100);
  }, []);

  // Define keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'ctrl+n',
      description: 'Create new list',
      category: 'List Operations',
      handler: handleCreateList,
      enabled: isAuthenticated && !listLoading,
    },
    {
      key: 'ctrl+s',
      description: 'Share current list',
      category: 'List Operations',
      handler: handleOpenShareModal,
      enabled: isAuthenticated && currentList !== null && userPermission === 'owner',
    },
    {
      key: 'ctrl+l',
      description: 'Open list selector',
      category: 'Navigation',
      handler: handleOpenListSelector,
      enabled: isAuthenticated && !listLoading,
    },
    {
      key: 'ctrl+r',
      description: 'Retry sync',
      category: 'Sync',
      handler: syncStatus.onRetrySync,
      enabled: isAuthenticated && !syncStatus.isSyncing,
    },
    {
      key: 'escape',
      description: 'Close modal or clear focus',
      category: 'General',
      handler: () => {
        if (currentConflict) {
          setCurrentConflict(null);
        } else if (showShortcutsHelp) {
          setShowShortcutsHelp(false);
        } else if (showListManagement) {
          setShowListManagement(false);
        } else if (showShareModal) {
          setShowShareModal(false);
        } else if (showListSelector) {
          setShowListSelector(false);
        } else {
          // Clear focus from any active element
          (document.activeElement as HTMLElement)?.blur();
        }
      },
      enabled: isAuthenticated,
      preventDefault: false, // Allow Escape to work naturally
    },
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      category: 'General',
      handler: () => setShowShortcutsHelp(prev => !prev),
      enabled: isAuthenticated,
    },
  ];

  // Set up keyboard shortcuts
  useEffect(() => {
    if (!isAuthenticated) return;

    const handler = createShortcutHandler({
      shortcuts,
      enabled: true,
    });

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isAuthenticated, shortcuts]);

  // Share list handlers
  const handleAddMember = async (email: string, permission: PermissionLevel) => {
    if (!currentList) return;
    await addListMember(currentList.id, email, permission);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!currentList) return;
    await removeListMember(memberId);
  };

  const handleUpdatePermission = async (memberId: string, permission: PermissionLevel) => {
    if (!currentList) return;
    // updateMemberPermission takes (memberId, permission)
    await updateMemberPermission(memberId, permission);
  };

  const handleRenameList = async (listId: string, newName: string) => {
    await updateListName(listId, newName);
  };

  const handleDeleteList = async (listId: string) => {
    await deleteList(listId);
  };

  const handleDuplicateList = async (listId: string, newName?: string): Promise<string> => {
    const { duplicateList } = await import('./utils/listApi');
    const newList = await duplicateList(listId, newName);
    return newList.id;
  };

  // Conflict resolution handlers
  const handleConflictResolve = useCallback((conflictId: string, resolution: ConflictResolution) => {
    const conflict = conflicts.find(c => c.id === conflictId);
    if (!conflict) return;

    if (resolution === 'manual') {
      // Open modal for manual resolution
      const conflictData: ConflictData = {
        itemId: conflict.itemId,
        itemName: conflict.itemName,
        local: conflict.localVersion.value as GroceryItem,
        remote: conflict.remoteVersion.value as GroceryItem,
        timestamp: conflict.timestamp,
      };
      setCurrentConflict(conflictData);
    } else {
      // Auto-resolve with 'mine' or 'theirs'
      resolveConflict(conflictId, resolution);
    }
  }, [conflicts, resolveConflict]);

  const handleConflictDismiss = useCallback((conflictId: string) => {
    dismissConflict(conflictId);
  }, [dismissConflict]);

  const handleManualResolve = useCallback((resolvedItem: GroceryItem) => {
    if (!currentConflict) return;

    // Find the conflict by itemId
    const conflict = conflicts.find(c => c.itemId === currentConflict.itemId);
    if (conflict) {
      resolveConflict(conflict.id, 'manual', resolvedItem);
    }

    setCurrentConflict(null);
  }, [currentConflict, conflicts, resolveConflict]);

  const handleCancelManualResolve = useCallback(() => {
    setCurrentConflict(null);
  }, []);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="app">
        <div className="auth-loading">
          <div className="loading-spinner-large"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication forms if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="app">
        <header className="header">
          <h1>🛒 Grocery List</h1>
          <p className="subtitle">Collaborative shopping list</p>
        </header>

        <main className="main auth-main">
          {authView === 'login' ? (
            <LoginForm onSwitchToRegister={() => setAuthView('register')} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setAuthView('login')} />
          )}
        </main>
      </div>
    );
  }

  // Show grocery list when authenticated
  return (
    <div className="app">
      {/* Service Worker Update Banner */}
      <ServiceWorkerUpdate position="top" autoHideDelay={3000} />

      {/* Onboarding tour - shown on first visit */}
      {showTour && (
        <OnboardingTour onComplete={completeTour} onSkip={skipTour} />
      )}

      {/* Notification toast container */}
      <Notifications position="top-right" autoHideDuration={5000} />

      {/* Push notification permission prompt */}
      <NotificationPrompt />

      {/* Conflict notifications */}
      <ConflictNotifications
        conflicts={conflicts}
        onResolve={handleConflictResolve}
        onDismiss={handleConflictDismiss}
        position="top-right"
        maxVisible={3}
      />

      {/* Conflict resolution modal */}
      {currentConflict && (
        <ConflictResolutionModal
          conflict={currentConflict}
          onResolve={handleManualResolve}
          onCancel={handleCancelManualResolve}
          currentUserName={user?.email || 'You'}
          remoteUserName="Other User"
        />
      )}

      {/* Keyboard shortcuts help modal */}
      <KeyboardShortcutsHelp
        shortcuts={shortcuts}
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />

      {/* Share list modal */}
      {showShareModal && currentList && (
        <ListErrorBoundary
          componentName="Share List Modal"
          onReset={() => setShowShareModal(false)}
        >
          <ShareListModal
            listId={currentList.id}
            members={currentList.members}
            currentUserId={user?.id || ''}
            onClose={() => setShowShareModal(false)}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
            onUpdatePermission={handleUpdatePermission}
          />
        </ListErrorBoundary>
      )}

      {/* List management modal */}
      {showListManagement && currentList && (
        <ListErrorBoundary
          componentName="List Management"
          onReset={() => setShowListManagement(false)}
        >
          <ListManagement
            list={{
              ...currentList,
              memberCount: currentList.members.length,
              currentUserPermission: userPermission || 'viewer',
              isArchived: false, // Default to not archived
            }}
            currentUserId={user?.id || ''}
            onClose={() => setShowListManagement(false)}
            onRenameList={handleRenameList}
            onShareList={async (_listId, email, permission) => {
              // TODO: Convert email to userId - for now this is a placeholder
              if (!currentList) return;
              await addListMember(currentList.id, email, permission);
            }}
            onUpdateMemberPermission={async (_listId, memberId, permission) => {
              await updateMemberPermission(memberId, permission);
            }}
            onRemoveMember={async (_listId, memberId) => {
              await removeListMember(memberId);
            }}
            onDeleteList={handleDeleteList}
            onDuplicateList={handleDuplicateList}
            onLeaveList={async () => {
              // TODO: Implement leave list functionality
              console.log('Leave list not yet implemented');
            }}
            onTransferOwnership={async () => {
              // TODO: Implement transfer ownership functionality
              console.log('Transfer ownership not yet implemented');
            }}
          />
        </ListErrorBoundary>
      )}

      <header className="header">
        <div className="header-content">
          <div className="header-title">
            <h1>🛒 Grocery List</h1>
            <p className="subtitle">Collaborative shopping list</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <SyncStatus {...syncStatus} />
            <button
              className="btn-help"
              onClick={() => setShowShortcutsHelp(true)}
              title="Keyboard shortcuts (?)"
              aria-label="Show keyboard shortcuts"
              style={{
                background: 'none',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#6b7280',
                transition: 'all 0.2s ease',
              }}
            >
              ?
            </button>
            <UserProfile onShowTour={startTour} />
          </div>
        </div>
      </header>

      <main className="main">
        {/* List selection section */}
        <section className="list-selector-section">
          {listLoading ? (
            <div className="list-selector-loading">
              <div className="loading-spinner"></div>
              <span>Loading lists...</span>
            </div>
          ) : listError ? (
            <div className="error-state">
              <p>Error loading lists: {listError}</p>
            </div>
          ) : !currentList ? (
            <div className="no-list-state">
              <p>Create your first list to get started!</p>
              <button onClick={handleCreateList} className="btn btn-primary">
                Create Your First List
              </button>
            </div>
          ) : (
            <>
              <div ref={listSelectorRef}>
                <ListErrorBoundary componentName="List Selector">
                  <ListSelector
                    lists={currentList ? [{
                      id: currentList.id,
                      name: currentList.name,
                      ownerId: currentList.ownerId,
                      color: currentList.color,
                      icon: currentList.icon,
                      createdAt: currentList.createdAt,
                      updatedAt: currentList.updatedAt,
                      memberCount: currentList.members.length,
                      members: currentList.members,
                      currentUserPermission: userPermission || 'viewer',
                      isArchived: false,
                    }] : []}
                    currentListId={activeListId}
                    onListChange={handleListChange}
                    onCreateList={handleCreateList}
                    onCreateFromTemplate={handleCreateFromTemplate}
                    onManageList={handleManageList}
                    loading={listLoading}
                  />
                </ListErrorBoundary>
              </div>

              <section className="add-section">
                <h2>Add Item</h2>
                <AddItemForm listId={activeListId} canEdit={canEdit()} />
              </section>

              {currentList?.budget && currentList.budget > 0 && (
                <section className="budget-section">
                  <BudgetTracker
                    items={groceryItems}
                    budget={currentList.budget}
                    currency={currentList.currency || 'USD'}
                    onUpdateBudget={async (newBudget) => {
                      if (currentList) {
                        await updateListBudget(currentList.id, newBudget, currentList.currency);
                      }
                    }}
                  />
                </section>
              )}

              <section className="list-section">
                <h2>Shopping List</h2>
                <GroceryList
                  listId={activeListId}
                  canEdit={canEdit()}
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  sort={sort}
                  onSortChange={handleSortChange}
                />
              </section>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
