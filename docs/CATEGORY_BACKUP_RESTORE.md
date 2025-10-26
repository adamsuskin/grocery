# Category Backup and Restore System

Complete documentation for the custom category backup and restore functionality.

## Overview

The category backup and restore system provides comprehensive data protection for custom categories:

- **Manual Backups**: Export categories to JSON files for safe keeping
- **Automatic Backups**: Periodic localStorage backups after modifications
- **Import/Restore**: Import categories from backup files with conflict resolution
- **Backup History**: View and restore from automatic backups
- **Configurable Settings**: Control automatic backup behavior

## Architecture

### Core Components

1. **`/src/utils/categoryBackup.ts`** - Core backup/restore utilities
   - Export/import functions
   - Validation logic
   - Conflict detection
   - LocalStorage management
   - Auto-backup system

2. **`/src/components/CategoryBackupRestore.tsx`** - UI Component
   - Multi-view interface (main, import, history, settings)
   - File upload handling
   - Conflict resolution dialog
   - Backup history management

3. **`/src/components/CategoryBackupRestore.css`** - Styles
   - Responsive design
   - Card-based layout
   - Dark mode support

## Backup File Format

### Version 1.0 Specification

```json
{
  "version": "1.0",
  "exportedAt": "2024-01-15T10:30:00Z",
  "exportTimestamp": 1705318200000,
  "listId": "abc-123",
  "listName": "My Grocery List",
  "categories": [
    {
      "name": "Gluten-Free",
      "color": "#FF5733",
      "icon": "🌾",
      "createdAt": 1234567890,
      "itemCount": 5
    }
  ]
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | Yes | Backup format version |
| `exportedAt` | string | Yes | ISO 8601 timestamp of export |
| `exportTimestamp` | number | Yes | Unix timestamp in milliseconds |
| `listId` | string | Yes | ID of the source list |
| `listName` | string | Yes | Name of the source list |
| `categories` | array | Yes | Array of category objects |

### Category Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Category name |
| `color` | string | No | Hex color code (e.g., #FF5733) |
| `icon` | string | No | Emoji or icon character |
| `createdAt` | number | Yes | Creation timestamp |
| `itemCount` | number | No | Number of items using this category |

## Features

### 1. Manual Export

Export categories to a downloadable JSON file:

```typescript
import { downloadCategoryBackup } from './utils/categoryBackup';

// Export categories with item counts
await downloadCategoryBackup('list-123', true);
// Downloads: categories-my-list-2024-01-15.json
```

**Features:**
- Includes all category properties (name, color, icon)
- Optional item count per category
- Generates safe filenames from list names
- Triggers browser download

### 2. Import with Conflict Resolution

Import categories from backup files with intelligent conflict handling:

```typescript
import { importFromFile } from './utils/categoryBackup';

const result = await importFromFile(file, {
  listId: 'list-123',
  conflictResolution: 'skip', // or 'overwrite', 'rename', 'merge'
});

console.log(`Imported: ${result.imported}`);
console.log(`Skipped: ${result.skipped}`);
console.log(`Conflicts: ${result.conflicts.length}`);
```

**Conflict Resolution Strategies:**

| Strategy | Behavior |
|----------|----------|
| `skip` | Keep existing categories, skip imported duplicates |
| `overwrite` | Replace existing categories with imported versions |
| `rename` | Import as new categories with "(Imported)" suffix |
| `merge` | Update properties (color, icon) of existing categories |

### 3. Automatic Backups

Categories are automatically backed up to localStorage after modifications:

- Triggered after add/update/delete operations
- Stored in localStorage for quick recovery
- Configurable max backup count (default: 5)
- Per-list backup management

**Backup Triggers:**
```typescript
// Automatically triggered after:
await addCustomCategory(...)      // After adding a category
await updateCustomCategory(...)   // After updating a category
await deleteCustomCategory(...)   // After deleting a category
await deleteMultipleCategories(...) // After bulk delete
```

### 4. Backup History

View and restore from automatic backups:

```typescript
import { getListBackups, restoreFromBackup } from './utils/categoryBackup';

// Get backups for a list
const backups = getListBackups('list-123');
// Returns: Array of StoredBackup objects, sorted by timestamp

// Restore from a backup
const result = await restoreFromBackup('backup-id', {
  listId: 'list-123',
  conflictResolution: 'skip',
});
```

**Backup Metadata:**
- Backup ID
- List ID and name
- Timestamp
- Category count
- Full backup data

### 5. Configuration

Customize automatic backup behavior:

```typescript
import { getAutoBackupConfig, setAutoBackupConfig } from './utils/categoryBackup';

