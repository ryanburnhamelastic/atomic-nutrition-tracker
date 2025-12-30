/**
 * FatSecret Platform API Client
 * https://platform.fatsecret.com/api/
 */

const FATSECRET_API_BASE = 'https://platform.fatsecret.com/rest/server.api';

// OAuth2 token cache
let cachedToken: { token: string; expiresAt: number } | null = null;

// Rate limit tracking (5000 calls per day)
let dailyCallCount = 0;
let lastResetDate = new Date().toDateString();

export interface FatSecretFood {
  food_id: string;
  food_name: string;
  brand_name?: string;
  food_type: string;
  food_url: string;
  servings: {
    serving: FatSecretServing | FatSecretServing[];
  };
}

export interface FatSecretServing {
  serving_id: string;
  serving_description: string;
  serving_url: string;
  metric_serving_amount?: string;
  metric_serving_unit?: string;
  number_of_units?: string;
  measurement_description: string;
  calories: string;
  carbohydrate: string;
  protein: string;
  fat: string;
  saturated_fat?: string;
  polyunsaturated_fat?: string;
  monounsaturated_fat?: string;
  cholesterol?: string;
  sodium?: string;
  potassium?: string;
  fiber?: string;
  sugar?: string;
}

export interface FatSecretSearchResult {
  foods?: {
    food: FatSecretFood | FatSecretFood[];
  };
  total_results: string;
  max_results: string;
  page_number: string;
}

/**
 * Get OAuth2 access token with caching
 */
async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('FatSecret API credentials not configured');
    return null;
  }

  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  try {
    // OAuth2 Client Credentials flow
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch('https://oauth.fatsecret.com/connect/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials&scope=basic',
    });

    if (!response.ok) {
      console.error('FatSecret OAuth error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    // Cache token (typically expires in 1 hour)
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000, // Expire 60 seconds early to be safe
    };

    return cachedToken.token;
  } catch (error) {
    console.error('FatSecret OAuth request failed:', error);
    return null;
  }
}

/**
 * Check and update rate limit counter
 */
function checkRateLimit(): boolean {
  const today = new Date().toDateString();

  // Reset counter if it's a new day
  if (today !== lastResetDate) {
    dailyCallCount = 0;
    lastResetDate = today;
  }

  // Check if we've exceeded the daily limit
  if (dailyCallCount >= 5000) {
    console.warn('FatSecret API daily rate limit reached (5000 calls)');
    return false;
  }

  // Log warning when approaching limit
  if (dailyCallCount >= 4500) {
    console.warn(`FatSecret API approaching daily rate limit: ${dailyCallCount}/5000 calls used`);
  }

  dailyCallCount++;
  return true;
}

/**
 * Search FatSecret food database
 */
export async function searchFatSecret(query: string, maxResults = 25): Promise<FatSecretSearchResult | null> {
  if (!checkRateLimit()) {
    return null;
  }

  const token = await getAccessToken();

  if (!token) {
    return null;
  }

  try {
    const params = new URLSearchParams({
      method: 'foods.search',
      search_expression: query,
      max_results: maxResults.toString(),
      format: 'json',
    });

    const response = await fetch(`${FATSECRET_API_BASE}?${params.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If token expired, try to refresh and retry once
      if (response.status === 401) {
        cachedToken = null; // Invalidate cache
        const newToken = await getAccessToken();
        if (newToken) {
          const retryResponse = await fetch(`${FATSECRET_API_BASE}?${params.toString()}`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${newToken}`,
              'Content-Type': 'application/json',
            },
          });
          if (retryResponse.ok) {
            const data = await retryResponse.json();
            return data.foods_search || data;
          }
        }
      }
      console.error('FatSecret API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return data.foods_search || data;
  } catch (error) {
    console.error('FatSecret API request failed:', error);
    return null;
  }
}

/**
 * Extract nutrition from FatSecret serving data
 */
function extractNutritionFromServing(serving: FatSecretServing): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  return {
    calories: Math.round(parseFloat(serving.calories) || 0),
    protein: Math.round(parseFloat(serving.protein) * 10) / 10,
    carbs: Math.round(parseFloat(serving.carbohydrate) * 10) / 10,
    fat: Math.round(parseFloat(serving.fat) * 10) / 10,
  };
}

/**
 * Transform FatSecret food to unified Food interface
 */
export function transformFatSecretFood(food: FatSecretFood) {
  // Get the first serving (or default serving)
  const servings = Array.isArray(food.servings.serving) ? food.servings.serving : [food.servings.serving];

  // Prefer metric servings, fall back to first available
  let serving = servings.find((s) => s.metric_serving_unit) || servings[0];

  const nutrition = extractNutritionFromServing(serving);

  // Extract serving size and unit
  let servingSize = 100; // Default to 100g
  let servingUnit = 'g';

  if (serving.metric_serving_amount && serving.metric_serving_unit) {
    servingSize = parseFloat(serving.metric_serving_amount);
    servingUnit = serving.metric_serving_unit.toLowerCase();
  } else if (serving.number_of_units) {
    servingSize = parseFloat(serving.number_of_units);
    servingUnit = serving.measurement_description.toLowerCase();
  }

  return {
    id: `fatsecret_${food.food_id}`,
    fdcId: parseInt(food.food_id),
    name: food.food_name,
    brand: food.brand_name || null,
    serving_size: servingSize,
    serving_unit: servingUnit,
    calories: nutrition.calories,
    protein: nutrition.protein,
    carbs: nutrition.carbs,
    fat: nutrition.fat,
    source: 'FatSecret',
  };
}

/**
 * Transform foods array from search results
 */
export function transformFatSecretFoods(searchResult: FatSecretSearchResult): any[] {
  if (!searchResult.foods?.food) {
    return [];
  }

  const foods = Array.isArray(searchResult.foods.food)
    ? searchResult.foods.food
    : [searchResult.foods.food];

  return foods.map(transformFatSecretFood);
}
