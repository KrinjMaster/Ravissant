import { productRepository } from "@/lib/repositories/product.repository";
import { MealType } from "@/types/products";
import { SQLiteDatabase } from "expo-sqlite";

export const productService = {
  getSummary: (db: SQLiteDatabase, day: string) =>
    productRepository.getSummary(db, day),
  getMealInfo: async (db: SQLiteDatabase, day: string, mealType: MealType) => {
    const [summary, items] = await Promise.all([
      productRepository.getMealMacros(db, day, mealType),
      productRepository.getMealItems(db, day, mealType),
    ]);

    return {
      summary: summary ?? {
        calories: 0,
        proteins: 0,
        fats: 0,
        carbs: 0,
      },
      items: items ?? [],
    };
  },
};
