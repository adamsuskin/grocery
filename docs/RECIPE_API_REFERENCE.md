# 🔌 Recipe Integration API Reference

**Version:** 1.0
**Base URL:** `http://localhost:3001/api` (development)
**Authentication:** Bearer Token (JWT)
**Last Updated:** October 2025

## 📋 Table of Contents

1. [Authentication](#-authentication)
2. [Recipe Endpoints](#-recipe-endpoints)
3. [Meal Plan Endpoints](#-meal-plan-endpoints)
4. [Collection Endpoints](#-collection-endpoints)
5. [Error Handling](#-error-handling)
6. [Rate Limiting](#-rate-limiting)
7. [Pagination](#-pagination)
8. [Query Parameters](#-query-parameters)
9. [Example Code](#-example-code)
10. [Postman Collection](#-postman-collection)

---

## 🔐 Authentication

All recipe endpoints require authentication via JWT Bearer token.

### Getting a Token

1. **Register a user:**
```bash
POST /api/auth/register
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

2. **Login:**
```bash
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-uuid",
      "username": "john_doe",
      "email": "john@example.com"
    }
  }
}
```

### Using the Token

Include the token in all subsequent requests:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🍳 Recipe Endpoints

### 1. Create Recipe

Create a new recipe with ingredients.

**Endpoint:** `POST /api/recipes`

**Auth Required:** Yes

**Request Body:**
```json
{
  "title": "Classic Spaghetti Carbonara",
  "description": "Authentic Italian pasta dish with eggs, cheese, and pancetta",
  "instructions": "1. Cook pasta in salted boiling water\n2. Fry pancetta until crispy\n3. Mix eggs with grated cheese\n4. Combine hot pasta with egg mixture\n5. Add pancetta and serve immediately",
  "prep_time": 10,
  "cook_time": 20,
  "servings": 4,
  "difficulty": "medium",
  "cuisine_type": "Italian",
  "image_url": "https://example.com/carbonara.jpg",
  "is_public": false,
  "ingredients": [
    {
      "name": "Spaghetti",
      "quantity": "400",
      "unit": "g",
      "category": "Pantry"
    },
    {
      "name": "Eggs",
      "quantity": "4",
      "unit": "whole",
      "category": "Dairy",
      "notes": "room temperature"
    },
    {
      "name": "Pancetta",
      "quantity": "200",
      "unit": "g",
      "category": "Meat",
      "notes": "diced"
    },
    {
      "name": "Parmesan cheese",
      "quantity": "100",
      "unit": "g",
      "category": "Dairy",
      "notes": "freshly grated"
    }
  ]
}
```

**Validation Rules:**
- `title`: Required, 1-255 characters
- `description`: Optional, any length
- `instructions`: Optional, any length
- `prep_time`: Optional, non-negative integer (minutes)
- `cook_time`: Optional, non-negative integer (minutes)
- `servings`: Optional, positive integer (default: 4)
- `difficulty`: Optional, enum: "easy" | "medium" | "hard"
- `cuisine_type`: Optional, string
- `image_url`: Optional, valid URL
- `is_public`: Optional, boolean (default: false)
- `ingredients`: Optional, array of ingredient objects
- `ingredients[].name`: Required if ingredients provided
- `ingredients[].quantity`: Optional, string
- `ingredients[].unit`: Optional, string
- `ingredients[].category`: Optional, string
- `ingredients[].notes`: Optional, string

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "recipe": {
      "id": "recipe-uuid",
      "user_id": "user-uuid",
      "title": "Classic Spaghetti Carbonara",
      "description": "Authentic Italian pasta dish with eggs, cheese, and pancetta",
      "instructions": "1. Cook pasta in salted boiling water\n2. Fry pancetta until crispy...",
      "prep_time": 10,
      "cook_time": 20,
      "servings": 4,
      "difficulty": "medium",
      "cuisine_type": "Italian",
      "image_url": "https://example.com/carbonara.jpg",
      "is_public": false,
      "created_at": "2025-10-26T10:30:00.000Z",
      "updated_at": "2025-10-26T10:30:00.000Z",
      "ingredients": [
        {
          "id": "ingredient-uuid-1",
          "recipe_id": "recipe-uuid",
          "name": "Spaghetti",
          "quantity": "400",
          "unit": "g",
          "category": "Pantry",
          "order_index": 0
        },
        {
          "id": "ingredient-uuid-2",
          "recipe_id": "recipe-uuid",
          "name": "Eggs",
          "quantity": "4",
          "unit": "whole",
          "category": "Dairy",
          "notes": "room temperature",
          "order_index": 1
        }
        // ... more ingredients
      ]
    }
  }
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Unauthorized (missing/invalid token)
- `500` - Server error

**curl Example:**
```bash
curl -X POST http://localhost:3001/api/recipes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Classic Spaghetti Carbonara",
    "servings": 4,
    "difficulty": "medium",
    "ingredients": [
      {"name": "Spaghetti", "quantity": "400", "unit": "g", "category": "Pantry"}
    ]
  }'
```

---

### 2. Get User's Recipes

Retrieve all recipes for the authenticated user.

**Endpoint:** `GET /api/recipes`

**Auth Required:** Yes

**Query Parameters:**
- `is_public` (optional): Filter by public/private status
  - Values: "true" | "false"
  - Example: `?is_public=true`
- `search` (optional): Search in title and description
  - Example: `?search=pasta`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "recipes": [
      {
        "id": "recipe-uuid",
        "user_id": "user-uuid",
        "title": "Classic Spaghetti Carbonara",
        "description": "Authentic Italian pasta dish",
        "instructions": "1. Cook pasta...",
        "prep_time": 10,
        "cook_time": 20,
        "servings": 4,
        "difficulty": "medium",
        "cuisine_type": "Italian",
        "image_url": "https://example.com/carbonara.jpg",
        "is_public": false,
        "created_at": "2025-10-26T10:30:00.000Z",
        "updated_at": "2025-10-26T10:30:00.000Z",
        "ingredients": [
          {
            "id": "ingredient-uuid",
            "name": "Spaghetti",
            "quantity": "400",
            "unit": "g",
            "category": "Pantry",
            "order_index": 0
          }
          // ... more ingredients
        ]
      }
      // ... more recipes
    ]
  }
}
```

**curl Example:**
```bash
# Get all recipes
curl http://localhost:3001/api/recipes \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get only public recipes
curl http://localhost:3001/api/recipes?is_public=true \
  -H "Authorization: Bearer YOUR_TOKEN"

# Search recipes
curl "http://localhost:3001/api/recipes?search=pasta" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Get Public Recipes

Browse recipes shared by all users.

**Endpoint:** `GET /api/recipes/public`

**Auth Required:** Yes

**Query Parameters:**
- `search` (optional): Search in title and description
  - Example: `?search=italian`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "recipes": [
      {
        "id": "recipe-uuid",
        "user_id": "other-user-uuid",
        "author_name": "Jane Smith",
        "title": "Margherita Pizza",
        "description": "Simple and delicious homemade pizza",
        "instructions": "1. Make dough...",
        "prep_time": 30,
        "cook_time": 15,
        "servings": 2,
        "difficulty": "medium",
        "cuisine_type": "Italian",
        "image_url": "https://example.com/pizza.jpg",
        "is_public": true,
        "created_at": "2025-10-25T14:20:00.000Z",
        "updated_at": "2025-10-25T14:20:00.000Z",
        "ingredients": [
          // ... ingredients
        ]
      }
      // ... more recipes
    ]
  }
}
```

**curl Example:**
```bash
# Browse all public recipes
curl http://localhost:3001/api/recipes/public \
  -H "Authorization: Bearer YOUR_TOKEN"

# Search public recipes
curl "http://localhost:3001/api/recipes/public?search=pizza" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. Search Recipes

Advanced search across recipes and ingredients.

**Endpoint:** `GET /api/recipes/search`

**Auth Required:** Yes

**Query Parameters:**
- `q` (required): Search query
  - Searches in: title, description, ingredient names
  - Example: `?q=chicken`
- `public_only` (optional): Only search public recipes
  - Values: "true" | "false"
  - Default: false (searches user's recipes + public)
  - Example: `?q=chicken&public_only=true`

**Validation:**
- `q`: Required, 1-100 characters

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "recipes": [
      {
        "id": "recipe-uuid",
        "author_name": "John Doe",
        "title": "Honey Garlic Chicken",
        "description": "Sweet and savory chicken dish",
        // ... full recipe details
        "ingredients": [
          // ... ingredients
        ]
      }
      // ... up to 50 results
    ],
    "query": "chicken"
  }
}
```

**curl Example:**
```bash
# Search all accessible recipes
curl "http://localhost:3001/api/recipes/search?q=chicken" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Search only public recipes
curl "http://localhost:3001/api/recipes/search?q=chicken&public_only=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 5. Get Single Recipe

Retrieve a specific recipe by ID.

**Endpoint:** `GET /api/recipes/:id`

**Auth Required:** Yes

**URL Parameters:**
- `id`: Recipe UUID

**Access Control:**
- You can view your own recipes (public or private)
- You can view other users' public recipes
- You cannot view other users' private recipes

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "recipe": {
      "id": "recipe-uuid",
      "user_id": "user-uuid",
      "title": "Classic Spaghetti Carbonara",
      // ... all recipe fields
      "ingredients": [
        // ... all ingredients with order
      ]
    }
  }
}
```

**Error Responses:**
- `404` - Recipe not found
- `403` - Not authorized to view this recipe
- `401` - Unauthorized (missing/invalid token)

**curl Example:**
```bash
curl http://localhost:3001/api/recipes/recipe-uuid \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 6. Update Recipe

Update an existing recipe.

**Endpoint:** `PUT /api/recipes/:id`

**Auth Required:** Yes (owner only)

**URL Parameters:**
- `id`: Recipe UUID

**Request Body (all fields optional):**
```json
{
  "title": "Updated Carbonara Recipe",
  "description": "Updated description",
  "instructions": "Updated instructions",
  "prep_time": 15,
  "cook_time": 25,
  "servings": 6,
  "difficulty": "easy",
  "cuisine_type": "Italian",
  "image_url": "https://example.com/new-image.jpg",
  "is_public": true,
  "ingredients": [
    {
      "name": "Spaghetti",
      "quantity": "500",
      "unit": "g",
      "category": "Pantry"
    }
    // New ingredient list replaces old one
  ]
}
```

**Notes:**
- Include only fields you want to update
- If `ingredients` is provided, it completely replaces the old ingredient list
- If `ingredients` is not provided, existing ingredients are preserved

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "recipe": {
      // ... updated recipe with all fields
      "ingredients": [
        // ... updated ingredients
      ]
    }
  }
}
```

**Error Responses:**
- `404` - Recipe not found
- `403` - Not authorized (not the owner)
- `400` - Validation error
- `401` - Unauthorized

**curl Example:**
```bash
curl -X PUT http://localhost:3001/api/recipes/recipe-uuid \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Recipe Title",
    "servings": 6
  }'
```

---

### 7. Delete Recipe

Delete a recipe and all its ingredients.

**Endpoint:** `DELETE /api/recipes/:id`

**Auth Required:** Yes (owner only)

**URL Parameters:**
- `id`: Recipe UUID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Recipe deleted successfully"
}
```

**Error Responses:**
- `404` - Recipe not found
- `403` - Not authorized (not the owner)
- `401` - Unauthorized

**Notes:**
- Deletes the recipe and all associated ingredients (CASCADE)
- Removes recipe from any collections
- Removes associated meal plans

**curl Example:**
```bash
curl -X DELETE http://localhost:3001/api/recipes/recipe-uuid \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 8. Duplicate Recipe

Create a copy of an existing recipe.

**Endpoint:** `POST /api/recipes/:id/duplicate`

**Auth Required:** Yes

**URL Parameters:**
- `id`: Recipe UUID to duplicate

**Request Body (optional):**
```json
{
  "title": "My Version of Carbonara"
}
```

**Notes:**
- If no title provided, uses "Copy of [Original Title]"
- Copies all recipe details and ingredients
- New recipe is always private (is_public = false)
- You can duplicate your own recipes or public recipes

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "recipe": {
      "id": "new-recipe-uuid",
      "user_id": "your-user-uuid",
      "title": "My Version of Carbonara",
      // ... all fields copied from original
      "is_public": false,
      "created_at": "2025-10-26T11:00:00.000Z",
      "updated_at": "2025-10-26T11:00:00.000Z",
      "ingredients": [
        // ... ingredients copied with new IDs
      ]
    }
  }
}
```

**Error Responses:**
- `404` - Original recipe not found
- `403` - Not authorized (recipe is private and not yours)
- `401` - Unauthorized

**curl Example:**
```bash
# Duplicate with default title
curl -X POST http://localhost:3001/api/recipes/recipe-uuid/duplicate \
  -H "Authorization: Bearer YOUR_TOKEN"

# Duplicate with custom title
curl -X POST http://localhost:3001/api/recipes/recipe-uuid/duplicate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "My Custom Recipe Name"}'
```

---

### 9. Toggle Recipe Visibility

Make a recipe public or private.

**Endpoint:** `PATCH /api/recipes/:id/public`

**Auth Required:** Yes (owner only)

**URL Parameters:**
- `id`: Recipe UUID

**Request Body:**
```json
{
  "is_public": true
}
```

**Validation:**
- `is_public`: Required, boolean

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "recipe": {
      "id": "recipe-uuid",
      // ... all recipe fields
      "is_public": true,
      "updated_at": "2025-10-26T11:15:00.000Z"
    }
  }
}
```

**Error Responses:**
- `404` - Recipe not found
- `403` - Not authorized (not the owner)
- `400` - Validation error
- `401` - Unauthorized

**curl Example:**
```bash
# Make recipe public
curl -X PATCH http://localhost:3001/api/recipes/recipe-uuid/public \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_public": true}'

# Make recipe private
curl -X PATCH http://localhost:3001/api/recipes/recipe-uuid/public \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_public": false}'
```

---

## 📅 Meal Plan Endpoints

### 1. Create Meal Plan

Schedule a recipe to a specific date and meal type.

**Endpoint:** `POST /api/meal-plans`

**Auth Required:** Yes

**Request Body:**
```json
{
  "recipe_id": "recipe-uuid",
  "planned_date": "2025-10-27",
  "meal_type": "dinner",
  "servings": 4,
  "notes": "Remember to buy fresh basil"
}
```

**Validation:**
- `recipe_id`: Required, valid UUID
- `planned_date`: Required, ISO 8601 date (YYYY-MM-DD)
- `meal_type`: Required, enum: "breakfast" | "lunch" | "dinner" | "snack"
- `servings`: Optional, positive integer
- `notes`: Optional, string

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "mealPlan": {
      "id": "meal-plan-uuid",
      "user_id": "user-uuid",
      "recipe_id": "recipe-uuid",
      "planned_date": "2025-10-27",
      "meal_type": "dinner",
      "servings": 4,
      "notes": "Remember to buy fresh basil",
      "is_cooked": false,
      "created_at": "2025-10-26T11:30:00.000Z",
      "updated_at": "2025-10-26T11:30:00.000Z"
    }
  }
}
```

**Error Responses:**
- `404` - Recipe not found or not accessible
- `400` - Validation error
- `401` - Unauthorized

**curl Example:**
```bash
curl -X POST http://localhost:3001/api/meal-plans \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipe_id": "recipe-uuid",
    "planned_date": "2025-10-27",
    "meal_type": "dinner",
    "servings": 4
  }'
