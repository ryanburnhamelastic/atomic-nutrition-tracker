import { useState, useEffect, useCallback } from 'react';
import { CustomFood, Food, MealType, RecentFood } from '../../types';
import { customFoodsApi, foodsApi, fatSecretApi, recentFoodsApi, favoriteFoodsApi, foodEntriesApi } from '../../lib/api';
import LoadingSpinner from '../common/LoadingSpinner';

// Source type for search results
type FoodSource = 'custom' | 'local' | 'fatsecret' | 'recent';

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
  food_id?: string | null;
  custom_food_id?: string | null;
  frequency?: number;
  last_eaten?: string;
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
  const [recentFoods, setRecentFoods] = useState<SearchResult[]>([]);
  const [favoriting, setFavoriting] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Load recent foods when component mounts or meal type changes
  const loadRecentFoods = useCallback(async () => {
    const response = await recentFoodsApi.list(mealType, 10);
    if (response.data) {
      setRecentFoods(
        response.data.map((f: RecentFood) => ({
          id: f.food_id || f.custom_food_id || `recent_${f.name}`,
          name: f.name,
          brand: f.brand,
          serving_size: f.serving_size,
          serving_unit: f.serving_unit,
          calories: f.calories,
          protein: f.protein,
          carbs: f.carbs,
          fat: f.fat,
          source: 'recent' as FoodSource,
          food_id: f.food_id,
          custom_food_id: f.custom_food_id,
          frequency: f.frequency,
          last_eaten: f.last_eaten,
        }))
      );
    }
  }, [mealType]);

  // Load favorites on mount
  const loadFavorites = useCallback(async () => {
    const response = await favoriteFoodsApi.list();
    if (response.data) {
      setFavoriteIds(new Set(response.data.map(f => f.id)));
    }
  }, []);

  // Debounced search - searches custom foods, local database, and FatSecret
  const searchFoods = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);

    // Search all sources in parallel
    const [customResponse, localResponse, fatSecretResponse] = await Promise.all([
      customFoodsApi.list(searchQuery),
      foodsApi.search(searchQuery, 15),
      fatSecretApi.search(searchQuery, 15),
    ]);

    // Debug logging
    console.log('FatSecret API response:', fatSecretResponse);
    if (fatSecretResponse.error) {
      console.error('FatSecret API error:', fatSecretResponse.error);
    }
    if (fatSecretResponse.data) {
      console.log('FatSecret data:', JSON.stringify(fatSecretResponse.data, null, 2));
      console.log('FatSecret foods count:', fatSecretResponse.data.foods?.length || 0);
      console.log('FatSecret totalResults:', fatSecretResponse.data.totalResults);
    }

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

    // Add FatSecret foods (branded and restaurant foods)
    if (fatSecretResponse.data?.foods) {
      combinedResults.push(
        ...fatSecretResponse.data.foods.map((f: Food) => ({
          id: f.id,
          name: f.name,
          brand: f.brand,
          serving_size: f.serving_size,
          serving_unit: f.serving_unit,
          calories: f.calories,
          protein: f.protein,
          carbs: f.carbs,
          fat: f.fat,
          source: 'fatsecret' as FoodSource,
        }))
      );
    }

    setResults(combinedResults);
    setLoading(false);
  }, []);

  // Load recent foods when meal type changes
  useEffect(() => {
    loadRecentFoods();
  }, [mealType, loadRecentFoods]);

  // Load favorites on mount
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

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

  const handleToggleFavorite = async (food: SearchResult, e: React.MouseEvent) => {
    e.stopPropagation();

    // Only allow favoriting from local database (not custom, FatSecret, or recent)
    if (food.source !== 'local') {
      return;
    }

    setFavoriting(food.id);

    const isFavorited = favoriteIds.has(food.id);

    if (isFavorited) {
      const response = await favoriteFoodsApi.remove(food.id);
      if (!response.error) {
        setFavoriteIds(prev => {
          const next = new Set(prev);
          next.delete(food.id);
          return next;
        });
      }
    } else {
      const response = await favoriteFoodsApi.add(food.id);
      if (!response.error) {
        setFavoriteIds(prev => new Set(prev).add(food.id));
      }
    }

    setFavoriting(null);
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
    const idField = selectedFood.custom_food_id
      ? { customFoodId: selectedFood.custom_food_id }
      : selectedFood.food_id
        ? { foodId: selectedFood.food_id }
        : selectedFood.source === 'custom'
          ? { customFoodId: selectedFood.id }
          : selectedFood.source === 'local'
            ? { foodId: selectedFood.id }
            : {}; // FatSecret foods don't have a local ID reference

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
      // Reload recent foods since we just added a food
      loadRecentFoods();
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
      ) : (
        <>
          {/* Recent Foods - Show when no search query or at top of results */}
          {!query.trim() && recentFoods.length > 0 && (
            <div className="mt-3">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Recent for {mealType}
              </h3>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {recentFoods.map((food) => (
                  <FoodResultRow
                    key={food.id}
                    food={food}
                    isFavorited={favoriteIds.has(food.id)}
                    favoriting={favoriting === food.id}
                    onSelect={handleSelectFood}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {results.length > 0 && (
            <div className={recentFoods.length > 0 && !query.trim() ? 'mt-6' : 'mt-3'}>
              {query.trim() && recentFoods.length > 0 && (
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Search Results
                </h3>
              )}
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {results.map((food) => (
                  <FoodResultRow
                    key={food.id}
                    food={food}
                    isFavorited={favoriteIds.has(food.id)}
                    favoriting={favoriting === food.id}
                    onSelect={handleSelectFood}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty states */}
          {!loading && results.length === 0 && recentFoods.length === 0 && !query.trim() && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
              Start typing to search for foods
            </p>
          )}
          {!loading && results.length === 0 && query.trim() && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
              No foods found. Try a different search.
            </p>
          )}
        </>
      )}
    </div>
  );
}

// Extract to separate component for reusability
interface FoodResultRowProps {
  food: SearchResult;
  isFavorited: boolean;
  favoriting: boolean;
  onSelect: (food: SearchResult) => void;
  onToggleFavorite: (food: SearchResult, e: React.MouseEvent) => void;
}

function FoodResultRow({ food, isFavorited, favoriting, onSelect, onToggleFavorite }: FoodResultRowProps) {
  return (
    <div className="flex items-center justify-between py-3">
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
          {food.source === 'fatsecret' && (
            <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded flex-shrink-0">
              FatSecret
            </span>
          )}
          {food.source === 'recent' && food.frequency && (
            <span className="text-xs px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded flex-shrink-0">
              {food.frequency}x recently
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
      <div className="flex items-center gap-2 ml-3">
        {/* Favorite button - only for local database foods */}
        {food.source === 'local' && (
          <button
            onClick={(e) => onToggleFavorite(food, e)}
            disabled={favoriting}
            className="p-2 text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 disabled:opacity-50 transition-colors"
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg
              className={`w-5 h-5 ${isFavorited ? 'fill-amber-500 text-amber-500' : 'fill-none'}`}
              viewBox="0 0 20 20"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        )}
        {/* Select button */}
        <button
          onClick={() => onSelect(food)}
          className="p-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
          aria-label="Select food"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
