import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product.service";
import { useSQLiteContext } from "expo-sqlite";

export function useGetMealTemplate(templateId: string) {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: ["meal-template-by-id", templateId],
    queryFn: () => productService.getMealTemplate(db, templateId),
  });
}
