import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product.service";
import { useSQLiteContext } from "expo-sqlite";

export function useWeight() {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: ["weight-history"],
    queryFn: () => productService.getAllWeight(db),
  });
}
