import { useMutation } from "@tanstack/react-query";
import { productService } from "@/services/product.service";
import { useSQLiteContext } from "expo-sqlite";

export function useChangeFavoriteTemplate() {
  const db = useSQLiteContext();

  return useMutation({
    mutationFn: ({
      templateId,
      isFavorite,
    }: {
      templateId: string;
      isFavorite: boolean;
    }) =>
      isFavorite
        ? productService.removeFavoriteTemplate(db, templateId)
        : productService.addFavoriteTemplate(db, templateId),
  });
}
