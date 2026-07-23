import { useMutation } from "@tanstack/react-query";
import { productService } from "@/services/product.service";
import { useSQLiteContext } from "expo-sqlite";
import { MealType } from "@/types/products";

export function useAddMealItem() {
  const db = useSQLiteContext();

  return useMutation({
    mutationFn: ({
      productId,
      mealType,
      grams,
      loggedDay,
    }: {
      productId: string;
      mealType: MealType;
      grams: number;
      loggedDay: string;
    }) => productService.addMealItem(db, productId, mealType, grams, loggedDay),
  });
}
