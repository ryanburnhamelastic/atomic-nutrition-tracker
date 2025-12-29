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
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

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
 * USDA Food Search Result
 */
export interface USDASearchResult {
  foods: Food[];
  totalHits: number;
}

/**
 * USDA Foods API (external USDA database)
 */
export const usdaApi = {
  search: (query: string, limit = 20) =>
    apiRequest<USDASearchResult>(`/usda-search?q=${encodeURIComponent(query)}&limit=${limit}`),
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
  parseText: (text: string) =>
    apiRequest<GeminiParseResult>('/parse-food-text', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  generateGoals: (input: GoalGenerationInput) =>
    apiRequest<GeneratedGoals>('/generate-goals', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
};

// Export for file uploads if needed
export { apiUpload };
