
import { Exercise, UserProfile } from '../types';

/**
 * APEXFIT CALORIE ENGINE (ACE) & BIOMETRICS
 */

const RESTING_OXYGEN_CONSUMPTION = 3.5; 
const STANDARD_MET_STRENGTH = 5.0; 

// --- Biometric Formulas ---

/**
 * Calculate Age from Date of Birth
 */
export const calculateAge = (dob: string): number => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

/**
 * Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
 */
export const calculateBMR = (user: UserProfile): number => {
  const age = calculateAge(user.dob);
  // Ensure we use KG and CM
  const weight = user.units.weight === 'lbs' ? user.weight * 0.453592 : user.weight;
  const height = user.units.height === 'ft_in' ? user.height * 30.48 : user.height; // approximate if single value, usually height stored as cm

  if (user.gender === 'male') {
    return (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    return (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }
};

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 */
export const calculateTDEE = (user: UserProfile): number => {
  const bmr = calculateBMR(user);
  let activityFactor = 1.2;

  switch (user.fitness_level) {
    case 'beginner': activityFactor = 1.2; break;
    case 'intermediate': activityFactor = 1.375; break;
    case 'advanced': activityFactor = 1.55; break;
    case 'expert': activityFactor = 1.725; break;
    default: activityFactor = 1.2;
  }

  return Math.round(bmr * activityFactor);
};

/**
 * Calculate Daily Water Goal
 * Baseline: 30ml per kg
 */
export const calculateDailyWaterGoal = (user: UserProfile): number => {
   const weight = user.units.weight === 'lbs' ? user.weight * 0.453592 : user.weight;
   return Math.round(weight * 30);
};

/**
 * Calculate Workout Water Bonus
 * +250ml per 15 mins of activity
 */
export const calculateWorkoutWaterBonus = (durationMin: number): number => {
  const intervals = Math.floor(durationMin / 15);
  return intervals * 250;
};


// --- Workout Formulas ---

export type WorkoutActivityType = 'Strength' | 'Cardio' | 'HIIT';

interface CalorieCalculationParams {
  userWeightKg: number;
  durationSec: number;
  avgMetValue: number;
  avgRestSec?: number;
  activityType?: WorkoutActivityType;
}

const calculateBaseCalories = (met: number, weightKg: number, durationMin: number): number => {
  return (met * RESTING_OXYGEN_CONSUMPTION * weightKg / 200) * durationMin;
};

const calculateStrengthCalories = (met: number, weightKg: number, durationMin: number, avgRestSec: number): number => {
  const kRest = avgRestSec > 180 ? 0.7 : 1.0;
  const effectiveMet = met * kRest;
  return calculateBaseCalories(effectiveMet, weightKg, durationMin);
};

const calculateCardioCalories = (met: number, weightKg: number, durationMin: number): number => {
  return calculateBaseCalories(met, weightKg, durationMin);
};

const calculateHIITCalories = (met: number, weightKg: number, durationMin: number): number => {
  return calculateBaseCalories(met, weightKg, durationMin);
};

export const calculateApexFitCalories = ({
  userWeightKg,
  durationSec,
  avgMetValue,
  avgRestSec = 90,
  activityType = 'Strength'
}: CalorieCalculationParams): number => {
  const durationMin = durationSec / 60;
  switch (activityType) {
    case 'Cardio': return Math.round(calculateCardioCalories(avgMetValue, userWeightKg, durationMin));
    case 'HIIT': return Math.round(calculateHIITCalories(avgMetValue, userWeightKg, durationMin));
    case 'Strength': default: return Math.round(calculateStrengthCalories(avgMetValue, userWeightKg, durationMin, avgRestSec));
  }
};

export const calculateAverageMets = (exercises: Exercise[]): number => {
  if (!exercises.length) return STANDARD_MET_STRENGTH;
  const sum = exercises.reduce((acc, ex) => acc + (ex.mets_code || STANDARD_MET_STRENGTH), 0);
  return sum / exercises.length;
};

export const calculate1RM = (weight: number, reps: number): number => {
  if (reps === 1) return weight;
  if (reps <= 10) {
    return Math.round(weight * (1 + reps / 30));
  } else {
    return Math.round(weight * (36 / (37 - reps)));
  }
};

export const getHydrationRecommendation = (weightKg: number, durationMin: number): number => {
  const intervals = durationMin / 15;
  return Math.round(weightKg * 2 * intervals);
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const dateKey = (date: Date): string => {
  const d = new Date(date);
  const offset = d.getTimezoneOffset() * 60000;
  const localDate = new Date(d.getTime() - offset);
  return localDate.toISOString().split('T')[0];
};
