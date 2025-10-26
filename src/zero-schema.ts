export const schema = {
  version: 1,
  tables: {
    grocery_items: {
      tableName: 'grocery_items',
      primaryKey: ['id'],
      columns: {
        id: { type: 'string' },
        name: { type: 'string' },
        quantity: { type: 'number' },
        gotten: { type: 'boolean' },
        createdAt: { type: 'number' },
      },
      relationships: {},
    },
  },
} as const;

export type Schema = typeof schema;
