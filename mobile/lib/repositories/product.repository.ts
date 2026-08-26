import { MealType } from "@/types/products";
import { SQLiteDatabase } from "expo-sqlite";
import { generateId } from "@/utils/product";
import { Product } from "@/features/meal-template/mealTemplate.context";
import { SearchSource } from "@/app/modal/add-food";

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
          ROUND(COALESCE(SUM(p.calories_per_100g * f.grams / 10000), 0)) AS calories,
          ROUND(COALESCE(SUM(p.proteins_per_100g * f.grams / 10000), 0)) AS protein,
          ROUND(COALESCE(SUM(p.fats_per_100g * f.grams / 10000), 0)) AS fat,
          ROUND(COALESCE(SUM(p.carbs_per_100g * f.grams / 10000), 0)) AS carbs
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
        SELECT ROUND(COALESCE(SUM(p.calories_per_100g * f.grams / 10000), 0)) AS calories,
          ROUND(COALESCE(SUM(p.proteins_per_100g * f.grams / 10000), 0)) AS protein,
          ROUND(COALESCE(SUM(p.fats_per_100g * f.grams / 10000), 0)) AS fat,
          ROUND(COALESCE(SUM(p.carbs_per_100g * f.grams / 10000), 0)) AS carbs
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
          ROUND(p.calories_per_100g * f.grams / 10000)  AS calories,
          ROUND(p.proteins_per_100g * f.grams / 10000) AS protein,
          ROUND(p.fats_per_100g * f.grams / 10000) AS fat,
          ROUND(p.carbs_per_100g * f.grams / 10000) AS carbs
        FROM food_entries f
        JOIN products p ON p.id = f.product_id
        WHERE DATE(f.logged_day) = ?
          AND f.meal_type = ?
        ORDER BY f.logged_at DESC
      `,
      [day, mealType],
    );
  },
  getItemsByName: async (
    db: SQLiteDatabase,
    searchParams: string,
    source: SearchSource,
    favoritesOnly: boolean,
  ) => {
    const search = `%${searchParams.toLowerCase()}%`;

    if (source === "recipes") {
      return db.getAllAsync<{
        id: string;
        name: string;
        type: "recipes";
      }>(
        `
          SELECT
            m.id,
            m.name,
            'recipes' AS type
          FROM meal_templates m
          ${
            favoritesOnly
              ? "JOIN favorite_meal_templates f ON f.meal_template_id = m.id"
              : ""
          }
          WHERE m.search_text LIKE ?
          ORDER BY m.name
          LIMIT 20
        `,
        [search],
      );
    }

    return db.getAllAsync<{
      id: string;
      name: string;
      type: "products";
      brand: string | null;
      weight: number;
      unit: string;
      calories: number;
    }>(
      `
        SELECT
          p.id,
          p.name,
          'products' AS type,
          p.brand,
          p.weight,
          p.unit,
          p.calories_per_100g / 100 AS calories
        FROM products p
        ${favoritesOnly ? "JOIN favorite_products f ON f.product_id = p.id" : ""}
        WHERE p.search_text LIKE ?
          ORDER BY p.name
        LIMIT 20
      `,
      [search],
    );
  },
  getItemById: async (db: SQLiteDatabase, productId: string) => {
    const result = await db.getFirstAsync<{
      name: string;
      brand: string | null;
      ingredients: string | null;
      allergens: string | null;
      weight: number;
      unit: string;
      calories: number;
      protein: number;
      fat: number;
      carbs: number;
      saturated_fat: number;
      unsaturated_fat: number;
      omega3_fat: number;
      omega6_fat: number;
      trans_fat: number;
      cholesterol: number;
      sugars: number;
      fiber: number;
      salt: number;
      sodium: number;
      store: string | null;
      isFavorite: number;
    }>(
      ` 
        SELECT 
          p.name,
          p.brand,
          p.ingredients,
          p.allergens,
          p.weight,
          p.unit,
          p.calories_per_100g / 100 AS calories,
          p.proteins_per_100g / 100 AS protein,
          p.fats_per_100g / 100 AS fat,
          p.carbs_per_100g / 100 AS carbs,
          p.saturated_fat_per_100g / 100 AS saturated_fat,
          p.unsaturated_fat_per_100g / 100 AS unsaturated_fat,
          p.omega3_fat_per_100g / 100 AS omega3_fat,
          p.omega6_fat_per_100g / 100 AS omega6_fat,
          p.trans_fat_per_100g / 100 AS trans_fat,
          p.cholesterol_per_100g / 100 AS cholesterol,
          p.sugars_per_100g / 100 AS sugars,
          p.fiber_per_100g / 100 AS fiber,
          p.salt_per_100g / 100 AS salt,
          p.sodium_per_100g / 100 AS sodium,
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
          p.calories_per_100g / 100 AS calories
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
      unit: string;
      calories: number;
    }>(
      ` 
        SELECT p.id,
          p.name,
          p.brand,
          p.weight,
          p.unit,
          p.calories_per_100g / 100 AS calories
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
    return db
      .getAllAsync<{
        id: string;
        name: string;
        productCount: number;
        calories: number;
        isFavorite: number;
      }>(
        `
        SELECT
          m.id,
          m.name,
          COUNT(mti.product_id) AS productCount,
          CAST(
            COALESCE(
              SUM(
                p.calories_per_100g * mti.grams / 10000.0
              ),
              0
            ) AS INTEGER
          ) AS calories,
          CASE
            WHEN f.meal_template_id IS NOT NULL THEN 1
            ELSE 0
          END AS isFavorite
        FROM meal_templates m
        LEFT JOIN meal_template_items mti
          ON mti.meal_template_id = m.id
        LEFT JOIN products p
          ON p.id = mti.product_id
        LEFT JOIN favorite_meal_templates f
          ON f.meal_template_id = m.id
        WHERE m.search_text LIKE ?
        GROUP BY
          m.id,
          m.name,
          f.meal_template_id
        ORDER BY m.name
        LIMIT 10
      `,
        [`%${searchParams.toLowerCase()}%`],
      )
      .then((rows) =>
        rows.map((row) => ({
          ...row,
          isFavorite: !!row.isFavorite,
        })),
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
      saturated_fat: number;
      unsaturated_fat: number;
      omega3_fat: number;
      omega6_fat: number;
      trans_fat: number;
      cholesterol: number;
      sugars: number;
      fiber: number;
      salt: number;
      sodium: number;
      weight: number;
      unit: string;
    }>(
      ` 
        SELECT p.id,
          p.name,
          p.brand,
          p.calories_per_100g / 100 AS calories,
          p.proteins_per_100g / 100 AS protein,
          p.fats_per_100g / 100 AS fat,
          p.carbs_per_100g / 100 AS carbs,
          p.saturated_fat_per_100g / 100 AS saturated_fat,
          p.unsaturated_fat_per_100g / 100 AS unsaturated_fat,
          p.omega3_fat_per_100g / 100 AS omega3_fat,
          p.omega6_fat_per_100g / 100 AS omega6_fat,
          p.trans_fat_per_100g / 100 AS trans_fat,
          p.cholesterol_per_100g / 100 AS cholesterol,
          p.sugars_per_100g / 100 AS sugars,
          p.fiber_per_100g / 100 AS fiber,
          p.salt_per_100g / 100 AS salt,
          p.sodium_per_100g / 100 AS sodium,
          m.grams AS weight,
          p.unit
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
      unit: string;
      name: string;
      brand: string | null;
      calories: number;
      protein: number;
      fat: number;
      carbs: number;
      saturated_fat: number;
      unsaturated_fat: number;
      omega3_fat: number;
      omega6_fat: number;
      trans_fat: number;
      cholesterol: number;
      sugars: number;
      fiber: number;
      salt: number;
      sodium: number;
    }>(
      ` 
        SELECT 
          p.id,
          p.unit,
          p.name,
          p.brand,
          p.calories_per_100g / 100 AS calories,
          p.proteins_per_100g / 100 AS protein,
          p.fats_per_100g / 100 AS fat,
          p.carbs_per_100g / 100 AS carbs,
          p.saturated_fat_per_100g / 100 AS saturated_fat,
          p.unsaturated_fat_per_100g / 100 AS unsaturated_fat,
          p.omega3_fat_per_100g / 100 AS omega3_fat,
          p.omega6_fat_per_100g / 100 AS omega6_fat,
          p.trans_fat_per_100g / 100 AS trans_fat,
          p.cholesterol_per_100g / 100 AS cholesterol,
          p.sugars_per_100g / 100 AS sugars,
          p.fiber_per_100g / 100 AS fiber,
          p.salt_per_100g / 100 AS salt,
          p.sodium_per_100g / 100 AS sodium
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
  addFavoriteMealTemplate: async (db: SQLiteDatabase, templateId: string) => {
    await db.runAsync(
      `INSERT OR IGNORE INTO favorite_meal_templates (meal_template_id) VALUES (?)`,
      [templateId],
    );
  },
  removeFavoriteMealTemplate: async (
    db: SQLiteDatabase,
    templateId: string,
  ) => {
    await db.runAsync(
      `DELETE FROM favorite_meal_templates WHERE meal_template_id = ?`,
      [templateId],
    );
  },
};
