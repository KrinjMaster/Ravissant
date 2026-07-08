import { MealType } from "@/types/products";
import { SQLiteDatabase } from "expo-sqlite";
import { generateId } from "@/utils/product";

export const productRepository = {
  getSummary: async (db: SQLiteDatabase, dayDate: string) => {
    const day = dayDate.substring(0, 10);

    return db.getFirstAsync<{
      calories: number;
      protein: number;
      fat: number;
      carbs: number;
    }>(
      `
    SELECT
      ROUND(COALESCE(SUM(p.calories_per_100g * f.grams / 100),0)) calories,
      ROUND(COALESCE(SUM(p.proteins_per_100g * f.grams / 100),0)) protein,
      ROUND(COALESCE(SUM(p.fats_per_100g * f.grams / 100),0)) fat,
      ROUND(COALESCE(SUM(p.carbs_per_100g * f.grams / 100),0)) carbs
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
      protein: number;
      fat: number;
      carbs: number;
    }>(
      `
    SELECT
      ROUND(COALESCE(SUM(p.calories_per_100g * f.grams / 100), 0)) AS calories,
      ROUND(COALESCE(SUM(p.proteins_per_100g * f.grams / 100), 0)) AS protein,
      ROUND(COALESCE(SUM(p.fats_per_100g * f.grams / 100), 0)) AS fat,
      ROUND(COALESCE(SUM(p.carbs_per_100g * f.grams / 100), 0)) AS carbs
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
      id: string;
      productId: string;
      name: string;
      weight: number;
      calories: number;
      protein: number;
      brand: string;
      fat: number;
      carbs: number;
    }>(
      `
    SELECT
      f.id,
      f.grams AS weight,
      f.logged_at,
      p.id AS productId,
      p.name,
      p.brand,
      ROUND(p.calories_per_100g * f.grams / 100) AS calories,
      ROUND(p.proteins_per_100g * f.grams / 100) AS protein,
      ROUND(p.fats_per_100g * f.grams / 100) AS fat,
      ROUND(p.carbs_per_100g * f.grams / 100) AS carbs
    FROM food_entries f
    JOIN products p ON p.id = f.product_id
    WHERE f.logged_day = ?
      AND f.meal_type = ?
    ORDER BY f.logged_at DESC
    `,
      [day, mealType],
    );
  },
  getItemsByName: async (db: SQLiteDatabase, searchParams: string) => {
    return db.getAllAsync<{
      id: string;
      name: string;
      brand: string;
      serving_size: number;
      calories: number;
    }>(
      `
    SELECT
      p.id,
      p.name,
      p.brand,
      p.serving_size,
      p.calories_per_100g AS calories
    FROM products p
    WHERE p.search_text LIKE ?
    ORDER BY p.name
    LIMIT 10;
    `,
      [`%${searchParams.toLowerCase()}%`],
    );
  },
  getItemById: async (db: SQLiteDatabase, productId: string) => {
    return db.getFirstAsync<{
      name: string;
      brand: string;
      serving_size: number;
      calories: number;
      protein: number;
      fat: number;
      carbs: number;
      supermarket: string;
    }>(
      `
    SELECT
      p.name,
      p.brand,
      p.serving_size,
      ROUND(p.calories_per_100g) as calories,
      ROUND(p.proteins_per_100g) as protein,
      ROUND(p.fats_per_100g) as fat,
      ROUND(p.carbs_per_100g) as carbs,
      s.name as supermarket
    FROM products p
    JOIN supermarkets s ON p.source = s.id
    WHERE p.id = ?
    LIMIT 1;
    `,
      [`${productId}`],
    );
  },
  addMealItem: async (
    db: SQLiteDatabase,
    productId: string,
    mealType: MealType,
    grams: number,
    loggedDay: string,
  ) => {
    await db.runAsync(
      `
    INSERT INTO food_entries (
      id,
      logged_at,
      logged_day,
      meal_type,
      product_id,
      grams
    )
    VALUES (?, datetime('now'), ?, ?, ?, ?);
    `,
      [await generateId(), loggedDay, mealType, productId, grams],
    );
  },
  removeMealItem: async (db: SQLiteDatabase, itemId: string) => {
    await db.runAsync(
      `
    DELETE FROM food_entries
    WHERE id = ?;
    `,
      [itemId],
    );
  },
};
