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

    // Get query parameters for date range
    const days = Math.min(Number(event.queryStringParameters?.days) || 30, 365);
    const endDate = event.queryStringParameters?.endDate || new Date().toISOString().split('T')[0];

    // Calculate start date
    const end = new Date(endDate + 'T00:00:00');
    const start = new Date(end);
    start.setDate(start.getDate() - days + 1);
    const startDate = start.toISOString().split('T')[0];

    // GET - Fetch analytics data
    if (event.httpMethod === 'GET') {
      // Get user's nutrition goals
      const goalsResult = await sql`
        SELECT calorie_target, protein_target, carbs_target, fat_target
        FROM user_goals
        WHERE user_id = ${userId}
      `;

      const goals = goalsResult.length > 0 ? goalsResult[0] : {
        calorie_target: 2000,
        protein_target: 150,
        carbs_target: 250,
        fat_target: 65,
      };

      // Get weight entries
      const weightEntries = await sql`
        SELECT date, weight_kg
        FROM weight_entries
        WHERE user_id = ${userId}
          AND date >= ${startDate}
          AND date <= ${endDate}
        ORDER BY date ASC
      `;

      // Get daily nutrition summaries
      const dailyData = await sql`
        SELECT
          date,
          SUM(calories) as total_calories,
          SUM(protein) as total_protein,
          SUM(carbs) as total_carbs,
          SUM(fat) as total_fat
        FROM food_entries
        WHERE user_id = ${userId}
          AND date >= ${startDate}
          AND date <= ${endDate}
        GROUP BY date
        ORDER BY date ASC
      `;

      // Calculate compliance metrics
      const proteinThreshold = Number(goals.protein_target) * 0.8;
      let compliantDays = 0;
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;

      const dailyDataWithCompliance = dailyData.map((day: any, index: number) => {
        const protein = Number(day.total_protein);
        const calories = Number(day.total_calories);
        const isCompliant = protein >= proteinThreshold && calories <= Number(goals.calorie_target);

        if (isCompliant) {
          compliantDays++;
          tempStreak++;
          if (tempStreak > longestStreak) longestStreak = tempStreak;
          // If this is the most recent day or consecutive, update current streak
          if (index === dailyData.length - 1 || index === dailyData.length - 2) {
            currentStreak = tempStreak;
          }
        } else {
          tempStreak = 0;
        }

        return {
          date: day.date,
          calories: Number(day.total_calories),
          protein: Number(day.total_protein),
          carbs: Number(day.total_carbs),
          fat: Number(day.total_fat),
          isCompliant,
        };
      });

      // Calculate weekly summaries
      const thisWeekStart = new Date(endDate + 'T00:00:00');
      thisWeekStart.setDate(thisWeekStart.getDate() - 6);
      const thisWeekStartStr = thisWeekStart.toISOString().split('T')[0];

      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekStartStr = lastWeekStart.toISOString().split('T')[0];
      const lastWeekEndStr = new Date(thisWeekStart.getTime() - 86400000).toISOString().split('T')[0];

      const thisWeekData = dailyDataWithCompliance.filter((d: any) => d.date >= thisWeekStartStr);
      const lastWeekData = dailyDataWithCompliance.filter((d: any) =>
        d.date >= lastWeekStartStr && d.date <= lastWeekEndStr
      );

      const calculateWeeklyAvg = (data: any[]) => {
        if (data.length === 0) return { calories: 0, protein: 0, carbs: 0, fat: 0, compliance: 0 };
        const totals = data.reduce((acc, day) => ({
          calories: acc.calories + day.calories,
          protein: acc.protein + day.protein,
          carbs: acc.carbs + day.carbs,
          fat: acc.fat + day.fat,
          compliant: acc.compliant + (day.isCompliant ? 1 : 0),
        }), { calories: 0, protein: 0, carbs: 0, fat: 0, compliant: 0 });

        return {
          calories: Math.round(totals.calories / data.length),
          protein: Math.round(totals.protein / data.length),
          carbs: Math.round(totals.carbs / data.length),
          fat: Math.round(totals.fat / data.length),
          compliance: Math.round((totals.compliant / data.length) * 100),
        };
      };

      const analytics = {
        dateRange: {
          start: startDate,
          end: endDate,
          days,
        },
        goals,
        weightTrend: weightEntries.map((w: any) => ({
          date: w.date,
          weight: Number(w.weight_kg),
        })),
        dailyNutrition: dailyDataWithCompliance,
        compliance: {
          totalDays: dailyData.length,
          compliantDays,
          complianceRate: dailyData.length > 0 ? Math.round((compliantDays / dailyData.length) * 100) : 0,
          currentStreak,
          longestStreak,
        },
        weeklySummary: {
          thisWeek: calculateWeeklyAvg(thisWeekData),
          lastWeek: calculateWeeklyAvg(lastWeekData),
        },
      };

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(analytics),
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Analytics function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

export { handler };
