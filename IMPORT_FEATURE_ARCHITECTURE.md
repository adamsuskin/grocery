# List Import Feature - Architecture

## Component Hierarchy

```
ListDashboard
└── ImportList (Modal)
    ├── File Selection UI
    ├── Preview UI
    │   └── Item List
    ├── Loading UI
    └── Success UI
```

## Data Flow

```
User Action          Component              Utility              Store
────────────────────────────────────────────────────────────────────────

1. Click Import    ListDashboard
   Button          │
                   └──> ImportList
                        (opens modal)

2. Select/Drop     ImportList
   File            │
                   └──> handleFileSelect()
                        │
                        └──> importList() ────> listImport.ts
                                                 │
                                                 ├─ JSON Parser
                                                 ├─ CSV Parser
                                                 └─ Text Parser
                                                 │
                                                 └──> ImportResult
                                                      {success, items,
                                                       errors, warnings}
                                                      │
                        ┌────────────────────────────┘
                        │
3. Preview Items   ImportList
                   (displays preview)
                   - Item count
                   - Warnings/Errors
                   - Editable list name

4. Confirm         ImportList
   Import          │
                   └──> handleImport()
                        │
                        └──> createListFromTemplate() ──> Zero Store
                                                           │
                                                           └─ Create List
                                                           └─ Create Items
                                                           │
                        ┌──────────────────────────────────┘
                        │
5. Success         ImportList
                   (shows success)
                   │
                   └──> onImportComplete(listId)
                        │
                        └──> ListDashboard
                             └──> onSelectList(listId)
                                  (navigate to new list)
```

## File Format Detection

```
File Extension
     │
     ├──> .json ──> importFromJSON()
     │                    │
     │                    ├─ JSON.parse()
     │                    ├─ Validate structure
     │                    ├─ Extract list name
     │                    └─ Process items array
     │
     ├──> .csv ──> importFromCSV()
     │                    │
     │                    ├─ Split into lines
     │                    ├─ Detect header row
     │                    ├─ Parse CSV values
     │                    └─ Create items
     │
     └──> .txt ──> importFromText()
                      │
                      ├─ Split into lines
                      ├─ Extract quantity prefix
                      ├─ Default to "Other" category
                      └─ Create items
```

## Validation Pipeline

```
Raw Item Data
     │
     ├──> validateItemName()
     │    ├─ Check not empty
     │    ├─ Check length <= 200
     │    └─ Trim whitespace
     │
     ├──> normalizeQuantity()
     │    ├─ Parse number
     │    ├─ Check >= 0
     │    ├─ Round to integer
     │    └─ Default to 1 if invalid
     │
     ├──> normalizeCategory()
     │    ├─ Trim whitespace
     │    ├─ Case-insensitive match
     │    ├─ Check valid categories
     │    └─ Default to "Other"
     │
     └──> Validated Item
          {name, quantity, category, notes}
```

## Error Handling Strategy

```
Import Process
     │
     ├──> Parse File
     │    ├─ Success ──> Continue
     │    └─ Failure ──> Return error result
     │
     ├──> Validate Structure
     │    ├─ Success ──> Continue
     │    └─ Failure ──> Return error result
     │
     ├──> Process Each Item
     │    ├─ Valid ──> Add to items array
     │    ├─ Invalid ──> Add to errors array
     │    └─ Warning ──> Add to warnings array
     │
     └──> Return Result
          ├─ success: items.length > 0
          ├─ items: [...valid items]
          ├─ errors: [...error messages]
          └─ warnings: [...warning messages]
```

## State Management

### ImportList Component States

```typescript
// UI State
step: 'select' | 'preview' | 'importing' | 'complete'

// Data State
importResult: ImportResult | null  // Parsed import data
listName: string                    // User-editable name
importError: string | null          // Current error message

// Refs
fileInputRef: HTMLInputElement      // File input element
```

### State Transitions

```
Initial State: step = 'select'
     │
     ├─ User selects file
     │  │
     │  ├─ Parse Success ──> step = 'preview'
     │  └─ Parse Failure ──> step = 'select' + error
     │
     ├─ User confirms import (from preview)
     │  │
     │  └──> step = 'importing'
     │       │
     │       ├─ Import Success ──> step = 'complete'
     │       └─ Import Failure ──> step = 'preview' + error
     │
     └─ User closes/cancels
        └──> Modal closes
```

## Integration Points

### Zero Store
```typescript
// Used mutation
createListFromTemplate(
  name: string,
  items: ImportedItem[],
  color?: string,
  icon?: string
): Promise<string>

// Creates:
// 1. New list with provided name
// 2. List membership for current user
// 3. All imported items associated with list
```

