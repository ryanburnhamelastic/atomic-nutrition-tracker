import { Link } from 'react-router-dom';
import { MealSummary, MealType } from '../../types';
import FoodEntryCard from './FoodEntryCard';

interface MealSectionProps {
  mealType: MealType;
  summary: MealSummary;
  onDeleteEntry?: (id: string) => void;
}

const mealLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
};

const mealIcons: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍿',
};

export default function MealSection({ mealType, summary, onDeleteEntry }: MealSectionProps) {
  const hasEntries = summary.entries.length > 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{mealIcons[mealType]}</span>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {mealLabels[mealType]}
          </h3>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {Math.round(summary.calories)} cal
        </span>
      </div>

      {hasEntries ? (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {summary.entries.map((entry) => (
            <FoodEntryCard
              key={entry.id}
              entry={entry}
              onDelete={onDeleteEntry}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
          No foods logged
        </p>
      )}

      <Link
        to={`/log?meal=${mealType}`}
        className="mt-3 w-full py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center justify-center gap-1 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Food
      </Link>
    </div>
  );
}
