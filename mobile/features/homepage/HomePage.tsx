import { Box } from "@/components/ui/box";
import { Divider } from "@/components/ui/divider";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { MacrosDisplay } from "@/features/homepage/MacrosDisplay";
import { MealDisplay } from "@/features/homepage/MealDisplay";
import { useMacrosSummary } from "@/hooks/useMacrosSummary";
import { useOnboard } from "@/hooks/useOnboard";
import { calculateMealCalories } from "@/utils/onboard";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { WeightDisplay } from "./WeightDisplay";

export const HomePage = ({ displayDate }: { displayDate: Date }) => {
  const { userData } = useOnboard();
  const { data: macrosData, isLoading } = useMacrosSummary(
    displayDate.toISOString(),
  );
  const insets = useSafeAreaInsets();
  const caloriesByMeal = calculateMealCalories(
    userData.nutritionPlan?.calories ?? 0,
  );

  if (isLoading || !macrosData) {
    return (
      <VStack
        className="w-screen h-screen bg-secondary-0 pt-16 pb-16 px-2"
        space="xl"
      >
        <SkeletonText className="w-[60%] h-8 mx-auto" />
        <VStack className="w-full h-[60%] border justify-between mt-2.5">
          <Skeleton className="w-full h-[75%] px-3 py-2 rounded-xl" />
          <Skeleton className="w-full h-[20%] px-3 py-2 rounded-xl" />
        </VStack>
        <Skeleton className="w-full h-[9%] px-3 py-2 rounded-xl" />
        <Skeleton className="w-full h-[9%] px-3 py-2 rounded-xl" />
        <Skeleton className="w-full h-[9%] px-3 py-2 rounded-xl" />
      </VStack>
    );
  }

  return (
    <ScrollView className="flex-1 h-full">
      <VStack
        className="h-full bg-secondary-0 px-3 items-center"
        space="md"
        style={{ paddingTop: insets.top, paddingBottom: 3 * insets.bottom }}
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
        <Divider className="my-0.5 w-[85%] h-0.5" />
        <WeightDisplay />
      </VStack>
    </ScrollView>
  );
};
