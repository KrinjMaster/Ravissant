import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Box } from "@/components/ui/box";
import { Button, ButtonIcon } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormControl } from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { AddIcon, ArrowLeftIcon, ChevronRightIcon } from "@/components/ui/icon";
import { Input, InputField } from "@/components/ui/input";
import { SkeletonText } from "@/components/ui/skeleton";
import { router } from "expo-router";
import { ScrollView, Pressable } from "react-native";
import Svg, { Defs, RadialGradient, Stop, Rect } from "react-native-svg";
import { useSearchMealTemplates } from "@/hooks/useSearchMealTemplates";

export default function MealTemplates() {
  const insets = useSafeAreaInsets();
  const [searchString, setSearchString] = useState("");
  const { data: searchData, isLoading: isSearchLoading } =
    useSearchMealTemplates(searchString);
  const showSkeleton = !searchData && isSearchLoading;

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  const handleViewTemplate = async (templateId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/modal/view-template",
      params: {
        templateId,
      },
    });
  };

  const handleAddTemplate = () => {
    router.push("/modal/add-template");
  };

  return (
    <VStack
      className="w-screen h-screen bg-secondary-0 px-2"
      space="md"
      style={{ paddingTop: insets.top }}
    >
      <Box className="absolute top-16 -left-64 w-[30rem] h-[45rem]">
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          <Defs>
            <RadialGradient
              id="glow"
              cx="50%"
              cy="50%"
              rx="50%"
              ry="50%"
              fx="50%"
              fy="50%"
            >
              <Stop offset="0%" stopColor="#00033D" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#00067A" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100" height="100" fill="url(#glow)" />
        </Svg>
      </Box>
      <Box className="absolute -bottom-72 -right-80 w-[30rem] h-[45rem]">
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          <Defs>
            <RadialGradient
              id="glow"
              cx="50%"
              cy="50%"
              rx="50%"
              ry="50%"
              fx="50%"
              fy="50%"
            >
              <Stop offset="0%" stopColor="#00033D" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#00067A" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100" height="100" fill="url(#glow)" />
        </Svg>
      </Box>
      <HStack className="items-center justify-center py-2.5">
        <Button
          action="default"
          variant="outline"
          onPress={handleGoBack}
          className="absolute left-0"
          size="xl"
        >
          <ButtonIcon as={ArrowLeftIcon} size="2xl" />
        </Button>
        <Text size="3xl" className="text-center">
          Рецепты
        </Text>
        <Button
          action="primary"
          variant="solid"
          className="absolute right-0 rounded-full"
          size="xl"
          onPress={handleAddTemplate}
        >
          <ButtonIcon as={AddIcon} size="2xl" />
        </Button>
      </HStack>
      <FormControl>
        <Input variant="half-rounded" size="2xl">
          <InputField
            placeholder="Введи название ..."
            value={searchString}
            onChangeText={(text) => setSearchString(text)}
          />
        </Input>
      </FormControl>
      <ScrollView className="flex-1 px-3 mt-2.5">
        <VStack space="md" className="pb-5">
          {searchData && searchData.length === 0 ? (
            <Text size="5xl" className="text-center">
              Ничего не найдено :(
            </Text>
          ) : null}
          {showSkeleton
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card
                  key={i}
                  size="md"
                  variant="half-rounded"
                  className="rounded-xl h-40 gap-2.5"
                >
                  <SkeletonText className="w-full h-6" />
                  <SkeletonText className="w-[40%] h-4 rounded-md" />
                </Card>
              ))
            : null}
          {/* Search meal templates */}
          {searchData
            ? searchData.map(({ name, id }) => (
                <Pressable key={id} onPress={() => handleViewTemplate(id)}>
                  <Card
                    size="md"
                    variant="half-rounded"
                    className="rounded-xl p-3.5"
                  >
                    <HStack className="justify-between items-center">
                      <Heading size="xl" className="line-clamp-2">
                        {name}
                      </Heading>
                      <Button
                        variant="outline"
                        action="primary"
                        size="xl"
                        className="border-0"
                        onPress={() => handleViewTemplate(id)}
                      >
                        <ButtonIcon
                          as={ChevronRightIcon}
                          size="2xl"
                          className="stroke-primary-600"
                        />
                      </Button>
                    </HStack>
                  </Card>
                </Pressable>
              ))
            : null}
        </VStack>
      </ScrollView>
    </VStack>
  );
}
