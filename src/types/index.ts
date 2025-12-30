/**
 * User entity - synced with Clerk authentication
 */
export interface User {
  id: string;
  clerk_user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  unit_system: 'metric' | 'imperial';
  created_at: string;
  updated_at: string;
}

/**
 * Generic API response wrapper
 * Use this for all API calls to handle errors consistently
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

/**
 * Input type for creating a user
 */
export interface CreateUserInput {
  email: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Input type for updating a user
 */
export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  unitSystem?: 'metric' | 'imperial';
}

// ============================================
// Nutrition Tracking Types
// ============================================

/**
 * User nutrition goals
 */
export interface UserGoals {
  id: string;
  user_id: string;
  calorie_target: number;
  protein_target: number;
  carbs_target: number;
  fat_target: number;
  use_metric: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateGoalsInput {
  calorieTarget?: number;
  proteinTarget?: number;
  carbsTarget?: number;
  fatTarget?: number;
  useMetric?: boolean;
}

/**
 * Weight entry for daily weight tracking
 */
export interface WeightEntry {
  id: string;
  user_id: string;
  date: string;
  weight_kg: number;
  trend_weight: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateWeightEntryInput {
  date: string;
  weightKg: number;
  notes?: string;
}

/**
 * Food from base database (system-wide)
 */
export interface Food {
  id: string;
  name: string;
  brand: string | null;
  serving_size: number;
  serving_unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  is_verified: boolean;
  source: string | null;
  created_at: string;
}

/**
 * User-created custom food
 */
export interface CustomFood {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  serving_size: number;
  serving_unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  created_at: string;
  updated_at: string;
}

/**
 * Recent food with frequency data
 */
export interface RecentFood extends Food {
  frequency: number;
  last_eaten: string;
  food_id: string | null;
  custom_food_id: string | null;
}

export interface CreateCustomFoodInput {
  name: string;
  brand?: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Meal type categories
 */
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/**
 * Logged food entry
 */
export interface FoodEntry {
  id: string;
  user_id: string;
  food_id: string | null;
  custom_food_id: string | null;
  date: string;
  meal_type: MealType;
  servings: number;
  name: string;
  serving_size: number;
  serving_unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateFoodEntryInput {
  date: string;
  mealType: MealType;
  foodId?: string;
  customFoodId?: string;
  servings: number;
  // Manual entry fields (required if no foodId/customFoodId)
  name?: string;
  servingSize?: number;
  servingUnit?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface UpdateFoodEntryInput {
  servings?: number;
  mealType?: MealType;
  name?: string;
  servingSize?: number;
  servingUnit?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

/**
 * Nutrition totals
 */
export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Meal summary with entries
 */
export interface MealSummary extends NutritionTotals {
  entries: FoodEntry[];
}

/**
 * Daily nutrition summary
 */
export interface DailySummary {
  date: string;
  totals: NutritionTotals;
  byMeal: {
    breakfast: MealSummary;
    lunch: MealSummary;
    dinner: MealSummary;
    snack: MealSummary;
  };
}

/**
 * Daily data point for reports
 */
export interface DailyDataPoint extends NutritionTotals {
  date: string;
}

/**
 * Report data for weekly/monthly views
 */
export interface ReportData {
  startDate: string;
  endDate: string;
  averages: NutritionTotals;
  dailyData: DailyDataPoint[];
}

// ============================================
// Gemini AI Types
// ============================================

/**
 * Food item returned by Gemini AI analysis
 */
export interface GeminiFood {
  name: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Response from image analysis endpoint
 */
export interface GeminiAnalysisResult {
  foods: GeminiFood[];
}

/**
 * Response from text parsing endpoint
 */
export interface GeminiParseResult {
  foods: GeminiFood[];
  originalText: string;
}

/**
 * Input for AI goal generation
 */
export interface GoalGenerationInput {
  age: number;
  sex: 'male' | 'female';
  heightCm: number;
  weightKg: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose_weight' | 'maintain' | 'gain_muscle';
  additionalContext?: string;
}

/**
 * Response from AI goal generation
 */
export interface GeneratedGoals {
  calorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  explanation: string;
}

// ============================================
// Analytics Types
// ============================================

/**
 * Weight data point for trend chart
 */
export interface WeightDataPoint {
  date: string;
  weight: number;
  trendWeight: number | null;
}

/**
 * Daily nutrition data with compliance
 */
export interface DailyNutritionData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  isCompliant: boolean;
}

/**
 * Compliance metrics
 */
export interface ComplianceMetrics {
  totalDays: number;
  compliantDays: number;
  complianceRate: number;
  currentStreak: number;
  longestStreak: number;
}

/**
 * Weekly nutrition averages
 */
export interface WeeklyAverage {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  compliance: number;
}

/**
 * Complete analytics response
 */
export interface AnalyticsData {
  dateRange: {
    start: string;
    end: string;
    days: number;
  };
  goals: {
    calorie_target: number;
    protein_target: number;
    carbs_target: number;
    fat_target: number;
  };
  weightTrend: WeightDataPoint[];
  dailyNutrition: DailyNutritionData[];
  compliance: ComplianceMetrics;
  weeklySummary: {
    thisWeek: WeeklyAverage;
    lastWeek: WeeklyAverage;
  };
}

// ============================================
// Favorites & Achievements Types
// ============================================

/**
 * Favorite food with full food details
 */
export interface FavoriteFood extends Food {
  favorite_id: string;
  favorited_at: string;
}

/**
 * Achievement definition
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
}

/**
 * User statistics and achievements
 */
export interface UserStats {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  total_days_logged: number;
  last_logged_date: string | null;
  achievements: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Response from updating user stats
 */
export interface UpdateStatsResponse {
  stats: UserStats;
  newAchievements: Achievement[];
}

// ============================================
// Program Types
// ============================================

/**
 * User program (time-bound macro program)
 */
export interface UserProgram {
  id: string;
  user_id: string;
  program_id: string;
  start_date: string;
  end_date: string;
  duration_weeks: number;
  status: 'active' | 'completed' | 'cancelled';
  starting_weight_kg: number | null;
  target_weight_kg: number | null;
  ending_weight_kg: number | null;
  calorie_target: number;
  protein_target: number;
  carbs_target: number;
  fat_target: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Input for creating a new program
 */
export interface CreateProgramInput {
  programId: string;
  startDate: string;
  durationWeeks: number;
  startingWeightKg?: number;
  targetWeightKg?: number;
  calorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  notes?: string;
}

/**
 * Response from programs API
 */
export interface ProgramsResponse {
  active: UserProgram | null;
  history: UserProgram[];
}

// ============================================
// Program Review Types
// ============================================

/**
 * AI weekly program review
 */
export interface ProgramReview {
  id: string;
  user_id: string;
  program_id: string;
  review_week: number;
  review_date: string;

  // Analysis inputs (snapshot of data at review time)
  days_analyzed: number;
  avg_calories: number;
  avg_protein: number;
  avg_carbs: number;
  avg_fat: number;
  compliance_rate: number;

  // Weight data
  starting_weight_kg: number | null;
  current_weight_kg: number | null;
  trend_weight_kg: number | null;
  weight_change_kg: number | null;

  // AI recommendations
  ai_analysis: string;
  recommended_calories: number;
  recommended_protein: number;
  recommended_carbs: number;
  recommended_fat: number;
  confidence_level: 'low' | 'medium' | 'high';

  // User action
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  user_response_date: string | null;
  user_notes: string | null;

  created_at: string;
  updated_at: string;
}

/**
 * Input for generating a program review
 */
export interface GenerateReviewInput {
  programId?: string;
  forceReview?: boolean;
}

/**
 * Input for accepting a review
 */
export interface AcceptReviewInput {
  notes?: string;
}

/**
 * Input for rejecting a review
 */
export interface RejectReviewInput {
  reason?: string;
}

/**
 * Program macro history entry (audit trail)
 */
export interface ProgramMacroHistory {
  id: string;
  program_id: string;
  review_id: string | null;
  calorie_target: number;
  protein_target: number;
  carbs_target: number;
  fat_target: number;
  effective_date: string;
  change_reason: 'initial' | 'ai_review' | 'manual_adjustment';
  created_at: string;
}

/**
 * Response from review accept/reject actions
 */
export interface ReviewActionResponse {
  review: ProgramReview;
  program?: UserProgram;
  goals?: UserGoals;
  message: string;
}

// ============================================
// AI Meal Planner Types
// ============================================

/**
 * AI-suggested meal with macros and reasoning
 */
export interface MealSuggestion {
  mealType: MealType;
  foodName: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  reason: string;
}

/**
 * General nutrition guidance from AI
 */
export interface GeneralGuidance {
  overview: string;
  priorities: string[];
  avoidances: string[];
  tips: string[];
}

/**
 * Complete meal suggestion response from AI
 */
export interface MealSuggestionResponse {
  suggestions: {
    specificMeals: MealSuggestion[];
    generalGuidance: GeneralGuidance;
  };
  confidence: 'low' | 'medium' | 'high';
}
