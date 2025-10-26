/**
 * Example Usage of ConflictResolutionModal
 *
 * This file demonstrates how to integrate and use the ConflictResolutionModal
 * component in your application for resolving grocery item conflicts.
 */

import { useState } from 'react';
import { ConflictResolutionModal, ConflictData } from './ConflictResolutionModal';
import type { GroceryItem } from '../types';

export function ConflictResolutionExample() {
  const [showModal, setShowModal] = useState(false);

  // Example conflict data
  const exampleConflict: ConflictData = {
    itemId: 'item-123',
    itemName: 'Organic Apples',
    timestamp: Date.now(),
    local: {
      id: 'item-123',
      name: 'Organic Apples',
      quantity: 3,
      category: 'Produce',
      notes: 'Get Honeycrisp if available',
      gotten: false,
      userId: 'user-abc',
      listId: 'list-456',
      createdAt: Date.now() - 10000,
      updatedAt: Date.now() - 5000,
    },
    remote: {
      id: 'item-123',
      name: 'Organic Apples',
      quantity: 5,
      category: 'Produce',
      notes: 'Prefer Gala or Fuji',
      gotten: true,
      userId: 'user-xyz',
      listId: 'list-456',
      createdAt: Date.now() - 10000,
      updatedAt: Date.now() - 3000,
    },
  };

  const handleResolve = (resolvedItem: GroceryItem) => {
    console.log('Conflict resolved with item:', resolvedItem);

    // Here you would typically:
    // 1. Update the item in your local state
    // 2. Sync the resolved item to the backend
    // 3. Clear the conflict from your conflict queue
    // 4. Show a success notification

    setShowModal(false);
  };

  const handleCancel = () => {
    console.log('Conflict resolution cancelled');

    // Here you would typically:
    // 1. Keep the conflict in the queue
    // 2. Maybe show it again later
    // 3. Or allow the user to skip/postpone resolution

    setShowModal(false);
  };

  return (
    <div>
      <button onClick={() => setShowModal(true)}>
        Show Conflict Resolution Modal
      </button>

      {showModal && (
        <ConflictResolutionModal
          conflict={exampleConflict}
          onResolve={handleResolve}
          onCancel={handleCancel}
          currentUserName="John Doe"
          remoteUserName="Jane Smith"
        />
      )}
    </div>
  );
}

/**
 * Example integration with a conflict queue
 */
export function ConflictQueueExample() {
  const [conflicts, setConflicts] = useState<ConflictData[]>([]);
  const [currentConflict, setCurrentConflict] = useState<ConflictData | null>(null);

  // Show the next conflict in the queue
  const showNextConflict = () => {
    if (conflicts.length > 0) {
      setCurrentConflict(conflicts[0]);
    }
  };

  const handleResolve = (_resolvedItem: GroceryItem) => {
    console.log('Resolved conflict:', currentConflict?.itemId);

    // Update the item with resolved values
    // syncResolvedItem(resolvedItem);

    // Remove the resolved conflict from the queue
    setConflicts(prev => prev.slice(1));
    setCurrentConflict(null);

    // Show next conflict if any
    setTimeout(showNextConflict, 500);
  };

  const handleCancel = () => {
    console.log('Cancelled conflict resolution');

    // Move conflict to end of queue for later
    if (currentConflict) {
      setConflicts(prev => [...prev.slice(1), currentConflict]);
    }

    setCurrentConflict(null);
  };

  return (
    <div>
      <div>
        <h3>Pending Conflicts: {conflicts.length}</h3>
        <button onClick={showNextConflict} disabled={conflicts.length === 0}>
          Resolve Next Conflict
        </button>
      </div>

      {currentConflict && (
        <ConflictResolutionModal
          conflict={currentConflict}
          onResolve={handleResolve}
          onCancel={handleCancel}
          currentUserName="You"
          remoteUserName="Team Member"
        />
      )}
    </div>
  );
}

/**
 * Example integration with real-time sync
 */
export function RealtimeSyncExample() {
  const [pendingConflict, setPendingConflict] = useState<ConflictData | null>(null);

  // Simulated real-time conflict detection (commented out for example purposes)
  // const handleItemConflict = (local: GroceryItem, remote: GroceryItem) => {
  //   const conflict: ConflictData = {
  //     itemId: local.id,
  //     itemName: local.name,
  //     local,
  //     remote,
  //     timestamp: Date.now(),
  //   };
  //
  //   setPendingConflict(conflict);
  // };

  const handleResolve = async (resolvedItem: GroceryItem) => {
    try {
      // Send resolved item to server
      // await api.updateItem(resolvedItem);

      // Update local state
      // updateLocalItem(resolvedItem);

      // Clear the conflict
      setPendingConflict(null);

      console.log('Conflict resolved and synced:', resolvedItem);
    } catch (error) {
      console.error('Failed to sync resolved item:', error);
      // Handle error (show notification, retry, etc.)
    }
  };

  const handleCancel = () => {
    // For now, just close the modal
    // In a real app, you might want to:
    // 1. Use a default resolution strategy (e.g., keep remote)
    // 2. Queue the conflict for later
    // 3. Ask the user again after some time

    setPendingConflict(null);
  };

  return (
    <div>
      <h2>Real-time Sync with Conflict Resolution</h2>

      {/* Your main app UI */}
      <div>
        {/* ... grocery list items ... */}
      </div>

      {/* Conflict modal appears when conflicts are detected */}
      {pendingConflict && (
        <ConflictResolutionModal
          conflict={pendingConflict}
          onResolve={handleResolve}
          onCancel={handleCancel}
          currentUserName="You"
          remoteUserName="Collaborator"
        />
      )}
    </div>
  );
}

/**
 * Example with multiple field types
 */
export function ComplexConflictExample() {
  const complexConflict: ConflictData = {
    itemId: 'item-789',
    itemName: 'Greek Yogurt',
    timestamp: Date.now(),
    local: {
      id: 'item-789',
      name: 'Greek Yogurt',
      quantity: 2,
      category: 'Dairy',
      notes: 'Low fat, plain flavor',
      gotten: false,
      userId: 'user-abc',
      listId: 'list-456',
      createdAt: Date.now() - 5000,
      updatedAt: Date.now() - 4000,
    },
    remote: {
      id: 'item-789',
      name: 'Greek Yogurt - Vanilla',
      quantity: 4,
      category: 'Dairy',
      notes: 'Non-fat, any brand',
      gotten: true,
      userId: 'user-xyz',
      listId: 'list-456',
      createdAt: Date.now() - 5000,
      updatedAt: Date.now() - 2000,
    },
  };

  return (
    <ConflictResolutionModal
      conflict={complexConflict}
      onResolve={(resolved) => {
        console.log('Complex conflict resolved:', resolved);
      }}
      onCancel={() => {
        console.log('Cancelled complex conflict');
      }}
      currentUserName="Sarah"
      remoteUserName="Mike"
    />
  );
}
