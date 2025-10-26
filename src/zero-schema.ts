export const schema = {
  version: 13,
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
        budget: { type: 'number' as const },
        currency: { type: 'string' as const },
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
        updated_at: { type: 'number' as const },
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
        price: { type: 'number' as const },
        user_id: { type: 'string' as const },
        list_id: { type: 'string' as const },
        createdAt: { type: 'number' as const },
        updatedAt: { type: 'number' as const },
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
    custom_categories: {
      tableName: 'custom_categories' as const,
      primaryKey: ['id'] as const,
      columns: {
        id: { type: 'string' as const },
        name: { type: 'string' as const },
        list_id: { type: 'string' as const },
        created_by: { type: 'string' as const },
        color: { type: 'string' as const },
        icon: { type: 'string' as const },
        display_order: { type: 'number' as const },
        is_archived: { type: 'boolean' as const },
        archived_at: { type: 'number' as const },
        is_locked: { type: 'boolean' as const },
        last_edited_by: { type: 'string' as const },
        createdAt: { type: 'number' as const },
        updatedAt: { type: 'number' as const },
      },
      relationships: {
        list: {
          source: 'list_id' as const,
          dest: {
            field: 'id' as const,
            schema: () => schema.tables.lists,
          },
        },
        creator: {
          source: 'created_by' as const,
          dest: {
            field: 'id' as const,
            schema: () => schema.tables.users,
          },
        },
        lastEditor: {
          source: 'last_edited_by' as const,
          dest: {
            field: 'id' as const,
            schema: () => schema.tables.users,
          },
        },
      },
    },
    category_suggestions: {
      tableName: 'category_suggestions' as const,
      primaryKey: ['id'] as const,
      columns: {
        id: { type: 'string' as const },
        list_id: { type: 'string' as const },
        suggested_by: { type: 'string' as const },
        name: { type: 'string' as const },
        color: { type: 'string' as const },
        icon: { type: 'string' as const },
        reason: { type: 'string' as const },
        status: { type: 'string' as const },
        reviewed_by: { type: 'string' as const },
        reviewed_at: { type: 'number' as const },
        createdAt: { type: 'number' as const },
        updatedAt: { type: 'number' as const },
      },
      relationships: {
        list: {
          source: 'list_id' as const,
          dest: {
            field: 'id' as const,
            schema: () => schema.tables.lists,
          },
        },
        suggester: {
          source: 'suggested_by' as const,
          dest: {
            field: 'id' as const,
            schema: () => schema.tables.users,
          },
        },
        reviewer: {
          source: 'reviewed_by' as const,
          dest: {
            field: 'id' as const,
            schema: () => schema.tables.users,
          },
        },
      },
    },
    category_comments: {
      tableName: 'category_comments' as const,
      primaryKey: ['id'] as const,
      columns: {
        id: { type: 'string' as const },
        category_id: { type: 'string' as const },
        user_id: { type: 'string' as const },
        comment_text: { type: 'string' as const },
        parent_id: { type: 'string' as const },
        createdAt: { type: 'number' as const },
        updatedAt: { type: 'number' as const },
      },
      relationships: {
        category: {
          source: 'category_id' as const,
          dest: {
            field: 'id' as const,
            schema: () => schema.tables.custom_categories,
          },
        },
        user: {
          source: 'user_id' as const,
          dest: {
            field: 'id' as const,
            schema: () => schema.tables.users,
          },
        },
        parent: {
          source: 'parent_id' as const,
          dest: {
            field: 'id' as const,
            schema: () => schema.tables.category_comments,
          },
        },
      },
    },
    category_votes: {
      tableName: 'category_votes' as const,
      primaryKey: ['id'] as const,
      columns: {
        id: { type: 'string' as const },
        category_id: { type: 'string' as const },
        user_id: { type: 'string' as const },
        vote_type: { type: 'string' as const },
        createdAt: { type: 'number' as const },
        updatedAt: { type: 'number' as const },
      },
      relationships: {
        category: {
          source: 'category_id' as const,
          dest: {
            field: 'id' as const,
            schema: () => schema.tables.custom_categories,
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
    category_suggestion_votes: {
      tableName: 'category_suggestion_votes' as const,
      primaryKey: ['id'] as const,
      columns: {
        id: { type: 'string' as const },
        suggestion_id: { type: 'string' as const },
        user_id: { type: 'string' as const },
        vote_type: { type: 'string' as const },
        createdAt: { type: 'number' as const },
      },
      relationships: {
        suggestion: {
          source: 'suggestion_id' as const,
          dest: {
            field: 'id' as const,
            schema: () => schema.tables.category_suggestions,
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
    recipes: {
      tableName: 'recipes' as const,
      primaryKey: ['id'] as const,
      columns: {
        id: { type: 'string' as const },
        name: { type: 'string' as const },
        description: { type: 'string' as const, optional: true },
        instructions: { type: 'string' as const },
        prepTime: { type: 'number' as const, optional: true },
        cookTime: { type: 'number' as const, optional: true },
        servings: { type: 'number' as const },
        difficulty: { type: 'string' as const, optional: true },
        cuisineType: { type: 'string' as const, optional: true },
        imageUrl: { type: 'string' as const, optional: true },
        userId: { type: 'string' as const },
        listId: { type: 'string' as const, optional: true },
        isPublic: { type: 'boolean' as const },
        createdAt: { type: 'number' as const },
        updatedAt: { type: 'number' as const },
      },
      relationships: {
        user: {
          source: 'userId' as const,
          dest: {
            field: 'id' as const,
            schema: () => schema.tables.users,
          },
        },
        list: {
          source: 'listId' as const,
          dest: {
            field: 'id' as const,
            schema: () => schema.tables.lists,
          },
        },
      },
    },
    recipe_ingredients: {
      tableName: 'recipe_ingredients' as const,
      primaryKey: ['id'] as const,
      columns: {
        id: { type: 'string' as const },
        recipeId: { type: 'string' as const },
        name: { type: 'string' as const },
        quantity: { type: 'number' as const },
        unit: { type: 'string' as const },
        notes: { type: 'string' as const, optional: true },
        category: { type: 'string' as const, optional: true },
        orderIndex: { type: 'number' as const },
        createdAt: { type: 'number' as const },
      },
      relationships: {
        recipe: {
          source: 'recipeId' as const,
          dest: {
            field: 'id' as const,
            schema: () => schema.tables.recipes,
          },
        },
      },
    },
    meal_plans: {
      tableName: 'meal_plans' as const,
      primaryKey: ['id'] as const,
      columns: {
        id: { type: 'string' as const },
        userId: { type: 'string' as const },
        listId: { type: 'string' as const, optional: true },
        recipeId: { type: 'string' as const },
        plannedDate: { type: 'number' as const },
        mealType: { type: 'string' as const },
        servings: { type: 'number' as const },
        notes: { type: 'string' as const, optional: true },
        isCooked: { type: 'boolean' as const },
        createdAt: { type: 'number' as const },
        updatedAt: { type: 'number' as const },
      },
      relationships: {
        user: {
          source: 'userId' as const,
          dest: {
            field: 'id' as const,
            schema: () => schema.tables.users,
          },
        },
        list: {
          source: 'listId' as const,
          dest: {
            field: 'id' as const,
            schema: () => schema.tables.lists,
          },
        },
        recipe: {
          source: 'recipeId' as const,
          dest: {
            field: 'id' as const,
            schema: () => schema.tables.recipes,
          },
        },
      },
    },
    recipe_collections: {
      tableName: 'recipe_collections' as const,
      primaryKey: ['id'] as const,
      columns: {
        id: { type: 'string' as const },
        userId: { type: 'string' as const },
        name: { type: 'string' as const },
        description: { type: 'string' as const, optional: true },
        isPublic: { type: 'boolean' as const },
        createdAt: { type: 'number' as const },
        updatedAt: { type: 'number' as const },
      },
      relationships: {
        user: {
          source: 'userId' as const,
          dest: {
            field: 'id' as const,
            schema: () => schema.tables.users,
          },
        },
      },
    },
    recipe_collection_items: {
      tableName: 'recipe_collection_items' as const,
      primaryKey: ['collectionId', 'recipeId'] as const,
      columns: {
        collectionId: { type: 'string' as const },
        recipeId: { type: 'string' as const },
        addedAt: { type: 'number' as const },
      },
      relationships: {
        collection: {
          source: 'collectionId' as const,
          dest: {
            field: 'id' as const,
            schema: () => schema.tables.recipe_collections,
          },
        },
        recipe: {
          source: 'recipeId' as const,
          dest: {
            field: 'id' as const,
            schema: () => schema.tables.recipes,
          },
        },
      },
    },
  },
} as const;

export type Schema = typeof schema;
