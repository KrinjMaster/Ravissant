import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { MacrosDisplay } from "@/features/homepage/MacrosDisplay";
import { MealDisplay } from "@/features/homepage/MealDisplay";
import { HomePageSkeleton } from "@/features/skeletons/HomePageSkeleton";
import { useMacrosSummary } from "@/hooks/useMacrosSummary";
import { useOnboard } from "@/hooks/useOnboard";
import { calculateMealCalories } from "@/utils/onboard";
import { useState } from "react";

export default function Index() {
  const [displayDate] = useState(new Date(Date.now()));
  const { userData } = useOnboard();
  const { data: macrosData, isLoading: isMacrosLoading } = useMacrosSummary(
    displayDate.toISOString(),
  );
  const caloriesByMeal = calculateMealCalories(
    userData.nutritionPlan?.calories ?? 0,
  );

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
        }}
      />
      <MealDisplay
        meal="breakfast"
        date={displayDate}
        plannedCalories={caloriesByMeal.breakfast}
      />
      <MealDisplay
        meal="lunch"
        date={displayDate}
        plannedCalories={caloriesByMeal.lunch}
      />
      <MealDisplay
        meal="dinner"
        date={displayDate}
        plannedCalories={caloriesByMeal.dinner}
      />
      <MealDisplay
        meal="snack"
        date={displayDate}
        plannedCalories={caloriesByMeal.snack}
      />
    </VStack>
  );
}
