import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product.service";
import { useSQLiteContext } from "expo-sqlite";

export function useRecentItems() {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: ["recent-items"],
    queryFn: () => productService.getRecentItems(db),
  });
}
