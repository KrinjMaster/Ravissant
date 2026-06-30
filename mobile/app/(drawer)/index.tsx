import { Badge, BadgeText } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { HomePageSkeleton } from "@/features/skeletons/HomePageSkeleton";
import { useMacrosSummary } from "@/hooks/useMacrosSummary";
import { useOnboard } from "@/hooks/useOnboard";
import { MealType } from "@/types/products";
import { calculateMealCalories } from "@/utils/onboard";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

export default function Index() {
  const [displayDate] = useState(new Date(Date.now()));
  const { data: macrosData, isLoading: isMacrosLoading } = useMacrosSummary(
    displayDate.toISOString(),
  );
  const { userData } = useOnboard();
  const caloriesByMeal = calculateMealCalories(
    userData.nutritionPlan?.calories ?? 0,
  );

  // const { data: mealData1, isLoading: isMeal1Loading } = useMealInfo(
  //   displayDate.toISOString(),
  //   "breakfast",
  // );

  const openModal = (meal: MealType) => {
    router.push({
      pathname: "/modal/add-food",
      params: {
        meal: meal,
        date: displayDate.toISOString().substring(0, 10),
      },
    });
  };

  if (!macrosData) {
    return <HomePageSkeleton />;
  }

  return (
    <View className="flex-1 bg-secondary-0 p-2.5 pt-[15%]">
      <Badge variant="secondary" className="border border-white">
        <BadgeText>{displayDate.toLocaleString().substring(0, 9)}</BadgeText>
      </Badge>
      <Text>
        калории {Math.round(macrosData.calories)} /{" "}
        {userData.nutritionPlan?.calories}
      </Text>
      <Text>
        жиры {Math.round(macrosData.fat)} / {userData.nutritionPlan?.fat}
      </Text>
      <Text>
        белки {Math.round(macrosData.protein)} /{" "}
        {userData.nutritionPlan?.protein}
      </Text>
      <Text>
        углеводы {Math.round(macrosData.carbs)} /{" "}
        {userData.nutritionPlan?.carbs}
      </Text>
    </View>
  );
}
