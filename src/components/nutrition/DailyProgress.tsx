import ProgressBar from '../common/ProgressBar';
import { NutritionTotals, UserGoals } from '../../types';

interface DailyProgressProps {
  totals: NutritionTotals;
  goals: UserGoals | null;
}

export default function DailyProgress({ totals, goals }: DailyProgressProps) {
  // Default goals if not set
  const calorieTarget = goals?.calorie_target ?? 2000;
  const proteinTarget = goals?.protein_target ?? 150;
  const carbsTarget = goals?.carbs_target ?? 250;
  const fatTarget = goals?.fat_target ?? 65;

  return (
    <div className="card">
      {/* Calories - Main focus */}
      <div className="mb-6">
        <div className="flex justify-between items-baseline mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Calories</h3>
          <div className="text-right">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(totals.calories)}
            </span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">
              / {calorieTarget}
            </span>
          </div>
        </div>
        <ProgressBar
          value={totals.calories}
          max={calorieTarget}
          showValues={false}
          color="primary"
          size="lg"
        />
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {calorieTarget - totals.calories > 0
            ? `${Math.round(calorieTarget - totals.calories)} remaining`
            : `${Math.round(totals.calories - calorieTarget)} over`}
        </p>
      </div>

      {/* Macros */}
      <div className="grid grid-cols-3 gap-4">
        {/* Protein */}
        <div>
          <div className="text-center mb-2">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {Math.round(totals.protein)}g
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">Protein</p>
          </div>
          <ProgressBar
            value={totals.protein}
            max={proteinTarget}
            showValues={false}
            color="success"
            size="sm"
          />
          <p className="text-xs text-center text-gray-400 mt-1">{proteinTarget}g</p>
        </div>

        {/* Carbs */}
        <div>
          <div className="text-center mb-2">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {Math.round(totals.carbs)}g
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">Carbs</p>
          </div>
          <ProgressBar
            value={totals.carbs}
            max={carbsTarget}
            showValues={false}
            color="warning"
            size="sm"
          />
          <p className="text-xs text-center text-gray-400 mt-1">{carbsTarget}g</p>
        </div>

        {/* Fat */}
        <div>
          <div className="text-center mb-2">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {Math.round(totals.fat)}g
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">Fat</p>
          </div>
          <ProgressBar
            value={totals.fat}
            max={fatTarget}
            showValues={false}
            color="primary"
            size="sm"
          />
          <p className="text-xs text-center text-gray-400 mt-1">{fatTarget}g</p>
        </div>
      </div>
    </div>
  );
}
