import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { ArrowLeftIcon } from "@/components/ui/icon";
import { VStack } from "@/components/ui/vstack";
import React from "react";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Text } from "@/components/ui/text";
import { Divider } from "@/components/ui/divider";
import { ScrollView } from "react-native-gesture-handler";
import { useGetMealTemplate } from "@/hooks/useGetMealTemplate";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { useRemoveTemplate } from "@/hooks/useRemoveTemplate";
import { MacrosDetailsCard } from "@/features/general/MacrosDetailsCard";
import { MacrosDetailsGrid } from "@/features/general/MacrosDetailsGrid";
import { MealType } from "@/types/products";
import { useAddMealTemplateItem } from "@/hooks/useAddMealTemplateItem";

type ViewMode = "view" | "add";

export default function ViewTemplateModal() {
  const { templateId, mode, meal, date } = useLocalSearchParams<{
    templateId: string;
    mode: ViewMode;
    meal: MealType;
    date: string;
  }>();
  const { data: templateData, isLoading } = useGetMealTemplate(templateId);
  const { mutateAsync: removeTemplate } = useRemoveTemplate();
  const { mutateAsync: addTemplateItem } = useAddMealTemplateItem();
  const insets = useSafeAreaInsets();

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  const handleDeleteTemplate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await removeTemplate({ templateId });
    router.back();
  };

  const handleAddItem = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await addTemplateItem({ templateId, mealType: meal, loggedDay: date });
    router.back();
  };

  console.log(mode, meal, date);

  if (isLoading || !templateData) {
    return (
      <VStack
        className="w-screen h-screen bg-secondary-0 pt-16 pb-8 px-2"
        space="sm"
      >
        <SkeletonText className="w-[80%] h-8 mx-auto" />
        <VStack className="w-full h-[40%] border justify-between mt-2.5">
          <Skeleton className="w-full h-[75%] px-3 py-2 rounded-xl" />
          <Skeleton className="w-full h-[20%] px-3 py-2 rounded-xl" />
        </VStack>
        <Skeleton className="mt-auto w-full h-[9%] px-3 py-2 rounded-xl" />
        <Skeleton className="mt-auto w-full h-[9%] px-3 py-2 rounded-xl" />
        <Skeleton className="mt-auto w-full h-[9%] px-3 py-2 rounded-xl" />
      </VStack>
    );
  }

  const { name, items } = templateData;

  return (
    <VStack
      className="w-full h-screen bg-secondary-0 px-3.5"
      space="md"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <VStack className="w-full items-center justify-between py-2.5" space="md">
        <HStack className="w-full items-center justify-center">
          <Button
            action="default"
            variant="outline"
            onPress={handleGoBack}
            className="absolute left-0"
            size="xl"
          >
            <ButtonIcon as={ArrowLeftIcon} size="2xl" />
          </Button>
          <Heading size="xl" className="line-clamp-2 text-center max-w-[85%]">
            {name}
          </Heading>
        </HStack>
      </VStack>
      <MacrosDetailsCard {...templateData} />
      <ScrollView className="mt-3.5">
        <VStack space="lg" style={{ paddingBottom: 2 * insets.bottom }}>
          {items.map(
            ({ id, name, weight, calories, protein, carbs, fat, unit }) => (
              <Box key={id} className="bg-secondary-0 px-2">
                <HStack key={id} className="justify-between items-center">
                  <Box className="w-full relative">
                    <Heading size="lg" className="line-clamp-2">
                      {name}
                    </Heading>
                    <Text size="lg" className="text-typography-400">
                      {weight} {unit}, {calories} ккал
                    </Text>
                    <MacrosDetailsGrid
                      protein={protein}
                      fat={fat}
                      carbs={carbs}
                    />
                  </Box>
                </HStack>
                <Divider className="mt-5 mx-auto w-[97%] h-0.5" />
              </Box>
            ),
          )}
        </VStack>
      </ScrollView>
      {mode === "view" ? (
        <Button
          action="negative"
          className="w-full rounded-2xl h-16"
          size="xl"
          onPress={handleDeleteTemplate}
        >
          <ButtonText>Удалить</ButtonText>
        </Button>
      ) : (
        <Button
          action="primary"
          size="xl"
          className="w-full mt-auto h-20 rounded-3xl"
          onPress={handleAddItem}
        >
          <ButtonText className="text-3xl">Добавить</ButtonText>
        </Button>
      )}
    </VStack>
  );
}
