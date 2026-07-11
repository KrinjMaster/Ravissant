import { useMutation } from "@tanstack/react-query";
import { productService } from "@/services/product.service";
import { useSQLiteContext } from "expo-sqlite";

export function useWeightLog() {
  const db = useSQLiteContext();

  return useMutation({
    mutationFn: ({ weight, day }: { weight: number; day: string }) =>
      productService.changeDayWeight(db, day, weight),
  });
}
