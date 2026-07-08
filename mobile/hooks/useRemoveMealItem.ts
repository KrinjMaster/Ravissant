import { useMutation } from "@tanstack/react-query";
import { useSQLiteContext } from "expo-sqlite";
import { productService } from "@/services/product.service";
import { MealType } from "@/types/products";

export function useRemoveMealItem() {
  const db = useSQLiteContext();

  return useMutation({
    mutationFn: ({
      itemId,
      day,
      meal,
    }: {
      itemId: string;
      day: string;
      meal: MealType;
    }) => productService.removeMealItem(db, itemId, day, meal),
  });
}
