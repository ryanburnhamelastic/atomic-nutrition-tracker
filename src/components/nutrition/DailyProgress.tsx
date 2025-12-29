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

  // Protein First Constraint
  // Carbs/Fat bars are "locked" until protein hits 80% of target
  const proteinThreshold = proteinTarget * 0.8;
  const proteinMet = totals.protein >= proteinThreshold;
  const caloriesWithinTarget = totals.calories <= calorieTarget;
  const isCompliant = proteinMet && caloriesWithinTarget;

  // Protein percentage for display
  const proteinPercent = Math.round((totals.protein / proteinTarget) * 100);

  return (
    <div className="card">
      {/* Compliance Status */}
      <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
        isCompliant
          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
          : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
      }`}>
        {isCompliant ? (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">On track! Protein goal met.</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm font-medium">
              {!proteinMet
                ? `Hit ${Math.round(proteinThreshold)}g protein first (${proteinPercent}%)`
                : 'Over calorie target'}
            </span>
          </>
        )}
      </div>

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
        {/* Protein - Priority macro */}
        <div>
          <div className="text-center mb-2">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {Math.round(totals.protein)}g
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
              Protein
              <span className="text-amber-500" title="Priority - hit 80% before other macros count">★</span>
            </p>
          </div>
          <ProgressBar
            value={totals.protein}
            max={proteinTarget}
            showValues={false}
            color="success"
            size="sm"
          />
          <p className="text-xs text-center text-gray-400 mt-1">
            {proteinTarget}g ({proteinPercent}%)
          </p>
        </div>

        {/* Carbs - Locked until protein met */}
        <div className={!proteinMet ? 'opacity-60' : ''}>
          <div className="text-center mb-2">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {Math.round(totals.carbs)}g
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
              Carbs
              {!proteinMet && <span className="text-gray-400" title="Locked until protein target met">🔒</span>}
            </p>
          </div>
          <ProgressBar
            value={totals.carbs}
            max={carbsTarget}
            showValues={false}
            color="warning"
            size="sm"
            locked={!proteinMet}
          />
          <p className="text-xs text-center text-gray-400 mt-1">{carbsTarget}g</p>
        </div>

        {/* Fat - Locked until protein met */}
        <div className={!proteinMet ? 'opacity-60' : ''}>
          <div className="text-center mb-2">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {Math.round(totals.fat)}g
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
              Fat
              {!proteinMet && <span className="text-gray-400" title="Locked until protein target met">🔒</span>}
            </p>
          </div>
          <ProgressBar
            value={totals.fat}
            max={fatTarget}
            showValues={false}
            color="primary"
            size="sm"
            locked={!proteinMet}
          />
          <p className="text-xs text-center text-gray-400 mt-1">{fatTarget}g</p>
        </div>
      </div>
    </div>
  );
}
