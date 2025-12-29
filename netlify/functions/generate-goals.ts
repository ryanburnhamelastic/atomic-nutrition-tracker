import { Handler, HandlerEvent } from '@netlify/functions';
import { corsHeaders } from './db';
import { authenticateRequest, unauthorizedResponse } from './auth';
import { model } from './lib/gemini';

// Input for goal generation
interface GoalGenerationInput {
  age: number;
  sex: 'male' | 'female';
  heightCm: number;
  weightKg: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose_weight' | 'maintain' | 'gain_muscle';
  additionalContext?: string;
}

// Output from goal generation
interface GeneratedGoals {
  calorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  explanation: string;
}

const GOAL_GENERATION_PROMPT = `You are a certified nutritionist AI assistant. Generate personalized daily nutrition goals based on the user's profile.

USER PROFILE:
- Age: {age} years
- Sex: {sex}
- Height: {heightCm} cm ({heightFt})
- Weight: {weightKg} kg ({weightLbs} lbs)
- Activity Level: {activityLevel}
- Goal: {goal}
{additionalContext}

INSTRUCTIONS:
1. Calculate BMR using the Mifflin-St Jeor equation:
   - Men: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age) + 5
   - Women: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age) - 161

2. Calculate TDEE by multiplying BMR by activity factor:
   - Sedentary (little/no exercise): 1.2
   - Lightly active (light exercise 1-3 days/week): 1.375
   - Moderately active (moderate exercise 3-5 days/week): 1.55
   - Active (hard exercise 6-7 days/week): 1.725
   - Very active (very hard exercise, physical job): 1.9

3. Adjust calories based on goal:
   - Lose weight: TDEE - 500 calories (safe 1 lb/week loss)
   - Maintain: TDEE
   - Gain muscle: TDEE + 300 calories (lean bulk)

4. Calculate macros:
   For weight loss:
   - Protein: 1.0-1.2g per lb of body weight (preserve muscle)
   - Fat: 25-30% of calories
   - Carbs: remaining calories

   For maintenance:
   - Protein: 0.8-1.0g per lb of body weight
   - Fat: 25-30% of calories
   - Carbs: remaining calories

   For muscle gain:
   - Protein: 1.0-1.2g per lb of body weight
   - Fat: 20-25% of calories
   - Carbs: remaining calories (higher for energy)

5. Ensure minimums:
   - Calories: minimum 1200 for women, 1500 for men
   - Protein: at least 50g
   - Fat: at least 40g (essential for hormones)
   - Carbs: at least 100g (brain function)

Return ONLY valid JSON in this exact format:
{
  "calorieTarget": 2000,
  "proteinTarget": 150,
  "carbsTarget": 200,
  "fatTarget": 65,
  "explanation": "Brief 2-3 sentence explanation of the recommendations."
}

Round all values to whole numbers. The explanation should be friendly and motivating.`;

const handler: Handler = async (event: HandlerEvent) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  try {
    const authResult = await authenticateRequest(event);

    if (!authResult.authenticated || !authResult.clerkUserId) {
      return unauthorizedResponse(corsHeaders, authResult.error);
    }

    // POST - Generate goals
    if (event.httpMethod === 'POST') {
      // Check if Gemini API key is configured
      if (!process.env.GEMINI_API_KEY) {
        return {
          statusCode: 503,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'AI service not configured' }),
        };
      }

      // Parse request body
      let input: GoalGenerationInput;
      try {
        input = JSON.parse(event.body || '{}');
      } catch {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invalid request body' }),
        };
      }

      // Validate required fields
      const { age, sex, heightCm, weightKg, activityLevel, goal } = input;

      if (!age || !sex || !heightCm || !weightKg || !activityLevel || !goal) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Missing required fields' }),
        };
      }

      // Validate ranges
      if (age < 13 || age > 120) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Age must be between 13 and 120' }),
        };
      }

      if (heightCm < 100 || heightCm > 250) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Height must be between 100 and 250 cm' }),
        };
      }

      if (weightKg < 30 || weightKg > 300) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Weight must be between 30 and 300 kg' }),
        };
      }

      // Build prompt
      const heightFt = `${Math.floor(heightCm / 30.48)}'${Math.round((heightCm % 30.48) / 2.54)}"`;
      const weightLbs = Math.round(weightKg * 2.205);

      const activityLabels: Record<string, string> = {
        sedentary: 'Sedentary (little/no exercise)',
        light: 'Lightly active (light exercise 1-3 days/week)',
        moderate: 'Moderately active (moderate exercise 3-5 days/week)',
        active: 'Active (hard exercise 6-7 days/week)',
        very_active: 'Very active (very hard exercise, physical job)',
      };

      const goalLabels: Record<string, string> = {
        lose_weight: 'Lose weight',
        maintain: 'Maintain current weight',
        gain_muscle: 'Build muscle/gain weight',
      };

      const prompt = GOAL_GENERATION_PROMPT
        .replace('{age}', String(age))
        .replace('{sex}', sex)
        .replace('{heightCm}', String(heightCm))
        .replace('{heightFt}', heightFt)
        .replace('{weightKg}', String(weightKg))
        .replace('{weightLbs}', String(weightLbs))
        .replace('{activityLevel}', activityLabels[activityLevel] || activityLevel)
        .replace('{goal}', goalLabels[goal] || goal)
        .replace('{additionalContext}', input.additionalContext
          ? `- Additional context: ${input.additionalContext}`
          : '');

      try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('No JSON found in Gemini response:', text);
          return {
            statusCode: 502,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Failed to generate goals. Please try again.' }),
          };
        }

        const parsed = JSON.parse(jsonMatch[0]) as GeneratedGoals;

        // Validate and sanitize response
        const sanitized: GeneratedGoals = {
          calorieTarget: Math.max(1200, Math.min(5000, Math.round(Number(parsed.calorieTarget) || 2000))),
          proteinTarget: Math.max(50, Math.min(400, Math.round(Number(parsed.proteinTarget) || 150))),
          carbsTarget: Math.max(100, Math.min(600, Math.round(Number(parsed.carbsTarget) || 250))),
          fatTarget: Math.max(40, Math.min(200, Math.round(Number(parsed.fatTarget) || 65))),
          explanation: String(parsed.explanation || 'Goals calculated based on your profile.').slice(0, 500),
        };

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(sanitized),
        };
      } catch (error) {
        console.error('Gemini goal generation failed:', error);
        return {
          statusCode: 502,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Failed to generate goals. Please try again.' }),
        };
      }
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Generate goals function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

export { handler };
