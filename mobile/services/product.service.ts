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
  ) =>
    await productRepository.getItemsByName(
      db,
      searchParams,
      source,
      favoritesOnly,
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
        items.map((val) => {
          templateMacros.calories += Math.round(
            (val.calories * val.weight) / 100,
          );
          templateMacros.protein += Math.round(
            (val.protein * val.weight) / 100,
          );
          templateMacros.fat += Math.round((val.fat * val.weight) / 100);
          templateMacros.carbs += Math.round((val.carbs * val.weight) / 100);

          if (val.saturated_fat) {
            templateMacros.saturated_fat += Math.round(
              (val.saturated_fat * val.weight) / 100,
            );
          }

          if (val.unsaturated_fat) {
            templateMacros.unsaturated_fat += Math.round(
              (val.saturated_fat * val.weight) / 100,
            );
          }

          if (val.omega3_fat) {
            templateMacros.omega3_fat += Math.round(
              (val.omega3_fat * val.weight) / 100,
            );
          }

          if (val.omega6_fat) {
            templateMacros.omega6_fat += Math.round(
              (val.omega6_fat * val.weight) / 100,
            );
          }

          if (val.trans_fat) {
            templateMacros.trans_fat += Math.round(
              (val.trans_fat * val.weight) / 100,
            );
          }

          if (val.cholesterol) {
            templateMacros.cholesterol += Math.round(
              (val.cholesterol * val.weight) / 100,
            );
          }

          if (val.sugars) {
            templateMacros.sugars += Math.round(
              (val.sugars * val.weight) / 100,
            );
          }

          if (val.fiber) {
            templateMacros.fiber += Math.round((val.fiber * val.weight) / 100);
          }

          if (val.salt) {
            templateMacros.salt += Math.round((val.salt * val.weight) / 100);
          }

          if (val.sodium) {
            templateMacros.sodium += Math.round(
              (val.sodium * val.weight) / 100,
            );
          }

          return val;
        }),
      );

    return template
      ? {
          id: template.id,
          name: template.name,
          items: templateItems,
          ...templateMacros,
        }
      : null;
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
};
