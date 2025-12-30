import { Handler, HandlerEvent } from '@netlify/functions';
import { initDb, getDb, corsHeaders } from './db';
import { authenticateRequest, unauthorizedResponse } from './auth';

const handler: Handler = async (event: HandlerEvent) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  try {
    await initDb();
    const sql = getDb();
    const authResult = await authenticateRequest(event);

    if (!authResult.authenticated || !authResult.clerkUserId) {
      return unauthorizedResponse(corsHeaders, authResult.error);
    }

    const { clerkUserId } = authResult;

    // Get user ID from clerk_user_id
    const users = await sql`
      SELECT id FROM users WHERE clerk_user_id = ${clerkUserId}
    `;

    if (users.length === 0) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    const userId = users[0].id;

    // Extract entry ID from path if present (e.g., /api/food-entries/123)
    const pathParts = event.path.split('/');
    const entryId = pathParts[pathParts.length - 1] !== 'food-entries' ? pathParts[pathParts.length - 1] : null;

    // GET - Fetch food entries for a specific date
    if (event.httpMethod === 'GET') {
      const date = event.queryStringParameters?.date;

      if (!date) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Date parameter is required' }),
        };
      }

      const entries = await sql`
        SELECT id, user_id, food_id, custom_food_id, date, meal_type, servings,
               name, serving_size, serving_unit, calories, protein, carbs, fat,
               completed, created_at, updated_at
        FROM food_entries
        WHERE user_id = ${userId} AND date = ${date}
        ORDER BY created_at ASC
      `;

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(entries),
      };
    }

    // POST - Create a new food entry
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const {
        date,
        mealType,
        foodId,
        customFoodId,
        servings,
        name,
        servingSize,
        servingUnit,
        calories,
        protein,
        carbs,
        fat,
      } = body;

      // Validate required fields
      if (!date || !mealType || !servings) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Date, mealType, and servings are required' }),
        };
      }

      // Validate meal type
      const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
      if (!validMealTypes.includes(mealType)) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invalid meal type' }),
        };
      }

      let entryName = name;
      let entryServingSize = servingSize;
      let entryServingUnit = servingUnit;
      let entryCalories = calories;
      let entryProtein = protein;
      let entryCarbs = carbs;
      let entryFat = fat;

      // If foodId provided, look up from foods table
      if (foodId) {
        const foods = await sql`
          SELECT name, serving_size, serving_unit, calories, protein, carbs, fat
          FROM foods WHERE id = ${foodId}
        `;
        if (foods.length === 0) {
          return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Food not found' }),
          };
        }
        const food = foods[0];
        entryName = food.name;
        entryServingSize = food.serving_size;
        entryServingUnit = food.serving_unit;
        entryCalories = food.calories;
        entryProtein = food.protein;
        entryCarbs = food.carbs;
        entryFat = food.fat;
      }

      // If customFoodId provided, look up from custom_foods table
      if (customFoodId) {
        const customFoods = await sql`
          SELECT name, serving_size, serving_unit, calories, protein, carbs, fat
          FROM custom_foods WHERE id = ${customFoodId} AND user_id = ${userId}
        `;
        if (customFoods.length === 0) {
          return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Custom food not found' }),
          };
        }
        const food = customFoods[0];
        entryName = food.name;
        entryServingSize = food.serving_size;
        entryServingUnit = food.serving_unit;
        entryCalories = food.calories;
        entryProtein = food.protein;
        entryCarbs = food.carbs;
        entryFat = food.fat;
      }

      // Validate manual entry has all required fields
      if (!foodId && !customFoodId) {
        if (!entryName || entryServingSize === undefined || !entryServingUnit ||
            entryCalories === undefined || entryProtein === undefined ||
            entryCarbs === undefined || entryFat === undefined) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Manual entry requires name, servingSize, servingUnit, calories, protein, carbs, and fat' }),
          };
        }
      }

      const entries = await sql`
        INSERT INTO food_entries (
          user_id, food_id, custom_food_id, date, meal_type, servings,
          name, serving_size, serving_unit, calories, protein, carbs, fat
        )
        VALUES (
          ${userId}, ${foodId || null}, ${customFoodId || null}, ${date}, ${mealType}, ${servings},
          ${entryName}, ${entryServingSize}, ${entryServingUnit},
          ${entryCalories}, ${entryProtein}, ${entryCarbs}, ${entryFat}
        )
        RETURNING id, user_id, food_id, custom_food_id, date, meal_type, servings,
                  name, serving_size, serving_unit, calories, protein, carbs, fat,
                  completed, created_at, updated_at
      `;

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify(entries[0]),
      };
    }

    // PUT - Update a food entry
    if (event.httpMethod === 'PUT' && entryId) {
      const body = JSON.parse(event.body || '{}');
      const { servings, mealType, name, servingSize, servingUnit, calories, protein, carbs, fat } = body;

      // Verify entry belongs to user
      const existing = await sql`
        SELECT id FROM food_entries WHERE id = ${entryId} AND user_id = ${userId}
      `;

      if (existing.length === 0) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Food entry not found' }),
        };
      }

      const entries = await sql`
        UPDATE food_entries
        SET
          servings = COALESCE(${servings ?? null}, servings),
          meal_type = COALESCE(${mealType ?? null}, meal_type),
          name = COALESCE(${name ?? null}, name),
          serving_size = COALESCE(${servingSize ?? null}, serving_size),
          serving_unit = COALESCE(${servingUnit ?? null}, serving_unit),
          calories = COALESCE(${calories ?? null}, calories),
          protein = COALESCE(${protein ?? null}, protein),
          carbs = COALESCE(${carbs ?? null}, carbs),
          fat = COALESCE(${fat ?? null}, fat),
          updated_at = NOW()
        WHERE id = ${entryId} AND user_id = ${userId}
        RETURNING id, user_id, food_id, custom_food_id, date, meal_type, servings,
                  name, serving_size, serving_unit, calories, protein, carbs, fat,
                  completed, created_at, updated_at
      `;

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(entries[0]),
      };
    }

    // PATCH - Toggle completion status
    if (event.httpMethod === 'PATCH' && entryId) {
      const body = JSON.parse(event.body || '{}');
      const { completed } = body;

      if (typeof completed !== 'boolean') {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'completed field must be a boolean' }),
        };
      }

      // Verify entry belongs to user
      const existing = await sql`
        SELECT id FROM food_entries WHERE id = ${entryId} AND user_id = ${userId}
      `;

      if (existing.length === 0) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Food entry not found' }),
        };
      }

      const entries = await sql`
        UPDATE food_entries
        SET completed = ${completed}, updated_at = NOW()
        WHERE id = ${entryId} AND user_id = ${userId}
        RETURNING id, user_id, food_id, custom_food_id, date, meal_type, servings,
                  name, serving_size, serving_unit, calories, protein, carbs, fat,
                  completed, created_at, updated_at
      `;

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(entries[0]),
      };
    }

    // DELETE - Remove a food entry
    if (event.httpMethod === 'DELETE' && entryId) {
      // Verify entry belongs to user
      const existing = await sql`
        SELECT id FROM food_entries WHERE id = ${entryId} AND user_id = ${userId}
      `;

      if (existing.length === 0) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Food entry not found' }),
        };
      }

      await sql`
        DELETE FROM food_entries WHERE id = ${entryId} AND user_id = ${userId}
      `;

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true }),
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Food entries function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

export { handler };
