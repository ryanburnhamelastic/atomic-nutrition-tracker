import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNutrition } from '../contexts/NutritionContext';
import { foodEntriesApi, userStatsApi } from '../lib/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import DailyProgress from '../components/nutrition/DailyProgress';
import MealSection from '../components/nutrition/MealSection';
import WeightLogSection from '../components/weight/WeightLogSection';
import StreakCounter from '../components/achievements/StreakCounter';
import AchievementBadges from '../components/achievements/AchievementBadges';
import { FoodEntry, MealType, UserStats } from '../types';

// Helper to format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.getTime() === today.getTime()) {
    return 'Today';
  } else if (date.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }
}

// Helper to change date by days
function addDays(dateString: string, days: number): string {
  const date = new Date(dateString + 'T00:00:00');
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    selectedDate,
    setSelectedDate,
    goals,
    dailySummary,
    summaryLoading,
    refreshSummary,
  } = useNutrition();

  // User stats for streaks and achievements
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Load user stats
  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    setStatsLoading(true);
    const response = await userStatsApi.get();
    if (response.data) {
      setUserStats(response.data);
    }
    setStatsLoading(false);
  };

  // Handle edit entry - navigate to LogFood with entry data
  const handleEditEntry = useCallback((entry: FoodEntry) => {
    navigate('/log', { state: { editEntry: entry } });
  }, [navigate]);

  // Handle delete entry
  const handleDeleteEntry = useCallback(async (entryId: string) => {
    const response = await foodEntriesApi.delete(entryId);
    if (!response.error) {
      refreshSummary();
    }
  }, [refreshSummary]);

  // Navigate dates
  const goToPreviousDay = () => setSelectedDate(addDays(selectedDate, -1));
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const goToToday = () => setSelectedDate(new Date().toISOString().split('T')[0]);

  // Check if viewing today
  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  // Default empty summary
  const summary = dailySummary || {
    date: selectedDate,
    totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    byMeal: {
      breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0, entries: [] },
      lunch: { calories: 0, protein: 0, carbs: 0, fat: 0, entries: [] },
      dinner: { calories: 0, protein: 0, carbs: 0, fat: 0, entries: [] },
      snack: { calories: 0, protein: 0, carbs: 0, fat: 0, entries: [] },
    },
  };

  return (
    <div className="space-y-4">
      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPreviousDay}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Previous day"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={goToToday}
          className="text-lg font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          {formatDate(selectedDate)}
        </button>

        <button
          onClick={goToNextDay}
          disabled={isToday}
          className={`p-2 ${
            isToday
              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
          aria-label="Next day"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {summaryLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* Daily Progress */}
          <DailyProgress totals={summary.totals} goals={goals} />

          {/* Streaks and Achievements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StreakCounter stats={userStats} loading={statsLoading} />
            <AchievementBadges stats={userStats} loading={statsLoading} />
          </div>

          {/* Weight Log */}
          <WeightLogSection />

          {/* Meal Sections */}
          {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((mealType) => (
            <MealSection
              key={mealType}
              mealType={mealType}
              summary={summary.byMeal[mealType]}
              onEditEntry={handleEditEntry}
              onDeleteEntry={handleDeleteEntry}
            />
          ))}
        </>
      )}
    </div>
  );
}
