export const schema = {
  version: 4,
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
        createdAt: { type: 'number' },
      },
      relationships: {
        user: {
          sourceField: ['user_id'],
          destField: ['id'],
          destSchema: 'users',
        },
      },
    },
  },
} as const;

export type Schema = typeof schema;
