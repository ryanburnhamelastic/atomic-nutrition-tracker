import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { UserGoals, DailySummary, UserStats } from '../types';
import { goalsApi, dailySummaryApi, userStatsApi } from '../lib/api';
import { useAuth } from './AuthContext';
import { getTodayDate } from '../lib/timeHelpers';

interface NutritionContextType {
  // Selected date for viewing
  selectedDate: string;
  setSelectedDate: (date: string) => void;

  // User's nutrition goals
  goals: UserGoals | null;
  goalsLoading: boolean;
  refreshGoals: () => Promise<void>;

  // Daily summary for selected date
  dailySummary: DailySummary | null;
  summaryLoading: boolean;
  refreshSummary: () => Promise<void>;

  // User stats (streaks, achievements)
  userStats: UserStats | null;
  statsLoading: boolean;
  refreshStats: () => Promise<void>;
}

const NutritionContext = createContext<NutritionContextType | undefined>(undefined);

export function NutritionProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();

  // Selected date defaults to today
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());

  // Goals state
  const [goals, setGoals] = useState<UserGoals | null>(null);
  const [goalsLoading, setGoalsLoading] = useState(false);

  // Daily summary state
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // User stats state
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Fetch user's nutrition goals
  const refreshGoals = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;

    setGoalsLoading(true);
    try {
      const response = await goalsApi.get();
      if (response.data) {
        setGoals(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    } finally {
      setGoalsLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  // Fetch daily summary for selected date
  const refreshSummary = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;

    setSummaryLoading(true);
    try {
      const response = await dailySummaryApi.get(selectedDate);
      if (response.data) {
        setDailySummary(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch daily summary:', error);
    } finally {
      setSummaryLoading(false);
    }
  }, [isLoaded, isSignedIn, selectedDate]);

  // Fetch user stats (streaks, achievements)
  const refreshStats = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;

    setStatsLoading(true);
    try {
      const response = await userStatsApi.get();
      if (response.data) {
        setUserStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  // Load goals when user signs in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      refreshGoals();
    } else {
      setGoals(null);
    }
  }, [isLoaded, isSignedIn, refreshGoals]);

  // Load summary when date changes or user signs in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      refreshSummary();
    } else {
      setDailySummary(null);
    }
  }, [isLoaded, isSignedIn, selectedDate, refreshSummary]);

  // Load stats when user signs in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      refreshStats();
    } else {
      setUserStats(null);
    }
  }, [isLoaded, isSignedIn, refreshStats]);

  const value: NutritionContextType = {
    selectedDate,
    setSelectedDate,
    goals,
    goalsLoading,
    refreshGoals,
    dailySummary,
    summaryLoading,
    refreshSummary,
    userStats,
    statsLoading,
    refreshStats,
  };

  return (
    <NutritionContext.Provider value={value}>
      {children}
    </NutritionContext.Provider>
  );
}

export function useNutrition() {
  const context = useContext(NutritionContext);
  if (context === undefined) {
    throw new Error('useNutrition must be used within a NutritionProvider');
  }
  return context;
}
