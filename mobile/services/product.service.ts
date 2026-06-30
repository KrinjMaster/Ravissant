import { productRepository } from "@/lib/repositories/product.repository";
import { MealType } from "@/types/products";
import { SQLiteDatabase } from "expo-sqlite";

export const productService = {
  getSummary: async (db: SQLiteDatabase, day: string) =>
    await productRepository.getSummary(db, day),
  getMealInfo: async (db: SQLiteDatabase, day: string, mealType: MealType) => {
    const [summary, items] = await Promise.all([
      productRepository.getMealMacros(db, day, mealType),
      productRepository.getMealItems(db, day, mealType),
    ]);

    return {
      summary: summary ?? {
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
      },
      items: items ?? [],
    };
  },
  searchItems: async (db: SQLiteDatabase, params: string) =>
    await productRepository.getItemsByName(db, params),
  getItemById: async (db: SQLiteDatabase, productId: string) =>
    await productRepository.getItemById(db, productId),
  addMealItem: async (
    db: SQLiteDatabase,
    productId: string,
    mealType: MealType,
    grams: number,
    loggedDay: string,
  ) =>
    await productRepository.addMealItem(
      db,
      productId,
      mealType,
      grams,
      loggedDay,
    ),
};
