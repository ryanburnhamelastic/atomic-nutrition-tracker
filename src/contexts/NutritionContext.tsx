import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { UserGoals, DailySummary } from '../types';
import { goalsApi, dailySummaryApi } from '../lib/api';
import { useAuth } from './AuthContext';

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
}

const NutritionContext = createContext<NutritionContextType | undefined>(undefined);

// Helper to get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

export function NutritionProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();

  // Selected date defaults to today
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());

  // Goals state
  const [goals, setGoals] = useState<UserGoals | null>(null);
  const [goalsLoading, setGoalsLoading] = useState(false);

  // Daily summary state
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Fetch user's nutrition goals
  const refreshGoals = useCallback(async () => {
    if (!isSignedIn) return;

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
  }, [isSignedIn]);

  // Fetch daily summary for selected date
  const refreshSummary = useCallback(async () => {
    if (!isSignedIn) return;

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
  }, [isSignedIn, selectedDate]);

  // Load goals when user signs in
  useEffect(() => {
    if (isSignedIn) {
      refreshGoals();
    } else {
      setGoals(null);
    }
  }, [isSignedIn, refreshGoals]);

  // Load summary when date changes or user signs in
  useEffect(() => {
    if (isSignedIn) {
      refreshSummary();
    } else {
      setDailySummary(null);
    }
  }, [isSignedIn, selectedDate, refreshSummary]);

  const value: NutritionContextType = {
    selectedDate,
    setSelectedDate,
    goals,
    goalsLoading,
    refreshGoals,
    dailySummary,
    summaryLoading,
    refreshSummary,
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
