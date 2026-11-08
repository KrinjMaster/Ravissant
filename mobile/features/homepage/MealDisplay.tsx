import { Button, ButtonIcon } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Progress } from "@/components/ui/progress";
import { HStack } from "@/components/ui/hstack";
import { AddIcon, Icon, InfoIcon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { MealType } from "@/types/products";
import { getMealLocale } from "@/utils/meals";
import { router } from "expo-router";
import { useEffect, useMemo } from "react";
import { Animated, Pressable } from "react-native";
import { VStack } from "@/components/ui/vstack";
import { useMealMacros } from "@/hooks/useMealMacros";
import { SkeletonText } from "@/components/ui/skeleton";
import * as Haptics from "expo-haptics";

export const MealDisplay = ({
  meal,
  date,
  plannedCalories,
}: {
  meal: MealType;
  date: Date;
  plannedCalories: number;
}) => {
  const { data: mealMacros, isLoading } = useMealMacros(
    date.toISOString(),
    meal,
  );
  const { calories } = mealMacros ?? {
    calories: 0,
  };

  const progressValue = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    if (!isLoading) {
      Animated.timing(progressValue, {
        toValue: plannedCalories
          ? Math.min(100, Math.max(0, (calories / plannedCalories) * 100))
          : 0,
        duration: 400,
        useNativeDriver: false,
      }).start();
    }
  }, [calories, isLoading, plannedCalories, progressValue]);

  const openAddFoodModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/modal/add-food",
      params: {
        meal: meal,
        date: date.toISOString().substring(0, 10),
        mode: "meal",
      },
    });
  };

  const openMealInfoModal = () => {
    if (mealMacros) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push({
        pathname: "/modal/meal-info",
        params: {
          meal: meal,
          date: date.toISOString().substring(0, 10),
          calorieGoal: plannedCalories,
        },
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full h-[7%]" variant="half-rounded">
        <SkeletonText _lines={1} className="h-[90%] w-[50%] my-auto" />
      </Card>
    );
  }

  return (
    <Card className="w-full h-24 p-2.5" variant="half-rounded">
      <HStack className="h-full pr-2.5" space="lg">
        <Progress orientation="vertical" size="sm" className="overflow-hidden">
          <Animated.View
            className="absolute bottom-0 left-0 right-0 bg-tertiary-600 rounded-full"
            style={{
              height: progressValue.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
            }}
          />
        </Progress>
        <VStack className="gap-0 relative w-[80%]">
          <HStack className="items-center" space="sm">
            <Heading size="2xl">{getMealLocale(meal)}</Heading>
            <Pressable onPress={openMealInfoModal}>
              <Icon as={InfoIcon} className="stroke-primary-600 w-6 h-6" />
            </Pressable>
          </HStack>
          <Text size="md" className="bottom-3 text-secondary-800 mt-1.5">
            {calories} / {plannedCalories} ккал
          </Text>
        </VStack>
        <Button
          variant="solid"
          action="primary"
          size="xl"
          className="my-auto border-none rounded-full h-12 px-3 py-2.5 ml-auto"
          onPress={openAddFoodModal}
        >
          <ButtonIcon as={AddIcon} size="2xl" />
        </Button>
      </HStack>
    </Card>
  );
};
