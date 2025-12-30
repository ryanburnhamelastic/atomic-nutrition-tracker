import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNutrition } from '../contexts/NutritionContext';
import { foodEntriesApi, userStatsApi, userProgramsApi, weightEntriesApi, programReviewsApi } from '../lib/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import DailyProgress from '../components/nutrition/DailyProgress';
import MealSection from '../components/nutrition/MealSection';
import WeightLogSection from '../components/weight/WeightLogSection';
import StreakCounter from '../components/achievements/StreakCounter';
import AchievementBadges from '../components/achievements/AchievementBadges';
import ActiveProgramCard from '../components/programs/ActiveProgramCard';
import ProgramSelectionModal from '../components/programs/ProgramSelectionModal';
import ProgramCompletionModal from '../components/programs/ProgramCompletionModal';
import ProgramReviewBanner from '../components/programs/ProgramReviewBanner';
import ProgramReviewModal from '../components/programs/ProgramReviewModal';
import MealPlannerFAB from '../components/common/MealPlannerFAB';
import MealPlannerModal from '../components/food/MealPlannerModal';
import { getTodayDate } from '../lib/timeHelpers';
import { FoodEntry, MealType, UserStats, UserProgram, ProgramReview } from '../types';

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
  const location = useLocation();
  const {
    selectedDate,
    setSelectedDate,
    goals,
    dailySummary,
    summaryLoading,
    refreshSummary,
  } = useNutrition();

  // Refresh data when returning from food logging
  useEffect(() => {
    const state = location.state as { refreshData?: boolean } | null;
    if (state?.refreshData) {
      refreshSummary();
      // Clear the state to avoid refreshing on every render
      window.history.replaceState({}, document.title);
    }
  }, [location, refreshSummary]);

  // User stats for streaks and achievements
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Program state
  const [activeProgram, setActiveProgram] = useState<UserProgram | null>(null);
  const [showProgramSelection, setShowProgramSelection] = useState(false);
  const [showProgramCompletion, setShowProgramCompletion] = useState(false);
  const [completedProgram, setCompletedProgram] = useState<UserProgram | null>(null);
  const [currentWeight, setCurrentWeight] = useState<number | undefined>(undefined);
  const [programLoading, setProgramLoading] = useState(true);

  // Review state
  const [pendingReview, setPendingReview] = useState<ProgramReview | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Meal planner state
  const [showMealPlanner, setShowMealPlanner] = useState(false);

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

  // Load active program and current weight
  useEffect(() => {
    loadProgram();
  }, []);

  const loadProgram = async () => {
    setProgramLoading(true);

    // Load active program
    const programResponse = await userProgramsApi.get(false);
    if (programResponse.data) {
      const program = programResponse.data.active;

      // Check if program just completed
      if (program && program.status === 'completed' && !sessionStorage.getItem(`program_${program.id}_celebrated`)) {
        setCompletedProgram(program);
        setShowProgramCompletion(true);
        sessionStorage.setItem(`program_${program.id}_celebrated`, 'true');
        setActiveProgram(null);
      } else if (program && program.status === 'active') {
        setActiveProgram(program);

        // Load pending review for active program
        const reviewResponse = await programReviewsApi.list('pending', program.id, 1);
        if (reviewResponse.data && reviewResponse.data.length > 0) {
          setPendingReview(reviewResponse.data[0]);
        } else {
          setPendingReview(null);
        }
      }
    }

    // Load current weight
    const weightResponse = await weightEntriesApi.list(undefined, undefined, 1);
    if (weightResponse.data && weightResponse.data.length > 0) {
      setCurrentWeight(Number(weightResponse.data[0].weight_kg));
    }

    setProgramLoading(false);
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

  // Handle toggle completion
  const handleToggleComplete = useCallback(async (entryId: string, completed: boolean) => {
    const response = await foodEntriesApi.toggleComplete(entryId, completed);
    if (!response.error) {
      refreshSummary();
    }
  }, [refreshSummary]);

  // Navigate dates
  const goToPreviousDay = () => setSelectedDate(addDays(selectedDate, -1));
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const goToToday = () => setSelectedDate(getTodayDate());

  // Check if viewing today
  const isToday = selectedDate === getTodayDate();

  // Program handlers
  const handleProgramSuccess = () => {
    loadProgram();
  };

  const handleCompletionClose = () => {
    setShowProgramCompletion(false);
    setCompletedProgram(null);
  };

  const handleStartNewProgram = () => {
    setShowProgramCompletion(false);
    setCompletedProgram(null);
    setShowProgramSelection(true);
  };

  // Review handlers
  const handleReviewSuccess = () => {
    setPendingReview(null);
    loadProgram(); // Reload program with updated macros
  };

  const handleDismissReview = () => {
    setShowReviewModal(false);
  };

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

          {/* Active Program or Start Program Button */}
          {programLoading ? (
            <div className="card">
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            </div>
          ) : activeProgram ? (
            <ActiveProgramCard
              program={activeProgram}
              currentWeight={currentWeight}
              onChangeProgram={() => setShowProgramSelection(true)}
            />
          ) : (
            <div className="card text-center py-8">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Active Program
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Choose a nutrition program to track your macros and reach your goals
              </p>
              <button
                onClick={() => setShowProgramSelection(true)}
                className="btn-primary"
              >
                Start a Program
              </button>
            </div>
          )}

          {/* Review Banner */}
          {pendingReview && activeProgram && (
            <ProgramReviewBanner
              review={pendingReview}
              onViewAnalysis={() => setShowReviewModal(true)}
              onDismiss={handleDismissReview}
            />
          )}

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
              onToggleComplete={handleToggleComplete}
            />
          ))}
        </>
      )}

      {/* Meal Planner FAB - only show when viewing today */}
      {isToday && <MealPlannerFAB onClick={() => setShowMealPlanner(true)} />}

      {/* Program Selection Modal */}
      <ProgramSelectionModal
        isOpen={showProgramSelection}
        onClose={() => setShowProgramSelection(false)}
        onSuccess={handleProgramSuccess}
        currentWeight={currentWeight}
      />

      {/* Program Completion Modal */}
      <ProgramCompletionModal
        isOpen={showProgramCompletion}
        completedProgram={completedProgram}
        onClose={handleCompletionClose}
        onStartNewProgram={handleStartNewProgram}
      />

      {/* Program Review Modal */}
      <ProgramReviewModal
        isOpen={showReviewModal}
        review={pendingReview}
        program={activeProgram}
        onClose={() => setShowReviewModal(false)}
        onSuccess={handleReviewSuccess}
      />

      {/* Meal Planner Modal */}
      <MealPlannerModal
        isOpen={showMealPlanner}
        onClose={() => setShowMealPlanner(false)}
        date={selectedDate}
        currentMacros={summary.totals}
        goalMacros={{
          calories: goals?.calorie_target || 2000,
          protein: goals?.protein_target || 150,
          carbs: goals?.carbs_target || 200,
          fat: goals?.fat_target || 65,
        }}
      />
    </div>
  );
}
