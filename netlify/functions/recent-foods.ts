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

    // GET - Get recent foods for a specific meal type
    if (event.httpMethod === 'GET') {
      const mealType = event.queryStringParameters?.mealType;
      const limit = Math.min(Number(event.queryStringParameters?.limit) || 10, 20);

      // Validate meal type
      const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
      if (!mealType || !validMealTypes.includes(mealType)) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Valid mealType parameter is required (breakfast, lunch, dinner, snack)' }),
        };
      }

      // Query recent foods for this meal type
      // Look back 30 days, group by food, sort by frequency and recency
      const recentFoods = await sql`
        WITH recent_entries AS (
          SELECT
            name,
            serving_size,
            serving_unit,
            calories,
            protein,
            carbs,
            fat,
            food_id,
            custom_food_id,
            date,
            created_at
          FROM food_entries
          WHERE user_id = ${userId}
            AND meal_type = ${mealType}
            AND date >= CURRENT_DATE - INTERVAL '30 days'
        ),
        food_stats AS (
          SELECT
            name,
            serving_size,
            serving_unit,
            calories,
            protein,
            carbs,
            fat,
            food_id,
            custom_food_id,
            COUNT(*) as frequency,
            MAX(date) as last_eaten
          FROM recent_entries
          GROUP BY name, serving_size, serving_unit, calories, protein, carbs, fat, food_id, custom_food_id
        )
        SELECT
          name,
          serving_size,
          serving_unit,
          calories,
          protein,
          carbs,
          fat,
          food_id,
          custom_food_id,
          NULL::text as brand,
          frequency,
          last_eaten
        FROM food_stats
        ORDER BY frequency DESC, last_eaten DESC
        LIMIT ${limit}
      `;

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(recentFoods),
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Recent foods function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

export { handler };
