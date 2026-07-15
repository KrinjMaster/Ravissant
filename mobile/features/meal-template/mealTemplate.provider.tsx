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
  name: string;
  brand: string;
}

export const MealTemplateProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [templateMacros, setTemplateMacros] = useState<{
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  }>({
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
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
      };

      const items = data.map((row) => {
        const weight = weightMap.get(row.id)!;

        newMacros.calories += Math.round((row.calories * weight) / 100);
        newMacros.protein += Math.round((row.protein * weight) / 100);
        newMacros.fat += Math.round((row.fat * weight) / 100);
        newMacros.carbs += Math.round((row.carbs * weight) / 100);

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
