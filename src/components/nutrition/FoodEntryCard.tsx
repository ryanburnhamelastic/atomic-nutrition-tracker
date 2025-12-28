import { FoodEntry } from '../../types';

interface FoodEntryCardProps {
  entry: FoodEntry;
  onDelete?: (id: string) => void;
}

export default function FoodEntryCard({ entry, onDelete }: FoodEntryCardProps) {
  // Calculate nutrition with servings
  const calories = Math.round(entry.calories * entry.servings);
  const protein = Math.round(entry.protein * entry.servings);
  const carbs = Math.round(entry.carbs * entry.servings);
  const fat = Math.round(entry.fat * entry.servings);

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-white truncate">
          {entry.name}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {entry.servings !== 1 ? `${entry.servings} x ` : ''}
          {entry.serving_size} {entry.serving_unit}
        </p>
        <div className="flex gap-3 mt-1 text-xs text-gray-400">
          <span>P: {protein}g</span>
          <span>C: {carbs}g</span>
          <span>F: {fat}g</span>
        </div>
      </div>
      <div className="flex items-center gap-3 ml-4">
        <span className="text-lg font-semibold text-gray-900 dark:text-white">
          {calories}
        </span>
        <span className="text-sm text-gray-400">cal</span>
        {onDelete && (
          <button
            onClick={() => onDelete(entry.id)}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            aria-label="Delete entry"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
