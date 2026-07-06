import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider/Divider";
import { FormControl } from "@/components/ui/form-control";
import { Grid, GridItem } from "@/components/ui/grid/Grid";
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

export default function AddFoodModal() {
  const { meal, date, productId } = useLocalSearchParams<{
    productId: string;
    meal: MealType;
    date: string;
  }>();
  const { data, isLoading } = useProductById(productId);
  const [weight, setWeight] = useState(data?.serving_size.toString() ?? "");
  const { mutateAsync, isSuccess, isPending } = useAddMealItem();

  const handleAddItem = async () => {
    mutateAsync({
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
      console.log(data);
    }
  }, [data]);

  useEffect(() => {
    console.log("isSuccess", isSuccess, "isPending", isPending);
  }, [isSuccess, isPending]);

  const handleFinish = () => {
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
        className="w-screen h-screen bg-secondary-0 items-center pt-[25%] pb-8 px-2"
        space="lg"
      >
        <Card variant="half-rounded" className="w-full">
          <Text size="2xl" className="line-clamp-2 text-start">
            {data.name}
          </Text>
          <HStack>
            <Text size="3xl" className="text-info-500">
              {data.supermarket}
            </Text>
          </HStack>
        </Card>
        <Divider className="my-0.5 w-[85%] h-0.5 rounded-full bg-background-200" />
        <Card variant="half-rounded" className="w-full pb-10">
          <Text size="8xl" className="text-center">
            {data.serving_size} г
          </Text>
          <Grid
            className="gap-4"
            _extra={{
              className: "grid-cols-9",
            }}
          >
            <GridItem
              _extra={{
                className: "col-span-3",
              }}
            >
              <Box className="relative w-fit items-center m-auto">
                <Text size="3xl">{data.protein} г</Text>
                <Text
                  size="xl"
                  className="absolute -bottom-6 text-typography-400"
                >
                  белки
                </Text>
              </Box>
            </GridItem>
            <GridItem
              _extra={{
                className: "col-span-3",
              }}
            >
              <Box className="relative w-fit items-center m-auto">
                <Text size="3xl">{data.fat} г</Text>
                <Text
                  size="xl"
                  className="absolute -bottom-6 text-typography-400"
                >
                  жиры
                </Text>
              </Box>
            </GridItem>
            <GridItem
              _extra={{
                className: "col-span-3",
              }}
            >
              <Box className="relative w-fit items-center m-auto">
                <Text size="3xl">{data.carbs} г</Text>
                <Text
                  size="xl"
                  className="absolute -bottom-6 text-typography-400"
                >
                  углеводы
                </Text>
              </Box>
            </GridItem>
          </Grid>
        </Card>
        <FormControl className="w-full mt-8">
          <VStack>
            <Text className="text-typography-200 text-xl pl-2">
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
