import { Handler, HandlerEvent } from '@netlify/functions';
import { initDb, getDb, corsHeaders } from './db';
import { authenticateRequest, unauthorizedResponse } from './auth';
import { model } from './lib/gemini';

// Program review generation response
interface ReviewGenerationResponse {
  analysis: string;
  recommendedCalories: number;
  recommendedProtein: number;
  recommendedCarbs: number;
  recommendedFat: number;
  confidenceLevel: 'low' | 'medium' | 'high';
  reasoning: string;
}

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

    // Get user ID
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
    const path = event.path;

    // GET - List reviews
    if (event.httpMethod === 'GET') {
      const status = event.queryStringParameters?.status;
      const programId = event.queryStringParameters?.programId;
      const limit = parseInt(event.queryStringParameters?.limit || '10', 10);

      let reviews;
      if (programId) {
        // Get reviews for specific program
        reviews = await sql`
          SELECT * FROM program_reviews
          WHERE user_id = ${userId} AND program_id = ${programId}
          ${status ? sql`AND status = ${status}` : sql``}
          ORDER BY review_date DESC
          LIMIT ${Math.min(limit, 50)}
        `;
      } else {
        // Get all reviews for user
        reviews = await sql`
          SELECT * FROM program_reviews
          WHERE user_id = ${userId}
          ${status ? sql`AND status = ${status}` : sql``}
          ORDER BY review_date DESC
          LIMIT ${Math.min(limit, 50)}
        `;
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ reviews }),
      };
    }

    // POST - Route based on path
    if (event.httpMethod === 'POST') {
      // Generate review
      if (path.includes('/generate')) {
        const body = JSON.parse(event.body || '{}');
        const programId = body.programId;
        const forceReview = body.forceReview || false;

        // Get active program if not specified
        let program;
        if (programId) {
          const programs = await sql`
            SELECT * FROM user_programs
            WHERE id = ${programId} AND user_id = ${userId}
          `;
          if (programs.length === 0) {
            return {
              statusCode: 404,
              headers: corsHeaders,
              body: JSON.stringify({ error: 'Program not found' }),
            };
          }
          program = programs[0];
        } else {
          // Get active program
          const programs = await sql`
            SELECT * FROM user_programs
            WHERE user_id = ${userId} AND status = 'active'
            ORDER BY start_date DESC
            LIMIT 1
          `;
          if (programs.length === 0) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify({ error: 'No active program found' }),
            };
          }
          program = programs[0];
        }

        // Check if review already exists this week (unless forced)
        const today = new Date().toISOString().split('T')[0];
        const daysSinceStart = Math.floor(
          (new Date(today).getTime() - new Date(program.start_date).getTime()) / (1000 * 60 * 60 * 24)
        );
        const currentWeek = Math.floor(daysSinceStart / 7) + 1;

        if (!forceReview) {
          const existing = await sql`
            SELECT * FROM program_reviews
            WHERE program_id = ${program.id} AND review_week = ${currentWeek}
          `;
          if (existing.length > 0) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify({ error: 'Review already exists for this week' }),
            };
          }
        }

        // Calculate date range (last 7 days OR since last review)
        const endDate = today;
        let startDate: string;

        if (program.last_review_date) {
          startDate = new Date(new Date(program.last_review_date).getTime() + 86400000)
            .toISOString()
            .split('T')[0];
        } else {
          // First review: start from program start or 7 days ago, whichever is more recent
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          startDate = program.start_date > sevenDaysAgo ? program.start_date : sevenDaysAgo;
        }

        // Aggregate food entries for the period
        const foodData = await sql`
          SELECT
            date,
            SUM(calories * servings) as total_calories,
            SUM(protein * servings) as total_protein,
            SUM(carbs * servings) as total_carbs,
            SUM(fat * servings) as total_fat
          FROM food_entries
          WHERE user_id = ${userId}
            AND date >= ${startDate}
            AND date <= ${endDate}
          GROUP BY date
          ORDER BY date ASC
        `;

        // Check if enough data
        if (foodData.length < 4) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({
              error: 'Insufficient data. Need at least 4 days of food entries in the review period.',
            }),
          };
        }

        // Calculate averages
        const daysAnalyzed = foodData.length;
        const avgCalories = Math.round(
          foodData.reduce((sum: number, day: any) => sum + Number(day.total_calories), 0) / daysAnalyzed
        );
        const avgProtein = Math.round(
          foodData.reduce((sum: number, day: any) => sum + Number(day.total_protein), 0) / daysAnalyzed
        );
        const avgCarbs = Math.round(
          foodData.reduce((sum: number, day: any) => sum + Number(day.total_carbs), 0) / daysAnalyzed
        );
        const avgFat = Math.round(
          foodData.reduce((sum: number, day: any) => sum + Number(day.total_fat), 0) / daysAnalyzed
        );

        // Calculate compliance rate (protein ≥80% target AND calories ≤ target)
        const compliantDays = foodData.filter((day: any) => {
          const proteinCompliant = Number(day.total_protein) >= program.protein_target * 0.8;
          const calorieCompliant = Number(day.total_calories) <= program.calorie_target;
          return proteinCompliant && calorieCompliant;
        }).length;
        const complianceRate = Math.round((compliantDays / daysAnalyzed) * 100);

        // Get weight data
        const weights = await sql`
          SELECT weight_kg, trend_weight, date
          FROM weight_entries
          WHERE user_id = ${userId}
          ORDER BY date DESC
          LIMIT 1
        `;

        const currentWeight = weights.length > 0 ? Number(weights[0].weight_kg) : null;
        const trendWeight = weights.length > 0 ? Number(weights[0].trend_weight) : null;
        const startingWeight = program.starting_weight_kg ? Number(program.starting_weight_kg) : null;

        let weightChange: number | null = null;
        if (currentWeight && startingWeight) {
          weightChange = currentWeight - startingWeight;
        }

        // Calculate expected weight change based on program type
        const programGoal = getGoalFromProgramId(program.program_id);
        const weeksElapsed = currentWeek;
        const expectedWeeklyRate = getExpectedWeeklyRate(programGoal);

        // Build AI prompt
        const prompt = buildReviewPrompt({
          programType: program.program_id,
          programGoal,
          currentWeek,
          totalWeeks: program.duration_weeks,
          daysRemaining: Math.floor(
            (new Date(program.end_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
          ),
          currentCalories: program.calorie_target,
          currentProtein: program.protein_target,
          currentCarbs: program.carbs_target,
          currentFat: program.fat_target,
          daysAnalyzed,
          avgCalories,
          avgProtein,
          avgCarbs,
          avgFat,
          calorieDeviation: Math.round(((avgCalories - program.calorie_target) / program.calorie_target) * 100),
          proteinDeviation: Math.round(((avgProtein - program.protein_target) / program.protein_target) * 100),
          complianceRate,
          startWeight: startingWeight,
          currentWeight,
          trendWeight,
          weightChange,
          weeklyRate: weightChange ? weightChange / weeksElapsed : null,
          expectedRate: expectedWeeklyRate,
        });

        // Call Gemini AI
        console.log('Calling Gemini for program review...');
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('No JSON found in Gemini response:', text);
          return {
            statusCode: 503,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'AI service returned invalid response' }),
          };
        }

        const aiResponse: ReviewGenerationResponse = JSON.parse(jsonMatch[0]);

        // Validate and sanitize recommendations
        const validated = validateRecommendations(aiResponse, program);

        // Save review to database
        const reviews = await sql`
          INSERT INTO program_reviews (
            user_id,
            program_id,
            review_week,
            review_date,
            days_analyzed,
            avg_calories,
            avg_protein,
            avg_carbs,
            avg_fat,
            compliance_rate,
            starting_weight_kg,
            current_weight_kg,
            trend_weight_kg,
            weight_change_kg,
            ai_analysis,
            recommended_calories,
            recommended_protein,
            recommended_carbs,
            recommended_fat,
            confidence_level,
            status
          ) VALUES (
            ${userId},
            ${program.id},
            ${currentWeek},
            ${today},
            ${daysAnalyzed},
            ${avgCalories},
            ${avgProtein},
            ${avgCarbs},
            ${avgFat},
            ${complianceRate},
            ${startingWeight},
            ${currentWeight},
            ${trendWeight},
            ${weightChange},
            ${validated.analysis},
            ${validated.recommendedCalories},
            ${validated.recommendedProtein},
            ${validated.recommendedCarbs},
            ${validated.recommendedFat},
            ${validated.confidenceLevel},
            'pending'
          )
          RETURNING *
        `;

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            review: reviews[0],
            message: 'Review generated successfully',
          }),
        };
      }

      // Accept review
      if (path.match(/\/program-reviews\/[^/]+\/accept/)) {
        const reviewId = path.split('/')[2];
        const body = JSON.parse(event.body || '{}');
        const userNotes = body.notes;

        // Get review
        const reviews = await sql`
          SELECT * FROM program_reviews
          WHERE id = ${reviewId} AND user_id = ${userId}
        `;

        if (reviews.length === 0) {
          return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Review not found' }),
          };
        }

        const review = reviews[0];

        if (review.status !== 'pending') {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Review has already been processed' }),
          };
        }

        // Get program
        const programs = await sql`
          SELECT * FROM user_programs
          WHERE id = ${review.program_id}
        `;

        if (programs.length === 0) {
          return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Program not found' }),
          };
        }

        const program = programs[0];

        // Update review status
        await sql`
          UPDATE program_reviews
          SET status = 'accepted',
              user_response_date = NOW(),
              user_notes = ${userNotes},
              updated_at = NOW()
          WHERE id = ${reviewId}
        `;

        // Insert into macro history
        await sql`
          INSERT INTO program_macro_history (
            program_id,
            review_id,
            calorie_target,
            protein_target,
            carbs_target,
            fat_target,
            effective_date,
            change_reason
          ) VALUES (
            ${program.id},
            ${reviewId},
            ${review.recommended_calories},
            ${review.recommended_protein},
            ${review.recommended_carbs},
            ${review.recommended_fat},
            CURRENT_DATE,
            'ai_review'
          )
        `;

        // Update program macros
        const updatedPrograms = await sql`
          UPDATE user_programs
          SET calorie_target = ${review.recommended_calories},
              protein_target = ${review.recommended_protein},
              carbs_target = ${review.recommended_carbs},
              fat_target = ${review.recommended_fat},
              last_review_date = CURRENT_DATE,
              next_review_date = CURRENT_DATE + INTERVAL '7 days',
              review_count = review_count + 1,
              updated_at = NOW()
          WHERE id = ${program.id}
          RETURNING *
        `;

        // Update user_goals to match
        await sql`
          UPDATE user_goals
          SET calorie_target = ${review.recommended_calories},
              protein_target = ${review.recommended_protein},
              carbs_target = ${review.recommended_carbs},
              fat_target = ${review.recommended_fat},
              updated_at = NOW()
          WHERE user_id = ${userId}
        `;

        // Get updated goals
        const goals = await sql`
          SELECT * FROM user_goals WHERE user_id = ${userId}
        `;

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            review: { ...review, status: 'accepted', user_notes: userNotes },
            program: updatedPrograms[0],
            goals: goals[0],
            message: 'Macros updated successfully',
          }),
        };
      }

      // Reject review
      if (path.match(/\/program-reviews\/[^/]+\/reject/)) {
        const reviewId = path.split('/')[2];
        const body = JSON.parse(event.body || '{}');
        const userNotes = body.reason;

        // Get review
        const reviews = await sql`
          SELECT * FROM program_reviews
          WHERE id = ${reviewId} AND user_id = ${userId}
        `;

        if (reviews.length === 0) {
          return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Review not found' }),
          };
        }

        const review = reviews[0];

        if (review.status !== 'pending') {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Review has already been processed' }),
          };
        }

        // Update review status
        await sql`
          UPDATE program_reviews
          SET status = 'rejected',
              user_response_date = NOW(),
              user_notes = ${userNotes},
              updated_at = NOW()
          WHERE id = ${reviewId}
        `;

        // Update program next review date
        await sql`
          UPDATE user_programs
          SET last_review_date = CURRENT_DATE,
              next_review_date = CURRENT_DATE + INTERVAL '7 days',
              review_count = review_count + 1,
              updated_at = NOW()
          WHERE id = ${review.program_id}
        `;

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            review: { ...review, status: 'rejected', user_notes: userNotes },
            message: 'Review rejected, macros unchanged',
          }),
        };
      }

      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Endpoint not found' }),
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Program reviews error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

