import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { FormControl } from "@/components/ui/form-control";
import { Grid, GridItem } from "@/components/ui/grid";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { ArrowLeftIcon } from "@/components/ui/icon";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAddMealItem } from "@/hooks/useAddMealItem";
import { useProductById } from "@/hooks/useProductById";
import { MealType } from "@/types/products";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Keyboard, TouchableWithoutFeedback } from "react-native";
import * as Haptics from "expo-haptics";

export default function AddProductModal() {
  const { meal, date, productId } = useLocalSearchParams<{
    productId: string;
    meal: MealType;
    date: string;
  }>();
  const { data, isLoading } = useProductById(productId);
  const [weight, setWeight] = useState(data?.serving_size.toString() ?? "");
  const { mutateAsync: addMealItem } = useAddMealItem();

  const handleAddItem = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addMealItem({
      productId,
      mealType: meal,
      grams: Number(weight),
      loggedDay: date,
    });
    handleFinish();
  };

  useEffect(() => {
    if (data) {
      setWeight(data.serving_size.toString());
    }
  }, [data]);

  const handleFinish = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  if (isLoading || !data) {
    return (
      <VStack className="w-screen h-screen bg-secondary-0 pt-16 pb-16 px-2">
        <Text size="6xl">Loading...</Text>
      </VStack>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <VStack
        className="w-screen h-screen bg-secondary-0 items-center pt-[15%] pb-8 px-2"
        space="xl"
      >
        <VStack space="sm">
          <HStack className="w-full items-center justify-center pt-5 p-0">
            <Button
              action="default"
              variant="outline"
              onPress={handleFinish}
              className="absolute left-0 top-0"
              size="xl"
            >
              <ButtonIcon as={ArrowLeftIcon} size="2xl" />
            </Button>
            <Heading size="2xl" className="line-clamp-3 text-start ml-16">
              {data.name}
            </Heading>
          </HStack>
          <HStack className="px-5">
            <Text
              size="2xl"
              className="text-typography-500 bg-primary-400 px-6 py-0.5 rounded-xl"
            >
              {data.supermarket}
            </Text>
          </HStack>
        </VStack>
        <Divider className="my-0.5 w-[85%] h-0.5" />
        <Card variant="half-rounded" className="w-full gap-5">
          <Box className="relative w-fit items-center m-auto pb-4">
            <Text size="8xl">{data.calories}</Text>
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
                <Text size="3xl">{data.protein} г</Text>
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
                <Text size="3xl">{data.fat} г</Text>
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
                <Text size="3xl">{data.carbs} г</Text>
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
        <FormControl className="w-full mt-8">
          <VStack>
            <Text className="text-typography-200 pl-2" size="lg">
              Введите вес
            </Text>
            <Input variant="half-rounded" size="2xl">
              <InputField
                keyboardType="numeric"
                value={weight}
                onChangeText={(text) => setWeight(text)}
              />
            </Input>
          </VStack>
        </FormControl>
        <Button
          action="primary"
          size="xl"
          className="w-full mt-auto h-20 rounded-3xl"
          onPress={handleAddItem}
        >
          <ButtonText className="text-3xl">Добавить</ButtonText>
        </Button>
      </VStack>
    </TouchableWithoutFeedback>
  );
}
