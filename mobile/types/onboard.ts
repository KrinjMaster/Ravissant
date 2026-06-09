export type Goal = "lose" | "maintain" | "bulk";
export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";

export interface UserData {
  goal: Goal;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  dailyCalorieTarget: number;
  manualOverride: boolean;
  isOnboarded: boolean;
}
