import { useAuthContext } from '../contexts/AuthContext';

export default function Home() {
  const { userName, user } = useAuthContext();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Welcome back, {userName || 'User'}!
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {/* TODO: Customize welcome message */}
          Here's what's happening with your account today.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Example Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <svg
                className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="ml-4 text-lg font-semibold text-slate-900 dark:text-white">
              Quick Action
            </h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            {/* TODO: Add description */}
            Perform a quick action to get started with your task.
          </p>
          <button className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors">
            Get Started
          </button>
        </div>

        {/* TODO: Add more action cards */}
      </div>

      {/* User Info (for debugging - remove in production) */}
      {user && (
        <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4 text-sm">
          <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Debug: User Info
          </h4>
          <pre className="text-slate-600 dark:text-slate-400 overflow-x-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
