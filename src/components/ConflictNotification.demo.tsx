/**
 * ConflictNotification Demo
 *
 * Interactive demo page to test and showcase the ConflictNotification component.
 * Run this in your app to see how conflicts appear and can be resolved.
 */

import { useState } from 'react';
import { ConflictNotifications } from './ConflictNotification';
import type { Conflict, ConflictResolution } from '../types';
import { nanoid } from 'nanoid';
import './ConflictNotification.css';

export function ConflictNotificationDemo() {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [resolvedConflicts, setResolvedConflicts] = useState<
    Array<{ conflict: Conflict; resolution: ConflictResolution; timestamp: number }>
  >([]);

  // Helper to create a sample conflict
  const createSampleConflict = (
    type: 'concurrent_edit' | 'delete_edit' | 'edit_edit',
    priority: number = 1
  ): Conflict => {
    const itemNames = ['Milk', 'Bread', 'Eggs', 'Cheese', 'Apples', 'Bananas'];
    const itemName = itemNames[Math.floor(Math.random() * itemNames.length)];

    return {
      id: nanoid(),
      type,
      itemId: nanoid(),
      itemName,
      listId: 'demo-list',
      localVersion: {
        value: {
          name: itemName,
          quantity: type === 'concurrent_edit' ? 2 : 1,
          gotten: false,
          category: 'Produce',
          notes: 'Local edit',
        },
        changes: [
          {
            field: 'quantity',
            oldValue: 1,
            newValue: 2,
          },
          {
            field: 'notes',
            oldValue: '',
            newValue: 'Local edit',
          },
        ],
        timestamp: Date.now() - 5000,
        userId: 'local-user',
        userName: 'You',
      },
      remoteVersion: {
        value: {
          name: itemName,
          quantity: type === 'concurrent_edit' ? 3 : 1,
          gotten: type === 'delete_edit' ? false : true,
          category: 'Produce',
          notes: 'Remote edit by Alice',
        },
        changes: [
          {
            field: type === 'concurrent_edit' ? 'quantity' : 'gotten',
            oldValue: type === 'concurrent_edit' ? 1 : false,
            newValue: type === 'concurrent_edit' ? 3 : true,
          },
          {
            field: 'notes',
            oldValue: '',
            newValue: 'Remote edit by Alice',
          },
        ],
        timestamp: Date.now() - 3000,
        userId: 'remote-user',
        userName: 'Alice',
      },
      timestamp: Date.now(),
      priority,
      autoResolvable: type === 'edit_edit',
    };
  };

  // Add a concurrent edit conflict
  const addConcurrentEditConflict = () => {
    const conflict = createSampleConflict('concurrent_edit', 2);
    setConflicts(prev => [...prev, conflict]);
  };

  // Add a delete-edit conflict
  const addDeleteEditConflict = () => {
    const conflict = createSampleConflict('delete_edit', 3);
    setConflicts(prev => [...prev, conflict]);
  };

  // Add an edit-edit conflict (different fields)
  const addEditEditConflict = () => {
    const conflict = createSampleConflict('edit_edit', 1);
    setConflicts(prev => [...prev, conflict]);
  };

  // Add multiple conflicts at once
  const addMultipleConflicts = () => {
    const newConflicts = [
      createSampleConflict('concurrent_edit', 2),
      createSampleConflict('delete_edit', 3),
      createSampleConflict('edit_edit', 1),
    ];
    setConflicts(prev => [...prev, ...newConflicts]);
  };

  // Handle conflict resolution
  const handleResolve = (conflictId: string, resolution: ConflictResolution) => {
    const conflict = conflicts.find(c => c.id === conflictId);
    if (conflict) {
      setResolvedConflicts(prev => [
        ...prev,
        { conflict, resolution, timestamp: Date.now() },
      ]);
    }
    setConflicts(prev => prev.filter(c => c.id !== conflictId));
  };

  // Handle conflict dismissal
  const handleDismiss = (conflictId: string) => {
    setConflicts(prev => prev.filter(c => c.id !== conflictId));
  };

  // Clear all conflicts
  const clearAllConflicts = () => {
    setConflicts([]);
  };

  // Clear resolved history
  const clearResolvedHistory = () => {
    setResolvedConflicts([]);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Conflict Notification Demo</h1>
      <p>
        Test the ConflictNotification component by adding different types of conflicts
        and seeing how they appear and can be resolved.
      </p>

      {/* Controls */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        marginBottom: '30px',
        padding: '20px',
        background: '#f5f5f5',
        borderRadius: '8px',
      }}>
        <h3 style={{ width: '100%', marginTop: 0 }}>Add Conflicts:</h3>

        <button
          onClick={addConcurrentEditConflict}
          style={{
            padding: '10px 20px',
            background: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Add Concurrent Edit
        </button>

        <button
          onClick={addDeleteEditConflict}
          style={{
            padding: '10px 20px',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Add Delete-Edit
        </button>

        <button
          onClick={addEditEditConflict}
          style={{
            padding: '10px 20px',
            background: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Add Edit-Edit
        </button>

        <button
          onClick={addMultipleConflicts}
          style={{
            padding: '10px 20px',
            background: '#9c27b0',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Add Multiple (3)
        </button>

        <button
          onClick={clearAllConflicts}
          style={{
            padding: '10px 20px',
            background: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Clear All
        </button>
      </div>

      {/* Status */}
      <div style={{
        padding: '15px',
        background: '#e3f2fd',
        borderRadius: '8px',
        marginBottom: '30px',
      }}>
        <h3 style={{ marginTop: 0 }}>Status:</h3>
        <p>Active Conflicts: {conflicts.length}</p>
        <p>Resolved Conflicts: {resolvedConflicts.length}</p>
      </div>

      {/* Resolved conflicts history */}
      {resolvedConflicts.length > 0 && (
        <div style={{
          padding: '20px',
          background: '#e8f5e9',
          borderRadius: '8px',
          marginBottom: '30px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ marginTop: 0 }}>Resolution History:</h3>
            <button
              onClick={clearResolvedHistory}
              style={{
                padding: '8px 16px',
                background: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Clear History
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {resolvedConflicts.map((item, index) => (
              <div
                key={index}
                style={{
                  padding: '10px',
                  background: 'white',
                  borderRadius: '4px',
                  borderLeft: '4px solid #4caf50',
                }}
              >
                <strong>{item.conflict.itemName}</strong> -
                Resolved using: <strong style={{ color: '#2e7d32' }}>{item.resolution}</strong>
                {' '}({new Date(item.timestamp).toLocaleTimeString()})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        padding: '20px',
        background: '#fff3e0',
        borderRadius: '8px',
        marginBottom: '30px',
      }}>
        <h3 style={{ marginTop: 0 }}>Conflict Types:</h3>
        <ul>
          <li>
            <strong>Concurrent Edit:</strong> Both users edited the same field (e.g., quantity)
          </li>
          <li>
            <strong>Delete-Edit:</strong> One user deleted while another edited (high priority)
          </li>
          <li>
            <strong>Edit-Edit:</strong> Users edited different fields (auto-resolvable)
          </li>
        </ul>

        <h3>Resolution Options:</h3>
        <ul>
          <li>
            <strong>Use Mine:</strong> Keep your local changes
          </li>
          <li>
            <strong>Use Theirs:</strong> Accept the remote changes
          </li>
          <li>
            <strong>Merge Manually:</strong> Open a dialog to manually merge both versions
          </li>
        </ul>
      </div>

      {/* Conflict notifications will appear in the top-right corner */}
      <ConflictNotifications
        conflicts={conflicts}
        onResolve={handleResolve}
        onDismiss={handleDismiss}
        position="top-right"
        maxVisible={3}
      />

      {/* Demo content to show notifications overlaying content */}
      <div style={{
        padding: '20px',
        background: 'white',
        borderRadius: '8px',
        border: '1px solid #ddd',
      }}>
        <h2>Sample Content</h2>
        <p>
          This is sample content to demonstrate how conflict notifications appear
          overlaid on top of your application content.
        </p>
        <p>
          Click the buttons above to add conflicts and watch them appear in the top-right
          corner. Each conflict notification includes:
        </p>
        <ul>
          <li>A clear description of what conflicted</li>
          <li>Visual diff showing the changes</li>
          <li>Three resolution options</li>
          <li>Auto-dismiss countdown (30 seconds)</li>
          <li>Persistent mode for critical conflicts (delete-edit)</li>
        </ul>
      </div>
    </div>
  );
}

export default ConflictNotificationDemo;
