import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { HStack } from "@/components/ui/hstack";
import { Progress, ProgressFilledTrack } from "@/components/ui/progress";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useOnboard } from "@/hooks/useOnboard";
import { useState } from "react";

interface Prop {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export const MacrosDisplay = ({ data }: { data: Prop }) => {
  const { userData } = useOnboard();
  const [cardWidth, setCardWidth] = useState(0);
  const { calories, protein, fat, carbs } = data;

  if (!userData.nutritionPlan) {
    return <Text>Loading...</Text>;
  }

  const {
    calories: calorieGoal,
    protein: proteinGoal,
    carbs: carbsGoal,
    fat: fatGoal,
  } = userData.nutritionPlan;
  const goalValue = `/ ${calorieGoal} ккал`;

  const progress = Math.min(1, calories / (calorieGoal || 1)) || 0;

  return (
    <VStack className="w-full h-[50%]" space="md">
      <Card
        className="w-full h-[75%] p-0 relative justify-center items-center overflow-hidden"
        variant="half-rounded"
        onLayout={(e) => {
          setCardWidth(e.nativeEvent.layout.width);
        }}
      >
        {/* Progress bar */}
        <Box
          className="absolute left-0 top-0 bottom-0 bg-primary-400 rounded-r-2xl"
          style={{ width: `${progress * 100}%` }}
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
                className="text-secondary-400 text-center scale-y-[2] subpixel-antialiased"
              >
                {calories}
              </Text>
            </Box>
            {/* Foreground Layer */}
            <Box
              className="absolute left-0 top-0 bottom-0 overflow-hidden justify-center"
              style={{ width: cardWidth * progress }}
            >
              <Box
                style={{ width: cardWidth }}
                className="items-center justify-center"
              >
                <Text
                  size="9xl"
                  className={`${calories > calorieGoal ? "text-error-500" : "text-primary-300"} text-center scale-y-[2] subpixel-antialiased`}
                >
                  {calories}
                </Text>
              </Box>
            </Box>
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
            <Box
              className="absolute left-0 top-0 bottom-0 overflow-hidden justify-center"
              style={{ width: Math.max(0, cardWidth * progress - 18) }}
            >
              <Box
                style={{ width: cardWidth - 32 }}
                className="items-end justify-center"
              >
                <Text size="2xl" className="text-white text-right">
                  {goalValue}
                </Text>
              </Box>
            </Box>
          </Box>
        )}
      </Card>
      <Card variant="half-rounded" className="w-full h-[20%] p-1.5 py-4">
        <HStack className="justify-between">
          <VStack className="w-[30%] items-center h-full px-0.5" space="sm">
            <Text size="xl">Белки</Text>
            <Progress
              value={Math.max(46, (100 * protein) / proteinGoal)}
              orientation="horizontal"
              size="md"
              className="w-full mt-auto"
            >
              <ProgressFilledTrack className="bg-tertiary-600" />
            </Progress>
            <Text className="text-secondary-800" size="sm">
              {protein} / {proteinGoal} г.
            </Text>
          </VStack>
          <VStack className="w-[30%] items-center h-full px-0.5" space="sm">
            <Text size="xl">Жиры</Text>
            <Progress
              value={Math.max(90, (100 * fat) / fatGoal)}
              orientation="horizontal"
              size="md"
              className="w-full mt-auto"
            >
              <ProgressFilledTrack className="bg-tertiary-600" />
            </Progress>
            <Text className="text-secondary-800" size="sm">
              {fat} / {fatGoal} г.
            </Text>
          </VStack>
          <VStack className="w-[30%] items-center h-full px-0.5" space="sm">
            <Text size="xl">Углеводы</Text>
            <Progress
              value={Math.max(25, (100 * carbs) / carbsGoal)}
              orientation="horizontal"
              size="md"
              className="w-full mt-auto"
            >
              <ProgressFilledTrack className="bg-tertiary-600" />
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
