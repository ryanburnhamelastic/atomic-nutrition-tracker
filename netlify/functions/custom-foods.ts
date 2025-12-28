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

    // Extract food ID from path if present (e.g., /api/custom-foods/123)
    const pathParts = event.path.split('/');
    const foodId = pathParts[pathParts.length - 1] !== 'custom-foods' ? pathParts[pathParts.length - 1] : null;

    // GET - List all custom foods for user or get single food
    if (event.httpMethod === 'GET') {
      if (foodId) {
        // Get single custom food
        const foods = await sql`
          SELECT id, user_id, name, brand, serving_size, serving_unit,
                 calories, protein, carbs, fat, created_at, updated_at
          FROM custom_foods
          WHERE id = ${foodId} AND user_id = ${userId}
        `;

        if (foods.length === 0) {
          return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Custom food not found' }),
          };
        }

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(foods[0]),
        };
      }

      // List all custom foods, optionally filter by search query
      const query = event.queryStringParameters?.q;

      let foods;
      if (query) {
        foods = await sql`
          SELECT id, user_id, name, brand, serving_size, serving_unit,
                 calories, protein, carbs, fat, created_at, updated_at
          FROM custom_foods
          WHERE user_id = ${userId}
            AND (name ILIKE ${'%' + query + '%'} OR brand ILIKE ${'%' + query + '%'})
          ORDER BY name ASC
          LIMIT 50
        `;
      } else {
        foods = await sql`
          SELECT id, user_id, name, brand, serving_size, serving_unit,
                 calories, protein, carbs, fat, created_at, updated_at
          FROM custom_foods
          WHERE user_id = ${userId}
          ORDER BY updated_at DESC
          LIMIT 100
        `;
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(foods),
      };
    }

    // POST - Create a new custom food
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { name, brand, servingSize, servingUnit, calories, protein, carbs, fat } = body;

      // Validate required fields
      if (!name || servingSize === undefined || !servingUnit || calories === undefined) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Name, servingSize, servingUnit, and calories are required' }),
        };
      }

      const foods = await sql`
        INSERT INTO custom_foods (
          user_id, name, brand, serving_size, serving_unit,
          calories, protein, carbs, fat
        )
        VALUES (
          ${userId}, ${name}, ${brand || null}, ${servingSize}, ${servingUnit},
          ${calories}, ${protein || 0}, ${carbs || 0}, ${fat || 0}
        )
        RETURNING id, user_id, name, brand, serving_size, serving_unit,
                  calories, protein, carbs, fat, created_at, updated_at
      `;

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify(foods[0]),
      };
    }

    // PUT - Update a custom food
    if (event.httpMethod === 'PUT' && foodId) {
      const body = JSON.parse(event.body || '{}');
      const { name, brand, servingSize, servingUnit, calories, protein, carbs, fat } = body;

      // Verify food belongs to user
      const existing = await sql`
        SELECT id FROM custom_foods WHERE id = ${foodId} AND user_id = ${userId}
      `;

      if (existing.length === 0) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Custom food not found' }),
        };
      }

      const foods = await sql`
        UPDATE custom_foods
        SET
          name = COALESCE(${name ?? null}, name),
          brand = COALESCE(${brand ?? null}, brand),
          serving_size = COALESCE(${servingSize ?? null}, serving_size),
          serving_unit = COALESCE(${servingUnit ?? null}, serving_unit),
          calories = COALESCE(${calories ?? null}, calories),
          protein = COALESCE(${protein ?? null}, protein),
          carbs = COALESCE(${carbs ?? null}, carbs),
          fat = COALESCE(${fat ?? null}, fat),
          updated_at = NOW()
        WHERE id = ${foodId} AND user_id = ${userId}
        RETURNING id, user_id, name, brand, serving_size, serving_unit,
                  calories, protein, carbs, fat, created_at, updated_at
      `;

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(foods[0]),
      };
    }

    // DELETE - Remove a custom food
    if (event.httpMethod === 'DELETE' && foodId) {
      // Verify food belongs to user
      const existing = await sql`
        SELECT id FROM custom_foods WHERE id = ${foodId} AND user_id = ${userId}
      `;

      if (existing.length === 0) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Custom food not found' }),
        };
      }

      await sql`
        DELETE FROM custom_foods WHERE id = ${foodId} AND user_id = ${userId}
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
    console.error('Custom foods function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

export { handler };
