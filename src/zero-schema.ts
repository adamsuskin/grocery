export const schema = {
  version: 2,
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
        createdAt: { type: 'number' },
      },
      relationships: {},
    },
  },
} as const;

export type Schema = typeof schema;
