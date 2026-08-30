import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { useSQLiteContext } from "expo-sqlite";
import { SearchSource } from "@/app/modal/add-food";
import { productService } from "@/services/product.service";

const PAGE_SIZE = 20;

export const useSearchItems = (
  searchString: string,
  source: SearchSource,
  favoritesOnly: boolean,
) => {
  const db = useSQLiteContext();

  return useInfiniteQuery({
    queryKey: ["search-items", searchString, source, favoritesOnly],

    initialPageParam: 0,

    queryFn: ({ pageParam }) =>
      productService.searchItems(
        db,
        searchString,
        source,
        favoritesOnly,
        PAGE_SIZE,
        pageParam,
      ),

    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) {
        return undefined;
      }

      return allPages.length * PAGE_SIZE;
    },
    placeholderData: keepPreviousData,
    enabled: searchString.length > 0,
  });
};
