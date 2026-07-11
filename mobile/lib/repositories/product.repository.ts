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
      productId: number;
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
    const result = await db.getFirstAsync<{
      name: string;
      brand: string;
      serving_size: number;
      calories: number;
      protein: number;
      fat: number;
      carbs: number;
      supermarket: string;
      isFavorite: number;
    }>(
      `
    SELECT
      p.name,
      p.brand,
      p.serving_size,
      ROUND(p.calories_per_100g) AS calories,
      ROUND(p.proteins_per_100g) AS protein,
      ROUND(p.fats_per_100g) AS fat,
      ROUND(p.carbs_per_100g) AS carbs,
      s.name AS supermarket,
      f.product_id AS productId,
      CASE WHEN f.product_id IS NOT NULL THEN 1 ELSE 0 END AS isFavorite
    FROM products p
    JOIN supermarkets s ON p.source = s.id
    LEFT JOIN favorite_products f ON p.id = f.product_id
    WHERE p.id = ?
    LIMIT 1;
    `,
      [`${productId}`],
    );

    if (!result) return null;

    return {
      ...result,
      isFavorite: !!result.isFavorite,
    };
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
  addFavoriteProduct: async (db: SQLiteDatabase, productId: string) => {
    await db.runAsync(
      `
    INSERT INTO favorite_products (
      product_id
    )
    VALUES (?);
    `,
      [productId],
    );
  },
  removeFavoriteProduct: async (db: SQLiteDatabase, productId: string) => {
    await db.runAsync(
      `
    DELETE FROM favorite_products 
    WHERE product_id = ?;
    `,
      [productId],
    );
  },
  getRecentItems: async (db: SQLiteDatabase) => {
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
    FROM food_entries f
    JOIN products p ON f.product_id = p.id
    GROUP BY p.id
    ORDER BY p.name
    LIMIT 5;
    `,
    );
  },
  addWeightLog: async (db: SQLiteDatabase, weight: number) => {
    await db.runAsync(
      `
    INSERT INTO weight_entries (
      id,
      logged_at,
      weight
    )
    VALUES (?, datetime('now'), ?);
    `,
      [await generateId(), weight],
    );
  },
  getRecentWeight: async (db: SQLiteDatabase) => {
    return await db.getFirstAsync<{
      weight: number;
      loggedAt: string;
    }>(`
    SELECT
      w.weight,
      w.logged_at as loggedAt
    FROM weight_entries w
    ORDER BY w.logged_at DESC
    LIMIT 1;
    `);
  },
  changeDayWeight: async (db: SQLiteDatabase, day: string, weight: number) => {
    await db.runAsync(
      `DELETE FROM weight_entries 
       WHERE date(logged_at) = date(?);`,
      [day],
    );

    const timestamp = `${day}T12:00:00.000Z`;

    await db.runAsync(
      `INSERT INTO weight_entries (weight, logged_at) 
       VALUES (?, ?);`,
      [weight, timestamp],
    );
  },
};
