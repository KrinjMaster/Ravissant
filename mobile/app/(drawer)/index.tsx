import { Box } from "@/components/ui/box";
import { Divider } from "@/components/ui/divider";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { MacrosDisplay } from "@/features/homepage/MacrosDisplay";
import { MealDisplay } from "@/features/homepage/MealDisplay";
import { useMacrosSummary } from "@/hooks/useMacrosSummary";
import { useOnboard } from "@/hooks/useOnboard";
import { calculateMealCalories } from "@/utils/onboard";
import { useState } from "react";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

export default function Index() {
  const [displayDate] = useState(new Date(Date.now()));
  const { userData } = useOnboard();
  const { data: macrosData, isLoading } = useMacrosSummary(
    displayDate.toISOString(),
  );
  const caloriesByMeal = calculateMealCalories(
    userData.nutritionPlan?.calories ?? 0,
  );

  if (isLoading || !macrosData) {
    return (
      <VStack className="w-screen h-screen bg-secondary-0 pt-16 pb-16 px-2">
        <Text size="6xl">Loading...</Text>
      </VStack>
    );
  }

  return (
    <VStack
      className="h-full bg-secondary-0 px-3 pt-[15%] items-center"
      space="md"
    >
      <Box className="absolute -top-48 -right-48 w-[30rem] h-[45rem]">
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          <Defs>
            <RadialGradient
              id="glow"
              cx="50%"
              cy="50%"
              rx="50%"
              ry="50%"
              fx="50%"
              fy="50%"
            >
              <Stop offset="0%" stopColor="#00033D" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#00067A" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100" height="100" fill="url(#glow)" />
        </Svg>
      </Box>
      <Box className="absolute bottom-16 -left-72 w-[30rem] h-[45rem]">
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          <Defs>
            <RadialGradient
              id="glow"
              cx="50%"
              cy="50%"
              rx="50%"
              ry="50%"
              fx="50%"
              fy="50%"
            >
              <Stop offset="0%" stopColor="#00033D" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#00067A" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100" height="100" fill="url(#glow)" />
        </Svg>
      </Box>
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
        }}
      />
      <Divider className="my-0.5 w-[85%] h-0.5" />
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
