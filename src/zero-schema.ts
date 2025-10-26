export const schema = {
  version: 7,
  tables: {
    users: {
      tableName: 'users' as const,
      primaryKey: ['id'] as const,
      columns: {
        id: { type: 'string' as const },
        email: { type: 'string' as const },
        name: { type: 'string' as const },
        createdAt: { type: 'number' as const },
      },
      relationships: {
        groceryItems: {
          source: 'id' as const,
          dest: {
            field: 'user_id' as const,
            schema: () => schema.tables.grocery_items,
          },
        },
        ownedLists: {
          source: 'id' as const,
          dest: {
            field: 'owner_id' as const,
            schema: () => schema.tables.lists,
          },
        },
        listMemberships: {
          source: 'id' as const,
          dest: {
            field: 'user_id' as const,
            schema: () => schema.tables.list_members,
          },
        },
      },
    },
    lists: {
      tableName: 'lists' as const,
      primaryKey: ['id'] as const,
      columns: {
        id: { type: 'string' as const },
        name: { type: 'string' as const },
        owner_id: { type: 'string' as const },
        color: { type: 'string' as const },
        icon: { type: 'string' as const },
        is_archived: { type: 'boolean' as const },
        archived_at: { type: 'number' as const },
        createdAt: { type: 'number' as const },
        updatedAt: { type: 'number' as const },
      },
      relationships: {
        owner: {
          source: 'owner_id' as const,
          dest: {
            field: 'id' as const,
            schema: () => schema.tables.users,
          },
        },
        items: {
          source: 'id' as const,
          dest: {
            field: 'list_id' as const,
            schema: () => schema.tables.grocery_items,
          },
        },
        members: {
          source: 'id' as const,
          dest: {
            field: 'list_id' as const,
            schema: () => schema.tables.list_members,
          },
        },
      },
    },
    list_members: {
      tableName: 'list_members' as const,
      primaryKey: ['id'] as const,
      columns: {
        id: { type: 'string' as const },
        list_id: { type: 'string' as const },
        user_id: { type: 'string' as const },
        user_email: { type: 'string' as const },
        user_name: { type: 'string' as const },
        permission: { type: 'string' as const },
        added_at: { type: 'number' as const },
        added_by: { type: 'string' as const },
      },
      relationships: {
        list: {
          source: 'list_id' as const,
          dest: {
            field: 'id' as const,
            schema: () => schema.tables.lists,
          },
        },
        user: {
          source: 'user_id' as const,
          dest: {
            field: 'id' as const,
            schema: () => schema.tables.users,
          },
        },
      },
    },
    grocery_items: {
      tableName: 'grocery_items' as const,
      primaryKey: ['id'] as const,
      columns: {
        id: { type: 'string' as const },
        name: { type: 'string' as const },
        quantity: { type: 'number' as const },
        gotten: { type: 'boolean' as const },
        category: { type: 'string' as const },
        notes: { type: 'string' as const },
        user_id: { type: 'string' as const },
        list_id: { type: 'string' as const },
        createdAt: { type: 'number' as const },
      },
      relationships: {
        user: {
          source: 'user_id' as const,
          dest: {
            field: 'id' as const,
            schema: () => schema.tables.users,
          },
        },
        list: {
          source: 'list_id' as const,
          dest: {
            field: 'id' as const,
            schema: () => schema.tables.lists,
          },
        },
      },
    },
    list_pins: {
      tableName: 'list_pins' as const,
      primaryKey: ['user_id', 'list_id'] as const,
      columns: {
        user_id: { type: 'string' as const },
        list_id: { type: 'string' as const },
        pinned_at: { type: 'number' as const },
      },
      relationships: {
        user: {
          source: 'user_id' as const,
          dest: {
            field: 'id' as const,
            schema: () => schema.tables.users,
          },
        },
        list: {
          source: 'list_id' as const,
          dest: {
            field: 'id' as const,
            schema: () => schema.tables.lists,
          },
        },
      },
    },
  },
} as const;

export type Schema = typeof schema;
