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

    // Get user ID from clerk_user_id
    const users = await sql`
      SELECT id FROM users WHERE clerk_user_id = ${authResult.clerkUserId}
    `;

    if (users.length === 0) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    const userId = users[0].id;

    // Extract entry ID from path if present (for PUT/DELETE)
    const pathParts = event.path.split('/');
    const entryId = pathParts[pathParts.length - 1] !== 'weight-entries' ? pathParts[pathParts.length - 1] : null;

    // GET - List weight entries (with optional date range)
    if (event.httpMethod === 'GET') {
      const startDate = event.queryStringParameters?.startDate;
      const endDate = event.queryStringParameters?.endDate;
      const limit = Math.min(Number(event.queryStringParameters?.limit) || 30, 365);

      let entries;
      if (startDate && endDate) {
        entries = await sql`
          SELECT * FROM weight_entries
          WHERE user_id = ${userId}
            AND date >= ${startDate}
            AND date <= ${endDate}
          ORDER BY date DESC
          LIMIT ${limit}
        `;
      } else {
        entries = await sql`
          SELECT * FROM weight_entries
          WHERE user_id = ${userId}
          ORDER BY date DESC
          LIMIT ${limit}
        `;
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(entries),
      };
    }

    // POST - Create or update weight entry (upsert by date)
    if (event.httpMethod === 'POST') {
      let body: { date?: string; weightKg?: number; notes?: string };
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invalid request body' }),
        };
      }

      const { date, weightKg, notes } = body;

      if (!date || !weightKg) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Date and weight are required' }),
        };
      }

      // Validate weight range (reasonable human weight in kg)
      if (weightKg < 20 || weightKg > 500) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Weight must be between 20 and 500 kg' }),
        };
      }

      // Upsert - insert or update if date already exists
      const result = await sql`
        INSERT INTO weight_entries (user_id, date, weight_kg, notes)
        VALUES (${userId}, ${date}, ${weightKg}, ${notes || null})
        ON CONFLICT (user_id, date)
        DO UPDATE SET
          weight_kg = ${weightKg},
          notes = ${notes || null},
          updated_at = NOW()
        RETURNING *
      `;

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify(result[0]),
      };
    }

    // DELETE - Delete weight entry
    if (event.httpMethod === 'DELETE' && entryId) {
      // Verify ownership
      const existing = await sql`
        SELECT id FROM weight_entries WHERE id = ${entryId} AND user_id = ${userId}
      `;

      if (existing.length === 0) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Weight entry not found' }),
        };
      }

      await sql`DELETE FROM weight_entries WHERE id = ${entryId}`;

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
    console.error('Weight entries function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

export { handler };
