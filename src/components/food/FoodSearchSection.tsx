import { useState, useEffect, useCallback } from 'react';
import { CustomFood, Food, MealType } from '../../types';
import { customFoodsApi, foodsApi, usdaApi, foodEntriesApi } from '../../lib/api';
import LoadingSpinner from '../common/LoadingSpinner';

// Source type for search results
type FoodSource = 'custom' | 'local' | 'usda';

// Unified food item for display
interface SearchResult {
  id: string;
  name: string;
  brand: string | null;
  serving_size: number;
  serving_unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: FoodSource;
}

interface FoodSearchSectionProps {
  date: string;
  mealType: MealType;
  onSuccess: () => void;
}

export default function FoodSearchSection({ date, mealType, onSuccess }: FoodSearchSectionProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  // Debounced search - searches custom foods, local database, and USDA
  const searchFoods = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);

    // Search all sources in parallel
    const [customResponse, localResponse, usdaResponse] = await Promise.all([
      customFoodsApi.list(searchQuery),
      foodsApi.search(searchQuery, 15),
      usdaApi.search(searchQuery, 15),
    ]);

    const combinedResults: SearchResult[] = [];

    // Add custom foods first (highest priority)
    if (customResponse.data) {
      combinedResults.push(
        ...customResponse.data.map((f: CustomFood) => ({
          id: f.id,
          name: f.name,
          brand: f.brand,
          serving_size: f.serving_size,
          serving_unit: f.serving_unit,
          calories: f.calories,
          protein: f.protein,
          carbs: f.carbs,
          fat: f.fat,
          source: 'custom' as FoodSource,
        }))
      );
    }

    // Add local database foods
    if (localResponse.data) {
      combinedResults.push(
        ...localResponse.data.map((f: Food) => ({
          id: f.id,
          name: f.name,
          brand: f.brand,
          serving_size: f.serving_size,
          serving_unit: f.serving_unit,
          calories: f.calories,
          protein: f.protein,
          carbs: f.carbs,
          fat: f.fat,
          source: 'local' as FoodSource,
        }))
      );
    }

    // Add USDA foods
    if (usdaResponse.data?.foods) {
      combinedResults.push(
        ...usdaResponse.data.foods.map((f: Food) => ({
          id: f.id,
          name: f.name,
          brand: f.brand,
          serving_size: f.serving_size,
          serving_unit: f.serving_unit,
          calories: f.calories,
          protein: f.protein,
          carbs: f.carbs,
          fat: f.fat,
          source: 'usda' as FoodSource,
        }))
      );
    }

    setResults(combinedResults);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchFoods(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchFoods]);

  const handleAddFood = async (food: SearchResult) => {
    setAddingId(food.id);

    // Determine which ID field to use based on source
    const idField = food.source === 'custom'
      ? { customFoodId: food.id }
      : food.source === 'local'
        ? { foodId: food.id }
        : {}; // USDA foods don't have a local ID reference

    const response = await foodEntriesApi.create({
      date,
      mealType,
      servings: 1,
      name: food.name,
      servingSize: food.serving_size,
      servingUnit: food.serving_unit,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      ...idField,
    });

    setAddingId(null);

    if (!response.error) {
      onSuccess();
    }
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Search Foods
      </h2>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          className="input pl-10"
          placeholder="Search foods..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="sm" />
        </div>
      ) : results.length > 0 ? (
        <div className="mt-3 divide-y divide-gray-100 dark:divide-gray-700">
          {results.map((food) => (
            <div
              key={food.id}
              className="flex items-center justify-between py-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {food.name}
                  </p>
                  {food.source === 'custom' && (
                    <span className="text-xs px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded flex-shrink-0">
                      My Food
                    </span>
                  )}
                  {food.source === 'usda' && (
                    <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded flex-shrink-0">
                      USDA
                    </span>
                  )}
                </div>
                {food.brand && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {food.brand}
                  </p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {food.serving_size} {food.serving_unit} - {food.calories} cal
                </p>
              </div>
              <button
                onClick={() => handleAddFood(food)}
                disabled={addingId === food.id}
                className="ml-3 p-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50"
                aria-label="Add food"
              >
                {addingId === food.id ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
      ) : query.trim() ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
          No foods found. Try a different search.
        </p>
      ) : null}
    </div>
  );
}
