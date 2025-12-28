import { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNutrition } from '../contexts/NutritionContext';
import { goalsApi } from '../lib/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Settings() {
  const { userEmail, userName, user } = useAuthContext();
  const { isDarkMode, toggleTheme } = useTheme();
  const { goals, goalsLoading, refreshGoals } = useNutrition();

  // Goals form state
  const [calorieTarget, setCalorieTarget] = useState('2000');
  const [proteinTarget, setProteinTarget] = useState('150');
  const [carbsTarget, setCarbsTarget] = useState('250');
  const [fatTarget, setFatTarget] = useState('65');
  const [savingGoals, setSavingGoals] = useState(false);
  const [goalsMessage, setGoalsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Populate form when goals load
  useEffect(() => {
    if (goals) {
      setCalorieTarget(String(goals.calorie_target));
      setProteinTarget(String(goals.protein_target));
      setCarbsTarget(String(goals.carbs_target));
      setFatTarget(String(goals.fat_target));
    }
  }, [goals]);

  const handleSaveGoals = async () => {
    setSavingGoals(true);
    setGoalsMessage(null);

    const response = await goalsApi.update({
      calorieTarget: Number(calorieTarget),
      proteinTarget: Number(proteinTarget),
      carbsTarget: Number(carbsTarget),
      fatTarget: Number(fatTarget),
    });

    setSavingGoals(false);

    if (response.error) {
      setGoalsMessage({ type: 'error', text: response.error });
    } else {
      setGoalsMessage({ type: 'success', text: 'Goals saved successfully!' });
      refreshGoals();
      setTimeout(() => setGoalsMessage(null), 3000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-8">
        Settings
      </h1>

      {/* Account Section */}
      <section className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Account
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Name
            </label>
            <p className="mt-1 text-slate-900 dark:text-white">
              {userName || user?.first_name || 'Not set'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </label>
            <p className="mt-1 text-slate-900 dark:text-white">{userEmail}</p>
          </div>
        </div>
      </section>

      {/* Nutrition Goals Section */}
      <section className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Nutrition Goals
        </h2>
        {goalsLoading ? (
          <div className="flex justify-center py-4">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-4">
            {goalsMessage && (
              <div className={goalsMessage.type === 'success' ? 'success-message' : 'error-message'}>
                {goalsMessage.text}
              </div>
            )}

            <div>
              <label htmlFor="calorieTarget" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Daily Calorie Target
              </label>
              <input
                id="calorieTarget"
                type="number"
                className="input mt-1"
                value={calorieTarget}
                onChange={(e) => setCalorieTarget(e.target.value)}
                min="0"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="proteinTarget" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Protein (g)
                </label>
                <input
                  id="proteinTarget"
                  type="number"
                  className="input mt-1"
                  value={proteinTarget}
                  onChange={(e) => setProteinTarget(e.target.value)}
                  min="0"
                />
              </div>
              <div>
                <label htmlFor="carbsTarget" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Carbs (g)
                </label>
                <input
                  id="carbsTarget"
                  type="number"
                  className="input mt-1"
                  value={carbsTarget}
                  onChange={(e) => setCarbsTarget(e.target.value)}
                  min="0"
                />
              </div>
              <div>
                <label htmlFor="fatTarget" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Fat (g)
                </label>
                <input
                  id="fatTarget"
                  type="number"
                  className="input mt-1"
                  value={fatTarget}
                  onChange={(e) => setFatTarget(e.target.value)}
                  min="0"
                />
              </div>
            </div>

            <button
              onClick={handleSaveGoals}
              disabled={savingGoals}
              className="btn-primary w-full"
            >
              {savingGoals ? <LoadingSpinner size="sm" /> : 'Save Goals'}
            </button>
          </div>
        )}
      </section>

      {/* Preferences Section */}
      <section className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Preferences
        </h2>
        <div className="space-y-4">
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Dark Mode
              </label>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Toggle between light and dark themes
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isDarkMode ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isDarkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-red-200 dark:border-red-800/50">
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
          Danger Zone
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Delete Account
              </label>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Permanently delete your account and all data
              </p>
            </div>
            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors">
              Delete
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
