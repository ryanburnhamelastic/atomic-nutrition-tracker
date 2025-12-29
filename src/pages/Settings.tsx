import { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { usersApi } from '../lib/api';

export default function Settings() {
  const { userEmail, userName, user, refreshUser } = useAuthContext();
  const { isDarkMode, toggleTheme } = useTheme();

  // User preferences state
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [preferencesMessage, setPreferencesMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load user preferences
  useEffect(() => {
    if (user) {
      setUnitSystem(user.unit_system);
    }
  }, [user]);

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
