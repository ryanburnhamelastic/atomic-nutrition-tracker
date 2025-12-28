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

    // Extract food ID from path if present (e.g., /api/foods/123)
    const pathParts = event.path.split('/');
    const foodId = pathParts[pathParts.length - 1] !== 'foods' ? pathParts[pathParts.length - 1] : null;

    // GET - Search foods or get single food
    if (event.httpMethod === 'GET') {
      if (foodId) {
        // Get single food
        const foods = await sql`
          SELECT id, name, brand, serving_size, serving_unit,
                 calories, protein, carbs, fat, is_verified, source, created_at
          FROM foods
          WHERE id = ${foodId}
        `;

        if (foods.length === 0) {
          return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Food not found' }),
          };
        }

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(foods[0]),
        };
      }

      // Search foods
      const query = event.queryStringParameters?.q;
      const limit = Math.min(Number(event.queryStringParameters?.limit) || 20, 100);

      if (!query) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Search query is required' }),
        };
      }

      // Full-text search with fallback to ILIKE
      const foods = await sql`
        SELECT id, name, brand, serving_size, serving_unit,
               calories, protein, carbs, fat, is_verified, source, created_at,
               ts_rank(to_tsvector('english', name), plainto_tsquery('english', ${query})) as rank
        FROM foods
        WHERE to_tsvector('english', name) @@ plainto_tsquery('english', ${query})
           OR name ILIKE ${'%' + query + '%'}
           OR brand ILIKE ${'%' + query + '%'}
        ORDER BY is_verified DESC, rank DESC, name ASC
        LIMIT ${limit}
      `;

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(foods),
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Foods function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

export { handler };