```

---

### 2. Get Meal Plans

Retrieve meal plans with optional filtering.

**Endpoint:** `GET /api/meal-plans`

**Auth Required:** Yes

**Query Parameters:**
- `start_date` (optional): Filter from this date (ISO 8601)
  - Example: `?start_date=2025-10-27`
- `end_date` (optional): Filter until this date (ISO 8601)
  - Example: `?end_date=2025-11-02`
- `is_cooked` (optional): Filter by cooked status
  - Values: "true" | "false"
  - Example: `?is_cooked=false`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "mealPlans": [
      {
        "id": "meal-plan-uuid",
        "user_id": "user-uuid",
        "recipe_id": "recipe-uuid",
        "planned_date": "2025-10-27",
        "meal_type": "dinner",
        "servings": 4,
        "notes": "Remember to buy fresh basil",
        "is_cooked": false,
        "created_at": "2025-10-26T11:30:00.000Z",
        "updated_at": "2025-10-26T11:30:00.000Z",
        "recipe_title": "Classic Spaghetti Carbonara",
        "recipe_image_url": "https://example.com/carbonara.jpg",
        "prep_time": 10,
        "cook_time": 20,
        "ingredients": [
          {
            "id": "ingredient-uuid",
            "name": "Spaghetti",
            "quantity": "400",
            "unit": "g",
            "category": "Pantry"
          }
          // ... more ingredients
        ]
      }
      // ... more meal plans
    ]
  }
}
```