// Get current config
const config = getAutoBackupConfig();
// Returns: { enabled: true, intervalMinutes: 1440, maxBackups: 5 }

// Update config
setAutoBackupConfig({
  enabled: true,
  maxBackups: 10,
});
```

**Configuration Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | true | Enable automatic backups |
| `intervalMinutes` | number | 1440 | Backup interval (24 hours) |
| `maxBackups` | number | 5 | Maximum backups per list |

## UI Components

### CategoryBackupRestore Component

Main component providing backup/restore interface:

```typescript
<CategoryBackupRestore
  listId="list-123"
  listName="My Grocery List"
  onClose={() => setShowBackup(false)}
  onImportSuccess={(count) => {
    console.log(`Imported ${count} categories`);
  }}
/>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `listId` | string | Yes | ID of the list |
| `listName` | string | Yes | Name of the list |
| `onClose` | function | Yes | Callback when modal closes |
| `onImportSuccess` | function | Yes | Callback after successful import |

### View Modes

1. **Main View**: Four action cards
   - Export Backup
   - Restore Backup
   - Backup History
   - Settings

2. **Import View**: File upload and preview
   - File selection
   - Format validation
   - Conflict preview
   - Resolution strategy selection
   - Import confirmation

3. **History View**: Automatic backup list
   - Backup metadata display
   - Restore action
   - Delete action
   - Empty state with create option

4. **Settings View**: Configuration form
   - Enable/disable auto-backups
   - Max backups slider
   - Save/cancel actions

## Integration

### Adding to CustomCategoryManager

The backup/restore feature is integrated into the CustomCategoryManager:

```typescript
import { CategoryBackupRestore } from './CategoryBackupRestore';
import { createAutoBackup } from '../utils/categoryBackup';

// Add state
const [showBackupRestore, setShowBackupRestore] = useState(false);

// Add button in UI
<button onClick={() => setShowBackupRestore(true)}>
  Backup/Restore
</button>

// Add modal
{showBackupRestore && (
  <CategoryBackupRestore
    listId={listId}
    listName="Categories"
    onClose={() => setShowBackupRestore(false)}
    onImportSuccess={(count) => {
      setSuccessMessage(`Imported ${count} categories!`);
    }}
  />
)}

// Trigger auto-backup after operations
await addCustomCategory(...);
await createAutoBackup(listId);
```

## Validation

### Backup File Validation

Files are validated before import:

```typescript
import { validateBackupFile } from './utils/categoryBackup';

const backup = validateBackupFile(jsonString);
if (!backup) {
  // Invalid format
  console.error('Invalid backup file');
} else {
  // Valid format, proceed with import
  console.log(`Found ${backup.categories.length} categories`);
}
```

**Validation Checks:**
- Valid JSON structure
- Required fields present
- Correct field types
- Valid category objects
- Version compatibility

### Conflict Detection

Detect conflicts before import:

```typescript
import { detectConflicts } from './utils/categoryBackup';

const conflicts = detectConflicts(
  importedCategories,
  existingCategories
);

// Returns array of conflicts with:
// - existingCategory: The current category
// - importedCategory: The imported category
// - reason: 'duplicate_name' | 'same_properties'
```

## Error Handling

### Import Errors

```typescript
const result = await importCategories(jsonString, options);

if (!result.success) {
  // Check errors array
  console.error('Import failed:', result.errors);
  // Examples:
  // - "Invalid backup file format"
  // - "User must be authenticated"
  // - "Failed to import 'Category Name': Database error"
}

// Check warnings for non-fatal issues
if (result.warnings.length > 0) {
  console.warn('Import warnings:', result.warnings);
  // Examples:
  // - "Skipped 'Category Name' (already exists)"
  // - "Backup version 2.0 may not be fully compatible"
}
```

### Export Errors

```typescript
try {
  await downloadCategoryBackup('list-123');
} catch (error) {
  // Possible errors:
  // - "List not found"
  // - "No custom categories found for this list"
  // - "Failed to export categories"
}
```

## LocalStorage Schema

### Backup Storage Key

`grocery_category_backups` - Stores array of backups

```typescript
interface StoredBackup {
  id: string;                 // Unique backup ID
  listId: string;             // List ID
  listName: string;           // List name
  timestamp: number;          // Creation timestamp
  categoryCount: number;      // Number of categories
  data: CategoryBackup;       // Full backup data
}
```

