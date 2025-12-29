import { useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useNutrition } from '../contexts/NutritionContext';
import QuickAddFavorites from '../components/food/QuickAddFavorites';
import AIFoodInput from '../components/food/AIFoodInput';
import FoodSearchSection from '../components/food/FoodSearchSection';
import QuickAddForm from '../components/food/QuickAddForm';
import { FoodEntry, MealType } from '../types';

const mealLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

interface LocationState {
  editEntry?: FoodEntry;
}

export default function LogFood() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { selectedDate, refreshSummary } = useNutrition();

  // Get edit entry from navigation state
  const editEntry = (location.state as LocationState)?.editEntry || null;

  // Get meal type from URL params, edit entry, or default to snack
  const mealParam = searchParams.get('meal') as MealType | null;
  const [selectedMeal, setSelectedMeal] = useState<MealType>(
    editEntry?.meal_type ||
    (mealParam && ['breakfast', 'lunch', 'dinner', 'snack'].includes(mealParam)
      ? mealParam
      : 'snack')
  );

  const handleSuccess = async () => {
    await refreshSummary();
    navigate('/', { state: { refreshData: true } });
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {editEntry ? 'Edit Food' : 'Add Food'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Meal Type Selector */}
      <div>
        <label className="label">Meal</label>
        <div className="grid grid-cols-4 gap-2">
          {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((meal) => (
            <button
              key={meal}
              type="button"
              onClick={() => setSelectedMeal(meal)}
              className={`py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                selectedMeal === meal
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {mealLabels[meal]}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Add Favorites (only show when not editing) */}
      {!editEntry && (
        <QuickAddFavorites
          mealType={selectedMeal}
          onAdd={handleSuccess}
        />
      )}

      {/* AI Food Input (only show when not editing) */}
      {!editEntry && (
        <AIFoodInput
          date={selectedDate}
          mealType={selectedMeal}
          onSuccess={handleSuccess}
        />
      )}

      {/* Food Search (only show when not editing) */}
      {!editEntry && (
        <FoodSearchSection
          date={selectedDate}
          mealType={selectedMeal}
          onSuccess={handleSuccess}
        />
      )}

      {/* Quick Add Form */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {editEntry ? 'Edit Entry' : 'Quick Add'}
        </h2>
        <QuickAddForm
          date={selectedDate}
          mealType={selectedMeal}
          editEntry={editEntry}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
