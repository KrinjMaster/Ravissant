import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product.service";
import { useSQLiteContext } from "expo-sqlite";

export function useSearchItems(params: string) {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: ["product-items", params],
    queryFn: () => productService.searchItems(db, params),
  });
}
