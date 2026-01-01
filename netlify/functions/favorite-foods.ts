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

    // GET - List user's favorite foods with full food details (both regular and custom)
    if (event.httpMethod === 'GET') {
      const favorites = await sql`
        SELECT
          ff.id as favorite_id,
          COALESCE(f.id, cf.id) as id,
          COALESCE(f.name, cf.name) as name,
          COALESCE(f.brand, cf.brand) as brand,
          COALESCE(f.serving_size, cf.serving_size) as serving_size,
          COALESCE(f.serving_unit, cf.serving_unit) as serving_unit,
          COALESCE(f.calories, cf.calories) as calories,
          COALESCE(f.protein, cf.protein) as protein,
          COALESCE(f.carbs, cf.carbs) as carbs,
          COALESCE(f.fat, cf.fat) as fat,
          ff.food_id,
          ff.custom_food_id,
          ff.created_at as favorited_at
        FROM favorite_foods ff
        LEFT JOIN foods f ON ff.food_id = f.id
        LEFT JOIN custom_foods cf ON ff.custom_food_id = cf.id
        WHERE ff.user_id = ${userId}
        ORDER BY ff.created_at DESC
      `;

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(favorites),
      };
    }

    // POST - Add food to favorites (regular or custom)
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { foodId, customFoodId } = body;

      if (!foodId && !customFoodId) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Either foodId or customFoodId is required' }),
        };
      }

      // Check if already favorited
      const existing = foodId
        ? await sql`
            SELECT id FROM favorite_foods
            WHERE user_id = ${userId} AND food_id = ${foodId}
          `
        : await sql`
            SELECT id FROM favorite_foods
            WHERE user_id = ${userId} AND custom_food_id = ${customFoodId}
          `;

      if (existing.length > 0) {
        return {
          statusCode: 409,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Food already in favorites' }),
        };
      }

      // Add to favorites
      const favorite = foodId
        ? await sql`
            INSERT INTO favorite_foods (user_id, food_id)
            VALUES (${userId}, ${foodId})
            RETURNING id, user_id, food_id, custom_food_id, created_at
          `
        : await sql`
            INSERT INTO favorite_foods (user_id, custom_food_id)
            VALUES (${userId}, ${customFoodId})
            RETURNING id, user_id, food_id, custom_food_id, created_at
          `;

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify(favorite[0]),
      };
    }

    // DELETE - Remove food from favorites (regular or custom)
    if (event.httpMethod === 'DELETE') {
      const foodId = event.queryStringParameters?.foodId;
      const customFoodId = event.queryStringParameters?.customFoodId;

      if (!foodId && !customFoodId) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Either foodId or customFoodId query parameter is required' }),
        };
      }

      if (foodId) {
        await sql`
          DELETE FROM favorite_foods
          WHERE user_id = ${userId} AND food_id = ${foodId}
        `;
      } else {
        await sql`
          DELETE FROM favorite_foods
          WHERE user_id = ${userId} AND custom_food_id = ${customFoodId}
        `;
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Removed from favorites' }),
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Favorite foods function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

export { handler };
