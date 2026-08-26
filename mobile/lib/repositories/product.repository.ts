import { MealType } from "@/types/products";
import { SQLiteDatabase } from "expo-sqlite";
import { generateId } from "@/utils/product";
import { Product } from "@/features/meal-template/mealTemplate.context";

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
          ROUND(COALESCE(SUM(p.calories_per_100g * f.grams / 100), 0)) AS calories,
          ROUND(COALESCE(SUM(p.proteins_per_100g * f.grams / 100), 0)) AS protein,
          ROUND(COALESCE(SUM(p.fats_per_100g * f.grams / 100), 0)) AS fat,
          ROUND(COALESCE(SUM(p.carbs_per_100g * f.grams / 100), 0)) AS carbs
        FROM food_entries f
        JOIN products p ON p.id = f.product_id
        WHERE DATE(f.logged_day) = ?
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
        SELECT ROUND(COALESCE(SUM(p.calories_per_100g * f.grams / 100), 0)) AS calories,
          ROUND(COALESCE(SUM(p.proteins_per_100g * f.grams / 100), 0)) AS protein,
          ROUND(COALESCE(SUM(p.fats_per_100g * f.grams / 100), 0)) AS fat,
          ROUND(COALESCE(SUM(p.carbs_per_100g * f.grams / 100), 0)) AS carbs
        FROM food_entries f
        JOIN products p ON p.id = f.product_id
        WHERE DATE(f.logged_day) = ?
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
      brand: string | null;
      fat: number;
      carbs: number;
    }>(
      ` 
        SELECT f.id,
          f.grams AS weight,
          p.id AS productId,
          p.name,
          p.brand,
          ROUND(p.calories_per_100g * f.grams / 100) AS calories,
          ROUND(p.proteins_per_100g * f.grams / 100) AS protein,
          ROUND(p.fats_per_100g * f.grams / 100) AS fat,
          ROUND(p.carbs_per_100g * f.grams / 100) AS carbs
        FROM food_entries f
        JOIN products p ON p.id = f.product_id
        WHERE DATE(f.logged_day) = ?
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
      brand: string | null;
      weight: number;
      calories: number;
    }>(
      ` 
        SELECT p.id,
          p.name,
          p.brand,
          p.weight,
          p.calories_per_100g / 100 AS calories
        FROM products p
        WHERE p.search_text LIKE ?
        ORDER BY p.name
        LIMIT 10
      `,
      [`%${searchParams.toLowerCase()}%`],
    );
  },
  getItemById: async (db: SQLiteDatabase, productId: string) => {
    const result = await db.getFirstAsync<{
      name: string;
      brand: string | null;
      weight: number;
      calories: number;
      protein: number;
      fat: number;
      carbs: number;
      store: string | null;
      isFavorite: number;
    }>(
      ` 
        SELECT p.name,
          p.brand,
          p.weight,
          p.calories_per_100g AS calories,
          p.proteins_per_100g AS protein,
          p.fats_per_100g AS fat,
          p.carbs_per_100g AS carbs,
         (SELECT GROUP_CONCAT(s.name, ', ')
        FROM product_sources ps
        JOIN stores s ON s.id = ps.store_id
        WHERE ps.product_id = p.id) AS store,
             CASE
                 WHEN f.product_id IS NOT NULL THEN 1
                 ELSE 0
             END AS isFavorite
        FROM products p
        LEFT JOIN favorite_products f ON f.product_id = p.id
        WHERE p.id = ?
        LIMIT 1
      `,
      [productId],
    );
    if (!result) {
      return null;
    }
    return { ...result, isFavorite: !!result.isFavorite };
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
        INSERT INTO food_entries (id, logged_at, logged_day, meal_type, product_id, grams)
        VALUES (?, datetime('now'), ?, ?, ?, ?)
      `,
      [await generateId(), loggedDay, mealType, productId, grams],
    );
  },
  removeMealItem: async (db: SQLiteDatabase, itemId: string) => {
    await db.runAsync(`DELETE FROM food_entries WHERE id = ?`, [itemId]);
  },
  addFavoriteProduct: async (db: SQLiteDatabase, productId: string) => {
    await db.runAsync(
      `INSERT OR IGNORE INTO favorite_products ( product_id ) VALUES (?)`,
      [productId],
    );
  },
  removeFavoriteProduct: async (db: SQLiteDatabase, productId: string) => {
    await db.runAsync(`DELETE FROM favorite_products WHERE product_id = ?`, [
      productId,
    ]);
  },
  getRecentItems: async (db: SQLiteDatabase) => {
    return db.getAllAsync<{
      id: string;
      name: string;
      brand: string | null;
      weight: number;
      calories: number;
    }>(
      ` 
        SELECT p.id,
          p.name,
          p.brand,
          p.weight,
          p.calories_per_100g AS calories
        FROM food_entries f
        JOIN products p ON f.product_id = p.id
        GROUP BY p.id
        ORDER BY MAX(f.logged_at) DESC
        LIMIT 5
      `,
    );
  },
  getFavoriteItemsByName: async (db: SQLiteDatabase, searchParams: string) => {
    return db.getAllAsync<{
      id: string;
      name: string;
      brand: string | null;
      weight: number;
      calories: number;
    }>(
      ` 
        SELECT p.id,
          p.name,
          p.brand,
          p.weight,
          p.calories_per_100g AS calories
        FROM favorite_products f
        JOIN products p ON f.product_id = p.id
        WHERE p.search_text LIKE ?
        ORDER BY p.name
        LIMIT 10
      `,
      [`%${searchParams.toLowerCase()}%`],
    );
  },
  getMealTemplates: async (db: SQLiteDatabase, searchParams: string) => {
    return db.getAllAsync<{ id: string; name: string }>(
      `SELECT m.id, m.name FROM meal_templates m WHERE m.search_text LIKE ? ORDER BY m.name LIMIT 10`,
      [`%${searchParams.toLowerCase()}%`],
    );
  },
  getMealTemplate: async (db: SQLiteDatabase, templateId: string) => {
    return db.getFirstAsync<{ id: string; name: string }>(
      `SELECT m.id, m.name FROM meal_templates m WHERE m.id = ?`,
      [templateId],
    );
  },
  getMealTemplateItems: async (db: SQLiteDatabase, templateId: string) => {
    return db.getAllAsync<{
      id: string;
      name: string;
      brand: string | null;
      calories: number;
      protein: number;
      fat: number;
      carbs: number;
      weight: number;
    }>(
      ` 
        SELECT p.id,
          p.name,
          p.brand,
          p.calories_per_100g AS calories,
          p.proteins_per_100g AS protein,
          p.fats_per_100g AS fat,
          p.carbs_per_100g AS carbs,
          m.grams AS weight
        FROM meal_template_items m
        JOIN products p ON p.id = m.product_id
        WHERE m.meal_template_id = ?
      `,
      [templateId],
    );
  },
  getWeightModifiedItem: async (db: SQLiteDatabase, products: Product[]) => {
    if (products.length === 0) {
      return [];
    }
    const placeholders = products.map(() => "?").join(",");
    return db.getAllAsync<{
      id: string;
      name: string;
      brand: string | null;
      calories: number;
      protein: number;
      fat: number;
      carbs: number;
    }>(
      ` 
        SELECT p.id,
          p.name,
          p.brand,
          p.calories_per_100g AS calories,
          p.proteins_per_100g AS protein,
          p.fats_per_100g AS fat,
          p.carbs_per_100g AS carbs
        FROM products p
        WHERE p.id IN (${placeholders})
      `,
      products.map((product) => product.productId),
    );
  },
  addMealTemplate: async (
    db: SQLiteDatabase,
    templateId: string,
    templateName: string,
  ) => {
    await db.runAsync(
      `INSERT INTO meal_templates ( id, name, search_text ) VALUES (?, ?, ?)`,
      [templateId, templateName, templateName.toLowerCase()],
    );
  },
  addMealTemplateItem: async (
    db: SQLiteDatabase,
    templateId: string,
    itemId: string,
    itemWeight: number,
  ) => {
    await db.runAsync(
      `INSERT INTO meal_template_items ( meal_template_id, product_id, grams ) VALUES (?, ?, ?)`,
      [templateId, itemId, itemWeight],
    );
  },
  removeMealTemplate: async (db: SQLiteDatabase, templateId: string) => {
    await db.runAsync(`DELETE FROM meal_templates WHERE id = ?`, [templateId]);
  },
  addWeightLog: async (db: SQLiteDatabase, weight: number) => {
    await db.runAsync(
      `INSERT INTO weight_entries ( id, logged_at, weight ) VALUES (?, datetime('now'), ?)`,
      [await generateId(), weight],
    );
  },
  getRecentWeight: async (db: SQLiteDatabase) => {
    return db.getFirstAsync<{ weight: number; loggedAt: string }>(
      `SELECT w.weight, w.logged_at AS loggedAt FROM weight_entries w ORDER BY w.logged_at DESC LIMIT 1`,
    );
  },
  changeDayWeight: async (db: SQLiteDatabase, day: string, weight: number) => {
    await db.runAsync(
      `DELETE FROM weight_entries WHERE DATE(logged_at) = DATE(?)`,
      [day],
    );
    const timestamp = `${day}T12:00:00.000Z`;
    await db.runAsync(
      `INSERT INTO weight_entries ( id, weight, logged_at ) VALUES (?, ?, ?)`,
      [await generateId(), weight, timestamp],
    );
  },
  getAllWeight: async (db: SQLiteDatabase) => {
    return db.getAllAsync<{ logged_at: string; weight: number }>(
      `SELECT w.logged_at, w.weight FROM weight_entries w`,
    );
  },
};