### Config Storage Key

`grocery_category_auto_backup_config` - Stores configuration

```typescript
interface AutoBackupConfig {
  enabled: boolean;           // Auto-backup enabled
  intervalMinutes: number;    // Backup interval
  maxBackups: number;         // Max backups to keep
}
```

## Testing

Comprehensive test suite in `/tests/categoryBackup.test.ts`:

```bash
npm test categoryBackup
```

**Test Coverage:**
- Backup file validation
- Conflict detection
- LocalStorage management
- Configuration persistence
- Format compatibility
- Error handling

## Best Practices

### 1. Regular Exports

- Export categories before major changes
- Keep backup files in safe location
- Use descriptive filenames
- Export after bulk operations

### 2. Conflict Resolution

- Use `skip` for safety (default)
- Use `overwrite` when restoring your own backups
- Use `rename` to preserve both versions
- Use `merge` to update properties only

### 3. Automatic Backups

- Keep auto-backup enabled
- Adjust maxBackups based on activity
- Periodically review backup history
- Delete old backups to free space

### 4. Error Recovery

- Check import results for errors
- Review warnings after import
- Verify imported categories
- Keep original backup file

## Security Considerations

1. **Data Storage**
   - Backups stored in localStorage (not encrypted)
   - No sensitive data should be in category names
   - Clear backups when logging out

2. **File Upload**
   - Maximum file size: 5MB
   - JSON-only format accepted
   - Validation before processing
   - No script execution from files

3. **Authentication**
   - User must be authenticated for import
   - Permission checks for list access
   - Owner/editor permissions required

## Troubleshooting

### Import Fails

**Problem**: "Invalid backup file format"
**Solution**:
- Check JSON is valid
- Verify file has all required fields
- Ensure version is compatible

**Problem**: "User must be authenticated"
**Solution**:
- Log in before importing
- Check authentication status

### No Automatic Backups

**Problem**: Backups not being created
**Solution**:
- Check auto-backup is enabled in settings
- Verify localStorage is not full
- Check browser localStorage support

### Conflicts Not Detected

**Problem**: Duplicate categories imported
**Solution**:
- Ensure conflict resolution is set
- Check category name matching (case-insensitive)
- Verify existing categories loaded

## API Reference

### Export Functions

#### `exportCategories(listId, includeItems?): Promise<string>`
Exports categories as JSON string.

#### `downloadCategoryBackup(listId, includeItems?): Promise<void>`
Downloads categories as JSON file.

### Import Functions

#### `importFromFile(file, options): Promise<ImportResult>`
Imports categories from file.

#### `importCategories(jsonString, options): Promise<ImportResult>`
Imports categories from JSON string.

### Validation Functions

#### `validateBackupFile(jsonString): CategoryBackup | null`
Validates backup file format.

#### `detectConflicts(imported, existing): CategoryConflict[]`
Detects category name conflicts.

### Storage Functions

#### `getStoredBackups(): StoredBackup[]`
Gets all stored backups.

#### `getListBackups(listId): StoredBackup[]`
Gets backups for specific list.

#### `deleteStoredBackup(backupId): void`
Deletes a stored backup.

#### `clearAllBackups(): void`
Clears all stored backups.

### Backup Functions

#### `createAutoBackup(listId): Promise<void>`
Creates automatic backup.

#### `restoreFromBackup(backupId, options): Promise<ImportResult>`
Restores from stored backup.

### Config Functions

#### `getAutoBackupConfig(): AutoBackupConfig`
Gets current configuration.

#### `setAutoBackupConfig(config): void`
Updates configuration.

## Future Enhancements

1. **Cloud Storage**
   - Sync backups to cloud
   - Cross-device backup access
   - Automatic cloud backup

2. **Advanced Features**
   - Scheduled backups
   - Backup encryption
   - Version comparison
   - Selective restore

3. **Analytics**
   - Backup usage metrics
   - Restore success rates
   - Storage usage tracking

4. **Collaboration**
   - Share backup files
   - Team backup management
   - Backup permissions

## Support

For issues or questions:
- Check documentation above
- Review test files for examples
- Examine source code comments
- Check browser console for errors

## Changelog

### Version 1.0 (Current)
- Initial release
- Manual export/import
- Automatic backups
- Conflict resolution
- Backup history
- Configuration settings
- Comprehensive testing