**curl Example:**
```bash
# Get all meal plans
curl http://localhost:3001/api/meal-plans \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get meal plans for a specific week
curl "http://localhost:3001/api/meal-plans?start_date=2025-10-27&end_date=2025-11-02" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get uncooked meals
curl "http://localhost:3001/api/meal-plans?is_cooked=false" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Get Single Meal Plan

Retrieve a specific meal plan by ID.

**Endpoint:** `GET /api/meal-plans/:id`

**Auth Required:** Yes (owner only)

**URL Parameters:**
- `id`: Meal plan UUID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "mealPlan": {
      "id": "meal-plan-uuid",
      // ... meal plan fields
      "recipe_title": "Classic Spaghetti Carbonara",
      "recipe_description": "Authentic Italian pasta dish",
      "recipe_instructions": "1. Cook pasta...",
      "recipe_image_url": "https://example.com/carbonara.jpg",
      "prep_time": 10,
      "cook_time": 20,
      "ingredients": [
        // ... full ingredient list
      ]
    }
  }
}
```

**Error Responses:**
- `404` - Meal plan not found
- `403` - Not authorized
- `401` - Unauthorized

**curl Example:**
```bash
curl http://localhost:3001/api/meal-plans/meal-plan-uuid \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. Update Meal Plan

Update an existing meal plan.

**Endpoint:** `PUT /api/meal-plans/:id`

**Auth Required:** Yes (owner only)

**URL Parameters:**
- `id`: Meal plan UUID

**Request Body (all fields optional):**
```json
{
  "planned_date": "2025-10-28",
  "meal_type": "lunch",
  "servings": 6,
  "notes": "Updated notes",
  "is_cooked": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "mealPlan": {
      // ... updated meal plan
    }
  }
}
```

**Error Responses:**
- `404` - Meal plan not found
- `403` - Not authorized
- `400` - Validation error (no fields to update)
- `401` - Unauthorized

**curl Example:**
```bash
curl -X PUT http://localhost:3001/api/meal-plans/meal-plan-uuid \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planned_date": "2025-10-28",
    "servings": 6
  }'
