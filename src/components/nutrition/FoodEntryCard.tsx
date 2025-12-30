import { FoodEntry } from '../../types';

interface FoodEntryCardProps {
  entry: FoodEntry;
  onEdit?: (entry: FoodEntry) => void;
  onDelete?: (id: string) => void;
  onToggleComplete?: (id: string, completed: boolean) => void;
}

export default function FoodEntryCard({ entry, onEdit, onDelete, onToggleComplete }: FoodEntryCardProps) {
  // Calculate nutrition with servings
  const calories = Math.round(entry.calories * entry.servings);
  const protein = Math.round(entry.protein * entry.servings);
  const carbs = Math.round(entry.carbs * entry.servings);
  const fat = Math.round(entry.fat * entry.servings);

  const isCompleted = entry.completed;

  return (
    <div className={`flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-opacity ${
      isCompleted ? 'opacity-60' : ''
    }`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Completion Checkbox */}
        {onToggleComplete && (
          <button
            onClick={() => onToggleComplete(entry.id, !isCompleted)}
            className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
              isCompleted
                ? 'bg-green-500 border-green-500 dark:bg-green-600 dark:border-green-600'
                : 'bg-white dark:bg-slate-700 border-gray-400 dark:border-gray-500 hover:border-green-400 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
            }`}
            aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {isCompleted && (
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        )}

        <div className="flex-1 min-w-0">
          <p className={`font-medium text-gray-900 dark:text-white truncate ${
            isCompleted ? 'line-through' : ''
          }`}>
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
      </div>
      <div className="flex items-center gap-2 ml-4">
        <span className={`text-lg font-semibold text-gray-900 dark:text-white ${
          isCompleted ? 'line-through' : ''
        }`}>
          {calories}
        </span>
        <span className="text-sm text-gray-400">cal</span>
        {onEdit && (
          <button
            onClick={() => onEdit(entry)}
            disabled={isCompleted}
            className={`p-1 transition-colors ${
              isCompleted
                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                : 'text-gray-400 hover:text-indigo-500'
            }`}
            aria-label="Edit entry"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(entry.id)}
            disabled={isCompleted}
            className={`p-1 transition-colors ${
              isCompleted
                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                : 'text-gray-400 hover:text-red-500'
            }`}
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
