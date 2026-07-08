import { Box } from "@/components/ui/box";
import { Button, ButtonIcon } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CaloriesDisplay } from "@/components/ui/custom/caloriesDisplay";
import { Divider } from "@/components/ui/divider";
import { Grid, GridItem } from "@/components/ui/grid";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { ArrowLeftIcon, Icon, TrashIcon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { MealItem } from "@/features/meal-info/MealItem";
import { useMealItems } from "@/hooks/useMealItems";
import { useMealMacros } from "@/hooks/useMealMacros";
import { useRemoveMealItem } from "@/hooks/useRemoveMealItem";
import { MealType } from "@/types/products";
import { getMealLocale } from "@/utils/meals";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { ScrollView } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import * as Haptics from "expo-haptics";

function RightAction() {
  return (
    <Box className="w-[35%] bg-error-400 justify-center items-end px-10">
      <Icon as={TrashIcon} color="white" className="h-12 w-12" />
    </Box>
  );
}

export default function AddProductModal() {
  const { meal, date, calorieGoal } = useLocalSearchParams<{
    meal: MealType;
    date: string;
    calorieGoal: number;
  }>();
  const { data: mealItems, isLoading: isItemsLoading } = useMealItems(
    date,
    meal,
  );
  const { data: mealMacros, isLoading: isMacrosLoading } = useMealMacros(
    date,
    meal,
  );
  const { mutateAsync: removeMealItem } = useRemoveMealItem();

  const handleFinish = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  const removeItem = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await removeMealItem({ itemId: id, meal, day: date });
  };

  if (isItemsLoading || isMacrosLoading || !mealItems || !mealMacros) {
    return (
      <VStack className="w-screen h-screen bg-secondary-0 pt-16 pb-16 px-2">
        <Text size="6xl">Loading...</Text>
      </VStack>
    );
  }

  return (
    <VStack className="w-full h-screen bg-secondary-0 pt-[15%] pb-8" space="md">
      <VStack
        className="w-full h-[55%] items-center justify-between px-2"
        space="md"
      >
        <HStack className="w-full items-center justify-center px-2">
          <Button
            action="default"
            variant="outline"
            onPress={handleFinish}
            className="absolute left-0"
            size="xl"
          >
            <ButtonIcon as={ArrowLeftIcon} size="2xl" />
          </Button>
          <Heading size="xl" className="line-clamp-2 text-start">
            {getMealLocale(meal)}
          </Heading>
        </HStack>
        <CaloriesDisplay
          calories={mealMacros.calories}
          calorieGoal={calorieGoal}
          className="w-full h-[60%]"
        />
        <Divider className="my-0.5 w-[85%] h-0.5" />
        <Card variant="half-rounded" className="w-full">
          <Grid
            className="gap-4 items-center"
            _extra={{
              className: "grid-cols-10",
            }}
          >
            <GridItem
              className="pb-6"
              _extra={{
                className: "col-span-3",
              }}
            >
              <Box className="relative w-fit items-center m-auto">
                <Text size="3xl">{mealMacros.protein} г</Text>
                <Text
                  size="xl"
                  className="absolute -bottom-6 text-typography-300"
                >
                  белки
                </Text>
              </Box>
            </GridItem>
            <Divider className="w-0.5 h-[75%]" />
            <GridItem
              className="pb-6"
              _extra={{
                className: "col-span-3",
              }}
            >
              <Box className="relative w-fit items-center m-auto">
                <Text size="3xl">{mealMacros.fat} г</Text>
                <Text
                  size="xl"
                  className="absolute -bottom-6 text-typography-300"
                >
                  жиры
                </Text>
              </Box>
            </GridItem>
            <Divider className="w-0.5 h-[75%]" />
            <GridItem
              className="pb-6"
              _extra={{
                className: "col-span-3",
              }}
            >
              <Box className="relative w-fit items-center m-auto">
                <Text size="3xl">{mealMacros.carbs} г</Text>
                <Text
                  size="xl"
                  className="absolute -bottom-6 text-typography-300"
                >
                  углеводы
                </Text>
              </Box>
            </GridItem>
          </Grid>
        </Card>
      </VStack>
      <ScrollView className="flex-1 mt-2.5">
        <VStack space="xl">
          {mealItems.length
            ? mealItems.map((val) => (
                <ReanimatedSwipeable
                  key={val.id}
                  renderRightActions={() => <RightAction />}
                  overshootRight={false}
                  onSwipeableOpen={(direction) => {
                    if (direction === "left") removeItem(val.id);
                  }}
                >
                  <MealItem {...val} meal={meal} date={date} />
                </ReanimatedSwipeable>
              ))
            : null}
        </VStack>
      </ScrollView>
    </VStack>
  );
}
