import { ReactNode, useEffect, useState } from "react";
import { MealTemplateContext, Product } from "./mealTemplate.context";
import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product.service";
import { SQLiteDatabase, useSQLiteContext } from "expo-sqlite";

export interface Item {
  weight: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  id: string;
  unit: string;
  name: string;
  brand: string | null;
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
}

export const MealTemplateProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [templateMacros, setTemplateMacros] = useState<{
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
  }>({
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
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
  });
  const [displayData, setDisplayData] = useState<Item[]>([]);
  const db = useSQLiteContext();

  const { data, refetch } = useQuery({
    queryKey: ["product-template-items"],
    queryFn: () => {
      if (products.length !== 0) {
        return productService.getWeightModifiedItem(db, products);
      }

      return null;
    },
    placeholderData: (previousData) => previousData,
  });

  const clearData = () => {
    setDisplayData([]);
    setTemplateMacros({
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
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
    });
    setProducts([]);
  };

  useEffect(() => {
    async function ref() {
      await refetch();
    }

    ref();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length]);

  useEffect(() => {
    if (data) {
      const weightMap = new Map(products.map((p) => [p.productId, p.weight]));
      const newMacros = {
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
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

      const items = data.map((row) => {
        const weight = weightMap.get(row.id)!;

        newMacros.calories += Math.round((row.calories * weight) / 100);
        newMacros.protein += Math.round((row.protein * weight) / 100);
        newMacros.fat += Math.round((row.fat * weight) / 100);
        newMacros.carbs += Math.round((row.carbs * weight) / 100);

        newMacros.saturated_fat += Math.round(
          (row.saturated_fat * weight) / 100,
        );
        newMacros.unsaturated_fat += Math.round(
          (row.unsaturated_fat * weight) / 100,
        );
        newMacros.omega3_fat += Math.round((row.omega3_fat * weight) / 100);
        newMacros.omega6_fat += Math.round((row.omega6_fat * weight) / 100);
        newMacros.trans_fat += Math.round((row.trans_fat * weight) / 100);
        newMacros.cholesterol += Math.round((row.cholesterol * weight) / 100);
        newMacros.sugars += Math.round((row.sugars * weight) / 100);
        newMacros.fiber += Math.round((row.fiber * weight) / 100);
        newMacros.salt += Math.round((row.salt * weight) / 100);
        newMacros.sodium += Math.round((row.sodium * weight) / 100);

        return {
          ...row,
          weight,
          calories: Math.round((row.calories * weight) / 100),
          protein: Math.round((row.protein * weight) / 100),
          fat: Math.round((row.fat * weight) / 100),
          carbs: Math.round((row.carbs * weight) / 100),
        };
      });

      setTemplateMacros(newMacros);
      setDisplayData(items);
    } else {
      setDisplayData([]);
      setTemplateMacros({
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
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
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const addTemplateItem = (productId: string, weight: number) => {
    if (products.filter((val) => val.productId === productId).length === 0) {
      setProducts((prev) => [
        ...prev,
        { productId: productId, weight: weight },
      ]);
    }
  };

  const removeTemplateItem = (productId: string) => {
    setProducts((prev) => prev.filter((val) => val.productId !== productId));
  };

  const finishMealTemplate = async (
    db: SQLiteDatabase,
    templateName: string,
  ) => {
    await productService.addMealTemplate(db, templateName, products);
    clearData();
  };

  return (
    <MealTemplateContext.Provider
      value={{
        finishMealTemplate,
        products,
        addTemplateItem,
        removeTemplateItem,
        displayData: displayData,
        macrosData: templateMacros,
      }}
    >
      {children}
    </MealTemplateContext.Provider>
  );
};
