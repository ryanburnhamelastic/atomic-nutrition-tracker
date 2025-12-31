import {
  ApiResponse,
  User,
  CreateUserInput,
  UpdateUserInput,
  UserGoals,
  UpdateGoalsInput,
  Food,
  CustomFood,
  CreateCustomFoodInput,
  FoodEntry,
  CreateFoodEntryInput,
  UpdateFoodEntryInput,
  DailySummary,
  GeminiAnalysisResult,
  GeminiParseResult,
  GoalGenerationInput,
  GeneratedGoals,
  WeightEntry,
  CreateWeightEntryInput,
  AnalyticsData,
  FavoriteFood,
  MealType,
  UserStats,
  UpdateStatsResponse,
  UserProgram,
  CreateProgramInput,
  ProgramsResponse,
  ProgramReview,
  GenerateReviewInput,
  AcceptReviewInput,
  RejectReviewInput,
  ReviewActionResponse,
  MealSuggestionResponse,
} from '../types';

const API_BASE = '/api';

// Token getter function - set by AuthContext
let getAuthToken: (() => Promise<string | null>) | null = null;

/**
 * Set the auth token getter function
 * Called by AuthContext to provide token access
 */
export function setAuthTokenGetter(getter: () => Promise<string | null>) {
  getAuthToken = getter;
}

/**
 * Generic API request wrapper
 * Handles auth headers, error handling, and JSON parsing
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add auth token if available
    if (getAuthToken) {
      const token = await getAuthToken();
      console.log('[API] Token retrieved:', token ? 'Yes' : 'No');
      console.log('[API] Token value (first 20 chars):', token ? token.substring(0, 20) + '...' : 'null');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('[API] Authorization header set for:', endpoint);
      } else {
        console.warn('[API] No auth token available for request:', endpoint);
      }
    } else {
      console.warn('[API] getAuthToken not initialized for request:', endpoint);
    }

    console.log('[API] Final headers:', Object.keys(headers));

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'An error occurred' };
    }

    return { data };
  } catch (error) {
    console.error('API request failed:', error);
    return { error: 'Network error' };
  }
}

/**
 * API request for file uploads (FormData)
 * Does not set Content-Type header (browser sets it with boundary)
 */
async function apiUpload<T>(
  endpoint: string,
  formData: FormData
): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {};

    if (getAuthToken) {
      const token = await getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'An error occurred' };
    }

    return { data };
  } catch (error) {
    console.error('API upload failed:', error);
    return { error: 'Network error' };
  }
}

/**
 * Users API
 */
