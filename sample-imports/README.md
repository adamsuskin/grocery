# Sample Import Files

This directory contains example files demonstrating the supported import formats for the grocery list application.

## Supported Formats

### 1. JSON Format (`example-list.json`)

The JSON format provides the most complete structure with all item details:

```json
{
  "name": "List Name",
  "items": [
    {
      "name": "Item Name",
      "quantity": 1,
      "category": "Category",
      "notes": "Optional notes"
    }
  ]
}
```

**Features:**
- Full control over all item properties
- Structured data with validation
- Supports list name and item notes

### 2. CSV Format (`example-list.csv`)

CSV format for spreadsheet compatibility:

```csv
name,quantity,category,notes
Milk,2,Dairy,Whole milk
Apples,6,Produce,
```

**Features:**
- Easy to create in Excel or Google Sheets
- Header row (name, quantity, category, notes)
- Empty fields allowed
- List name derived from filename

### 3. Plain Text Format (`example-list.txt`)

Simple line-by-line format:

```
Milk
2 Apples
3x Bananas
```

**Features:**
- Simplest format - just item names
- Optional quantity prefix (e.g., "2 Apples" or "3x Bananas")
- All items default to "Other" category
- List name derived from filename

## Valid Categories

- Produce
- Dairy
- Meat
- Bakery
- Pantry
- Frozen
- Beverages
- Other (default)

## File Size Limit

Maximum file size: 5MB

## Usage

1. Click the "Import" button in the List Dashboard
2. Select or drag-and-drop a file
3. Preview the imported items
4. Edit the list name if needed
5. Click "Import List" to create the list

## Error Handling

The import system provides:
- **Validation**: Checks for proper format and required fields
- **Warnings**: Notifies about category normalization or missing data
- **Error messages**: Clear feedback for invalid items
- **Partial imports**: Successfully imports valid items even if some fail
