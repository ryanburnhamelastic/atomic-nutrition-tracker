import { useAuthContext } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function Settings() {
  const { userEmail, userName, user } = useAuthContext();
  const { isDarkMode, toggleTheme } = useTheme();

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

          {/* TODO: Add more preference toggles */}
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
