import { UserStats } from '../../types';

interface StreakCounterProps {
  stats: UserStats | null;
  loading: boolean;
}

export default function StreakCounter({ stats, loading }: StreakCounterProps) {
  if (loading || !stats) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6">
        <div className="text-center text-slate-500 dark:text-slate-400">
          Loading stats...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Your Streak</h3>
        <div className="text-3xl">🔥</div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-3xl font-bold">{stats.current_streak}</div>
          <div className="text-sm text-indigo-100 mt-1">Current</div>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold">{stats.longest_streak}</div>
          <div className="text-sm text-indigo-100 mt-1">Longest</div>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold">{stats.total_days_logged}</div>
          <div className="text-sm text-indigo-100 mt-1">Total Days</div>
        </div>
      </div>
    </div>
  );
}
