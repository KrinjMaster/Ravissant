import { Card } from "@/components/ui/card";
import { CaloriesDisplay } from "@/components/ui/custom/caloriesDisplay";
import { HStack } from "@/components/ui/hstack";
import { Progress } from "@/components/ui/progress";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useOnboard } from "@/hooks/useOnboard";
import { useEffect, useMemo } from "react";
import { Animated } from "react-native";
import { useSafeAreaFrame } from "react-native-safe-area-context";

interface Prop {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export const MacrosDisplay = ({ data }: { data: Prop }) => {
  const { userData } = useOnboard();
  const { calories, protein, fat, carbs } = data;
  const { height: visibleHeight } = useSafeAreaFrame();

  const {
    calories: calorieGoal,
    protein: proteinGoal,
    carbs: carbsGoal,
    fat: fatGoal,
  } = userData.nutritionPlan ?? {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };

  const proteinProgress = useMemo(() => new Animated.Value(0), []);
  const fatProgress = useMemo(() => new Animated.Value(0), []);
  const carbsProgress = useMemo(() => new Animated.Value(0), []);

  const animateProgress = (value: Animated.Value, amount: number) => {
    Animated.timing(value, {
      toValue: Math.min(100, Math.max(0, amount)),
      duration: 800,
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    animateProgress(proteinProgress, proteinGoal ? (protein / proteinGoal) * 100 : 0);
  }, [protein, proteinGoal, proteinProgress]);

  useEffect(() => {
    animateProgress(fatProgress, fatGoal ? (fat / fatGoal) * 100 : 0);
  }, [fat, fatGoal, fatProgress]);

  useEffect(() => {
    animateProgress(carbsProgress, carbsGoal ? (carbs / carbsGoal) * 100 : 0);
  }, [carbs, carbsGoal, carbsProgress]);

  return (
    <VStack
      className="w-full justify-between"
      style={{ height: visibleHeight / 2 }}
    >
      <CaloriesDisplay
        calories={calories}
        calorieGoal={calorieGoal}
        className="w-full h-[75%]"
      />
      <Card variant="half-rounded" className="w-full h-[20%] px-3 py-2">
        <HStack className="justify-between pt-2">
          <VStack className="w-[30%] items-center h-full px-0.5" space="sm">
            <Text size="lg">Белки</Text>
            <Progress
              orientation="horizontal"
              size="sm"
              className="w-[90%] mt-auto overflow-hidden"
            >
              <Animated.View
                className="h-2 bg-tertiary-600 rounded-full"
                style={{
                  width: proteinProgress.interpolate({
                    inputRange: [0, 100],
                    outputRange: ["0%", "100%"],
                  }),
                }}
              />
            </Progress>
            <Text className="text-secondary-800" size="sm">
              {protein} / {proteinGoal} г.
            </Text>
          </VStack>
          <VStack className="w-[30%] items-center h-full px-0.5" space="sm">
            <Text size="lg">Жиры</Text>
            <Progress
              orientation="horizontal"
              size="sm"
              className="w-[90%] mt-auto overflow-hidden"
            >
              <Animated.View
                className="h-2 bg-tertiary-600 rounded-full"
                style={{
                  width: fatProgress.interpolate({
                    inputRange: [0, 100],
                    outputRange: ["0%", "100%"],
                  }),
                }}
              />
            </Progress>
            <Text className="text-secondary-800" size="sm">
              {fat} / {fatGoal} г.
            </Text>
          </VStack>
          <VStack className="w-[30%] items-center h-full px-0.5" space="sm">
            <Text size="lg">Углеводы</Text>
            <Progress
              orientation="horizontal"
              size="sm"
              className="w-[90%] mt-auto overflow-hidden"
            >
              <Animated.View
                className="h-2 bg-tertiary-600 rounded-full"
                style={{
                  width: carbsProgress.interpolate({
                    inputRange: [0, 100],
                    outputRange: ["0%", "100%"],
                  }),
                }}
              />
            </Progress>
            <Text className="text-secondary-800" size="sm">
              {carbs} / {carbsGoal} г.
            </Text>
          </VStack>
        </HStack>
      </Card>
    </VStack>
  );
};
