import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useState } from "react";

interface Prop {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  calorieGoal: number;
}

export const MacrosDisplay = ({ data }: { data: Prop }) => {
  const { calories, calorieGoal } = data;
  const goalValue = `/ ${calorieGoal}`;

  const [cardWidth, setCardWidth] = useState(0);
  const progress = Math.min(1, calories / (calorieGoal || 1)) || 0;

  return (
    <Card
      className="w-full h-[35%] p-0 relative justify-center items-center overflow-hidden border border-secondary-300"
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
              className="text-secondary-400 text-center font-bold"
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
                className={`${calories > calorieGoal ? "text-error-500" : "text-primary-300"} text-center`}
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
            <Text
              size="3xl"
              className="text-secondary-700 text-right font-medium"
            >
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
              <Text size="3xl" className="text-white text-right font-medium">
                {goalValue}
              </Text>
            </Box>
          </Box>
        </Box>
      )}
    </Card>
  );
};
