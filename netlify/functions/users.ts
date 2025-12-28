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

    // GET - Fetch current user
    if (event.httpMethod === 'GET') {
      const users = await sql`
        SELECT id, clerk_user_id, email, first_name, last_name, created_at, updated_at
        FROM users
        WHERE clerk_user_id = ${clerkUserId}
      `;

      if (users.length === 0) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'User not found' }),
        };
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(users[0]),
      };
    }

    // POST - Create new user (called on first login)
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { email, firstName, lastName } = body;

      if (!email) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Email is required' }),
        };
      }

      // Check if user already exists
      const existing = await sql`
        SELECT id FROM users WHERE clerk_user_id = ${clerkUserId}
      `;

      if (existing.length > 0) {
        return {
          statusCode: 409,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'User already exists' }),
        };
      }

      const users = await sql`
        INSERT INTO users (clerk_user_id, email, first_name, last_name)
        VALUES (${clerkUserId}, ${email}, ${firstName || null}, ${lastName || null})
        RETURNING id, clerk_user_id, email, first_name, last_name, created_at, updated_at
      `;

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify(users[0]),
      };
    }

    // PUT - Update user
    if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      const { firstName, lastName } = body;

      const users = await sql`
        UPDATE users
        SET first_name = ${firstName || null},
            last_name = ${lastName || null},
            updated_at = NOW()
        WHERE clerk_user_id = ${clerkUserId}
        RETURNING id, clerk_user_id, email, first_name, last_name, created_at, updated_at
      `;

      if (users.length === 0) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'User not found' }),
        };
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(users[0]),
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Users function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

export { handler };
