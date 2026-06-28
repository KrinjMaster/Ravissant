import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product.service";
import { useSQLiteContext } from "expo-sqlite";

export function useProductById(productId: string) {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: ["meal-by-id", productId],
    queryFn: () => productService.getItemById(db, productId),
  });
}
