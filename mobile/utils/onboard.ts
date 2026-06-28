import { ActivityLevel, Goal, NutritionPlan, Sex } from "@/types/onboard";
import { MealType } from "@/types/products";

export const calculatePlan = ({
  sex,
  age,
  weightKg,
  heightCm,
  activityLevel,
  goal,
}: {
  sex: Sex;
  age: number;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
  goal: Goal;
}): NutritionPlan => {
  // 1. BMR (Mifflin-St Jeor)
  const bmr =
    sex === "male"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  // 2. Activity multiplier
  const activityMultiplier = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
  }[activityLevel];

  let calories = bmr * activityMultiplier;

  const goalMultiplier = {
    lose: 0.8,
    maintain: 1,
    bulk: 1.1,
  }[goal];

  calories *= goalMultiplier;

  // safety floor
  calories = Math.max(calories, sex === "male" ? 1500 : 1200);
  calories = Math.round(calories / 25) * 25;

  // 4. PROTEIN (adaptive + capped)
  const proteinRanges = {
    sedentary: { min: 1.4, max: 1.6 },
    light: { min: 1.6, max: 1.8 },
    moderate: { min: 1.8, max: 2.0 },
    active: { min: 2.0, max: 2.2 },
  }[activityLevel];

  let proteinMultiplier =
    goal === "lose"
      ? proteinRanges.max
      : goal === "bulk"
        ? proteinRanges.min
        : (proteinRanges.min + proteinRanges.max) / 2;

  let protein = weightKg * proteinMultiplier;

  // hard cap (prevents obesity edge cases)
  protein = Math.min(protein, weightKg * 2.4);

  protein = Math.round(protein);

  // 5. FAT (adaptive, not fixed %)
  const fatPerKgBase = goal === "lose" ? 0.7 : goal === "bulk" ? 1.0 : 0.85;

  let fat = weightKg * fatPerKgBase;

  // also ensure minimum % of calories (prevents too-low fat)
  const fatFromCalories = (calories * 0.25) / 9;

  fat = Math.max(fat, fatFromCalories);

  fat = Math.round(fat);

  // 6. CARBS (controlled remainder)
  let remainingCalories = calories - protein * 4 - fat * 9;

  let carbs = remainingCalories / 4;

  // prevent unrealistic extremes
  carbs = Math.max(carbs, 50); // minimum survival baseline
  carbs = Math.round(carbs);

  return {
    calories,
    protein,
    fat,
    carbs,
  };
};

const mealDistribution: Record<MealType, number> = {
  breakfast: 0.25,
  lunch: 0.35,
  snack: 0.15,
  dinner: 0.25,
};

export function calculateMealCalories(totalCalories: number) {
  return {
    breakfast: Math.round(totalCalories * mealDistribution.breakfast),
    lunch: Math.round(totalCalories * mealDistribution.lunch),
    snack: Math.round(totalCalories * mealDistribution.snack),
    dinner: Math.round(totalCalories * mealDistribution.dinner),
  };
}
