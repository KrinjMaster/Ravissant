import { createContext } from "react";
import { Item } from "./mealTemplate.provider";
import { SQLiteDatabase } from "expo-sqlite";

export interface Product {
  productId: string;
  weight: number;
}

interface Macros {
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
}

interface Props {
  products: Product[];
  addTemplateItem: (productId: string, weight: number) => void;
  removeTemplateItem: (productId: string) => void;
  finishMealTemplate: (
    db: SQLiteDatabase,
    templateName: string,
  ) => Promise<void>;
  macrosData: Macros;
  displayData: Item[];
}

export const MealTemplateContext = createContext<Props | null>(null);
