import { useMutation } from "@tanstack/react-query";
import { productService } from "@/services/product.service";
import { useSQLiteContext } from "expo-sqlite";

export function useChangeFavoriteProduct() {
  const db = useSQLiteContext();

  return useMutation({
    mutationFn: ({
      productId,
      isFavorite,
    }: {
      productId: string;
      isFavorite: boolean;
    }) =>
      isFavorite
        ? productService.removeFavoriteItem(db, productId)
        : productService.addFavoriteItem(db, productId),
  });
}
