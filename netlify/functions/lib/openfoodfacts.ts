/**
 * Open Food Facts API Client
 * https://world.openfoodfacts.org/data
 *
 * Free, open-source food database with 2.8M+ products
 * No authentication required, no IP whitelist
 */

const OPEN_FOOD_FACTS_API_BASE = 'https://world.openfoodfacts.org';

export interface OpenFoodFactsProduct {
  code: string;
  product_name: string;
  brands?: string;
  quantity?: string;
  serving_size?: string;
  nutriments: {
    'energy-kcal_100g'?: number;
    'energy-kcal_serving'?: number;
    proteins_100g?: number;
    proteins_serving?: number;
    carbohydrates_100g?: number;
    carbohydrates_serving?: number;
    fat_100g?: number;
    fat_serving?: number;
    // Additional nutrients
    sugars_100g?: number;
    fiber_100g?: number;
    sodium_100g?: number;
    salt_100g?: number;
  };
  nutrient_levels?: {
    fat?: string;
    salt?: string;
    'saturated-fat'?: string;
    sugars?: string;
  };
  nutrition_grades?: string;
  image_url?: string;
  image_small_url?: string;
}

export interface OpenFoodFactsSearchResult {
  count: number;
  page: number;
  page_count: number;
  page_size: number;
  products: OpenFoodFactsProduct[];
}

export interface OpenFoodFactsBarcodeResult {
  status: number;
  status_verbose: string;
  code: string;
  product?: OpenFoodFactsProduct;
}

/**
 * Search Open Food Facts database
 */
export async function searchOpenFoodFacts(
  query: string,
  pageSize = 25
): Promise<OpenFoodFactsSearchResult | null> {
  try {
    const params = new URLSearchParams({
      search_terms: query,
      search_simple: '1',
      action: 'process',
      json: '1',
      page_size: pageSize.toString(),
      fields: 'code,product_name,brands,quantity,serving_size,nutriments,nutrition_grades,image_url,image_small_url',
    });

    const response = await fetch(`${OPEN_FOOD_FACTS_API_BASE}/cgi/search.pl?${params.toString()}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'AtomicNutritionTracker/1.0',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Open Food Facts API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    console.log('Open Food Facts search response:', JSON.stringify(data, null, 2));

    return data;
  } catch (error) {
    console.error('Open Food Facts API request failed:', error);
    return null;
  }
}

/**
 * Lookup product by barcode
 */
export async function barcodeLookupOpenFoodFacts(barcode: string): Promise<OpenFoodFactsProduct | null> {
  try {
    const response = await fetch(`${OPEN_FOOD_FACTS_API_BASE}/api/v2/product/${barcode}.json`, {
      method: 'GET',
      headers: {
        'User-Agent': 'AtomicNutritionTracker/1.0',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Open Food Facts barcode lookup error:', response.status, response.statusText);
      return null;
    }

    const data: OpenFoodFactsBarcodeResult = await response.json();
    console.log('Open Food Facts barcode response:', JSON.stringify(data, null, 2));

    // Status 1 means product found
    if (data.status === 1 && data.product) {
      return data.product;
    }

    return null;
  } catch (error) {
    console.error('Open Food Facts barcode lookup failed:', error);
    return null;
  }
}

/**
 * Extract serving size from Open Food Facts product
 * Returns size in grams
 */
function extractServingSize(product: OpenFoodFactsProduct): number {
  // Try to parse serving_size field (e.g., "100g", "1 cup (240ml)", "30g")
  if (product.serving_size) {
    const match = product.serving_size.match(/(\d+\.?\d*)\s*g/i);
    if (match) {
      return parseFloat(match[1]);
    }
  }

  // Default to 100g if no serving size specified
  return 100;
}

/**
 * Transform Open Food Facts product to unified Food interface
 */
export function transformOpenFoodFactsProduct(product: OpenFoodFactsProduct) {
  const servingSize = extractServingSize(product);

  // Use per-100g values as base, scale to serving size
  const calories = product.nutriments['energy-kcal_100g'] || 0;
  const protein = product.nutriments.proteins_100g || 0;
  const carbs = product.nutriments.carbohydrates_100g || 0;
  const fat = product.nutriments.fat_100g || 0;

  // Scale to actual serving size if not 100g
  const scaleFactor = servingSize / 100;

  return {
    id: `off_${product.code}`,
    fdcId: parseInt(product.code) || 0,
    name: product.product_name || 'Unknown Product',
    brand: product.brands || null,
    serving_size: servingSize,
    serving_unit: 'g',
    calories: Math.round(calories * scaleFactor),
    protein: Math.round(protein * scaleFactor * 10) / 10,
    carbs: Math.round(carbs * scaleFactor * 10) / 10,
    fat: Math.round(fat * scaleFactor * 10) / 10,
    source: 'OpenFoodFacts',
  };
}

/**
 * Transform products array from search results
 */
export function transformOpenFoodFactsProducts(searchResult: OpenFoodFactsSearchResult): any[] {
  if (!searchResult.products || searchResult.products.length === 0) {
    return [];
  }

  // Filter out products with no nutrition data
  const validProducts = searchResult.products.filter(
    (p) => p.product_name && (p.nutriments['energy-kcal_100g'] || p.nutriments['energy-kcal_serving'])
  );

  return validProducts.map(transformOpenFoodFactsProduct);
}
