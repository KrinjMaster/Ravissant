import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product.service";
import { useSQLiteContext } from "expo-sqlite";

export function useMacrosSummary(day: string) {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: ["summary", day],
    queryFn: () => productService.getSummary(db, day),
  });
}
