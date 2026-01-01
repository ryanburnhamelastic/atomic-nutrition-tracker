import { useState, useEffect, useCallback } from 'react';
import { customFoodsApi, favoriteFoodsApi, recentFoodsApi, foodEntriesApi } from '../lib/api';
import { CustomFood, CreateCustomFoodInput, FavoriteFood, RecentFood } from '../types';
import { useNutrition } from '../contexts/NutritionContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

type TabType = 'custom' | 'favorites' | 'recent';

export default function MyFoods() {
  const [activeTab, setActiveTab] = useState<TabType>('favorites');
  const { selectedDate, refreshSummary } = useNutrition();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Foods</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage your custom foods, favorites, and recent meals
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'favorites'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Favorites
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'recent'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'custom'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Custom Foods
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'favorites' && <FavoritesTab selectedDate={selectedDate} refreshSummary={refreshSummary} />}
      {activeTab === 'recent' && <RecentTab selectedDate={selectedDate} refreshSummary={refreshSummary} />}
      {activeTab === 'custom' && <CustomFoodsTab />}
    </div>
  );
}

// Favorites Tab
interface TabProps {
  selectedDate: string;
  refreshSummary: () => Promise<void>;
}

function FavoritesTab({ selectedDate, refreshSummary }: TabProps) {
  const [favorites, setFavorites] = useState<FavoriteFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFood, setSelectedFood] = useState<FavoriteFood | null>(null);
  const [servings, setServings] = useState('1');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    const response = await favoriteFoodsApi.list();
    if (response.data) {
      setFavorites(response.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleRemove = async (favoriteId: string, foodId: string | null, customFoodId: string | null) => {
    setRemovingId(favoriteId);
    const response = await favoriteFoodsApi.remove(foodId || undefined, customFoodId || undefined);
    if (!response.error) {
      setFavorites(favorites.filter(f => f.favorite_id !== favoriteId));
    }
    setRemovingId(null);
  };

  const handleAddFood = async () => {
    if (!selectedFood) return;

    setAdding(true);

    const idField = selectedFood.custom_food_id
      ? { customFoodId: selectedFood.custom_food_id }
      : selectedFood.food_id
        ? { foodId: selectedFood.food_id }
        : {};

    const response = await foodEntriesApi.create({
      date: selectedDate,
      mealType,
      servings: parseFloat(servings) || 1,
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

    if (!response.error) {
      setSelectedFood(null);
      setServings('1');
      await refreshSummary();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="card text-center py-12">
        <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        <p className="text-gray-500 dark:text-gray-400 mb-2">No favorite foods yet</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Star foods while searching to add them to your favorites
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Modal */}
      {selectedFood && (
        <div className="card bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{selectedFood.name}</h3>
              {selectedFood.brand && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedFood.brand}</p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedFood.serving_size} {selectedFood.serving_unit} per serving
              </p>
            </div>
            <button
              onClick={() => setSelectedFood(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Servings
              </label>
              <input
                type="number"
                min="0.25"
                step="0.25"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Meal
              </label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value as typeof mealType)}
                className="input"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-sm mb-4">
            <div className="bg-white dark:bg-gray-800 rounded p-2">
              <p className="text-gray-500 dark:text-gray-400">Cal</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {Math.round(selectedFood.calories * parseFloat(servings || '1'))}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded p-2">
              <p className="text-gray-500 dark:text-gray-400">P</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {Math.round(selectedFood.protein * parseFloat(servings || '1') * 10) / 10}g
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded p-2">
              <p className="text-gray-500 dark:text-gray-400">C</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {Math.round(selectedFood.carbs * parseFloat(servings || '1') * 10) / 10}g
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded p-2">
              <p className="text-gray-500 dark:text-gray-400">F</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {Math.round(selectedFood.fat * parseFloat(servings || '1') * 10) / 10}g
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setSelectedFood(null)}
              className="flex-1 btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleAddFood}
              disabled={adding || !servings || parseFloat(servings) <= 0}
              className="flex-1 btn btn-primary disabled:opacity-50"
            >
              {adding ? <LoadingSpinner size="sm" /> : 'Add to Today'}
            </button>
          </div>
        </div>
      )}

      {/* Favorites List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {favorites.map((food) => (
          <div
            key={food.favorite_id}
            className="card relative group cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedFood(food)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {food.name}
                </p>
                {food.brand && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {food.brand}
                  </p>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(food.favorite_id, food.food_id, food.custom_food_id);
                }}
                disabled={removingId === food.favorite_id}
                className="p-1.5 text-amber-500 hover:text-red-500 transition-colors disabled:opacity-50"
                aria-label="Remove from favorites"
              >
                {removingId === food.favorite_id ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {food.serving_size} {food.serving_unit} • {food.calories} cal
            </p>
            <div className="flex gap-3 text-xs text-gray-400">
              <span>P: {food.protein}g</span>
              <span>C: {food.carbs}g</span>
              <span>F: {food.fat}g</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Recent Tab
function RecentTab({ selectedDate, refreshSummary }: TabProps) {
  const [recentFoods, setRecentFoods] = useState<RecentFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFood, setSelectedFood] = useState<RecentFood | null>(null);
  const [servings, setServings] = useState('1');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [adding, setAdding] = useState(false);

  const loadRecent = useCallback(async () => {
    setLoading(true);
    console.log('[MY FOODS] Loading recent foods...');
    const response = await recentFoodsApi.listAll(30);
    console.log('[MY FOODS] Recent foods response:', response);
    if (response.error) {
      console.error('[MY FOODS] Recent foods error:', response.error);
    }
    if (response.data) {
      console.log('[MY FOODS] Recent foods count:', response.data.length);
      console.log('[MY FOODS] Recent foods data:', response.data);
      setRecentFoods(response.data);
    } else {
      console.warn('[MY FOODS] No recent foods data returned');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  const handleAddFood = async () => {
    if (!selectedFood) return;

    setAdding(true);

    const idField = selectedFood.custom_food_id
      ? { customFoodId: selectedFood.custom_food_id }
      : selectedFood.food_id
        ? { foodId: selectedFood.food_id }
        : {};

    const response = await foodEntriesApi.create({
      date: selectedDate,
      mealType,
      servings: parseFloat(servings) || 1,
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

    if (!response.error) {
      setSelectedFood(null);
      setServings('1');
      await refreshSummary();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (recentFoods.length === 0) {
    return (
      <div className="card text-center py-12">
        <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-gray-500 dark:text-gray-400 mb-2">No recent foods</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Start logging foods to see your recent meals here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Modal */}
      {selectedFood && (
        <div className="card bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900 dark:text-white">{selectedFood.name}</h3>
                {selectedFood.frequency && (
                  <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded">
                    {selectedFood.frequency}x
                  </span>
                )}
              </div>
              {selectedFood.brand && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedFood.brand}</p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedFood.serving_size} {selectedFood.serving_unit} per serving
              </p>
            </div>
            <button
              onClick={() => setSelectedFood(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Servings
              </label>
              <input
                type="number"
                min="0.25"
                step="0.25"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                className="input"
                placeholder={selectedFood.last_servings ? `Last: ${selectedFood.last_servings}` : '1'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Meal
              </label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value as typeof mealType)}
                className="input"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-sm mb-4">
            <div className="bg-white dark:bg-gray-800 rounded p-2">
              <p className="text-gray-500 dark:text-gray-400">Cal</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {Math.round(selectedFood.calories * parseFloat(servings || '1'))}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded p-2">
              <p className="text-gray-500 dark:text-gray-400">P</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {Math.round(selectedFood.protein * parseFloat(servings || '1') * 10) / 10}g
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded p-2">
              <p className="text-gray-500 dark:text-gray-400">C</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {Math.round(selectedFood.carbs * parseFloat(servings || '1') * 10) / 10}g
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded p-2">
              <p className="text-gray-500 dark:text-gray-400">F</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {Math.round(selectedFood.fat * parseFloat(servings || '1') * 10) / 10}g
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setSelectedFood(null)}
              className="flex-1 btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleAddFood}
              disabled={adding || !servings || parseFloat(servings) <= 0}
              className="flex-1 btn btn-primary disabled:opacity-50"
            >
              {adding ? <LoadingSpinner size="sm" /> : 'Add to Today'}
            </button>
          </div>
        </div>
      )}

      {/* Recent Foods List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {recentFoods.map((food, index) => (
          <div
            key={`${food.name}-${index}`}
            className="card cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              setSelectedFood(food);
              setServings(food.last_servings ? String(food.last_servings) : '1');
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {food.name}
                  </p>
                  {food.frequency && food.frequency > 1 && (
                    <span className="text-xs px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded flex-shrink-0">
                      {food.frequency}x
                    </span>
                  )}
                </div>
                {food.brand && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {food.brand}
                  </p>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {food.serving_size} {food.serving_unit} • {food.calories} cal
            </p>
            <div className="flex gap-3 text-xs text-gray-400">
              <span>P: {food.protein}g</span>
              <span>C: {food.carbs}g</span>
              <span>F: {food.fat}g</span>
            </div>
            {food.last_eaten && (
              <p className="text-xs text-gray-400 mt-2">
                Last: {new Date(food.last_eaten).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Custom Foods Tab (existing functionality)
function CustomFoodsTab() {
  const [foods, setFoods] = useState<CustomFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFood, setEditingFood] = useState<CustomFood | null>(null);

  const fetchFoods = useCallback(async () => {
    setLoading(true);
    const response = await customFoodsApi.list();
    if (response.data) {
      setFoods(response.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this food?')) return;

    const response = await customFoodsApi.delete(id);
    if (!response.error) {
      setFoods(foods.filter((f) => f.id !== id));
    }
  };

  const handleEdit = (food: CustomFood) => {
    setEditingFood(food);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingFood(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    fetchFoods();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {foods.length} custom food{foods.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          + Add Food
        </button>
      </div>

      {showForm && (
        <FoodForm
          food={editingFood}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {foods.length === 0 ? (
        <div className="card text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            You haven't created any custom foods yet.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            Create Your First Food
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {foods.map((food) => (
            <div
              key={food.id}
              className="card flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {food.name}
                </p>
                {food.brand && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {food.brand}
                  </p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {food.serving_size} {food.serving_unit} • {food.calories} cal
                </p>
                <div className="flex gap-3 mt-1 text-xs text-gray-400">
                  <span>P: {food.protein}g</span>
                  <span>C: {food.carbs}g</span>
                  <span>F: {food.fat}g</span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleEdit(food)}
                  className="p-2 text-gray-400 hover:text-indigo-500 transition-colors"
                  aria-label="Edit"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(food.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Delete"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Food Form Component
interface FoodFormProps {
  food: CustomFood | null;
  onClose: () => void;
  onSuccess: () => void;
}

function FoodForm({ food, onClose, onSuccess }: FoodFormProps) {
  const [name, setName] = useState(food?.name || '');
  const [brand, setBrand] = useState(food?.brand || '');
  const [servingSize, setServingSize] = useState(String(food?.serving_size || '100'));
  const [servingUnit, setServingUnit] = useState(food?.serving_unit || 'g');
  const [calories, setCalories] = useState(String(food?.calories || ''));
  const [protein, setProtein] = useState(String(food?.protein || '0'));
  const [carbs, setCarbs] = useState(String(food?.carbs || '0'));
  const [fat, setFat] = useState(String(food?.fat || '0'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Food name is required');
      return;
    }

    if (!calories || Number(calories) < 0) {
      setError('Valid calorie amount is required');
      return;
    }

    setLoading(true);

    const data: CreateCustomFoodInput = {
      name: name.trim(),
      brand: brand.trim() || undefined,
      servingSize: Number(servingSize),
      servingUnit: servingUnit.trim(),
      calories: Number(calories),
      protein: Number(protein),
      carbs: Number(carbs),
      fat: Number(fat),
    };

    const response = food
      ? await customFoodsApi.update(food.id, data)
      : await customFoodsApi.create(data);

    setLoading(false);

    if (response.error) {
      setError(response.error);
      return;
    }

    onSuccess();
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {food ? 'Edit Food' : 'Create Custom Food'}
        </h2>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="error-message">{error}</div>}

        <div>
          <label htmlFor="name" className="label">Food Name</label>
          <input
            id="name"
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Homemade Granola"
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="brand" className="label">Brand (optional)</label>
          <input
            id="brand"
            type="text"
            className="input"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g., My Kitchen"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="servingSize" className="label">Serving Size</label>
            <input
              id="servingSize"
              type="number"
              className="input"
              value={servingSize}
              onChange={(e) => setServingSize(e.target.value)}
              min="0"
              step="0.1"
            />
          </div>
          <div>
            <label htmlFor="servingUnit" className="label">Unit</label>
            <select
              id="servingUnit"
              className="input"
              value={servingUnit}
              onChange={(e) => setServingUnit(e.target.value)}
            >
              <option value="g">g</option>
              <option value="oz">oz</option>
              <option value="ml">ml</option>
              <option value="cup">cup</option>
              <option value="tbsp">tbsp</option>
              <option value="tsp">tsp</option>
              <option value="piece">piece</option>
              <option value="serving">serving</option>
            </select>
          </div>
          <div>
            <label htmlFor="calories" className="label">Calories</label>
            <input
              id="calories"
              type="number"
              className="input"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              min="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="protein" className="label">Protein (g)</label>
            <input
              id="protein"
              type="number"
              className="input"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              min="0"
              step="0.1"
            />
          </div>
          <div>
            <label htmlFor="carbs" className="label">Carbs (g)</label>
            <input
              id="carbs"
              type="number"
              className="input"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              min="0"
              step="0.1"
            />
          </div>
          <div>
            <label htmlFor="fat" className="label">Fat (g)</label>
            <input
              id="fat"
              type="number"
              className="input"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              min="0"
              step="0.1"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex-1"
            disabled={loading}
          >
            {loading ? <LoadingSpinner size="sm" /> : food ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}
