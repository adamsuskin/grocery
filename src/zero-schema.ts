export const schema = {
  version: 3,
  tables: {
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
        createdAt: { type: 'number' },
      },
      relationships: {},
    },
  },
} as const;

export type Schema = typeof schema;