### ListDashboard
```typescript
// Integration points
- showImport state controls modal visibility
- handleImportComplete(listId) navigates to new list
- Import button triggers modal open

// Button placement
Create List Input | [Create List] [Import] <-- New button
```

## File Format Specifications

### JSON Schema
```json
{
  "type": "object",
  "required": ["items"],
  "properties": {
    "name": {
      "type": "string",
      "description": "List name (optional, defaults to 'Imported List')"
    },
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name"],
        "properties": {
          "name": {"type": "string"},
          "quantity": {"type": "number", "minimum": 1, "default": 1},
          "category": {"type": "string", "enum": [...categories], "default": "Other"},
          "notes": {"type": "string", "default": ""}
        }
      }
    }
  }
}
```

### CSV Format
```
Header Row: name,quantity,category,notes
Data Rows:  <value>,<value>,<value>,<value>

Rules:
- First row can be header (detected by "name" or "item" presence)
- Values can be quoted for commas/special chars
- Empty values allowed (use defaults)
- List name from filename
```

### Text Format
```
Format: [quantity] [x] <item name>

Examples:
- "Milk"          -> name: "Milk", quantity: 1
- "2 Apples"      -> name: "Apples", quantity: 2
- "3x Bananas"    -> name: "Bananas", quantity: 3

Rules:
- One item per line
- Optional quantity prefix
- All items get "Other" category
- List name from filename
```

## CSS Architecture

```
.import-list-overlay          (Modal backdrop)
└── .import-list-modal        (Modal container)
    └── .import-step          (Step container)
        ├── .import-header    (Title + close button)
        ├── .import-body      (Main content area)
        │   ├── File Selection Step
        │   │   ├── .file-drop-zone
        │   │   ├── .import-error
        │   │   └── .format-guide
        │   │
        │   ├── Preview Step
        │   │   ├── .preview-summary
        │   │   ├── .list-name-input
        │   │   ├── .import-warnings
        │   │   ├── .import-errors
        │   │   └── .preview-items
        │   │       └── .preview-item (repeating)
        │   │
        │   ├── Importing Step
        │   │   └── .importing-spinner
        │   │
        │   └── Complete Step
        │       └── .complete-message
        │
        └── .import-footer    (Action buttons)
```

## Performance Considerations

### File Processing
- Asynchronous file reading with `file.text()`
- No blocking operations during parse
- Early return on validation failures
- Efficient string operations

### UI Rendering
- Minimal re-renders with proper state updates
- CSS animations use GPU acceleration
- Preview list scrollable for large imports
- Lazy evaluation of format examples

### Memory Management
- Files validated for size (5MB max)
- Temporary file data cleared after parse
- No retention of file contents after import
- Efficient data structures (arrays, not objects)

## Security Considerations

### File Validation
- File size limits prevent DoS
- File type restrictions (.json, .csv, .txt only)
- Content validation before parsing
- No execution of file contents

### Input Sanitization
- Item names trimmed and length-limited
- Quantity validated and normalized
- Category restricted to enum values
- No HTML/script injection possible

### User Permissions
- All items associated with current user
- Zero store handles permission checks
- No cross-user data leakage
- Proper authentication required

## Testing Strategy

### Unit Tests
```typescript
// listImport.ts
describe('importFromJSON', () => {
  test('valid JSON with all fields')
  test('JSON with missing optional fields')
  test('JSON with invalid categories')
  test('empty items array')
  test('malformed JSON')
})

describe('importFromCSV', () => {
  test('CSV with header row')
  test('CSV without header row')
  test('CSV with quoted values')
  test('CSV with empty fields')
})

describe('importFromText', () => {
  test('plain item names')
  test('items with quantity prefix')
  test('items with "x" notation')
  test('empty lines ignored')
})
```

### Integration Tests
```typescript
describe('ImportList Component', () => {
  test('file upload triggers parsing')
  test('drag-and-drop works')
  test('preview shows correct data')
  test('import creates list in store')
  test('success navigates to new list')
  test('cancel closes modal')
})
```

### E2E Tests
```typescript
describe('Import Feature Flow', () => {
  test('complete import flow JSON')
  test('complete import flow CSV')
  test('complete import flow TXT')
  test('error handling invalid file')
  test('partial import with errors')
  test('navigation after import')
})
```

## Monitoring & Logging

### Import Metrics
- File format distribution
- Success/failure rates
- Average import size
- Error types frequency
- Time to complete import

### Error Tracking
- Parse failures by format
- Validation error patterns
- User abandonment points
- File size violations
- Category normalization frequency
