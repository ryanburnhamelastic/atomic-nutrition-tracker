import { MealType } from '../types';

/**
 * Get today's date in YYYY-MM-DD format using LOCAL timezone
 * (not UTC, to avoid timezone mismatch issues)
 */
export function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get current time in HH:MM format (24-hour)
 */
export function getCurrentTime(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * Get remaining meals based on current time
 * Time windows:
 * - Breakfast: 5 AM - 10 AM
 * - Lunch: 10 AM - 3 PM
 * - Dinner: 3 PM - 9 PM
 * - Snack: Always available
 */
export function getRemainingMeals(currentTime: string): MealType[] {
  const hour = parseInt(currentTime.split(':')[0]);
  const meals: MealType[] = [];

  // Breakfast: 5 AM - 10 AM
  if (hour >= 5 && hour < 10) {
    meals.push('breakfast');
  }

  // Lunch: 10 AM - 3 PM
  if (hour >= 10 && hour < 15) {
    meals.push('lunch');
  }

  // Dinner: 3 PM - 9 PM
  if (hour >= 15 && hour < 21) {
    meals.push('dinner');
  }

  // Snack: Always available
  meals.push('snack');

  // Edge case: Very early morning (before 5 AM)
  // Show all meals for the upcoming day
  if (hour < 5) {
    return ['breakfast', 'lunch', 'dinner', 'snack'];
  }

  return meals.length > 0 ? meals : ['snack'];
}

/**
 * Format meal type array into readable string
 * Examples:
 * - ['breakfast'] => 'breakfast'
 * - ['lunch', 'snack'] => 'lunch and snack'
 * - ['breakfast', 'lunch', 'dinner'] => 'breakfast, lunch, and dinner'
 */
export function getMealTypeLabel(meals: MealType[]): string {
  if (meals.length === 0) return 'none';
  if (meals.length === 1) return meals[0];
  if (meals.length === 2) return `${meals[0]} and ${meals[1]}`;

  const lastMeal = meals[meals.length - 1];
  const otherMeals = meals.slice(0, -1).join(', ');
  return `${otherMeals}, and ${lastMeal}`;
}

/**
 * Icons for each meal type
 */
export const mealIcons: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍿',
};
