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

    // GET - List user's favorite foods with full food details
    if (event.httpMethod === 'GET') {
      const favorites = await sql`
        SELECT
          ff.id as favorite_id,
          f.id,
          f.name,
          f.brand,
          f.serving_size,
          f.serving_unit,
          f.calories,
          f.protein,
          f.carbs,
          f.fat,
          ff.created_at as favorited_at
        FROM favorite_foods ff
        JOIN foods f ON ff.food_id = f.id
        WHERE ff.user_id = ${userId}
        ORDER BY ff.created_at DESC
      `;

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(favorites),
      };
    }

    // POST - Add food to favorites
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { foodId } = body;

      if (!foodId) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'foodId is required' }),
        };
      }

      // Check if already favorited
      const existing = await sql`
        SELECT id FROM favorite_foods
        WHERE user_id = ${userId} AND food_id = ${foodId}
      `;

      if (existing.length > 0) {
        return {
          statusCode: 409,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Food already in favorites' }),
        };
      }

      // Add to favorites
      const favorite = await sql`
        INSERT INTO favorite_foods (user_id, food_id)
        VALUES (${userId}, ${foodId})
        RETURNING id, user_id, food_id, created_at
      `;

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify(favorite[0]),
      };
    }

    // DELETE - Remove food from favorites
    if (event.httpMethod === 'DELETE') {
      const foodId = event.path.split('/').pop();

      if (!foodId) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Food ID is required' }),
        };
      }

      await sql`
        DELETE FROM favorite_foods
        WHERE user_id = ${userId} AND food_id = ${foodId}
      `;

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
