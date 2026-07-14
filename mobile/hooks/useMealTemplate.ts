import { MealTemplateContext } from "@/features/meal-template/mealTemplate.context";
import { useContext } from "react";

export const useMealTemplate = () => {
  const ctx = useContext(MealTemplateContext);

  if (!ctx) {
    throw new Error(
      "MealTemplateContext must be used within MealTemplateProvider",
    );
  }

  return ctx;
};
