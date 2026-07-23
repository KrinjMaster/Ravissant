import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product.service";
import { useSQLiteContext } from "expo-sqlite";
import { MealType } from "@/types/products";

export function useMealMacros(day: string, mealType: MealType) {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: ["meal-info", `${day.substring(0, 10)} ${mealType}`],
    queryFn: () => productService.getMealMacros(db, day, mealType),
  });
}
