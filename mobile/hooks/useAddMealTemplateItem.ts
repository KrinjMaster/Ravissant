import { useMutation } from "@tanstack/react-query";
import { productService } from "@/services/product.service";
import { useSQLiteContext } from "expo-sqlite";
import { MealType } from "@/types/products";

export function useAddMealTemplateItem() {
  const db = useSQLiteContext();

  return useMutation({
    mutationFn: ({
      templateId,
      mealType,
      loggedDay,
    }: {
      templateId: string;
      mealType: MealType;
      loggedDay: string;
    }) =>
      productService.addMealTemplateItem(db, templateId, mealType, loggedDay),
  });
}