```

---

### 5. Delete Meal Plan

Delete a meal plan.

**Endpoint:** `DELETE /api/meal-plans/:id`

**Auth Required:** Yes (owner only)

**URL Parameters:**
- `id`: Meal plan UUID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Meal plan deleted successfully"
}
```

**Error Responses:**
- `404` - Meal plan not found
- `403` - Not authorized
- `401` - Unauthorized

**curl Example:**
```bash
curl -X DELETE http://localhost:3001/api/meal-plans/meal-plan-uuid \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 6. Mark Meal as Cooked

Toggle the cooked status of a meal.

**Endpoint:** `PATCH /api/meal-plans/:id/cooked`

**Auth Required:** Yes (owner only)

**URL Parameters:**
- `id`: Meal plan UUID

**Request Body:**
```json
{
  "is_cooked": true
}
```

**Validation:**
- `is_cooked`: Required, boolean

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "mealPlan": {
      // ... meal plan with updated is_cooked
    }
  }
}
```

**curl Example:**
```bash
# Mark as cooked
curl -X PATCH http://localhost:3001/api/meal-plans/meal-plan-uuid/cooked \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_cooked": true}'

# Mark as not cooked
curl -X PATCH http://localhost:3001/api/meal-plans/meal-plan-uuid/cooked \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_cooked": false}'
```

