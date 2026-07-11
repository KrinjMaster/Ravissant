import { queryClient } from "@/app/_layout";
import { productRepository } from "@/lib/repositories/product.repository";
import { MealType } from "@/types/products";
import { SQLiteDatabase } from "expo-sqlite";

export const productService = {
  getSummary: async (db: SQLiteDatabase, day: string) =>
    await productRepository.getSummary(db, day),
  getMealMacros: async (db: SQLiteDatabase, day: string, mealType: MealType) =>
    await productRepository.getMealMacros(db, day, mealType),
  getMealItems: async (db: SQLiteDatabase, day: string, mealType: MealType) =>
    await productRepository.getMealItems(db, day, mealType),
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
  ) => {
    await productRepository.addMealItem(
      db,
      productId,
      mealType,
      grams,
      loggedDay,
    );

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["summary", loggedDay],
      }),
      queryClient.invalidateQueries({
        queryKey: ["meal-info", `${loggedDay} ${mealType}`],
      }),
      queryClient.invalidateQueries({
        queryKey: ["meal-items", `${loggedDay} ${mealType}`],
      }),
    ]);
  },
  removeMealItem: async (
    db: SQLiteDatabase,
    itemId: string,
    day: string,
    mealType: MealType,
  ) => {
    await productRepository.removeMealItem(db, itemId);

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["summary", day],
      }),
      queryClient.invalidateQueries({
        queryKey: ["meal-info", `${day} ${mealType}`],
      }),
      queryClient.invalidateQueries({
        queryKey: ["meal-items", `${day} ${mealType}`],
      }),
    ]);
  },
  addFavoriteItem: async (db: SQLiteDatabase, productId: string) => {
    await productRepository.addFavoriteProduct(db, productId);

    await queryClient.invalidateQueries({
      queryKey: ["meal-by-id", productId],
    });
  },
  removeFavoriteItem: async (db: SQLiteDatabase, productId: string) => {
    await productRepository.removeFavoriteProduct(db, productId);

    await queryClient.invalidateQueries({
      queryKey: ["meal-by-id", productId],
    });
  },
  getRecentItems: async (db: SQLiteDatabase) =>
    await productRepository.getRecentItems(db),
  getRecentWeight: async (db: SQLiteDatabase) =>
    await productRepository.getRecentWeight(db),
  changeDayWeight: async (db: SQLiteDatabase, day: string, weight: number) => {
    await productRepository.changeDayWeight(db, day, weight);

    await queryClient.invalidateQueries({
      queryKey: ["weight-recent"],
    });
  },
};
