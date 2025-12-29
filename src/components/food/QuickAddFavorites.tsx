import { useEffect, useState } from 'react';
import { favoriteFoodsApi, foodEntriesApi, userStatsApi } from '../../lib/api';
import { FavoriteFood } from '../../types';
import { useNutrition } from '../../contexts/NutritionContext';

interface QuickAddFavoritesProps {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  onAdd?: () => void;
}

export default function QuickAddFavorites({ mealType, onAdd }: QuickAddFavoritesProps) {
  const { selectedDate, refreshSummary } = useNutrition();
  const [favorites, setFavorites] = useState<FavoriteFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    const response = await favoriteFoodsApi.list();
    if (response.data) {
      setFavorites(response.data);
    }
    setLoading(false);
  };

  const handleQuickAdd = async (food: FavoriteFood) => {
    setAdding(food.id);
    try {
      await foodEntriesApi.create({
        foodId: food.id,
        date: selectedDate,
        mealType,
        servings: 1,
      });

      // Update user stats and check for new achievements
      const statsResponse = await userStatsApi.update();
      if (statsResponse.data?.newAchievements && statsResponse.data.newAchievements.length > 0) {
        // Show achievement notification
        statsResponse.data.newAchievements.forEach((achievement) => {
          if (achievement) {
            console.log('🏆 Achievement unlocked:', achievement.name);
            // Could show a toast notification here
          }
        });
      }

      await refreshSummary();
      onAdd?.();
    } catch (error) {
      console.error('Failed to add food:', error);
    } finally {
      setAdding(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
          Quick Add Favorites
        </h3>
        <div className="text-center py-4 text-slate-500 dark:text-slate-400">
          Loading favorites...
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-6">
      <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        Quick Add Favorites
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {favorites.map((food) => (
          <button
            key={food.favorite_id}
            onClick={() => handleQuickAdd(food)}
            disabled={adding === food.id}
            className="p-3 bg-slate-50 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="font-medium text-sm text-slate-900 dark:text-white truncate">
              {food.name}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {food.calories} cal
            </div>
            {adding === food.id && (
              <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                Adding...
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
