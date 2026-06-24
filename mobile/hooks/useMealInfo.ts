import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product.service";
import { useSQLiteContext } from "expo-sqlite";
import { MealType } from "@/types/products";

export function useMealInfo(day: string, mealType: MealType) {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: ["meal-info", day],
    queryFn: () => productService.getMealInfo(db, day, mealType),
  });
}