---

### 7. Generate Shopping List

Generate a shopping list from meal plans in a date range.

**Endpoint:** `POST /api/meal-plans/generate-list`

**Auth Required:** Yes

**Request Body:**
```json
{
  "start_date": "2025-10-27",
  "end_date": "2025-11-02",
  "list_id": "list-uuid"
}
```

**Validation:**
- `start_date`: Required, ISO 8601 date
- `end_date`: Required, ISO 8601 date
- `start_date` must be <= `end_date`
- `list_id`: Optional, UUID of existing grocery list

**Behavior:**
- Collects all ingredients from uncooked meals in date range
- Aggregates duplicate ingredients by name and category
- If `list_id` provided: adds ingredients to that list
- If `list_id` not provided: returns ingredient list only

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "ingredients": [
      {
        "name": "Spaghetti",
        "quantity": "400 + 500",
        "unit": "g",
        "category": "Pantry",
        "count": 2
      },
      {
        "name": "Eggs",
        "quantity": "4 + 6",
        "unit": "whole",
        "category": "Dairy",
        "count": 2
      }
      // ... more aggregated ingredients
    ],
    "addedToList": true,
    "listId": "list-uuid",
    "message": "12 ingredients added to shopping list"
  }
}
```

**If no meal plans found:**
```json
{
  "success": true,
  "data": {
    "ingredients": [],
    "message": "No meal plans found for the specified date range"
  }
}
```

**Error Responses:**
- `404` - List not found or not accessible
- `400` - Validation error (invalid dates, start > end)
- `401` - Unauthorized

**curl Example:**
```bash
# Generate and preview
curl -X POST http://localhost:3001/api/meal-plans/generate-list \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2025-10-27",
    "end_date": "2025-11-02"
  }'

# Generate and add to list
curl -X POST http://localhost:3001/api/meal-plans/generate-list \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2025-10-27",
    "end_date": "2025-11-02",
    "list_id": "list-uuid"
  }'
```

---

## 📚 Collection Endpoints

### 1. Create Collection

Create a new recipe collection.

**Endpoint:** `POST /api/collections`

**Auth Required:** Yes

**Request Body:**
```json
{
  "name": "Italian Favorites",
  "description": "My favorite Italian recipes from Nonna's cookbook"
}
```

**Validation:**
- `name`: Required, 1-255 characters, must be unique per user
- `description`: Optional, any length

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "collection": {
      "id": "collection-uuid",
      "user_id": "user-uuid",
      "name": "Italian Favorites",
      "description": "My favorite Italian recipes from Nonna's cookbook",
      "created_at": "2025-10-26T12:00:00.000Z",
      "updated_at": "2025-10-26T12:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `400` - Validation error (name already exists, name too long)
- `401` - Unauthorized

**curl Example:**
```bash
curl -X POST http://localhost:3001/api/collections \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Italian Favorites",
    "description": "Classic Italian recipes"
  }'
```

---

### 2. Get Collections

Retrieve all collections for the authenticated user.

**Endpoint:** `GET /api/collections`

**Auth Required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "collections": [
      {
        "id": "collection-uuid",
        "user_id": "user-uuid",
        "name": "Italian Favorites",
        "description": "My favorite Italian recipes",
        "created_at": "2025-10-26T12:00:00.000Z",
        "updated_at": "2025-10-26T12:00:00.000Z",
        "recipe_count": "5"
      },
      {
        "id": "collection-uuid-2",
        "user_id": "user-uuid",
        "name": "Quick Meals",
        "description": "Recipes under 30 minutes",
        "created_at": "2025-10-25T10:00:00.000Z",
        "updated_at": "2025-10-25T10:00:00.000Z",
        "recipe_count": "12"
      }
      // ... more collections
    ]
  }
}
```

