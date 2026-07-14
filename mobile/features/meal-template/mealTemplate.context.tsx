import { createContext } from "react";
import { Item } from "./mealTemplate.provider";

export interface Product {
  productId: string;
  weight: number;
}

interface Macros {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface Props {
  products: Product[];
  addTemplateItem: (productId: string, weight: number) => void;
  removeTemplateItem: (productId: string) => void;
  macrosData: Macros;
  displayData: Item[];
}

export const MealTemplateContext = createContext<Props | null>(null);