// Helper: Get goal from program ID
function getGoalFromProgramId(programId: string): string {
  if (programId.includes('cut')) return 'cut';
  if (programId.includes('bulk')) return 'bulk';
  return 'maintenance';
}

// Helper: Get expected weekly weight change rate
function getExpectedWeeklyRate(goal: string): number {
  if (goal === 'cut') return -0.6; // -0.4 to -0.8 kg/week
  if (goal === 'bulk') return 0.3; // +0.2 to +0.4 kg/week
  return 0; // maintenance ±0.2 kg/week
}

// Helper: Build AI review prompt
function buildReviewPrompt(data: any): string {
  const startWeightLbs = data.startWeight ? (data.startWeight * 2.20462).toFixed(1) : 'N/A';
  const currentWeightLbs = data.currentWeight ? (data.currentWeight * 2.20462).toFixed(1) : 'N/A';
  const trendWeightLbs = data.trendWeight ? (data.trendWeight * 2.20462).toFixed(1) : 'N/A';
  const weightChangeLbs = data.weightChange ? (data.weightChange * 2.20462).toFixed(1) : 'N/A';
  const weeklyRateLbs = data.weeklyRate ? (data.weeklyRate * 2.20462).toFixed(2) : 'N/A';

  return `You are a certified nutrition coach analyzing a client's weekly progress.

PROGRAM CONTEXT:
- Program Type: ${data.programType} (${data.programGoal})
- Week: ${data.currentWeek} of ${data.totalWeeks}
- Days Remaining: ${data.daysRemaining}

CURRENT MACROS:
- Calories: ${data.currentCalories}
- Protein: ${data.currentProtein}g
- Carbs: ${data.currentCarbs}g
- Fat: ${data.currentFat}g

WEEKLY PERFORMANCE:
- Days with Data: ${data.daysAnalyzed}/7
- Average Intake:
  - Calories: ${data.avgCalories} (${data.calorieDeviation > 0 ? '+' : ''}${data.calorieDeviation}% vs target)
  - Protein: ${data.avgProtein}g (${data.proteinDeviation > 0 ? '+' : ''}${data.proteinDeviation}% vs target)
  - Carbs: ${data.avgCarbs}g
  - Fat: ${data.avgFat}g
- Compliance Rate: ${data.complianceRate}% (protein ≥80% target, calories ≤ target)

WEIGHT PROGRESS:
- Starting Weight: ${data.startWeight ? data.startWeight + ' kg' : 'N/A'} (${startWeightLbs} lbs)
- Current Weight: ${data.currentWeight ? data.currentWeight + ' kg' : 'N/A'} (${currentWeightLbs} lbs)
- Trend Weight (EWMA): ${data.trendWeight ? data.trendWeight + ' kg' : 'N/A'} (${trendWeightLbs} lbs)
- Total Change: ${data.weightChange ? data.weightChange + ' kg' : 'N/A'} (${weightChangeLbs} lbs)
- Weekly Rate: ${data.weeklyRate ? data.weeklyRate.toFixed(2) + ' kg/week' : 'N/A'} (${weeklyRateLbs} lbs/week)
- Expected Rate: ${data.expectedRate} kg/week for ${data.programGoal}

ANALYSIS INSTRUCTIONS:
1. **Adherence Assessment:**
   - Is the user hitting macro targets consistently?
   - Is compliance rate acceptable (>70% = good, >85% = excellent)?
   - Are they under/over-eating calories significantly?

2. **Weight Progress Assessment:**
   - Compare actual weight change vs expected:
     - Cut: -0.4 to -0.8 kg/week (-1 to -1.5 lbs/week)
     - Maintenance: ±0.2 kg/week
     - Bulk: +0.2 to +0.4 kg/week (+0.5 to +1 lbs/week)
   - Use trend weight (EWMA) for accuracy, not daily fluctuations
   - If weight isn't moving as expected and adherence is good, macros need adjustment

3. **Macro Adjustment Recommendations:**
   - **If losing too fast (>1 kg/week on cut):** Increase calories by 100-200
   - **If not losing (cut) or gaining (maintenance):** Decrease calories by 100-200
   - **If bulking too fast (>0.5 kg/week):** Decrease calories by 100
   - **If not gaining on bulk:** Increase calories by 100-200
   - **Protein:** Keep 0.8-1.2g/lb bodyweight, prioritize if low adherence
   - **Fats:** Maintain 20-30% of calories for hormones
   - **Carbs:** Adjust remaining calories
   - **Small changes:** 5-10% adjustments, be conservative

4. **Confidence Level:**
   - HIGH: ≥6 days data, clear trend, good adherence
   - MEDIUM: 4-5 days data OR mixed adherence
   - LOW: <4 days data OR poor adherence (<50%)

5. **Special Cases:**
   - If <4 days of data: "Insufficient data, continue monitoring"
   - If compliance <50%: Focus on adherence, not macro changes
   - If program ending soon (<2 weeks): Minimal changes

Return ONLY valid JSON in this exact format:
{
  "analysis": "2-3 paragraph analysis explaining performance, what's working, what's not",
  "recommendedCalories": 2000,
  "recommendedProtein": 170,
  "recommendedCarbs": 190,
  "recommendedFat": 65,
  "confidenceLevel": "high",
  "reasoning": "Brief 1-2 sentence explanation of why these specific macros"
}

Be encouraging, data-driven, and conservative with changes. Prioritize user safety and sustainable progress.`;
}

