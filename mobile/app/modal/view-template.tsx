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
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Grid, GridItem } from "@/components/ui/grid";
import { Divider } from "@/components/ui/divider";
import { ScrollView } from "react-native-gesture-handler";
import { useGetMealTemplate } from "@/hooks/useGetMealTemplate";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { useRemoveTemplate } from "@/hooks/useRemoveTemplate";

export default function ViewTemplateModal() {
  const { templateId } = useLocalSearchParams<{
    templateId: string;
  }>();
  const { data: templateData, isLoading } = useGetMealTemplate(templateId);
  const { mutateAsync: removeTemplate } = useRemoveTemplate();
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

  const { name, calories, carbs, protein, fat, items } = templateData;

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
          <Heading size="xl" className="line-clamp-2 text-start">
            {name}
          </Heading>
        </HStack>
      </VStack>
      <Card variant="half-rounded" className="w-fit gap-5 mt-5">
        <Box className="relative w-fit items-center m-auto pb-4">
          <Text size="8xl">{calories}</Text>
          <Text size="4xl" className="absolute bottom-0">
            ккал
          </Text>
        </Box>
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
              <Text size="3xl">{protein} г</Text>
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
              <Text size="3xl">{fat} г</Text>
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
              <Text size="3xl">{carbs} г</Text>
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
      <ScrollView className="mt-3.5">
        <VStack space="lg" style={{ paddingBottom: 2 * insets.bottom }}>
          {items.map(({ id, name, weight, calories, protein, carbs, fat }) => (
            <Box key={id} className="bg-secondary-0 px-2">
              <HStack key={id} className="justify-between items-center">
                <Box className="w-full relative">
                  <Heading size="sm" className="line-clamp-2">
                    {name}
                  </Heading>
                  <Text className="text-typography-400">
                    {weight} г, {calories} ккал
                  </Text>
                  <Grid
                    className="items-center mt-2"
                    _extra={{
                      className: "grid-cols-11",
                    }}
                  >
                    <GridItem
                      className="pb-4"
                      _extra={{
                        className: "col-span-3",
                      }}
                    >
                      <Box className="relative w-fit items-center m-auto">
                        <Text size="xl">{protein} г</Text>
                        <Text
                          size="md"
                          className="absolute -bottom-5 text-typography-300"
                        >
                          белки
                        </Text>
                      </Box>
                    </GridItem>
                    <GridItem
                      className="items-center"
                      _extra={{
                        className: "col-span-1",
                      }}
                    >
                      <Divider className="w-0.5 h-8" />
                    </GridItem>
                    <GridItem
                      className="pb-4"
                      _extra={{
                        className: "col-span-3",
                      }}
                    >
                      <Box className="relative w-fit items-center m-auto">
                        <Text size="xl">{fat} г</Text>
                        <Text
                          size="md"
                          className="absolute -bottom-5 text-typography-300"
                        >
                          жиры
                        </Text>
                      </Box>
                    </GridItem>
                    <GridItem
                      className="items-center"
                      _extra={{
                        className: "col-span-1",
                      }}
                    >
                      <Divider className="w-0.5 h-8" />
                    </GridItem>
                    <GridItem
                      className="pb-4"
                      _extra={{
                        className: "col-span-3",
                      }}
                    >
                      <Box className="relative w-fit items-center m-auto">
                        <Text size="xl">{carbs} г</Text>
                        <Text
                          size="md"
                          className="absolute -bottom-5 text-typography-300"
                        >
                          углеводы
                        </Text>
                      </Box>
                    </GridItem>
                  </Grid>
                </Box>
              </HStack>
              <Divider className="mt-5 mx-auto w-[97%] h-0.5" />
            </Box>
          ))}
        </VStack>
      </ScrollView>
      <Button
        action="negative"
        className="w-full rounded-2xl h-16"
        size="xl"
        onPress={handleDeleteTemplate}
      >
        <ButtonText>Удалить</ButtonText>
      </Button>
    </VStack>
  );
}
