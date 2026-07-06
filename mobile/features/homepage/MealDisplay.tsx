import { Button, ButtonIcon } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Progress, ProgressFilledTrack } from "@/components/ui/progress";
import { HStack } from "@/components/ui/hstack";
import { AddIcon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useMealInfo } from "@/hooks/useMealInfo";
import { MealType } from "@/types/products";
import { getMealLocale } from "@/utils/meals";
import { router } from "expo-router";
import {
  createAnimatedComponent,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";
import { SkeletonText } from "@/components/ui/skeleton/Skeleton";
import { VStack } from "@/components/ui/vstack";

const AnimatedProgress = createAnimatedComponent(ProgressFilledTrack);

export const MealDisplay = ({
  meal,
  date,
  plannedCalories,
}: {
  meal: MealType;
  date: Date;
  plannedCalories: number;
}) => {
  const { data: mealData, isLoading } = useMealInfo(date.toISOString(), meal);
  const { calories } = mealData?.summary ?? {
    calories: 0,
  };

  const animatedProgressValue = useSharedValue(0);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    height: `${animatedProgressValue.value}%`,
  }));

  useEffect(() => {
    if (!isLoading) {
      animatedProgressValue.value = withTiming(
        (calories / plannedCalories) * 100,
        {
          duration: 400,
          easing: Easing.inOut(Easing.cubic),
        },
      );
      console.log(calories);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calories]);

  const openModal = () => {
    router.push({
      pathname: "/modal/add-food",
      params: {
        meal: meal,
        date: date.toISOString().substring(0, 10),
      },
    });
  };

  if (isLoading) {
    return (
      <Card className="w-full h-[7%]" variant="half-rounded">
        <SkeletonText _lines={1} className="h-[90%] w-[50%] my-auto" />
      </Card>
    );
  }

  return (
    <Card className="w-full h-[9%] py-2.5 px-2" variant="half-rounded">
      <HStack className="h-full" space="lg">
        <Progress orientation="vertical" size="sm" className="">
          <AnimatedProgress
            className="bg-tertiary-600"
            style={animatedProgressStyle}
          />
        </Progress>
        <VStack className="gap-0 relative w-[80%] border">
          <Heading size="2xl">{getMealLocale(meal)}</Heading>
          <Text size="md" className="bottom-2 text-secondary-800 mt-1.5">
            {Math.round(calories)} / {plannedCalories} ккал
          </Text>
        </VStack>
        <Button
          variant="solid"
          action="primary"
          size="md"
          className="ml-auto my-auto border-none"
          onPress={openModal}
        >
          <ButtonIcon as={AddIcon} size="2xl" />
        </Button>
      </HStack>
    </Card>
  );
};
