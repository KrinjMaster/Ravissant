import { useSQLiteContext } from "expo-sqlite";
import { useQueryClient } from "@tanstack/react-query";
import { productService } from "@/services/product.service";

export const useGetIdByBarcode = () => {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  const findByBarcode = async (barcode: string) => {
    return queryClient.fetchQuery({
      queryKey: ["product-by-barcode", barcode],
      queryFn: () => productService.getProductByBarcode(db, barcode),
    });
  };

  return {
    findByBarcode,
  };
};
