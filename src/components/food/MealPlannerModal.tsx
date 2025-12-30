import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mealPlannerApi } from '../../lib/api';
import { getCurrentTime, getRemainingMeals, getMealTypeLabel, mealIcons } from '../../lib/timeHelpers';
import { MealSuggestionResponse, MealSuggestion, NutritionTotals, MealType } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';

interface MealPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  currentMacros: NutritionTotals;
  goalMacros: NutritionTotals;
}

export default function MealPlannerModal({
  isOpen,
  onClose,
  date,
  currentMacros,
  goalMacros,
}: MealPlannerModalProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<MealSuggestionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remainingMeals, setRemainingMeals] = useState<MealType[]>([]);

  // Calculate remaining macros
  const remaining = {
    calories: goalMacros.calories - currentMacros.calories,
    protein: goalMacros.protein - currentMacros.protein,
    carbs: goalMacros.carbs - currentMacros.carbs,
    fat: goalMacros.fat - currentMacros.fat,
  };

  // Determine remaining meals on mount
  useEffect(() => {
    if (isOpen) {
      const currentTime = getCurrentTime();
      const meals = getRemainingMeals(currentTime);
      setRemainingMeals(meals);
    }
  }, [isOpen]);

  // Fetch suggestions
  const handleGetSuggestions = async () => {
    setLoading(true);
    setError(null);
    setSuggestions(null);

    const currentTime = getCurrentTime();
    const response = await mealPlannerApi.getSuggestions(date, currentTime);

    setLoading(false);

    if (response.error) {
      setError(response.error);
      return;
    }

    if (response.data) {
      setSuggestions(response.data);
    }
  };

  // Handle quick add meal to food log
  const handleQuickAdd = (meal: MealSuggestion) => {
    // Navigate to LogFood with pre-filled data
    navigate('/log', {
      state: {
        quickAdd: {
          date,
          mealType: meal.mealType,
          name: meal.foodName,
          servingSize: meal.servingSize,
          servingUnit: meal.servingUnit,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
        },
      },
    });
    onClose();
  };

  // Handle regenerate
  const handleRegenerate = () => {
    handleGetSuggestions();
  };

  // Handle close
  const handleClose = () => {
    setSuggestions(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              AI Meal Planner
              <span className="text-3xl">✨</span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Remaining meals: {getMealTypeLabel(remainingMeals)}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center py-12">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600 dark:text-gray-400">Analyzing your day...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-lg">
              <p className="font-semibold">Error generating suggestions</p>
              <p className="text-sm mt-1">{error}</p>
              <button onClick={handleGetSuggestions} className="btn-secondary mt-3">
                Try Again
              </button>
            </div>
          )}

          {/* Suggestions */}
          {suggestions && !loading && (
            <>
              {/* Remaining Macros Card */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Remaining Today
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg text-center">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Calories</div>
                    <div className={`text-2xl font-bold ${
                      remaining.calories < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-indigo-600 dark:text-indigo-400'
                    }`}>
                      {remaining.calories < 0 ? '-' : ''}{Math.abs(remaining.calories)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">kcal</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Protein</div>
                    <div className={`text-2xl font-bold ${
                      remaining.protein < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {remaining.protein < 0 ? '-' : ''}{Math.abs(remaining.protein)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">g</div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-center">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Carbs</div>
                    <div className={`text-2xl font-bold ${
                      remaining.carbs < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {remaining.carbs < 0 ? '-' : ''}{Math.abs(remaining.carbs)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">g</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Fat</div>
                    <div className={`text-2xl font-bold ${
                      remaining.fat < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-purple-600 dark:text-purple-400'
                    }`}>
                      {remaining.fat < 0 ? '-' : ''}{Math.abs(remaining.fat)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">g</div>
                  </div>
                </div>
              </div>

              {/* Specific Meal Suggestions */}
              {suggestions.suggestions.specificMeals.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Suggested Meals
                  </h3>
                  <div className="space-y-3">
                    {suggestions.suggestions.specificMeals.map((meal, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{mealIcons[meal.mealType]}</span>
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {meal.foodName}
                              </h4>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {meal.servingSize}{meal.servingUnit} • {meal.reason}
                            </p>
                          </div>
                          <button
                            onClick={() => handleQuickAdd(meal)}
                            className="btn-sm btn-primary ml-3 flex-shrink-0"
                          >
                            Add to Log
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-sm text-center">
                          <div>
                            <div className="font-medium text-indigo-600 dark:text-indigo-400">
                              {meal.calories}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">cal</div>
                          </div>
                          <div>
                            <div className="font-medium text-green-600 dark:text-green-400">
                              {meal.protein}g
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">protein</div>
                          </div>
                          <div>
                            <div className="font-medium text-yellow-600 dark:text-yellow-400">
                              {meal.carbs}g
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">carbs</div>
                          </div>
                          <div>
                            <div className="font-medium text-purple-600 dark:text-purple-400">
                              {meal.fat}g
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">fat</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* General Guidance */}
              <div className="card bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Nutrition Coach Tips
                </h3>

                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {suggestions.suggestions.generalGuidance.overview}
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Priorities */}
                  {suggestions.suggestions.generalGuidance.priorities.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">
                        ✅ Priorities
                      </h4>
                      <ul className="space-y-1">
                        {suggestions.suggestions.generalGuidance.priorities.map((item, idx) => (
                          <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Avoidances */}
                  {suggestions.suggestions.generalGuidance.avoidances.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">
                        ⚠️ Limit
                      </h4>
                      <ul className="space-y-1">
                        {suggestions.suggestions.generalGuidance.avoidances.map((item, idx) => (
                          <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Tips */}
                {suggestions.suggestions.generalGuidance.tips.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
                    <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-400 mb-2">
                      💡 Tips
                    </h4>
                    <ul className="space-y-1">
                      {suggestions.suggestions.generalGuidance.tips.map((tip, idx) => (
                        <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                          • {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Confidence Indicator */}
                <div className="mt-4 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <span>AI Confidence:</span>
                  <span
                    className={`font-semibold px-2 py-1 rounded ${
                      suggestions.confidence === 'high'
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                        : suggestions.confidence === 'medium'
                        ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {suggestions.confidence.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button onClick={handleRegenerate} className="btn-secondary flex-1">
                  🔄 Regenerate
                </button>
                <button onClick={handleClose} className="btn-primary flex-1">
                  Done
                </button>
              </div>
            </>
          )}

          {/* Initial State - No suggestions yet */}
          {!loading && !suggestions && !error && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Let AI Help Plan Your Day
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Get personalized meal suggestions based on your remaining macros and eating patterns
              </p>
              <button onClick={handleGetSuggestions} className="btn-primary">
                Get Suggestions ✨
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
