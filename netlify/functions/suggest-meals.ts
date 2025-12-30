import { Handler, HandlerEvent } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

    // Only support POST
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { date, currentTime } = body;

    if (!date || !currentTime) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing required fields: date, currentTime' }),
      };
    }

    // 1. Get today's food entries
    const todayEntries = await sql`
      SELECT meal_type, calories, protein, carbs, fat
      FROM food_entries
      WHERE user_id = ${userId} AND date = ${date}
    `;

    // Calculate consumed macros
    const consumed = todayEntries.reduce(
      (acc, entry) => ({
        calories: acc.calories + Number(entry.calories),
        protein: acc.protein + Number(entry.protein),
        carbs: acc.carbs + Number(entry.carbs),
        fat: acc.fat + Number(entry.fat),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    // 2. Get user goals (try program first, then user_goals)
    const activePrograms = await sql`
      SELECT calorie_target, protein_target, carbs_target, fat_target
      FROM user_programs
      WHERE user_id = ${userId} AND status = 'active'
      ORDER BY start_date DESC
      LIMIT 1
    `;

    let goals;
    if (activePrograms.length > 0) {
      goals = {
        calorie_target: Number(activePrograms[0].calorie_target),
        protein_target: Number(activePrograms[0].protein_target),
        carbs_target: Number(activePrograms[0].carbs_target),
        fat_target: Number(activePrograms[0].fat_target),
      };
    } else {
      const userGoals = await sql`
        SELECT calorie_target, protein_target, carbs_target, fat_target
        FROM user_goals
        WHERE user_id = ${userId}
      `;

      if (userGoals.length === 0) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'No nutrition goals found. Please set your goals first.' }),
        };
      }

      goals = {
        calorie_target: Number(userGoals[0].calorie_target),
        protein_target: Number(userGoals[0].protein_target),
        carbs_target: Number(userGoals[0].carbs_target),
        fat_target: Number(userGoals[0].fat_target),
      };
    }

    // 3. Calculate remaining macros
    const remaining = {
      calories: goals.calorie_target - consumed.calories,
      protein: goals.protein_target - consumed.protein,
      carbs: goals.carbs_target - consumed.carbs,
      fat: goals.fat_target - consumed.fat,
    };

    // 4. Get recent foods (past 7 days, excluding today)
    const sevenDaysAgo = new Date(date);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const recentFoods = await sql`
      SELECT
        name,
        meal_type,
        COUNT(*) as frequency,
        AVG(calories) as avg_calories,
        AVG(protein) as avg_protein,
        AVG(carbs) as avg_carbs,
        AVG(fat) as avg_fat
      FROM food_entries
      WHERE user_id = ${userId}
        AND date >= ${sevenDaysAgoStr}
        AND date <= ${yesterdayStr}
      GROUP BY name, meal_type
      ORDER BY frequency DESC, name ASC
      LIMIT 20
    `;

    // 5. Determine remaining meals based on current time
    const hour = parseInt(currentTime.split(':')[0]);
    const remainingMeals: string[] = [];

    if (hour >= 5 && hour < 10) remainingMeals.push('breakfast');
    if (hour >= 10 && hour < 15) remainingMeals.push('lunch');
    if (hour >= 15 && hour < 21) remainingMeals.push('dinner');
    remainingMeals.push('snack'); // Always available

    if (hour < 5) {
      // Very early morning - show all meals
      remainingMeals.push('breakfast', 'lunch', 'dinner');
    }

    const mealTypes = remainingMeals.length > 0 ? remainingMeals.join(' and ') : 'snack';

    // 6. Format recent foods for prompt
    const formattedRecentFoods = formatRecentFoods(recentFoods);

    // 7. Build Gemini prompt
    const prompt = buildMealSuggestionPrompt(
      currentTime,
      mealTypes,
      remaining,
      formattedRecentFoods
    );

    // 8. Call Gemini API
    const apiKey = process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[Meal Suggestions] Gemini API key not configured');
      return {
        statusCode: 503,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'AI service not configured' }),
      };
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Parse JSON from response
      const aiSuggestions = parseGeminiResponse(text);

      if (!aiSuggestions) {
        throw new Error('Invalid AI response format');
      }

      // Validate suggestions
      const validated = validateSuggestions(aiSuggestions, remaining);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          suggestions: validated.suggestions,
          confidence: validated.confidence,
        }),
      };
    } catch (geminiError) {
      console.error('[Meal Suggestions] Gemini API error:', geminiError);

      // Return fallback suggestions
      const fallback = generateFallbackSuggestions(remaining, remainingMeals);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          suggestions: fallback,
          confidence: 'low',
        }),
      };
    }
  } catch (error) {
    console.error('Meal suggestions function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

/**
 * Format recent foods for Gemini prompt
 */
function formatRecentFoods(foods: any[]): string {
  if (foods.length === 0) {
    return 'No recent food history available (new user).';
  }

  const grouped = foods.reduce((acc, food) => {
    const mealType = food.meal_type as string;
    if (!acc[mealType]) acc[mealType] = [];
    acc[mealType].push(food.name);
    return acc;
  }, {} as Record<string, string[]>);

  return Object.entries(grouped)
    .map(([meal, items]) => `${meal}: ${items.slice(0, 5).join(', ')}`)
    .join('\n');
}

/**
 * Build Gemini prompt for meal suggestions
 */
function buildMealSuggestionPrompt(
  currentTime: string,
  mealTypes: string,
  remaining: { calories: number; protein: number; carbs: number; fat: number },
  recentFoods: string
): string {
  const calorieStatus = remaining.calories < 0 ? 'exceeded by ' + Math.abs(remaining.calories) : remaining.calories;
  const proteinStatus = remaining.protein < 0 ? 'exceeded by ' + Math.abs(remaining.protein) : remaining.protein;

  return `You are a nutrition AI assistant helping users plan their remaining meals.

CURRENT SITUATION:
- Time: ${currentTime}
- Remaining meals today: ${mealTypes}
- Remaining macros:
  * Calories: ${remaining.calories < 0 ? 'EXCEEDED - over by ' + Math.abs(remaining.calories) : remaining.calories} kcal
  * Protein: ${proteinStatus}g
  * Carbs: ${remaining.carbs}g
  * Fat: ${remaining.fat}g

RECENT FOOD HISTORY (past 7 days):
${recentFoods}

INSTRUCTIONS:
1. Suggest 2-3 specific meals/foods for the remaining meal types
2. Consider the user's eating patterns from recent history
3. Prioritize hitting remaining macro targets (especially protein)
4. Provide practical, achievable suggestions
5. Include portion sizes that fit the remaining macros
6. If macros are negative (over target), suggest lighter, lower-calorie options
7. Be realistic - suggest foods people actually eat

Return ONLY valid JSON with this exact structure:
{
  "specificMeals": [
    {
      "mealType": "dinner",
      "foodName": "Grilled chicken breast with steamed broccoli",
      "servingSize": 200,
      "servingUnit": "g",
      "calories": 280,
      "protein": 45,
      "carbs": 8,
      "fat": 6,
      "reason": "High protein to meet remaining target, low calorie"
    }
  ],
  "generalGuidance": {
    "overview": "You have plenty of protein remaining. Focus on lean proteins with vegetables for dinner, and keep snacks light.",
    "priorities": ["Lean proteins (chicken, fish, tofu)", "Non-starchy vegetables", "Moderate healthy fats"],
    "avoidances": ["High-carb snacks", "Heavy sauces", "Fried foods"],
    "tips": ["Drink water before meals", "Prep dinner early", "Keep healthy snacks ready"]
  },
  "confidence": "high"
}`;
}

/**
 * Parse Gemini response to extract JSON
 */
function parseGeminiResponse(text: string): any {
  try {
    // Try direct JSON parse
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }

    // Try to find JSON object in text
    const objectMatch = text.match(/\{[\s\S]*"specificMeals"[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]);
    }

    return null;
  }
}

/**
 * Validate and sanitize AI suggestions
 */
function validateSuggestions(
  aiResponse: any,
  remaining: { calories: number; protein: number; carbs: number; fat: number }
): any {
  const suggestions = aiResponse.specificMeals || [];
  const guidance = aiResponse.generalGuidance || {
    overview: '',
    priorities: [],
    avoidances: [],
    tips: [],
  };

  // Validate each meal suggestion
  const validatedMeals = suggestions.map((meal: any) => ({
    mealType: meal.mealType || 'snack',
    foodName: meal.foodName || 'Suggested meal',
    servingSize: Math.max(1, Math.min(1000, Number(meal.servingSize) || 100)),
    servingUnit: meal.servingUnit || 'g',
    calories: Math.max(0, Math.min(2000, Number(meal.calories) || 0)),
    protein: Math.max(0, Math.min(200, Number(meal.protein) || 0)),
    carbs: Math.max(0, Math.min(200, Number(meal.carbs) || 0)),
    fat: Math.max(0, Math.min(100, Number(meal.fat) || 0)),
    reason: meal.reason || 'Balanced nutrition',
  }));

  return {
    suggestions: {
      specificMeals: validatedMeals,
      generalGuidance: {
        overview: String(guidance.overview || 'Plan your remaining meals to meet your targets'),
        priorities: Array.isArray(guidance.priorities) ? guidance.priorities : [],
        avoidances: Array.isArray(guidance.avoidances) ? guidance.avoidances : [],
        tips: Array.isArray(guidance.tips) ? guidance.tips : [],
      },
    },
    confidence: aiResponse.confidence || 'medium',
  };
}

/**
 * Generate fallback suggestions when Gemini fails
 */
function generateFallbackSuggestions(
  remaining: { calories: number; protein: number; carbs: number; fat: number },
  remainingMeals: string[]
): any {
  const suggestions: any[] = [];

  // High protein suggestion if protein is remaining
  if (remaining.protein > 20) {
    suggestions.push({
      mealType: remainingMeals.includes('dinner') ? 'dinner' : 'snack',
      foodName: 'Grilled chicken breast with vegetables',
      servingSize: 150,
      servingUnit: 'g',
      calories: Math.min(300, remaining.calories),
      protein: Math.min(40, remaining.protein),
      carbs: 5,
      fat: 5,
      reason: 'High protein to meet remaining target',
    });
  }

  // Balanced meal suggestion
  if (remaining.calories > 200) {
    suggestions.push({
      mealType: remainingMeals.includes('lunch') ? 'lunch' : 'dinner',
      foodName: 'Lean protein with rice and vegetables',
      servingSize: 200,
      servingUnit: 'g',
      calories: Math.min(400, remaining.calories),
      protein: Math.min(30, remaining.protein),
      carbs: Math.min(40, remaining.carbs),
      fat: Math.min(10, remaining.fat),
      reason: 'Balanced macros to meet targets',
    });
  }

  // Light snack if calories are low or exceeded
  suggestions.push({
    mealType: 'snack',
    foodName: 'Greek yogurt with berries',
    servingSize: 150,
    servingUnit: 'g',
    calories: 120,
    protein: 15,
    carbs: 15,
    fat: 2,
    reason: 'Light, protein-rich snack',
  });

  return {
    specificMeals: suggestions,
    generalGuidance: {
      overview: 'Focus on lean proteins and vegetables to meet your remaining targets.',
      priorities: ['Lean proteins', 'Non-starchy vegetables', 'Whole grains in moderation'],
      avoidances: ['Processed foods', 'Sugary snacks', 'Heavy sauces'],
      tips: ['Stay hydrated', 'Plan your meals ahead', 'Track your portions'],
    },
  };
}

export { handler };