export const usersApi = {
  get: () => apiRequest<User>('/users'),
  create: (data: CreateUserInput) =>
    apiRequest<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (data: UpdateUserInput) =>
    apiRequest<User>('/users', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

/**
 * Goals API
 */
export const goalsApi = {
  get: () => apiRequest<UserGoals>('/goals'),
  update: (data: UpdateGoalsInput) =>
    apiRequest<UserGoals>('/goals', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

/**
 * Food Entries API
 */
export const foodEntriesApi = {
  listByDate: (date: string) =>
    apiRequest<FoodEntry[]>(`/food-entries?date=${date}`),
  create: (data: CreateFoodEntryInput) =>
    apiRequest<FoodEntry>('/food-entries', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateFoodEntryInput) =>
    apiRequest<FoodEntry>(`/food-entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  toggleComplete: (id: string, completed: boolean) =>
    apiRequest<FoodEntry>(`/food-entries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed }),
    }),
  delete: (id: string) =>
    apiRequest<void>(`/food-entries/${id}`, {
      method: 'DELETE',
    }),
};

/**
 * Daily Summary API
 */
export const dailySummaryApi = {
  get: (date: string) => apiRequest<DailySummary>(`/daily-summary?date=${date}`),
};

/**
 * Weight Entries API
 */
export const weightEntriesApi = {
  list: (startDate?: string, endDate?: string, limit = 30) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('limit', String(limit));
    return apiRequest<WeightEntry[]>(`/weight-entries?${params.toString()}`);
  },
  create: (data: CreateWeightEntryInput) =>
    apiRequest<WeightEntry>('/weight-entries', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiRequest<void>(`/weight-entries/${id}`, {
      method: 'DELETE',
    }),
};

/**
 * Custom Foods API
 */
export const customFoodsApi = {
  list: (query?: string) =>
    apiRequest<CustomFood[]>(query ? `/custom-foods?q=${encodeURIComponent(query)}` : '/custom-foods'),
  get: (id: string) => apiRequest<CustomFood>(`/custom-foods/${id}`),
  create: (data: CreateCustomFoodInput) =>
    apiRequest<CustomFood>('/custom-foods', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<CreateCustomFoodInput>) =>
    apiRequest<CustomFood>(`/custom-foods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiRequest<void>(`/custom-foods/${id}`, {
      method: 'DELETE',
    }),
};

/**
 * Foods API (base food database)
 */
export const foodsApi = {
  search: (query: string, limit = 20) =>
    apiRequest<Food[]>(`/foods?q=${encodeURIComponent(query)}&limit=${limit}`),
  get: (id: string) => apiRequest<Food>(`/foods/${id}`),
};

/**
 * FatSecret Food Search Result
 */
export interface FatSecretSearchResult {
  foods: Food[];
  totalResults: number;
}

/**
 * FatSecret Foods API (branded/restaurant foods)
 */
export const fatSecretApi = {
  search: (query: string, limit = 20) =>
    apiRequest<FatSecretSearchResult>(`/fatsecret-search?q=${encodeURIComponent(query)}&limit=${limit}`),
};

/**
 * Recent Food Item (with frequency and recency data)
 */
export interface RecentFood extends Food {
  frequency: number;
  last_eaten: string;
  food_id: string | null;
  custom_food_id: string | null;
}

/**
 * Recent Foods API (context-aware by meal type)
 */
export const recentFoodsApi = {
  list: (mealType: MealType, limit = 10) =>
    apiRequest<RecentFood[]>(`/recent-foods?mealType=${mealType}&limit=${limit}`),
};

/**
 * Barcode Lookup Result
 */
export interface BarcodeLookupResult {
  food: Food;
}

/**
 * Barcode Lookup API (FatSecret barcode database)
 */
export const barcodeApi = {
  lookup: (barcode: string) =>
    apiRequest<BarcodeLookupResult>(`/barcode-lookup?barcode=${encodeURIComponent(barcode)}`),
};

/**
 * Gemini AI API (food analysis)
 */
export const geminiApi = {
  analyzeImage: (imageBase64: string, mimeType = 'image/jpeg') =>
    apiRequest<GeminiAnalysisResult>('/analyze-food-image', {
      method: 'POST',
      body: JSON.stringify({ image: imageBase64, mimeType }),
    }),
  parseText: (
    text: string,
    macroContext?: {
      remainingCalories: number;
      remainingProtein: number;
      remainingCarbs: number;
      remainingFat: number;
    }
  ) =>
    apiRequest<GeminiParseResult>('/parse-food-text', {
      method: 'POST',
      body: JSON.stringify({
        text,
        ...macroContext,
      }),
    }),
  generateGoals: (input: GoalGenerationInput) =>
    apiRequest<GeneratedGoals>('/generate-goals', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
};

/**
 * Analytics API
 */
export const analyticsApi = {
  get: (days = 30, endDate?: string) => {
    const params = new URLSearchParams({ days: days.toString() });
    if (endDate) params.append('endDate', endDate);
    return apiRequest<AnalyticsData>(`/analytics?${params.toString()}`);
  },
};

/**
 * Favorite Foods API
 */
export const favoriteFoodsApi = {
  list: () => apiRequest<FavoriteFood[]>('/favorite-foods'),
  add: (foodId: string) =>
    apiRequest<{ id: string; user_id: string; food_id: string; created_at: string }>('/favorite-foods', {
      method: 'POST',
      body: JSON.stringify({ foodId }),
    }),
  remove: (foodId: string) =>
    apiRequest<{ message: string }>(`/favorite-foods/${foodId}`, {
      method: 'DELETE',
    }),
};

/**
 * User Stats API
 */
export const userStatsApi = {
  get: () => apiRequest<UserStats>('/user-stats'),
  update: () => apiRequest<UpdateStatsResponse>('/user-stats', {
    method: 'POST',
  }),
};

/**
 * User Programs API
 */
export const userProgramsApi = {
  get: (includeHistory = false) =>
    apiRequest<ProgramsResponse>(`/user-programs?history=${includeHistory}`),
  create: (data: CreateProgramInput) =>
    apiRequest<UserProgram>('/user-programs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (
    id: string,
    data: {
      status?: string;
      endingWeightKg?: number;
      notes?: string;
      calorieTarget?: number;
      proteinTarget?: number;
      carbsTarget?: number;
      fatTarget?: number;
      macrosLocked?: boolean;
    }
  ) =>
    apiRequest<UserProgram>(`/user-programs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

/**
 * Program Reviews API
 */
export const programReviewsApi = {
  list: (status?: string, programId?: string, limit = 10) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (programId) params.append('programId', programId);
    params.append('limit', String(limit));
    return apiRequest<ProgramReview[]>(`/program-reviews?${params.toString()}`);
  },
  generate: (data: GenerateReviewInput = {}) =>
    apiRequest<ProgramReview>('/program-reviews/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  accept: (id: string, data: AcceptReviewInput = {}) =>
    apiRequest<ReviewActionResponse>(`/program-reviews/${id}/accept`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  reject: (id: string, data: RejectReviewInput = {}) =>
    apiRequest<ReviewActionResponse>(`/program-reviews/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

/**
 * AI Meal Planner API
 */
export const mealPlannerApi = {
  getSuggestions: (date: string, currentTime: string) =>
    apiRequest<MealSuggestionResponse>('/suggest-meals', {
      method: 'POST',
      body: JSON.stringify({ date, currentTime }),
    }),
};

// Export for file uploads if needed
export { apiUpload };
