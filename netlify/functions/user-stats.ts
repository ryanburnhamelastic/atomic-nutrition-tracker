import { Handler, HandlerEvent } from '@netlify/functions';
import { initDb, getDb, corsHeaders } from './db';
import { authenticateRequest, unauthorizedResponse } from './auth';

// Achievement definitions
export const ACHIEVEMENTS = {
  FIRST_ENTRY: {
    id: 'first_entry',
    name: 'First Steps',
    description: 'Log your first meal',
    icon: '🎯',
  },
  WEEK_WARRIOR: {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: '7 day logging streak',
    icon: '🔥',
  },
  TWO_WEEK_STREAK: {
    id: 'two_week_streak',
    name: 'Committed',
    description: '14 day logging streak',
    icon: '💪',
  },
  MONTH_MASTER: {
    id: 'month_master',
    name: 'Month Master',
    description: '30 day logging streak',
    icon: '⭐',
  },
  FIFTY_DAY_STREAK: {
    id: 'fifty_day_streak',
    name: 'Dedicated',
    description: '50 day logging streak',
    icon: '🏆',
  },
  CENTURY_STREAK: {
    id: 'century_streak',
    name: 'Century Club',
    description: '100 day logging streak',
    icon: '👑',
  },
  HUNDRED_DAYS: {
    id: 'hundred_days',
    name: 'Centurion',
    description: '100 total days logged',
    icon: '💯',
  },
  PROTEIN_PRO_7: {
    id: 'protein_pro_7',
    name: 'Protein Pro',
    description: 'Hit protein goal 7 days in a row',
    icon: '🥩',
  },
  MACRO_MASTER_7: {
    id: 'macro_master_7',
    name: 'Macro Master',
    description: 'Hit all macro goals 7 days in a row',
    icon: '🎪',
  },
};

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

    // GET - Get user stats
    if (event.httpMethod === 'GET') {
      // Get or create stats
      let stats = await sql`
        SELECT * FROM user_stats WHERE user_id = ${userId}
      `;

      if (stats.length === 0) {
        // Create initial stats
        stats = await sql`
          INSERT INTO user_stats (user_id)
          VALUES (${userId})
          RETURNING *
        `;
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(stats[0]),
      };
    }

    // POST - Update stats (called after logging food)
    if (event.httpMethod === 'POST') {
      const today = new Date().toISOString().split('T')[0];

      // Get or create stats
      let stats = await sql`
        SELECT * FROM user_stats WHERE user_id = ${userId}
      `;

      if (stats.length === 0) {
        stats = await sql`
          INSERT INTO user_stats (user_id)
          VALUES (${userId})
          RETURNING *
        `;
      }

      const currentStats = stats[0];
      const lastLoggedDate = currentStats.last_logged_date;
      let currentStreak = currentStats.current_streak;
      let longestStreak = currentStats.longest_streak;
      let totalDaysLogged = currentStats.total_days_logged;
      const achievements = currentStats.achievements || [];
      const newAchievements = [];

      // Calculate streak
      if (!lastLoggedDate || lastLoggedDate !== today) {
        // First entry ever
        if (!lastLoggedDate) {
          currentStreak = 1;
          totalDaysLogged = 1;
          if (!achievements.includes(ACHIEVEMENTS.FIRST_ENTRY.id)) {
            newAchievements.push(ACHIEVEMENTS.FIRST_ENTRY.id);
          }
        } else {
          // Check if yesterday
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          if (lastLoggedDate === yesterdayStr) {
            // Continue streak
            currentStreak += 1;
            totalDaysLogged += 1;
          } else {
            // Streak broken
            currentStreak = 1;
            totalDaysLogged += 1;
          }
        }

        // Update longest streak
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }

        // Check for streak achievements
        if (currentStreak >= 7 && !achievements.includes(ACHIEVEMENTS.WEEK_WARRIOR.id)) {
          newAchievements.push(ACHIEVEMENTS.WEEK_WARRIOR.id);
        }
        if (currentStreak >= 14 && !achievements.includes(ACHIEVEMENTS.TWO_WEEK_STREAK.id)) {
          newAchievements.push(ACHIEVEMENTS.TWO_WEEK_STREAK.id);
        }
        if (currentStreak >= 30 && !achievements.includes(ACHIEVEMENTS.MONTH_MASTER.id)) {
          newAchievements.push(ACHIEVEMENTS.MONTH_MASTER.id);
        }
        if (currentStreak >= 50 && !achievements.includes(ACHIEVEMENTS.FIFTY_DAY_STREAK.id)) {
          newAchievements.push(ACHIEVEMENTS.FIFTY_DAY_STREAK.id);
        }
        if (currentStreak >= 100 && !achievements.includes(ACHIEVEMENTS.CENTURY_STREAK.id)) {
          newAchievements.push(ACHIEVEMENTS.CENTURY_STREAK.id);
        }

        // Check for total days achievements
        if (totalDaysLogged >= 100 && !achievements.includes(ACHIEVEMENTS.HUNDRED_DAYS.id)) {
          newAchievements.push(ACHIEVEMENTS.HUNDRED_DAYS.id);
        }

        // Check for protein/macro achievements (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

        // Get user's protein goal
        const goals = await sql`
          SELECT protein_target FROM user_goals WHERE user_id = ${userId}
        `;

        if (goals.length > 0) {
          const proteinTarget = Number(goals[0].protein_target);
          const proteinThreshold = proteinTarget * 0.8;

          // Get daily nutrition for last 7 days
          const dailyNutrition = await sql`
            SELECT
              date,
              SUM(protein * servings) as total_protein
            FROM food_entries
            WHERE user_id = ${userId}
              AND date >= ${sevenDaysAgoStr}
              AND date <= ${today}
            GROUP BY date
            ORDER BY date DESC
          `;

          // Check if 7 consecutive days of hitting protein
          if (dailyNutrition.length >= 7) {
            const last7Days = dailyNutrition.slice(0, 7);
            const allMetProtein = last7Days.every(
              (day) => Number(day.total_protein) >= proteinThreshold
            );

            if (allMetProtein && !achievements.includes(ACHIEVEMENTS.PROTEIN_PRO_7.id)) {
              newAchievements.push(ACHIEVEMENTS.PROTEIN_PRO_7.id);
            }
          }
        }

        // Update stats
        const updatedAchievements = [...achievements, ...newAchievements];
        const updatedStats = await sql`
          UPDATE user_stats
          SET
            current_streak = ${currentStreak},
            longest_streak = ${longestStreak},
            total_days_logged = ${totalDaysLogged},
            last_logged_date = ${today},
            achievements = ${JSON.stringify(updatedAchievements)},
            updated_at = NOW()
          WHERE user_id = ${userId}
          RETURNING *
        `;

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            stats: updatedStats[0],
            newAchievements: newAchievements.map((id) =>
              Object.values(ACHIEVEMENTS).find((a) => a.id === id)
            ),
          }),
        };
      } else {
        // Already logged today, just return current stats
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            stats: currentStats,
            newAchievements: [],
          }),
        };
      }
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('User stats function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

export { handler };
