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
  const [selectedFood, setSelectedFood] = useState<SearchResult | null>(null);
  const [servings, setServings] = useState('1');
  const [grams, setGrams] = useState('');
  const [inputMode, setInputMode] = useState<'servings' | 'grams'>('servings');
  const [adding, setAdding] = useState(false);

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

  const handleSelectFood = (food: SearchResult) => {
    setSelectedFood(food);
    setServings('1');
    setGrams(food.serving_size.toString());
    setInputMode('servings');
  };

  const handleCancelSelection = () => {
    setSelectedFood(null);
    setServings('1');
    setGrams('');
    setInputMode('servings');
  };

  const handleAddFood = async () => {
    if (!selectedFood) return;

    // Calculate servings based on input mode
    let servingCount: number;
    if (inputMode === 'grams') {
      const gramsValue = parseFloat(grams) || 0;
      servingCount = gramsValue / selectedFood.serving_size;
    } else {
      servingCount = parseFloat(servings) || 1;
    }

    setAdding(true);

    // Determine which ID field to use based on source
    const idField = selectedFood.source === 'custom'
      ? { customFoodId: selectedFood.id }
      : selectedFood.source === 'local'
        ? { foodId: selectedFood.id }
        : {}; // USDA foods don't have a local ID reference

    const response = await foodEntriesApi.create({
      date,
      mealType,
      servings: servingCount,
      name: selectedFood.name,
      servingSize: selectedFood.serving_size,
      servingUnit: selectedFood.serving_unit,
      calories: selectedFood.calories,
      protein: selectedFood.protein,
      carbs: selectedFood.carbs,
      fat: selectedFood.fat,
      ...idField,
    });

    setAdding(false);
    setSelectedFood(null);
    setServings('1');
    setGrams('');
    setInputMode('servings');

    if (!response.error) {
      onSuccess();
    }
  };

  // Calculate nutrition for current servings/grams
  let servingCount: number;
  if (inputMode === 'grams' && selectedFood) {
    const gramsValue = parseFloat(grams) || 0;
    servingCount = gramsValue / selectedFood.serving_size;
  } else {
    servingCount = parseFloat(servings) || 1;
  }
  const calculatedNutrition = selectedFood ? {
    calories: Math.round(selectedFood.calories * servingCount),
    protein: Math.round(selectedFood.protein * servingCount * 10) / 10,
    carbs: Math.round(selectedFood.carbs * servingCount * 10) / 10,
    fat: Math.round(selectedFood.fat * servingCount * 10) / 10,
  } : null;

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Search Foods
      </h2>

      {/* Serving Selector Modal */}
      {selectedFood && (
        <div className="mb-4 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {selectedFood.name}
              </h3>
              {selectedFood.brand && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedFood.brand}
                </p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedFood.serving_size} {selectedFood.serving_unit} per serving
              </p>
            </div>
            <button
              onClick={handleCancelSelection}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Cancel"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Input Mode Toggle */}
          <div className="mb-3">
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setInputMode('servings')}
                className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors ${
                  inputMode === 'servings'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Servings
              </button>
              <button
                type="button"
                onClick={() => setInputMode('grams')}
                className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors ${
                  inputMode === 'grams'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Grams
              </button>
            </div>

            {inputMode === 'servings' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Number of servings
                </label>
                <input
                  type="number"
                  min="0.25"
                  step="0.25"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  className="input w-32"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount in grams
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                  className="input w-32"
                  placeholder="e.g., 150"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  1 serving = {selectedFood.serving_size}g
                </p>
              </div>
            )}
          </div>

          {/* Calculated Nutrition */}
          {calculatedNutrition && (
            <div className="grid grid-cols-4 gap-2 text-center text-sm mb-4">
              <div className="bg-white dark:bg-gray-800 rounded p-2">
                <p className="text-gray-500 dark:text-gray-400">Calories</p>
                <p className="font-semibold text-gray-900 dark:text-white">{calculatedNutrition.calories}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded p-2">
                <p className="text-gray-500 dark:text-gray-400">Protein</p>
                <p className="font-semibold text-gray-900 dark:text-white">{calculatedNutrition.protein}g</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded p-2">
                <p className="text-gray-500 dark:text-gray-400">Carbs</p>
                <p className="font-semibold text-gray-900 dark:text-white">{calculatedNutrition.carbs}g</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded p-2">
                <p className="text-gray-500 dark:text-gray-400">Fat</p>
                <p className="font-semibold text-gray-900 dark:text-white">{calculatedNutrition.fat}g</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleCancelSelection}
              className="flex-1 btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleAddFood}
              disabled={
                adding ||
                (inputMode === 'servings' && (!servings || parseFloat(servings) <= 0)) ||
                (inputMode === 'grams' && (!grams || parseFloat(grams) <= 0))
              }
              className="flex-1 btn btn-primary disabled:opacity-50"
            >
              {adding ? <LoadingSpinner size="sm" /> : 'Add to Meal'}
            </button>
          </div>
        </div>
      )}

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
                onClick={() => handleSelectFood(food)}
                className="ml-3 p-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                aria-label="Select food"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
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
