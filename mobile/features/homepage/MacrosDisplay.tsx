import { Card } from "@/components/ui/card";
import { CaloriesDisplay } from "@/components/ui/custom/caloriesDisplay";
import { HStack } from "@/components/ui/hstack";
import { Progress, ProgressFilledTrack } from "@/components/ui/progress";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useOnboard } from "@/hooks/useOnboard";
import { useEffect } from "react";
import { Dimensions } from "react-native";
import {
  createAnimatedComponent,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaFrame } from "react-native-safe-area-context";

interface Prop {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

const AnimatedProgress = createAnimatedComponent(ProgressFilledTrack);

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

  const animatedProteinValue = useSharedValue(0);
  const animatedFatValue = useSharedValue(0);
  const animatedCarbsValue = useSharedValue(0);

  const animatedProteinStyle = useAnimatedStyle(() => ({
    width: `${animatedProteinValue.value}%`,
  }));
  const animatedFatStyle = useAnimatedStyle(() => ({
    width: `${animatedFatValue.value}%`,
  }));
  const animatedCarbsStyle = useAnimatedStyle(() => ({
    width: `${animatedCarbsValue.value}%`,
  }));

  useEffect(() => {
    animatedProteinValue.value = withTiming((protein / proteinGoal) * 100, {
      duration: 800,
      easing: Easing.inOut(Easing.cubic),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protein]);

  useEffect(() => {
    animatedFatValue.value = withTiming((fat / fatGoal) * 100, {
      duration: 800,
      easing: Easing.inOut(Easing.cubic),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fat]);

  useEffect(() => {
    animatedCarbsValue.value = withTiming((carbs / carbsGoal) * 100, {
      duration: 800,
      easing: Easing.inOut(Easing.cubic),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carbs]);

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
              <AnimatedProgress
                className="bg-tertiary-600"
                style={animatedProteinStyle}
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
              <AnimatedProgress
                className="bg-tertiary-600"
                style={animatedFatStyle}
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
              <AnimatedProgress
                className="bg-tertiary-600"
                style={animatedCarbsStyle}
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
