import { Handler, HandlerEvent } from '@netlify/functions';
import { initDb, getDb, corsHeaders } from './db';
import { authenticateRequest, unauthorizedResponse } from './auth';

interface FoodEntry {
  id: string;
  user_id: string;
  food_id: string | null;
  custom_food_id: string | null;
  date: string;
  meal_type: string;
  servings: number;
  name: string;
  serving_size: number;
  serving_unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  created_at: string;
  updated_at: string;
}

interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealSummary extends NutritionTotals {
  entries: FoodEntry[];
}

const emptyMealSummary = (): MealSummary => ({
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  entries: [],
});

const handler: Handler = async (event: HandlerEvent) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  // Only GET is allowed
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
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
    const date = event.queryStringParameters?.date;

    if (!date) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Date parameter is required' }),
      };
    }

    // Fetch all entries for the date
    const entries = await sql`
      SELECT id, user_id, food_id, custom_food_id, date, meal_type, servings,
             name, serving_size, serving_unit, calories, protein, carbs, fat,
             created_at, updated_at
      FROM food_entries
      WHERE user_id = ${userId} AND date = ${date}
      ORDER BY created_at ASC
    ` as FoodEntry[];

    // Group entries by meal type and calculate totals
    const byMeal: Record<string, MealSummary> = {
      breakfast: emptyMealSummary(),
      lunch: emptyMealSummary(),
      dinner: emptyMealSummary(),
      snack: emptyMealSummary(),
    };

    const totals: NutritionTotals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };

    for (const entry of entries) {
      const mealType = entry.meal_type;
      if (byMeal[mealType]) {
        // Calculate nutrition based on servings
        const entryCalories = Number(entry.calories) * Number(entry.servings);
        const entryProtein = Number(entry.protein) * Number(entry.servings);
        const entryCarbs = Number(entry.carbs) * Number(entry.servings);
        const entryFat = Number(entry.fat) * Number(entry.servings);

        byMeal[mealType].entries.push(entry);
        byMeal[mealType].calories += entryCalories;
        byMeal[mealType].protein += entryProtein;
        byMeal[mealType].carbs += entryCarbs;
        byMeal[mealType].fat += entryFat;

        totals.calories += entryCalories;
        totals.protein += entryProtein;
        totals.carbs += entryCarbs;
        totals.fat += entryFat;
      }
    }

    // Round totals to 1 decimal place
    totals.calories = Math.round(totals.calories * 10) / 10;
    totals.protein = Math.round(totals.protein * 10) / 10;
    totals.carbs = Math.round(totals.carbs * 10) / 10;
    totals.fat = Math.round(totals.fat * 10) / 10;

    for (const meal of Object.values(byMeal)) {
      meal.calories = Math.round(meal.calories * 10) / 10;
      meal.protein = Math.round(meal.protein * 10) / 10;
      meal.carbs = Math.round(meal.carbs * 10) / 10;
      meal.fat = Math.round(meal.fat * 10) / 10;
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        date,
        totals,
        byMeal,
      }),
    };
  } catch (error) {
    console.error('Daily summary function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

export { handler };
