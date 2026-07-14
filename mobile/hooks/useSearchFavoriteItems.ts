import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product.service";
import { useSQLiteContext } from "expo-sqlite";

export function useSearchFavoriteItems(params: string) {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: ["product-favorite-items", params],
    queryFn: () => productService.searchFavoriteItems(db, params),
    placeholderData: (previousData) => previousData,
  });
}