// Helper: Validate and sanitize AI recommendations
function validateRecommendations(
  aiResponse: ReviewGenerationResponse,
  program: any
): ReviewGenerationResponse {
  const validated: ReviewGenerationResponse = {
    analysis: (aiResponse.analysis || '').slice(0, 5000),
    recommendedCalories: Math.max(1200, Math.min(5000, Math.round(aiResponse.recommendedCalories || program.calorie_target))),
    recommendedProtein: Math.max(50, Math.min(400, Math.round(aiResponse.recommendedProtein || program.protein_target))),
    recommendedCarbs: Math.max(50, Math.min(600, Math.round(aiResponse.recommendedCarbs || program.carbs_target))),
    recommendedFat: Math.max(30, Math.min(200, Math.round(aiResponse.recommendedFat || program.fat_target))),
    confidenceLevel: ['low', 'medium', 'high'].includes(aiResponse.confidenceLevel)
      ? aiResponse.confidenceLevel
      : 'medium',
    reasoning: (aiResponse.reasoning || '').slice(0, 500),
  };

  // Ensure changes are within ±20% of current values
  const maxCalorieChange = program.calorie_target * 0.2;
  if (Math.abs(validated.recommendedCalories - program.calorie_target) > maxCalorieChange) {
    validated.recommendedCalories =
      program.calorie_target + (validated.recommendedCalories > program.calorie_target ? maxCalorieChange : -maxCalorieChange);
  }

  return validated;
}

export { handler };
