/**
 * Unit conversion utilities
 */

export type UnitSystem = 'metric' | 'imperial';

// Weight conversions
const KG_TO_LBS = 2.20462;
const LBS_TO_KG = 1 / KG_TO_LBS;

/**
 * Convert weight from kg to the user's preferred unit
 */
export function formatWeight(kg: number, unitSystem: UnitSystem, decimals = 1): string {
  if (unitSystem === 'imperial') {
    const lbs = kg * KG_TO_LBS;
    return `${lbs.toFixed(decimals)} lbs`;
  }
  return `${kg.toFixed(decimals)} kg`;
}

/**
 * Get just the numeric value in the user's preferred unit
 */
export function convertWeight(kg: number, unitSystem: UnitSystem): number {
  if (unitSystem === 'imperial') {
    return kg * KG_TO_LBS;
  }
  return kg;
}

/**
 * Convert from user's preferred unit back to kg (for storage)
 */
export function toKg(value: number, unitSystem: UnitSystem): number {
  if (unitSystem === 'imperial') {
    return value * LBS_TO_KG;
  }
  return value;
}

/**
 * Get the unit label
 */
export function getWeightUnit(unitSystem: UnitSystem): string {
  return unitSystem === 'imperial' ? 'lbs' : 'kg';
}

/**
 * Get the weight step for input fields
 */
export function getWeightStep(unitSystem: UnitSystem): number {
  return unitSystem === 'imperial' ? 0.5 : 0.1;
}

// Height conversions (for future use)
const CM_TO_INCHES = 0.393701;

export function formatHeight(cm: number, unitSystem: UnitSystem): string {
  if (unitSystem === 'imperial') {
    const totalInches = cm * CM_TO_INCHES;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}' ${inches}"`;
  }
  return `${cm} cm`;
}
