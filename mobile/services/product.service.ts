import { SearchSource } from "@/app/modal/add-food";
import { queryClient } from "@/constants/query";
import { Product } from "@/features/meal-template/mealTemplate.context";
import { productRepository } from "@/lib/repositories/product.repository";
import { MealType } from "@/types/products";
import { generateId } from "@/utils/product";
import { SQLiteDatabase } from "expo-sqlite";

export const productService = {
  getSummary: async (db: SQLiteDatabase, day: string) =>
    await productRepository.getSummary(db, day),
  getMealMacros: async (db: SQLiteDatabase, day: string, mealType: MealType) =>
    await productRepository.getMealMacros(db, day, mealType),
  getMealItems: async (db: SQLiteDatabase, day: string, mealType: MealType) =>
    await productRepository.getMealItems(db, day, mealType),
  searchItems: async (
    db: SQLiteDatabase,
    searchParams: string,
    source: SearchSource,
    favoritesOnly: boolean,
    limit: number,
    offset: number,
  ) =>
    productRepository.getItemsByName(
      db,
      searchParams,
      source,
      favoritesOnly,
      limit,
      offset,
    ),
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
      queryClient.invalidateQueries({
        queryKey: ["recent-items"],
      }),
    ]);
  },
  addMealTemplateItem: async (
    db: SQLiteDatabase,
    templateId: string,
    mealType: MealType,
    loggedDay: string,
  ) => {
    await productRepository.addMealTemplateItemToMeal(
      db,
      templateId,
      mealType,
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
      queryClient.invalidateQueries({
        queryKey: ["recent-items"],
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
      queryClient.invalidateQueries({
        queryKey: ["recent-items"],
      }),
    ]);
  },
  addFavoriteItem: async (db: SQLiteDatabase, productId: string) => {
    await productRepository.addFavoriteProduct(db, productId);

    await queryClient.invalidateQueries({
      queryKey: ["meal-by-id", productId],
    });

    await queryClient.invalidateQueries({
      queryKey: ["product-favorite-items"],
    });
  },
  removeFavoriteItem: async (db: SQLiteDatabase, productId: string) => {
    await productRepository.removeFavoriteProduct(db, productId);

    await queryClient.invalidateQueries({
      queryKey: ["meal-by-id", productId],
    });

    await queryClient.invalidateQueries({
      queryKey: ["product-favorite-items"],
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

    await queryClient.invalidateQueries({
      queryKey: ["weight-history"],
    });
  },
  searchFavoriteItems: async (db: SQLiteDatabase, params: string) =>
    await productRepository.getFavoriteItemsByName(db, params),
  searchMealTemplates: async (db: SQLiteDatabase, params: string) =>
    await productRepository.getMealTemplates(db, params),
  getWeightModifiedItem: async (db: SQLiteDatabase, ids: Product[]) =>
    await productRepository.getWeightModifiedItem(db, ids),
  addMealTemplate: async (
    db: SQLiteDatabase,
    templateName: string,
    products: Product[],
  ) => {
    const templateId = await generateId();

    await productRepository.addMealTemplate(db, templateId, templateName);

    products.forEach(async ({ productId, weight }) => {
      await productRepository.addMealTemplateItem(
        db,
        templateId,
        productId,
        weight,
      );
    });

    await queryClient.invalidateQueries({
      queryKey: ["product-meal-templates"],
    });
  },
  getMealTemplate: async (db: SQLiteDatabase, templateId: string) => {
    const template = await productRepository.getMealTemplate(db, templateId);

    if (!template) {
      return null;
    }

    const templateMacros = {
      calories: 0,
      carbs: 0,
      protein: 0,
      fat: 0,
      saturated_fat: 0,
      unsaturated_fat: 0,
      omega3_fat: 0,
      omega6_fat: 0,
      trans_fat: 0,
      cholesterol: 0,
      sugars: 0,
      fiber: 0,
      salt: 0,
      sodium: 0,
    };

    const templateItems = await productRepository
      .getMealTemplateItems(db, templateId)
      .then((items) =>
        items.map((item) => {
          const factor = item.weight / 100;

          const calculated = {
            ...item,
            calories: Math.round(item.calories * factor),
            protein: Math.round(item.protein * factor),
            fat: Math.round(item.fat * factor),
            carbs: Math.round(item.carbs * factor),
            saturated_fat:
              item.saturated_fat == null
                ? null
                : Math.round(item.saturated_fat * factor),
            unsaturated_fat:
              item.unsaturated_fat == null
                ? null
                : Math.round(item.unsaturated_fat * factor),
            omega3_fat:
              item.omega3_fat == null
                ? null
                : Math.round(item.omega3_fat * factor),
            omega6_fat:
              item.omega6_fat == null
                ? null
                : Math.round(item.omega6_fat * factor),
            trans_fat:
              item.trans_fat == null
                ? null
                : Math.round(item.trans_fat * factor),
            cholesterol:
              item.cholesterol == null
                ? null
                : Math.round(item.cholesterol * factor),
            sugars:
              item.sugars == null ? null : Math.round(item.sugars * factor),
            fiber: item.fiber == null ? null : Math.round(item.fiber * factor),
            salt: item.salt == null ? null : Math.round(item.salt * factor),
            sodium:
              item.sodium == null ? null : Math.round(item.sodium * factor),
          };

          templateMacros.calories += calculated.calories;
          templateMacros.protein += calculated.protein;
          templateMacros.fat += calculated.fat;
          templateMacros.carbs += calculated.carbs;

          if (calculated.saturated_fat != null) {
            templateMacros.saturated_fat += calculated.saturated_fat;
          }

          if (calculated.unsaturated_fat != null) {
            templateMacros.unsaturated_fat += calculated.unsaturated_fat;
          }

          if (calculated.omega3_fat != null) {
            templateMacros.omega3_fat += calculated.omega3_fat;
          }

          if (calculated.omega6_fat != null) {
            templateMacros.omega6_fat += calculated.omega6_fat;
          }

          if (calculated.trans_fat != null) {
            templateMacros.trans_fat += calculated.trans_fat;
          }

          if (calculated.cholesterol != null) {
            templateMacros.cholesterol += calculated.cholesterol;
          }

          if (calculated.sugars != null) {
            templateMacros.sugars += calculated.sugars;
          }

          if (calculated.fiber != null) {
            templateMacros.fiber += calculated.fiber;
          }

          if (calculated.salt != null) {
            templateMacros.salt += calculated.salt;
          }

          if (calculated.sodium != null) {
            templateMacros.sodium += calculated.sodium;
          }

          return calculated;
        }),
      );

    return {
      id: template.id,
      name: template.name,
      items: templateItems,
      ...templateMacros,
    };
  },
  removeMealTemplate: async (db: SQLiteDatabase, templateId: string) => {
    await productRepository.removeMealTemplate(db, templateId);

    await queryClient.invalidateQueries({
      queryKey: ["product-meal-templates"],
    });
  },
  getAllWeight: async (db: SQLiteDatabase) =>
    await productRepository.getAllWeight(db),

  addFavoriteTemplate: async (db: SQLiteDatabase, templateId: string) => {
    await productRepository.addFavoriteMealTemplate(db, templateId);

    await queryClient.invalidateQueries({
      queryKey: ["product-meal-templates"],
    });

    await queryClient.invalidateQueries({
      queryKey: ["search-items", "recipes", true],
    });
  },
  removeFavoriteTemplate: async (db: SQLiteDatabase, templateId: string) => {
    await productRepository.removeFavoriteMealTemplate(db, templateId);

    await queryClient.invalidateQueries({
      queryKey: ["product-meal-templates"],
    });

    await queryClient.invalidateQueries({
      queryKey: ["search-items", "recipes", true],
    });
  },
  addProduct: async (
    db: SQLiteDatabase,
    {
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
    },
  ) => {
    const productId = await productRepository.addProduct(db, {
      name,
      brand,
      category,
      weight,
      unit,
      ingredients,
      allergens,
      barcode,
      nutrition,
    });

    await queryClient.invalidateQueries({
      queryKey: ["search-items"],
    });

    return productId;
  },
  getProductByBarcode: async (db: SQLiteDatabase, barcode: string) => {
    return await productRepository.getProductByBarcode(db, barcode);
  },
};
