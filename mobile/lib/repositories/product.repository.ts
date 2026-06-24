import { MealType } from "@/types/products";
import { SQLiteDatabase } from "expo-sqlite";

export const productRepository = {
  getSummary: async (db: SQLiteDatabase, dayDate: string) => {
    // const tables = await db.getAllAsync<{ name: string }>(
    //   "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;",
    // );
    const day = dayDate.substring(0, 10);

    return db.getFirstAsync<{
      calories: number;
      proteins: number;
      fats: number;
      carbs: number;
    }>(
      `
    SELECT
      COALESCE(SUM(p.calories_per_100g * f.grams / 100),0) calories,
      COALESCE(SUM(p.proteins_per_100g * f.grams / 100),0) proteins,
      COALESCE(SUM(p.fats_per_100g * f.grams / 100),0) fats,
      COALESCE(SUM(p.carbs_per_100g * f.grams / 100),0) carbs
    FROM food_entries f
    JOIN products p ON p.id = f.product_id
    WHERE DATE(f.logged_day)=?
    `,
      [day],
    );
  },
  getMealMacros: async (
    db: SQLiteDatabase,
    dayDate: string,
    mealType: MealType,
  ) => {
    const day = dayDate.substring(0, 10);

    return db.getFirstAsync<{
      calories: number;
      proteins: number;
      fats: number;
      carbs: number;
    }>(
      `
    SELECT
      COALESCE(SUM(p.calories_per_100g * f.grams / 100), 0) AS calories,
      COALESCE(SUM(p.proteins_per_100g * f.grams / 100), 0) AS proteins,
      COALESCE(SUM(p.fats_per_100g * f.grams / 100), 0) AS fats,
      COALESCE(SUM(p.carbs_per_100g * f.grams / 100), 0) AS carbs
    FROM food_entries f
    JOIN products p ON p.id = f.product_id
    WHERE f.logged_day = ?
      AND f.meal_type = ?
    `,
      [day, mealType],
    );
  },
  getMealItems: async (
    db: SQLiteDatabase,
    dayDate: string,
    mealType: MealType,
  ) => {
    const day = dayDate.substring(0, 10);

    return db.getAllAsync<{
      calories: number;
      proteins: number;
      fats: number;
      carbs: number;
    }>(
      `
    SELECT
      f.id,
      f.grams,
      f.logged_at,
      p.id AS product_id,
      p.name,
      p.calories_per_100g,
      p.proteins_per_100g,
      p.fats_per_100g,
      p.carbs_per_100g
    FROM food_entries f
    JOIN products p ON p.id = f.product_id
    WHERE f.logged_day = ?
      AND f.meal_type = ?
    ORDER BY f.logged_at DESC
    `,
      [day, mealType],
    );
  },
};
