import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product.service";
import { useSQLiteContext } from "expo-sqlite";

export function useSearchMealTemplates(params: string) {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: ["product-meal-templates", params],
    queryFn: () => productService.searchMealTemplates(db, params),
    placeholderData: (previousData) => previousData,
  });
}
