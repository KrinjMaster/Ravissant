export type Goal = "lose" | "maintain" | "bulk";
export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";

export interface NutritionPlan {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface UserData {
  goal: Goal;
  sex: Sex;
  birthday: string;
  height: number;
  weight: number;
  activityLevel: ActivityLevel;
  nutritionPlan: NutritionPlan;
  isOnboarded: boolean;
}
