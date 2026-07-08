import { useLocalSearchParams, router } from "expo-router";
import { Button, ButtonIcon } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { FormControl } from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { AddIcon, ArrowLeftIcon } from "@/components/ui/icon";
import { Input, InputField } from "@/components/ui/input";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useSearchItems } from "@/hooks/useSearchItems";
import { MealType } from "@/types/products";
import { getMealLocale } from "@/utils/meals";
import { useState } from "react";
import { Pressable, ScrollView } from "react-native";
import { Box } from "@/components/ui/box";
import * as Haptics from "expo-haptics";

export default function AddFoodModal() {
  const { meal, date } = useLocalSearchParams<{
    meal: MealType;
    date: string;
  }>();
  const [searchString, setSearchString] = useState("");
  const { data, isLoading } = useSearchItems(searchString);
  const showSkeleton = searchString.length > 0 && !data && isLoading;

  const handleFinish = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  const handleForward = (productId: string, date: string, meal: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/modal/add-product",
      params: {
        productId,
        meal,
        date,
      },
    });
  };

  return (
    <VStack
      className="w-screen h-screen bg-secondary-0 pt-[15%] px-2"
      space="xl"
    >
      <HStack className="items-center justify-center py-2.5">
        <Button
          action="default"
          variant="outline"
          onPress={handleFinish}
          className="absolute left-0"
          size="xl"
        >
          <ButtonIcon as={ArrowLeftIcon} size="2xl" />
        </Button>
        <Text size="3xl" className="text-center">
          {getMealLocale(meal)}
        </Text>
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
      <ScrollView className="flex-1 px-3">
        <VStack space="md" className="pb-5">
          {data && data.length === 0 ? (
            <Text size="6xl">Ничего не найдено :(</Text>
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
                  <Skeleton className="w-full h-8 rounded-xl mt-auto" />
                </Card>
              ))
            : null}
          {data && searchString.length !== 0
            ? data.map(({ name, brand, id, calories, serving_size }) => (
                <Pressable
                  key={id}
                  onPress={() => handleForward(id, date, meal)}
                >
                  <Card
                    size="md"
                    variant="half-rounded"
                    className="rounded-xl p-0 pr-5"
                  >
                    <HStack className="justify-between items-center">
                      <Box className="w-[85%] p-3 pr-0">
                        <Heading size="sm" className="line-clamp-2">
                          {name}
                        </Heading>
                        <Text className="line-clamp-1 text-typography-300">
                          {brand}
                        </Text>
                        <HStack space="md" className="items-center mt-1.5">
                          <Text>{serving_size} г</Text>
                          <Divider className="w-0.5 h-[75%]" />
                          <Text>{calories} ккал / 100 г</Text>
                        </HStack>
                      </Box>
                      <Button
                        variant="solid"
                        action="primary"
                        size="xl"
                        className="border-none rounded-full px-2 py-5 w-12 h-12"
                        onPress={() => handleForward(id, date, meal)}
                      >
                        <ButtonIcon as={AddIcon} size="2xl" />
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
