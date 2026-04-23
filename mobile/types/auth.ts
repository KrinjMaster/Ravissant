// user calorie goals
type UserGoal = "lose" | "mantain" | "gain";

type Language = "english" | "russian";

// user filled data on first login
export interface UserData {
  language: Language;
  name: string;
  sex: "Male" | "Female" | "Other";
  age: number;
  goal: UserGoal;
  weight_metric: number;
  height_metric: number;
  weight_imperial: number;
  height_imperial: number;
}
