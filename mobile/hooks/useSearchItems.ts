import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product.service";
import { useSQLiteContext } from "expo-sqlite";
import { SearchSource } from "@/app/modal/add-food";

export function useSearchItems(
  searchString: string,
  source: SearchSource,
  favoritesOnly: boolean,
) {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: ["search-items", source, favoritesOnly, searchString],
    queryFn: () =>
      productService.searchItems(db, searchString, source, favoritesOnly),
    placeholderData: (previousData) => previousData,
  });
}
