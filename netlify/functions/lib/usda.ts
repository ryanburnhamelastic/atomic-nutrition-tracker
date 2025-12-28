/**
 * USDA FoodData Central API Client
 * https://fdc.nal.usda.gov/api-guide.html
 */

const USDA_API_BASE = 'https://api.nal.usda.gov/fdc/v1';

export interface USDAFood {
  fdcId: number;
  description: string;
  brandOwner?: string;
  brandName?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients: USDANutrient[];
  dataType: string;
}

export interface USDANutrient {
  nutrientId: number;
  nutrientName: string;
  nutrientNumber: string;
  unitName: string;
  value: number;
}

export interface USDASearchResult {
  foods: USDAFood[];
  totalHits: number;
  currentPage: number;
  totalPages: number;
}

// Nutrient IDs for macros
const NUTRIENT_IDS = {
  CALORIES: 1008,    // Energy (kcal)
  PROTEIN: 1003,     // Protein
  CARBS: 1005,       // Carbohydrate, by difference
  FAT: 1004,         // Total lipid (fat)
  FIBER: 1079,       // Fiber, total dietary
  SUGAR: 2000,       // Sugars, total
};

/**
 * Search USDA FoodData Central
 */
export async function searchUSDA(query: string, pageSize = 25): Promise<USDASearchResult | null> {
  const apiKey = process.env.USDA_API_KEY;

  if (!apiKey) {
    console.error('USDA_API_KEY not configured');
    return null;
  }

  try {
    const response = await fetch(`${USDA_API_BASE}/foods/search?api_key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        pageSize,
        dataType: ['Foundation', 'SR Legacy', 'Branded'],
        sortBy: 'dataType.keyword',
        sortOrder: 'asc',
      }),
    });

    if (!response.ok) {
      console.error('USDA API error:', response.status, response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('USDA API request failed:', error);
    return null;
  }
}

/**
 * Extract nutrition values from USDA food nutrients array
 */
export function extractNutrition(nutrients: USDANutrient[]): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  const getNutrient = (id: number): number => {
    const nutrient = nutrients.find(n => n.nutrientId === id);
    return nutrient?.value || 0;
  };

  return {
    calories: Math.round(getNutrient(NUTRIENT_IDS.CALORIES)),
    protein: Math.round(getNutrient(NUTRIENT_IDS.PROTEIN) * 10) / 10,
    carbs: Math.round(getNutrient(NUTRIENT_IDS.CARBS) * 10) / 10,
    fat: Math.round(getNutrient(NUTRIENT_IDS.FAT) * 10) / 10,
  };
}

/**
 * Transform USDA food to our app's format
 */
export function transformUSDAFood(food: USDAFood) {
  const nutrition = extractNutrition(food.foodNutrients);

  // Default serving size is 100g if not specified
  const servingSize = food.servingSize || 100;
  const servingUnit = food.servingSizeUnit?.toLowerCase() || 'g';

  return {
    id: `usda_${food.fdcId}`,
    fdcId: food.fdcId,
    name: food.description,
    brand: food.brandOwner || food.brandName || null,
    serving_size: servingSize,
    serving_unit: servingUnit,
    calories: nutrition.calories,
    protein: nutrition.protein,
    carbs: nutrition.carbs,
    fat: nutrition.fat,
    source: 'USDA',
    dataType: food.dataType,
  };
}
