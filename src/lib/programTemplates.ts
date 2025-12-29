/**
 * Program Templates for Macro Calculation
 * Inspired by MacroFactor's program templates
 */

export interface UserStats {
  age: number;
  sex: 'male' | 'female';
  weightKg: number;
  heightCm: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface ProgramTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  calorieModifier: number; // -0.20 for 20% deficit, +0.10 for 10% surplus
  proteinPerKg: number; // grams of protein per kg of bodyweight
  fatPerKg: number; // grams of fat per kg of bodyweight
}

/**
 * Calculate BMR using Mifflin-St Jeor equation
 */
export function calculateBMR(stats: UserStats): number {
  const { sex, weightKg, heightCm, age } = stats;

  if (sex === 'male') {
    return (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
  } else {
    return (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
  }
}

/**
 * Get activity multiplier
 */
export function getActivityMultiplier(activityLevel: UserStats['activityLevel']): number {
  const multipliers = {
    sedentary: 1.2,     // Little to no exercise
    light: 1.375,       // Light exercise 1-3 days/week
    moderate: 1.55,     // Moderate exercise 3-5 days/week
    active: 1.725,      // Heavy exercise 6-7 days/week
    very_active: 1.9,   // Very heavy exercise, physical job
  };
  return multipliers[activityLevel];
}

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 */
export function calculateTDEE(stats: UserStats): number {
  const bmr = calculateBMR(stats);
  const multiplier = getActivityMultiplier(stats.activityLevel);
  return Math.round(bmr * multiplier);
}

/**
 * Available program templates
 */
export const PROGRAM_TEMPLATES: ProgramTemplate[] = [
  {
    id: 'aggressive_cut',
    name: 'Aggressive Cut',
    description: '20% deficit for rapid fat loss (1-1.5 lbs/week)',
    icon: '⚡',
    calorieModifier: -0.20,
    proteinPerKg: 2.2,
    fatPerKg: 0.8,
  },
  {
    id: 'moderate_cut',
    name: 'Moderate Cut',
    description: '15% deficit for steady fat loss (0.75-1 lb/week)',
    icon: '📉',
    calorieModifier: -0.15,
    proteinPerKg: 2.0,
    fatPerKg: 0.9,
  },
  {
    id: 'conservative_cut',
    name: 'Conservative Cut',
    description: '10% deficit for slow fat loss (0.5 lb/week)',
    icon: '📊',
    calorieModifier: -0.10,
    proteinPerKg: 1.8,
    fatPerKg: 1.0,
  },
  {
    id: 'maintenance',
    name: 'Maintenance',
    description: 'Maintain current weight and body composition',
    icon: '⚖️',
    calorieModifier: 0,
    proteinPerKg: 1.6,
    fatPerKg: 1.0,
  },
  {
    id: 'lean_bulk',
    name: 'Lean Bulk',
    description: '10% surplus for muscle gain, minimal fat (0.5-0.75 lb/week)',
    icon: '💪',
    calorieModifier: 0.10,
    proteinPerKg: 1.8,
    fatPerKg: 0.9,
  },
  {
    id: 'bulk',
    name: 'Bulk',
    description: '15% surplus for faster muscle gain (1 lb/week)',
    icon: '🏋️',
    calorieModifier: 0.15,
    proteinPerKg: 1.6,
    fatPerKg: 0.8,
  },
];

/**
 * Calculate macros based on program template
 */
export function calculateMacrosFromTemplate(
  stats: UserStats,
  template: ProgramTemplate
): MacroTargets {
  const tdee = calculateTDEE(stats);
  const targetCalories = Math.round(tdee * (1 + template.calorieModifier));

  // Calculate protein (4 cal/g)
  const proteinGrams = Math.round(stats.weightKg * template.proteinPerKg);
  const proteinCalories = proteinGrams * 4;

  // Calculate fat (9 cal/g)
  const fatGrams = Math.round(stats.weightKg * template.fatPerKg);
  const fatCalories = fatGrams * 9;

  // Remaining calories go to carbs (4 cal/g)
  const remainingCalories = targetCalories - proteinCalories - fatCalories;
  const carbsGrams = Math.round(Math.max(0, remainingCalories / 4));

  return {
    calories: targetCalories,
    protein: proteinGrams,
    carbs: carbsGrams,
    fat: fatGrams,
  };
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): ProgramTemplate | undefined {
  return PROGRAM_TEMPLATES.find(t => t.id === id);
}
