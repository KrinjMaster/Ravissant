import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { useSQLiteContext } from "expo-sqlite";
import { SearchSource } from "@/app/modal/add-food";
import { productService } from "@/services/product.service";
import { useDebouncedValue } from "./useDebouncedValue";

const PAGE_SIZE = 20;

export const useSearchItems = (
  searchString: string,
  source: SearchSource,
  favoritesOnly: boolean,
) => {
  const db = useSQLiteContext();
  const debouncedSearchString = useDebouncedValue(searchString.trim(), 250);

  return useInfiniteQuery({
    queryKey: ["search-items", debouncedSearchString, source, favoritesOnly],

    initialPageParam: 0,

    queryFn: ({ pageParam }) =>
      productService.searchItems(
        db,
        debouncedSearchString,
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
    enabled: debouncedSearchString.length > 0,
  });
};