**curl Example:**
```bash
curl http://localhost:3001/api/collections \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Get Collection with Recipes

Retrieve a specific collection with all its recipes.

**Endpoint:** `GET /api/collections/:id`

**Auth Required:** Yes (owner only)

**URL Parameters:**
- `id`: Collection UUID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "collection": {
      "id": "collection-uuid",
      "user_id": "user-uuid",
      "name": "Italian Favorites",
      "description": "My favorite Italian recipes",
      "created_at": "2025-10-26T12:00:00.000Z",
      "updated_at": "2025-10-26T12:00:00.000Z",
      "recipes": [
        {
          "id": "recipe-uuid",
          "title": "Spaghetti Carbonara",
          "description": "Classic Roman pasta dish",
          // ... full recipe details
          "added_at": "2025-10-26T12:05:00.000Z",
          "ingredients": [
            // ... ingredients
          ]
        }
        // ... more recipes
      ]
    }
  }
}
```

**Error Responses:**
- `404` - Collection not found
- `403` - Not authorized
- `401` - Unauthorized

**curl Example:**
```bash
curl http://localhost:3001/api/collections/collection-uuid \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. Update Collection

Update collection name and/or description.

**Endpoint:** `PUT /api/collections/:id`

**Auth Required:** Yes (owner only)

**URL Parameters:**
- `id`: Collection UUID

**Request Body (all fields optional):**
```json
{
  "name": "Updated Collection Name",
  "description": "Updated description"
}
```

**Validation:**
- `name`: Optional, 1-255 characters, must be unique per user
- `description`: Optional, any length
- At least one field required

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "collection": {
      // ... updated collection
    }
  }
}
```

**Error Responses:**
- `404` - Collection not found
- `403` - Not authorized
- `400` - Validation error (no fields, name exists, name too long)
- `401` - Unauthorized

**curl Example:**
```bash
curl -X PUT http://localhost:3001/api/collections/collection-uuid \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Italian Recipes"
  }'
```

---

### 5. Delete Collection

Delete a collection (recipes remain intact).

**Endpoint:** `DELETE /api/collections/:id`

**Auth Required:** Yes (owner only)

**URL Parameters:**
- `id`: Collection UUID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Collection deleted successfully"
}
```

**Notes:**
- Only the collection is deleted
- Recipes in the collection are NOT deleted
- Recipe associations are removed

**Error Responses:**
- `404` - Collection not found
- `403` - Not authorized
- `401` - Unauthorized

**curl Example:**
```bash
curl -X DELETE http://localhost:3001/api/collections/collection-uuid \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 6. Add Recipe to Collection

Add an existing recipe to a collection.

**Endpoint:** `POST /api/collections/:id/recipes/:recipeId`

**Auth Required:** Yes (collection owner only)

**URL Parameters:**
- `id`: Collection UUID
- `recipeId`: Recipe UUID to add

**Success Response (201):**
```json
{
  "success": true,
  "message": "Recipe added to collection successfully"
}
```

**Error Responses:**
- `404` - Collection or recipe not found
- `403` - Not authorized (not collection owner, or recipe not accessible)
- `400` - Recipe already in collection
- `401` - Unauthorized

**Notes:**
- You can only add recipes you have access to (your recipes or public recipes)
- Duplicate recipes in same collection are prevented

**curl Example:**
```bash
curl -X POST http://localhost:3001/api/collections/collection-uuid/recipes/recipe-uuid \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 7. Remove Recipe from Collection

Remove a recipe from a collection.

**Endpoint:** `DELETE /api/collections/:id/recipes/:recipeId`

**Auth Required:** Yes (collection owner only)

**URL Parameters:**
- `id`: Collection UUID
- `recipeId`: Recipe UUID to remove

**Success Response (200):**
```json
{
  "success": true,
  "message": "Recipe removed from collection successfully"
}
```

**Error Responses:**
- `404` - Collection not found, or recipe not in collection
- `403` - Not authorized
- `401` - Unauthorized

**Notes:**
- The recipe itself is NOT deleted
- Only the association is removed

**curl Example:**
```bash
curl -X DELETE http://localhost:3001/api/collections/collection-uuid/recipes/recipe-uuid \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ⚠️ Error Handling

### Standard Error Response Format

All errors return this format:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "details": []
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

### Common Error Examples

**Validation Error (400):**
```json
{
  "success": false,
  "error": "Validation error",
  "message": "Invalid request data",
  "details": [
    {
      "field": "title",
      "message": "Recipe title is required"
    },
    {
      "field": "servings",
      "message": "Servings must be a positive integer"
    }
  ]
}
```

