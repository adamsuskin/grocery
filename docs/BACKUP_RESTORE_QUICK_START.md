# Category Backup & Restore - Quick Start Guide

Get started with backing up and restoring your custom categories in minutes.

## Table of Contents

1. [Creating a Backup](#creating-a-backup)
2. [Restoring from Backup](#restoring-from-backup)
3. [Using Automatic Backups](#using-automatic-backups)
4. [Handling Conflicts](#handling-conflicts)
5. [Common Tasks](#common-tasks)

---

## Creating a Backup

### Manual Export

1. Open the Custom Category Manager
2. Click the **"Backup/Restore"** button
3. Click **"Export Backup"** card
4. Your categories are downloaded as a JSON file

**What you get:**
- JSON file with all your categories
- Category names, colors, and icons
- Item counts per category
- Timestamp and list information

**File naming:**
```
categories-my-grocery-list-2024-01-15.json
```

---

## Restoring from Backup

### Basic Import

1. Open the Custom Category Manager
2. Click **"Backup/Restore"** button
3. Click **"Restore Backup"** card
4. Click **"Choose File"** and select your backup JSON
5. Click **"Preview Import"**
6. Review the categories
7. Click **"Confirm Import"**

**That's it!** Your categories are restored.

---

## Using Automatic Backups

### How It Works

Categories are automatically backed up to your browser:
- After adding a category
- After updating a category
- After deleting categories
- Stores last 5 backups per list

### Viewing Backup History

1. Open **Backup/Restore** dialog
2. Click **"Backup History"** card
3. See all automatic backups with:
   - List name
   - Date and time
   - Number of categories

### Restoring from History

1. Find the backup you want
2. Click **"Restore"** button
3. Confirm the restore
4. Done!

---

## Handling Conflicts

When importing, you might have categories with the same name. Choose how to handle them:

### Skip (Recommended)
- **What it does**: Keeps your existing categories, skips duplicates
- **Use when**: You want to be safe and not overwrite anything
- **Example**: You have "Organic" already, importing won't change it

### Overwrite
- **What it does**: Replaces existing categories with imported ones
- **Use when**: Restoring your own backup and want exact copy
- **Example**: You have "Organic" (red), importing makes it green (from backup)

### Rename
- **What it does**: Imports as new categories with "(Imported)" suffix
- **Use when**: You want to keep both versions
- **Example**: You have "Organic", importing creates "Organic (Imported)"

### Merge
- **What it does**: Updates color/icon of existing categories
- **Use when**: You want to update properties but keep names
- **Example**: You have "Organic" (red), importing updates it to green

---

## Common Tasks

### Task 1: Backup Before Making Changes

```
1. Open Custom Category Manager
2. Click "Backup/Restore"
3. Click "Export Backup"
4. Make your changes
5. If something goes wrong, restore from the file
```

### Task 2: Transfer Categories to Another Device

```
1. On Device A:
   - Export your categories
   - Save the JSON file to cloud storage or email it

2. On Device B:
   - Download the JSON file
   - Import through "Restore Backup"
   - Use "Skip" resolution to keep existing categories
```

### Task 3: Recover Deleted Categories

```
1. Click "Backup/Restore"
2. Click "Backup History"
3. Find a backup from before deletion
4. Click "Restore"
5. Use "Skip" to only restore deleted ones
```

### Task 4: Merge Categories from Two Lists

```
1. Export categories from List A
2. Go to List B
3. Import the file with "Rename" resolution
4. You now have categories from both lists
5. Manually merge duplicates if needed
```

### Task 5: Update Category Colors in Bulk

```
1. Export your categories
2. Open JSON file in text editor
3. Find and replace colors (e.g., "#FF5733")
4. Save the file
5. Import with "Merge" resolution
6. Colors are updated!
```

---

## Tips & Tricks

### Tip 1: Regular Exports
Export your categories monthly and keep the files. It's your safety net!

### Tip 2: Naming Convention
When exporting manually, add a note to the filename:
```
categories-grocery-BEFORE-CLEANUP-2024-01-15.json
```

### Tip 3: Check Automatic Backups
Glance at backup history occasionally to ensure auto-backup is working.

### Tip 4: Clean Old Backups
Delete old automatic backups you don't need to save browser storage.

### Tip 5: Preview Before Import
Always preview imports to see what will happen before confirming.

---

## Troubleshooting

### Problem: "Invalid backup file format"

**Solutions:**
- Make sure you selected a JSON file
- Check the file isn't corrupted
- Try exporting a fresh backup and compare formats

### Problem: Import does nothing

**Solutions:**
- Check you clicked "Confirm Import" (not just "Preview")
- Verify conflict resolution is selected
- Look for error messages at top of dialog

### Problem: Categories are duplicated

**Solutions:**
- You likely used "Rename" resolution
- Delete the duplicates manually
- Or restore from backup with "Overwrite"

### Problem: Lost automatic backups

**Solutions:**
- Check if browser data was cleared
- Automatic backups are browser-specific (not synced)
- Keep manual exports for important backups

---

## Configuration

### Adjusting Automatic Backups

1. Click **"Backup/Restore"**
2. Click **"Settings"** card
3. Configure:
   - **Enable automatic backups**: Toggle on/off
   - **Maximum backups to keep**: 1-10 (default: 5)
4. Click **"Save Settings"**

**Recommendations:**
- Keep auto-backup enabled
- Use 5 backups for normal use
- Use 10 if you change categories frequently

---

## Best Practices

1. **Export before major changes**
   - Deleting multiple categories
   - Bulk color changes
   - Merging categories

2. **Name your exports descriptively**
   - Include the date
   - Add a note about what it contains

3. **Store backups safely**
   - Cloud storage
   - Email to yourself
   - USB drive

4. **Test imports**
   - Try importing in a test list first
   - Verify it works as expected
   - Then use in production

5. **Review before confirming**
   - Check preview carefully
   - Understand conflict resolution
   - Count expected imports

---

## Need More Help?

- **Full Documentation**: See `CATEGORY_BACKUP_RESTORE.md`
- **API Reference**: Check the full docs for programmatic usage
- **Examples**: Review test files for code examples
- **Support**: Check browser console for detailed error messages

---

## Quick Reference

### File Format
```json
{
  "version": "1.0",
  "listId": "abc-123",
  "listName": "My List",
  "categories": [
    {
      "name": "Gluten-Free",
      "color": "#FF5733",
      "icon": "🌾"
    }
  ]
}
```

### Conflict Resolutions
| Strategy | Effect |
|----------|--------|
| Skip | Keep existing, ignore imports |
| Overwrite | Replace existing with imports |
| Rename | Create new with "(Imported)" |
| Merge | Update properties only |

### Storage Limits
- Manual exports: No limit (files on disk)
- Automatic backups: 5 per list (configurable)
- Max file size: 5MB
- Storage: Browser localStorage

---

**Happy Backing Up!** 🎉
