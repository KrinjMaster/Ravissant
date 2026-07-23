import { MealType } from "@/types/products";

export const getMealLocale = (meal: MealType) => {
  const meals: Record<MealType, string> = {
    breakfast: "Завтрак",
    lunch: "Обед",
    dinner: "Ужин",
    snack: "Перекус",
  };

  return meals[meal];
};