**Unauthorized (401):**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**Forbidden (403):**
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Only the recipe owner can update it"
}
```

**Not Found (404):**
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Recipe not found"
}
```

**Rate Limited (429):**
```json
{
  "success": false,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later."
}
```

---

## 🚦 Rate Limiting

**Current Limits:**
- Not implemented yet
- Planned: 100 requests per 15 minutes per IP
- Planned: 1000 requests per hour per user

**Rate Limit Headers (Coming Soon):**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1698345600
```

---

## 📄 Pagination

**Current Status:** Not implemented

**Planned Implementation:**
- Recipes endpoint will support pagination
- Default: 50 items per page
- Query parameters: `page` and `limit`

Example (future):
```bash
GET /api/recipes?page=2&limit=20
```

---

## 🔍 Query Parameters

### Common Parameters

**Search:**
- `search`: String to search (case-insensitive)
- Used in: `/api/recipes`, `/api/recipes/public`

**Filtering:**
- `is_public`: Boolean as string ("true" or "false")
- `is_cooked`: Boolean as string ("true" or "false")
- `start_date`: ISO 8601 date string (YYYY-MM-DD)
- `end_date`: ISO 8601 date string (YYYY-MM-DD)

**Search (Advanced):**
- `q`: Search query (required for `/api/recipes/search`)
- `public_only`: Boolean as string ("true" or "false")

### Example Combinations

```bash
# Search and filter
GET /api/recipes?search=pasta&is_public=true

# Date range
GET /api/meal-plans?start_date=2025-10-27&end_date=2025-11-02

# Multiple filters
GET /api/meal-plans?start_date=2025-10-27&is_cooked=false
```

---

## 💻 Example Code

### JavaScript (Fetch API)

```javascript
// Configuration
const API_BASE_URL = 'http://localhost:3001/api';
const TOKEN = 'your-jwt-token';

// Helper function
async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

// Create a recipe
async function createRecipe() {
  const recipe = {
    title: 'Chocolate Chip Cookies',
    description: 'Classic homemade cookies',
    prep_time: 15,
    cook_time: 12,
    servings: 24,
    difficulty: 'easy',
    ingredients: [
      { name: 'Flour', quantity: '2', unit: 'cups', category: 'Pantry' },
      { name: 'Sugar', quantity: '1', unit: 'cup', category: 'Pantry' },
      { name: 'Chocolate chips', quantity: '2', unit: 'cups', category: 'Pantry' },
    ],
  };

  const result = await apiRequest('/recipes', {
    method: 'POST',
    body: JSON.stringify(recipe),
  });

  console.log('Recipe created:', result.data.recipe);
  return result.data.recipe;
}

// Get recipes
async function getRecipes(searchTerm = '') {
  const endpoint = searchTerm
    ? `/recipes?search=${encodeURIComponent(searchTerm)}`
    : '/recipes';

  const result = await apiRequest(endpoint);
  console.log('Recipes:', result.data.recipes);
  return result.data.recipes;
}

// Create meal plan
async function createMealPlan(recipeId, date, mealType) {
  const mealPlan = {
    recipe_id: recipeId,
    planned_date: date,
    meal_type: mealType,
    servings: 4,
  };

  const result = await apiRequest('/meal-plans', {
    method: 'POST',
    body: JSON.stringify(mealPlan),
  });

  console.log('Meal plan created:', result.data.mealPlan);
  return result.data.mealPlan;
}

// Generate shopping list
async function generateShoppingList(startDate, endDate, listId) {
  const params = {
    start_date: startDate,
    end_date: endDate,
  };

  if (listId) {
    params.list_id = listId;
  }

  const result = await apiRequest('/meal-plans/generate-list', {
    method: 'POST',
    body: JSON.stringify(params),
  });

  console.log('Shopping list:', result.data);
  return result.data;
}

