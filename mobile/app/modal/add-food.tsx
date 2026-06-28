import { AddFoodScreen } from "@/features/add-food/AddFoodScreen";
import { MealType } from "@/types/products";
import { useLocalSearchParams } from "expo-router";

export default function AddFoodModal() {
  const { meal, date } = useLocalSearchParams<{
    meal: MealType;
    date: string;
  }>();

  return <AddFoodScreen meal={meal} date={date} />;
}
