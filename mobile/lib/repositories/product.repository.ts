import { MealType } from "@/types/products";
import { SQLiteDatabase } from "expo-sqlite";

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
      COALESCE(SUM(p.calories_per_100g * f.grams / 100),0) calories,
      COALESCE(SUM(p.proteins_per_100g * f.grams / 100),0) protein,
      COALESCE(SUM(p.fats_per_100g * f.grams / 100),0) fat,
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
      protein: number;
      fat: number;
      carbs: number;
    }>(
      `
    SELECT
      COALESCE(SUM(p.calories_per_100g * f.grams / 100), 0) AS calories,
      COALESCE(SUM(p.proteins_per_100g * f.grams / 100), 0) AS protein,
      COALESCE(SUM(p.fats_per_100g * f.grams / 100), 0) AS fat,
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
      protein: number;
      fat: number;
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
    WHERE (COALESCE(p.brand, '') || ' ' || p.name) LIKE ?
    ORDER BY p.name
    LIMIT 10;
    `,
      [`%${searchParams}%`],
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
      p.calories_per_100g as calories,
      p.proteins_per_100g as protein,
      p.fats_per_100g as fat,
      p.carbs_per_100g as carbs,
      s.name as supermarket
    FROM products p
    JOIN supermarkets s ON p.source = s.id
    WHERE p.id = ?
    LIMIT 1;
    `,
      [`${productId}`],
    );
  },
};
