import { useMutation } from "@tanstack/react-query";
import { useSQLiteContext } from "expo-sqlite";
import { productService } from "@/services/product.service";

export function useRemoveTemplate() {
  const db = useSQLiteContext();

  return useMutation({
    mutationFn: ({ templateId }: { templateId: string }) =>
      productService.removeMealTemplate(db, templateId),
  });
}
