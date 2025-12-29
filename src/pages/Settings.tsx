import { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNutrition } from '../contexts/NutritionContext';
import { goalsApi, geminiApi, usersApi } from '../lib/api';
import { GoalGenerationInput } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Settings() {
  const { userEmail, userName, user, refreshUser } = useAuthContext();
  const { isDarkMode, toggleTheme } = useTheme();
  const { goals, goalsLoading, refreshGoals } = useNutrition();

  // User preferences state
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [preferencesMessage, setPreferencesMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Goals form state
  const [calorieTarget, setCalorieTarget] = useState('2000');
  const [proteinTarget, setProteinTarget] = useState('150');
  const [carbsTarget, setCarbsTarget] = useState('250');
  const [fatTarget, setFatTarget] = useState('65');
  const [useMetric, setUseMetric] = useState(true);
  const [autoCalcCalories, setAutoCalcCalories] = useState(false);
  const [savingGoals, setSavingGoals] = useState(false);
  const [goalsMessage, setGoalsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // AI Goal Generation state
  const [showAIGoals, setShowAIGoals] = useState(false);
  const [aiLoading, setAILoading] = useState(false);
  const [aiExplanation, setAIExplanation] = useState<string | null>(null);
  const [aiForm, setAIForm] = useState<GoalGenerationInput>({
    age: 30,
    sex: 'male',
    heightCm: 175,
    weightKg: 75,
    activityLevel: 'moderate',
    goal: 'maintain',
  });

  // Track if we're loading initial data to prevent auto-calc from overwriting
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load user preferences
  useEffect(() => {
    if (user) {
      setUnitSystem(user.unit_system);
    }
  }, [user]);

  // Populate form when goals load
  useEffect(() => {
    if (goals) {
      setCalorieTarget(String(goals.calorie_target));
      setProteinTarget(String(goals.protein_target));
      setCarbsTarget(String(goals.carbs_target));
      setFatTarget(String(goals.fat_target));
      setUseMetric(goals.use_metric);
      // Mark initial load as complete after a short delay
      setTimeout(() => setIsInitialLoad(false), 100);
    }
  }, [goals]);

  // Auto-calculate calories from macros when enabled
  // Formula: Protein (4 cal/g) + Carbs (4 cal/g) + Fat (9 cal/g)
  // Don't run during initial load to avoid overwriting saved calorie target
  useEffect(() => {
    if (autoCalcCalories && !isInitialLoad) {
      const protein = Number(proteinTarget) || 0;
      const carbs = Number(carbsTarget) || 0;
      const fat = Number(fatTarget) || 0;
      const calculatedCalories = (protein * 4) + (carbs * 4) + (fat * 9);
      setCalorieTarget(String(Math.round(calculatedCalories)));
    }
  }, [proteinTarget, carbsTarget, fatTarget, autoCalcCalories, isInitialLoad]);

  const handleSaveGoals = async () => {
    setSavingGoals(true);
    setGoalsMessage(null);

    const response = await goalsApi.update({
      calorieTarget: Number(calorieTarget),
      proteinTarget: Number(proteinTarget),
      carbsTarget: Number(carbsTarget),
      fatTarget: Number(fatTarget),
      useMetric,
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

  const handleGenerateAIGoals = async () => {
    setAILoading(true);
    setGoalsMessage(null);
    setAIExplanation(null);

    const response = await geminiApi.generateGoals(aiForm);

    setAILoading(false);

    if (response.error) {
      setGoalsMessage({ type: 'error', text: response.error });
    } else if (response.data) {
      // Update the form with AI-generated values
      setCalorieTarget(String(response.data.calorieTarget));
      setProteinTarget(String(response.data.proteinTarget));
      setCarbsTarget(String(response.data.carbsTarget));
      setFatTarget(String(response.data.fatTarget));
      setAIExplanation(response.data.explanation);
      setShowAIGoals(false);
      setGoalsMessage({ type: 'success', text: 'AI goals generated! Review and save below.' });
    }
  };

  const handleUnitSystemChange = async (newUnitSystem: 'metric' | 'imperial') => {
    setUnitSystem(newUnitSystem);
    setSavingPreferences(true);
    setPreferencesMessage(null);

    const response = await usersApi.update({ unitSystem: newUnitSystem });

    setSavingPreferences(false);

    if (response.error) {
      setPreferencesMessage({ type: 'error', text: response.error });
      // Revert on error
      setUnitSystem(user?.unit_system || 'metric');
    } else {
      setPreferencesMessage({ type: 'success', text: 'Preferences saved!' });
      refreshUser();
      setTimeout(() => setPreferencesMessage(null), 3000);
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Nutrition Goals
          </h2>
          <button
            onClick={() => setShowAIGoals(!showAIGoals)}
            className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {showAIGoals ? 'Hide AI' : 'Generate with AI'}
          </button>
        </div>

        {/* AI Goal Generator */}
        {showAIGoals && (
          <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <h3 className="font-medium text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI Goal Calculator
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Enter your details and let AI calculate personalized nutrition goals based on evidence-based formulas.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Age</label>
                <input
                  type="number"
                  className="input"
                  value={aiForm.age}
                  onChange={(e) => setAIForm({ ...aiForm, age: Number(e.target.value) })}
                  min="13"
                  max="120"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sex</label>
                <select
                  className="input"
                  value={aiForm.sex}
                  onChange={(e) => setAIForm({ ...aiForm, sex: e.target.value as 'male' | 'female' })}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Height (cm)</label>
                <input
                  type="number"
                  className="input"
                  value={aiForm.heightCm}
                  onChange={(e) => setAIForm({ ...aiForm, heightCm: Number(e.target.value) })}
                  min="100"
                  max="250"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  className="input"
                  value={aiForm.weightKg}
                  onChange={(e) => setAIForm({ ...aiForm, weightKg: Number(e.target.value) })}
                  min="30"
                  max="300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Activity Level</label>
                <select
                  className="input"
                  value={aiForm.activityLevel}
                  onChange={(e) => setAIForm({ ...aiForm, activityLevel: e.target.value as GoalGenerationInput['activityLevel'] })}
                >
                  <option value="sedentary">Sedentary</option>
                  <option value="light">Lightly Active</option>
                  <option value="moderate">Moderately Active</option>
                  <option value="active">Active</option>
                  <option value="very_active">Very Active</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Goal</label>
                <select
                  className="input"
                  value={aiForm.goal}
                  onChange={(e) => setAIForm({ ...aiForm, goal: e.target.value as GoalGenerationInput['goal'] })}
                >
                  <option value="lose_weight">Lose Weight</option>
                  <option value="maintain">Maintain Weight</option>
                  <option value="gain_muscle">Build Muscle</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerateAIGoals}
              disabled={aiLoading}
              className="btn btn-primary w-full bg-purple-600 hover:bg-purple-700"
            >
              {aiLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Calculating...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Goals
                </span>
              )}
            </button>
          </div>
        )}

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

            {/* AI Explanation */}
            {aiExplanation && (
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-sm text-slate-700 dark:text-slate-300">
                <p className="font-medium text-purple-700 dark:text-purple-300 mb-1">AI Recommendation:</p>
                {aiExplanation}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="calorieTarget" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Daily Calorie Target
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={autoCalcCalories}
                    onChange={(e) => setAutoCalcCalories(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  Auto-calc from macros
                </label>
              </div>
              <input
                id="calorieTarget"
                type="number"
                className={`input ${autoCalcCalories ? 'bg-slate-100 dark:bg-slate-700' : ''}`}
                value={calorieTarget}
                onChange={(e) => setCalorieTarget(e.target.value)}
                min="0"
                disabled={autoCalcCalories}
              />
              {autoCalcCalories && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  = ({proteinTarget}g × 4) + ({carbsTarget}g × 4) + ({fatTarget}g × 9)
                </p>
              )}
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

        {preferencesMessage && (
          <div className={`mb-4 ${preferencesMessage.type === 'success' ? 'success-message' : 'error-message'}`}>
            {preferencesMessage.text}
          </div>
        )}

        <div className="space-y-4">
          {/* Unit System Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Unit System
              </label>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {unitSystem === 'metric' ? 'Using metric (kg, cm)' : 'Using imperial (lbs, ft/in)'}
              </p>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
              <button
                onClick={() => handleUnitSystemChange('metric')}
                disabled={savingPreferences}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  unitSystem === 'metric'
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                } ${savingPreferences ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Metric
              </button>
              <button
                onClick={() => handleUnitSystemChange('imperial')}
                disabled={savingPreferences}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  unitSystem === 'imperial'
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                } ${savingPreferences ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Imperial
              </button>
            </div>
          </div>

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
