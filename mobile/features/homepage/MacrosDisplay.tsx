import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { HStack } from "@/components/ui/hstack";
import { Progress, ProgressFilledTrack } from "@/components/ui/progress";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useOnboard } from "@/hooks/useOnboard";
import { useEffect, useState } from "react";
import {
  createAnimatedComponent,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface Prop {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

const AnimatedBox = createAnimatedComponent(Box);
const AnimatedProgress = createAnimatedComponent(ProgressFilledTrack);

export const MacrosDisplay = ({ data }: { data: Prop }) => {
  const { userData } = useOnboard();
  const [cardWidth, setCardWidth] = useState(0);
  const { calories, protein, fat, carbs } = data;

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

  const goalValue = `/ ${calorieGoal} ккал`;
  const progress = Math.min(1, calories / (calorieGoal || 1)) || 0;

  const animatedCaloriesValue = useSharedValue(0);
  const animatedProteinValue = useSharedValue(0);
  const animatedFatValue = useSharedValue(0);
  const animatedCarbsValue = useSharedValue(0);

  const animatedBoxStyle = useAnimatedStyle(() => ({
    width: `${animatedCaloriesValue.value}%`,
  }));
  const animatedGoalBoxStyle = useAnimatedStyle(() => ({
    width: Math.max(0, cardWidth * (animatedCaloriesValue.value / 100) - 18),
  }));
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
    animatedCaloriesValue.value = withTiming(progress * 100, {
      duration: 1200,
      easing: Easing.inOut(Easing.cubic),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

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
    console.log(carbs);
    animatedCarbsValue.value = withTiming((carbs / carbsGoal) * 100, {
      duration: 800,
      easing: Easing.inOut(Easing.cubic),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carbs]);

  return (
    <VStack className="w-full h-[50%] justify-between">
      <Card
        className="w-full h-[75%] p-0 relative justify-center items-center overflow-hidden"
        variant="half-rounded"
        onLayout={(e) => {
          setCardWidth(e.nativeEvent.layout.width);
        }}
      >
        {/* Progress bar */}
        <AnimatedBox
          className="absolute left-0 top-0 bottom-0 bg-primary-400 rounded-r-2xl"
          style={animatedBoxStyle}
        />
        {/* Calories text */}
        {cardWidth > 0 && (
          <Box
            style={{ width: cardWidth }}
            className="absolute top-0 bottom-0 justify-center items-center"
          >
            {/* Background Layer (Static) */}
            <Box
              style={{ width: cardWidth }}
              className="items-center justify-center"
            >
              <Text
                size="9xl"
                className="text-secondary-400 text-center scale-y-150 subpixel-antialiased"
              >
                {calories}
              </Text>
            </Box>
            {/* Foreground Layer */}
            <AnimatedBox
              className="absolute left-0 top-0 bottom-0 overflow-hidden justify-center"
              style={animatedBoxStyle}
            >
              <Box
                style={{ width: cardWidth }}
                className="items-center justify-center"
              >
                <Text
                  size="9xl"
                  className={`${calories > calorieGoal ? "text-error-500" : "text-primary-300"} text-center scale-y-150 subpixel-antialiased`}
                >
                  {calories}
                </Text>
              </Box>
            </AnimatedBox>
          </Box>
        )}
        {/* Calorie Goal Text */}
        {cardWidth > 0 && (
          <Box
            className="absolute right-4 bottom-4 h-8 justify-center items-end"
            style={{ width: cardWidth - 32 }}
          >
            {/* Background Layer (Static) */}
            <Box
              style={{ width: cardWidth - 32 }}
              className="items-end justify-center"
            >
              <Text size="2xl" className="text-secondary-700 text-right">
                {goalValue}
              </Text>
            </Box>
            {/* Foreground Layer */}
            <AnimatedBox
              className="absolute left-0 top-0 bottom-0 overflow-hidden justify-center"
              style={animatedGoalBoxStyle}
            >
              <Box
                style={{ width: cardWidth - 32 }}
                className="items-end justify-center"
              >
                <Text size="2xl" className="text-white text-right">
                  {goalValue}
                </Text>
              </Box>
            </AnimatedBox>
          </Box>
        )}
      </Card>
      <Card variant="half-rounded" className="w-full h-[22%] p-1.5 py-4">
        <HStack className="justify-between">
          <VStack className="w-[30%] items-center h-full px-0.5" space="sm">
            <Text size="xl">Белки</Text>
            <Progress
              orientation="horizontal"
              size="md"
              className="w-full mt-auto"
            >
              <AnimatedProgress
                className="bg-tertiary-600"
                style={animatedProteinStyle}
              />
            </Progress>
            <Text className="text-secondary-800" size="sm">
              {Math.round(protein)} / {proteinGoal} г.
            </Text>
          </VStack>
          <VStack className="w-[30%] items-center h-full px-0.5" space="sm">
            <Text size="xl">Жиры</Text>
            <Progress
              orientation="horizontal"
              size="md"
              className="w-full mt-auto"
            >
              <AnimatedProgress
                className="bg-tertiary-600"
                style={animatedFatStyle}
              />
            </Progress>
            <Text className="text-secondary-800" size="sm">
              {Math.round(fat)} / {fatGoal} г.
            </Text>
          </VStack>
          <VStack className="w-[30%] items-center h-full px-0.5" space="sm">
            <Text size="xl">Углеводы</Text>
            <Progress
              orientation="horizontal"
              size="md"
              className="w-full mt-auto"
            >
              <AnimatedProgress
                className="bg-tertiary-600"
                style={animatedCarbsStyle}
              />
            </Progress>
            <Text className="text-secondary-800" size="sm">
              {Math.round(carbs)} / {carbsGoal} г.
            </Text>
          </VStack>
        </HStack>
      </Card>
    </VStack>
  );
};
