import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useEffect, useState } from "react";
import {
  createAnimatedComponent,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const AnimatedBox = createAnimatedComponent(Box);

export const CaloriesDisplay = ({
  className,
  calories,
  calorieGoal,
}: {
  className?: string;
  calories: number;
  calorieGoal: number;
}) => {
  const [cardWidth, setCardWidth] = useState(0);

  const goalValue = `/ ${calorieGoal} ккал`;
  const progress = Math.min(1, calories / (calorieGoal || 1)) || 0;

  const animatedCaloriesValue = useSharedValue(0);

  const animatedBoxStyle = useAnimatedStyle(() => ({
    width: `${animatedCaloriesValue.value}%`,
  }));
  const animatedGoalBoxStyle = useAnimatedStyle(() => ({
    width: Math.max(0, cardWidth * (animatedCaloriesValue.value / 100) - 18),
  }));

  useEffect(() => {
    animatedCaloriesValue.value = withTiming(progress * 100, {
      duration: 1200,
      easing: Easing.inOut(Easing.cubic),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  return (
    <Card
      className={`${className} p-0 relative justify-center items-center overflow-hidden`}
      variant="half-rounded"
      onLayout={(e) => {
        setCardWidth(e.nativeEvent.layout.width);
      }}
    >
      {/* Progress bar */}
      <AnimatedBox
        className="absolute left-0 top-0 bottom-0 bg-primary-200 rounded-r-2xl rounded-none"
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
              className="text-secondary-500 text-center scale-y-[1.75] subpixel-antialiased"
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
                className={`${calories > calorieGoal ? "text-error-500" : "text-primary-800"} text-center scale-y-[1.75] subpixel-antialiased`}
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
            <Text size="2xl" className="text-secondary-500 text-right">
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
              <Text size="2xl" className="text-primary-800 text-right">
                {goalValue}
              </Text>
            </Box>
          </AnimatedBox>
        </Box>
      )}
    </Card>
  );
};
