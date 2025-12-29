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

    // GET - Fetch user's nutrition goals
    if (event.httpMethod === 'GET') {
      const goals = await sql`
        SELECT id, user_id, calorie_target, protein_target, carbs_target, fat_target, use_metric, created_at, updated_at
        FROM user_goals
        WHERE user_id = ${userId}
      `;

      // Return default goals if none exist
      if (goals.length === 0) {
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            id: null,
            user_id: userId,
            calorie_target: 2000,
            protein_target: 150,
            carbs_target: 250,
            fat_target: 65,
            use_metric: true,
            created_at: null,
            updated_at: null,
          }),
        };
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(goals[0]),
      };
    }

    // PUT - Update or create nutrition goals
    if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      const { calorieTarget, proteinTarget, carbsTarget, fatTarget, useMetric } = body;

      // Check if goals exist
      const existing = await sql`
        SELECT id FROM user_goals WHERE user_id = ${userId}
      `;

      let goals;
      if (existing.length === 0) {
        // Create new goals
        goals = await sql`
          INSERT INTO user_goals (user_id, calorie_target, protein_target, carbs_target, fat_target, use_metric)
          VALUES (
            ${userId},
            ${calorieTarget ?? 2000},
            ${proteinTarget ?? 150},
            ${carbsTarget ?? 250},
            ${fatTarget ?? 65},
            ${useMetric ?? true}
          )
          RETURNING id, user_id, calorie_target, protein_target, carbs_target, fat_target, use_metric, created_at, updated_at
        `;
      } else {
        // Update existing goals
        goals = await sql`
          UPDATE user_goals
          SET
            calorie_target = COALESCE(${calorieTarget ?? null}, calorie_target),
            protein_target = COALESCE(${proteinTarget ?? null}, protein_target),
            carbs_target = COALESCE(${carbsTarget ?? null}, carbs_target),
            fat_target = COALESCE(${fatTarget ?? null}, fat_target),
            use_metric = COALESCE(${useMetric ?? null}, use_metric),
            updated_at = NOW()
          WHERE user_id = ${userId}
          RETURNING id, user_id, calorie_target, protein_target, carbs_target, fat_target, use_metric, created_at, updated_at
        `;
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(goals[0]),
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Goals function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

export { handler };
