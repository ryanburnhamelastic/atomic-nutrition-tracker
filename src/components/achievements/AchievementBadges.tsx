import { Achievement, UserStats } from '../../types';

// Achievement definitions (must match backend)
const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_entry', name: 'First Steps', description: 'Log your first meal', icon: '🎯' },
  { id: 'week_warrior', name: 'Week Warrior', description: '7 day logging streak', icon: '🔥' },
  { id: 'two_week_streak', name: 'Committed', description: '14 day logging streak', icon: '💪' },
  { id: 'month_master', name: 'Month Master', description: '30 day logging streak', icon: '⭐' },
  { id: 'fifty_day_streak', name: 'Dedicated', description: '50 day logging streak', icon: '🏆' },
  { id: 'century_streak', name: 'Century Club', description: '100 day logging streak', icon: '👑' },
  { id: 'hundred_days', name: 'Centurion', description: '100 total days logged', icon: '💯' },
  { id: 'protein_pro_7', name: 'Protein Pro', description: 'Hit protein goal 7 days in a row', icon: '🥩' },
  { id: 'macro_master_7', name: 'Macro Master', description: 'Hit all macro goals 7 days in a row', icon: '🎪' },
];

interface AchievementBadgesProps {
  stats: UserStats | null;
  loading: boolean;
}

export default function AchievementBadges({ stats, loading }: AchievementBadgesProps) {
  if (loading || !stats) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Achievements
        </h3>
        <div className="text-center text-slate-500 dark:text-slate-400">
          Loading achievements...
        </div>
      </div>
    );
  }

  const unlockedAchievements = ALL_ACHIEVEMENTS.filter((a) =>
    stats.achievements.includes(a.id)
  );
  const lockedAchievements = ALL_ACHIEVEMENTS.filter(
    (a) => !stats.achievements.includes(a.id)
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Achievements
        </h3>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {unlockedAchievements.length} / {ALL_ACHIEVEMENTS.length}
        </div>
      </div>

      {unlockedAchievements.length === 0 ? (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <div className="text-4xl mb-2">🏆</div>
          <p>Start logging to earn achievements!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Unlocked Achievements */}
          {unlockedAchievements.map((achievement) => (
            <div
              key={achievement.id}
              className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg border border-amber-200 dark:border-amber-700"
            >
              <div className="text-2xl flex-shrink-0">{achievement.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900 dark:text-white">
                  {achievement.name}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {achievement.description}
                </div>
              </div>
              <svg
                className="w-5 h-5 text-amber-500 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          ))}

          {/* Locked Achievements - Show next 3 */}
          {lockedAchievements.length > 0 && (
            <>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-4 mb-2">
                LOCKED
              </div>
              {lockedAchievements.slice(0, 3).map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg opacity-60"
                >
                  <div className="text-2xl flex-shrink-0 grayscale">{achievement.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-700 dark:text-slate-300">
                      {achievement.name}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {achievement.description}
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-slate-400 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