// Usage
async function main() {
  try {
    // Create a recipe
    const recipe = await createRecipe();

    // Add to meal plan
    const mealPlan = await createMealPlan(
      recipe.id,
      '2025-10-27',
      'dinner'
    );

    // Generate shopping list
    const shoppingList = await generateShoppingList(
      '2025-10-27',
      '2025-11-02',
      'your-list-uuid'
    );
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
```

### Python (Requests)

```python
import requests
from datetime import date, timedelta

API_BASE_URL = 'http://localhost:3001/api'
TOKEN = 'your-jwt-token'

class RecipeAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

    def create_recipe(self, recipe_data):
        response = requests.post(
            f'{self.base_url}/recipes',
            headers=self.headers,
            json=recipe_data
        )
        response.raise_for_status()
        return response.json()['data']['recipe']

    def get_recipes(self, search='', is_public=None):
        params = {}
        if search:
            params['search'] = search
        if is_public is not None:
            params['is_public'] = str(is_public).lower()

        response = requests.get(
            f'{self.base_url}/recipes',
            headers=self.headers,
            params=params
        )
        response.raise_for_status()
        return response.json()['data']['recipes']

    def create_meal_plan(self, recipe_id, planned_date, meal_type, servings=4):
        meal_plan = {
            'recipe_id': recipe_id,
            'planned_date': planned_date.isoformat(),
            'meal_type': meal_type,
            'servings': servings
        }

        response = requests.post(
            f'{self.base_url}/meal-plans',
            headers=self.headers,
            json=meal_plan
        )
        response.raise_for_status()
        return response.json()['data']['mealPlan']

    def generate_shopping_list(self, start_date, end_date, list_id=None):
        data = {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat()
        }

        if list_id:
            data['list_id'] = list_id

        response = requests.post(
            f'{self.base_url}/meal-plans/generate-list',
            headers=self.headers,
            json=data
        )
        response.raise_for_status()
        return response.json()['data']

# Usage
api = RecipeAPI(API_BASE_URL, TOKEN)

# Create a recipe
recipe = api.create_recipe({
    'title': 'Grilled Chicken Salad',
    'description': 'Healthy and delicious salad',
    'prep_time': 15,
    'cook_time': 20,
    'servings': 2,
    'difficulty': 'easy',
    'ingredients': [
        {'name': 'Chicken breast', 'quantity': '2', 'unit': 'pieces', 'category': 'Meat'},
        {'name': 'Mixed greens', 'quantity': '4', 'unit': 'cups', 'category': 'Produce'},
    ]
})

print(f'Created recipe: {recipe["id"]}')

# Add to meal plan
today = date.today()
meal_plan = api.create_meal_plan(
    recipe['id'],
    today,
    'lunch'
)

print(f'Created meal plan: {meal_plan["id"]}')

# Generate shopping list for this week
start = today
end = today + timedelta(days=6)
shopping_list = api.generate_shopping_list(start, end)

print(f'Generated shopping list with {len(shopping_list["ingredients"])} items')
```

---

## 📦 Postman Collection

### Import Instructions

1. Download the Postman collection: [recipe-api.postman_collection.json](recipe-api.postman_collection.json)
2. Open Postman
3. Click "Import" button
4. Select the downloaded JSON file
5. Set the environment variables:
   - `base_url`: `http://localhost:3001/api`
   - `token`: Your JWT token

### Collection Contents

The collection includes:

**Auth Folder:**
- Register User
- Login User

**Recipes Folder:**
- Create Recipe
- Get User's Recipes
- Get Public Recipes
- Search Recipes
- Get Recipe by ID
- Update Recipe
- Delete Recipe
- Duplicate Recipe
- Toggle Recipe Visibility

**Meal Plans Folder:**
- Create Meal Plan
- Get Meal Plans
- Get Meal Plan by ID
- Update Meal Plan
- Delete Meal Plan
- Mark as Cooked
- Generate Shopping List

**Collections Folder:**
- Create Collection
- Get Collections
- Get Collection by ID
- Update Collection
- Delete Collection
- Add Recipe to Collection
- Remove Recipe from Collection

### Postman Collection JSON

```json
{
  "info": {
    "name": "Recipe Integration API",
    "description": "Complete API collection for Recipe Integration (Phase 26)",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{token}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3001/api",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Recipes",
      "item": [
        {
          "name": "Create Recipe",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/recipes",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"title\": \"Test Recipe\",\n  \"description\": \"A test recipe\",\n  \"servings\": 4,\n  \"difficulty\": \"easy\",\n  \"ingredients\": [\n    {\"name\": \"Flour\", \"quantity\": \"2\", \"unit\": \"cups\", \"category\": \"Pantry\"}\n  ]\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            }
          }
        },
        {
          "name": "Get Recipes",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/recipes"
          }
        }
      ]
    }
  ]
}
```

---

## 🎓 Best Practices

### Authentication
- Always include the Bearer token in Authorization header
- Refresh tokens before they expire
- Store tokens securely (not in localStorage)

### Error Handling
- Always check `success` field in response
- Handle all HTTP status codes appropriately
- Display user-friendly error messages
- Log errors for debugging

### Performance
- Use pagination when available (coming soon)
- Cache responses when appropriate
- Batch operations when possible
- Use search filters to reduce payload size

### Data Management
- Validate data on client before sending
- Use consistent date formats (ISO 8601)
- Handle timezones appropriately
- Normalize ingredient names for aggregation

---

**Need Help?**
- 📖 [User Guide](RECIPE_INTEGRATION_GUIDE.md)
- 📋 [Implementation Details](../PHASE_26_COMPLETE.md)
- 🐛 [Report Issues](https://github.com/yourusername/grocery/issues)

---

*Last Updated: October 2025 | API Version 1.0*
