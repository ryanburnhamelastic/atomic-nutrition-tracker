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

    // GET - Get active program and history
    if (event.httpMethod === 'GET') {
      const includeHistory = event.queryStringParameters?.history === 'true';

      // Get active program
      const activePrograms = await sql`
        SELECT * FROM user_programs
        WHERE user_id = ${userId} AND status = 'active'
        ORDER BY start_date DESC
        LIMIT 1
      `;

      const active = activePrograms.length > 0 ? activePrograms[0] : null;

      // Check if active program has ended
      if (active) {
        const today = new Date().toISOString().split('T')[0];
        if (active.end_date < today) {
          // Auto-complete expired program
          await sql`
            UPDATE user_programs
            SET status = 'completed', updated_at = NOW()
            WHERE id = ${active.id}
          `;
          active.status = 'completed';
        }
      }

      let history = [];
      if (includeHistory) {
        history = await sql`
          SELECT * FROM user_programs
          WHERE user_id = ${userId} AND status IN ('completed', 'cancelled')
          ORDER BY end_date DESC
          LIMIT 10
        `;
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          active: active && active.status === 'active' ? active : null,
          history,
        }),
      };
    }

    // POST - Create new program
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const {
        programId,
        startDate,
        durationWeeks,
        startingWeightKg,
        targetWeightKg,
        calorieTarget,
        proteinTarget,
        carbsTarget,
        fatTarget,
        notes,
      } = body;

      if (!programId || !startDate || !durationWeeks || !calorieTarget || !proteinTarget || !carbsTarget || !fatTarget) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Missing required fields' }),
        };
      }

      // Calculate end date
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + (durationWeeks * 7));
      const endDate = end.toISOString().split('T')[0];

      // Cancel any existing active programs
      await sql`
        UPDATE user_programs
        SET status = 'cancelled', updated_at = NOW()
        WHERE user_id = ${userId} AND status = 'active'
      `;

      // Create new program
      const program = await sql`
        INSERT INTO user_programs (
          user_id, program_id, start_date, end_date, duration_weeks,
          starting_weight_kg, target_weight_kg,
          calorie_target, protein_target, carbs_target, fat_target, notes
        )
        VALUES (
          ${userId}, ${programId}, ${startDate}, ${endDate}, ${durationWeeks},
          ${startingWeightKg || null}, ${targetWeightKg || null},
          ${calorieTarget}, ${proteinTarget}, ${carbsTarget}, ${fatTarget}, ${notes || null}
        )
        RETURNING *
      `;

      // Update user goals to match program
      await sql`
        INSERT INTO user_goals (user_id, calorie_target, protein_target, carbs_target, fat_target)
        VALUES (${userId}, ${calorieTarget}, ${proteinTarget}, ${carbsTarget}, ${fatTarget})
        ON CONFLICT (user_id)
        DO UPDATE SET
          calorie_target = ${calorieTarget},
          protein_target = ${proteinTarget},
          carbs_target = ${carbsTarget},
          fat_target = ${fatTarget},
          updated_at = NOW()
      `;

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify(program[0]),
      };
    }

    // PUT - Update program (complete, cancel, modify, or update macros)
    if (event.httpMethod === 'PUT') {
      const programId = event.path.split('/').pop();
      const body = JSON.parse(event.body || '{}');
      const {
        status,
        endingWeightKg,
        notes,
        calorieTarget,
        proteinTarget,
        carbsTarget,
        fatTarget,
        macrosLocked
      } = body;

      if (!programId) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Program ID is required' }),
        };
      }

      // Verify ownership and get current program
      const existing = await sql`
        SELECT * FROM user_programs WHERE id = ${programId} AND user_id = ${userId}
      `;

      if (existing.length === 0) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Program not found' }),
        };
      }

      const currentProgram = existing[0];

      // Check if macros are being updated
      const isMacroUpdate = calorieTarget !== undefined ||
                           proteinTarget !== undefined ||
                           carbsTarget !== undefined ||
                           fatTarget !== undefined;

      // If macros are being updated, perform additional actions
      if (isMacroUpdate) {
        const today = new Date().toISOString().split('T')[0];

        // Use provided values or keep current values
        const newCalories = calorieTarget ?? currentProgram.calorie_target;
        const newProtein = proteinTarget ?? currentProgram.protein_target;
        const newCarbs = carbsTarget ?? currentProgram.carbs_target;
        const newFat = fatTarget ?? currentProgram.fat_target;

        // 1. Insert into program_macro_history
        await sql`
          INSERT INTO program_macro_history (
            program_id,
            calorie_target,
            protein_target,
            carbs_target,
            fat_target,
            effective_date,
            change_reason
          )
          VALUES (
            ${programId},
            ${newCalories},
            ${newProtein},
            ${newCarbs},
            ${newFat},
            ${today},
            'manual_adjustment'
          )
        `;

        // 2. Update user_goals to match new macros
        await sql`
          INSERT INTO user_goals (user_id, calorie_target, protein_target, carbs_target, fat_target)
          VALUES (${userId}, ${newCalories}, ${newProtein}, ${newCarbs}, ${newFat})
          ON CONFLICT (user_id)
          DO UPDATE SET
            calorie_target = ${newCalories},
            protein_target = ${newProtein},
            carbs_target = ${newCarbs},
            fat_target = ${newFat},
            updated_at = NOW()
        `;

        // 3. Expire any pending reviews for this program
        await sql`
          UPDATE program_reviews
          SET status = 'expired', updated_at = NOW()
          WHERE program_id = ${programId} AND status = 'pending'
        `;
      }

      // Update the program
      const updated = await sql`
        UPDATE user_programs
        SET
          status = COALESCE(${status || null}, status),
          ending_weight_kg = COALESCE(${endingWeightKg || null}, ending_weight_kg),
          notes = COALESCE(${notes || null}, notes),
          calorie_target = COALESCE(${calorieTarget || null}, calorie_target),
          protein_target = COALESCE(${proteinTarget || null}, protein_target),
          carbs_target = COALESCE(${carbsTarget || null}, carbs_target),
          fat_target = COALESCE(${fatTarget || null}, fat_target),
          macros_locked = COALESCE(${macrosLocked !== undefined ? macrosLocked : null}, macros_locked),
          updated_at = NOW()
        WHERE id = ${programId}
        RETURNING *
      `;

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(updated[0]),
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('User programs function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

export { handler };
