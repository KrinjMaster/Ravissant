import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product.service";
import { useSQLiteContext } from "expo-sqlite";
import { MealType } from "@/types/products";

export function useMealItems(day: string, mealType: MealType) {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: ["meal-items", `${day} ${mealType}`],
    queryFn: () => productService.getMealItems(db, day, mealType),
  });
}
