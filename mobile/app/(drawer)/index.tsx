import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { MacrosDisplay } from "@/features/homepage/MacrosDisplay";
import { HomePageSkeleton } from "@/features/skeletons/HomePageSkeleton";
import { useMacrosSummary } from "@/hooks/useMacrosSummary";
import { useOnboard } from "@/hooks/useOnboard";
import { MealType } from "@/types/products";
import { calculateMealCalories } from "@/utils/onboard";
import { router } from "expo-router";
import { useEffect, useState } from "react";
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

  // const openModal = (meal: MealType) => {
  //   router.push({
  //     pathname: "/modal/add-food",
  //     params: {
  //       meal: meal,
  //       date: displayDate.toISOString().substring(0, 10),
  //     },
  //   });
  // };

  if (!macrosData) {
    return <HomePageSkeleton />;
  }

  return (
    <VStack
      className="h-full bg-secondary-0 px-3 pt-[15%] items-center"
      space="md"
    >
      <Text size="3xl">
        {displayDate.toLocaleString("ru-RU", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })}
      </Text>
      <MacrosDisplay
        data={{
          ...macrosData,
          calories: 1250,
          calorieGoal: userData.nutritionPlan?.calories ?? 0,
        }}
      />
    </VStack>
  );
}
