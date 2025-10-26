export const schema = {
  version: 7,
  tables: {
    users: {
      tableName: 'users',
      primaryKey: ['id'],
      columns: {
        id: { type: 'string' },
        email: { type: 'string' },
        name: { type: 'string' },
        createdAt: { type: 'number' },
      },
      relationships: {
        groceryItems: {
          sourceField: ['id'],
          destField: ['user_id'],
          destSchema: 'grocery_items',
        },
        ownedLists: {
          sourceField: ['id'],
          destField: ['owner_id'],
          destSchema: 'lists',
        },
        listMemberships: {
          sourceField: ['id'],
          destField: ['user_id'],
          destSchema: 'list_members',
        },
      },
    },
    lists: {
      tableName: 'lists',
      primaryKey: ['id'],
      columns: {
        id: { type: 'string' },
        name: { type: 'string' },
        owner_id: { type: 'string' },
        color: { type: 'string' },
        icon: { type: 'string' },
        is_archived: { type: 'boolean' },
        archived_at: { type: 'number' },
        createdAt: { type: 'number' },
        updatedAt: { type: 'number' },
      },
      relationships: {
        owner: {
          sourceField: ['owner_id'],
          destField: ['id'],
          destSchema: 'users',
        },
        items: {
          sourceField: ['id'],
          destField: ['list_id'],
          destSchema: 'grocery_items',
        },
        members: {
          sourceField: ['id'],
          destField: ['list_id'],
          destSchema: 'list_members',
        },
      },
    },
    list_members: {
      tableName: 'list_members',
      primaryKey: ['id'],
      columns: {
        id: { type: 'string' },
        list_id: { type: 'string' },
        user_id: { type: 'string' },
        user_email: { type: 'string' },
        user_name: { type: 'string' },
        permission: { type: 'string' },
        added_at: { type: 'number' },
        added_by: { type: 'string' },
      },
      relationships: {
        list: {
          sourceField: ['list_id'],
          destField: ['id'],
          destSchema: 'lists',
        },
        user: {
          sourceField: ['user_id'],
          destField: ['id'],
          destSchema: 'users',
        },
      },
    },
    grocery_items: {
      tableName: 'grocery_items',
      primaryKey: ['id'],
      columns: {
        id: { type: 'string' },
        name: { type: 'string' },
        quantity: { type: 'number' },
        gotten: { type: 'boolean' },
        category: { type: 'string' },
        notes: { type: 'string' },
        user_id: { type: 'string' },
        list_id: { type: 'string' },
        createdAt: { type: 'number' },
      },
      relationships: {
        user: {
          sourceField: ['user_id'],
          destField: ['id'],
          destSchema: 'users',
        },
        list: {
          sourceField: ['list_id'],
          destField: ['id'],
          destSchema: 'lists',
        },
      },
    },
    list_pins: {
      tableName: 'list_pins',
      primaryKey: ['user_id', 'list_id'],
      columns: {
        user_id: { type: 'string' },
        list_id: { type: 'string' },
        pinned_at: { type: 'number' },
      },
      relationships: {
        user: {
          sourceField: ['user_id'],
          destField: ['id'],
          destSchema: 'users',
        },
        list: {
          sourceField: ['list_id'],
          destField: ['id'],
          destSchema: 'lists',
        },
      },
    },
  },
} as const;

export type Schema = typeof schema;
