import { useMutation } from "@tanstack/react-query";
import { productService } from "@/services/product.service";
import { useSQLiteContext } from "expo-sqlite";
import { MealType } from "@/types/products";

export function useAddProduct() {
  const db = useSQLiteContext();

  return useMutation({
    mutationFn: ({
      name,
      brand,
      category,
      weight,
      unit,
      ingredients,
      allergens,
      barcode,
      nutrition,
    }: {
      name: string;
      brand: string | null;
      category: string;
      weight: number;
      unit: string;
      ingredients: string | null;
      allergens: string | null;
      barcode: string | null;
      nutrition: {
        calories: string;
        protein: string;
        fat: string;
        saturatedFat: string;
        unsaturatedFat: string;
        omega3: string;
        omega6: string;
        transFat: string;
        carbs: string;
        sugars: string;
        fiber: string;
        salt: string;
        sodium: string;
        cholesterol: string;
      };
    }) =>
      productService.addProduct(db, {
        name,
        brand,
        category,
        weight,
        unit,
        ingredients,
        allergens,
        barcode,
        nutrition,
      }),
  });
}
